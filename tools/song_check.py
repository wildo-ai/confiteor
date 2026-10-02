"""Listen to a take by measuring it: what was sung, where the seams are, and whether each section lands.

    marketing/.generated/venv-media/bin/python tools/song_check.py <take.mp3> [--png out.png]

Prints:
  - the Whisper transcript per segment (what was actually sung, not what the plan asked for).
    Whisper invents words over instrumental passages ("What? What?"), so segments in a section with
    no lyrics are noise;
  - tempo and the first beats;
  - RMS energy per section, with the sections read from the take's own timing JSON (the chunk
    boundaries ElevenLabs reports), so a chorus quieter than its verse is a number, not an impression;
  - silent gaps longer than 0.4 s inside the song: the chunk seams that kill a build.

Taste is not measured here. A take that passes still has to be heard.
"""
import argparse
import json
import pathlib

import librosa
import librosa.display
import numpy as np


def sections(timing_path: pathlib.Path):
    """Chunk boundaries from the plan durations recorded in the take's timing JSON."""
    if not timing_path.exists():
        return []
    plan = json.loads(timing_path.read_text())["composition_plan"]
    out, t = [], 0.0
    for chunk in plan.get("chunks") or plan.get("sections") or []:
        dur = (chunk.get("duration_ms") or 0) / 1000
        head = next((l for l in chunk["text"].split("\n") if l.startswith("[")), "[?]")
        out.append((t, t + dur, head.strip("[]")))
        t += dur
    return out


def lyric_gate(take: pathlib.Path, segs):
    """Each planned lyric line, matched to the best window of what Whisper heard (1-3 consecutive
    segments, so a line split across segments still matches). A line under 0.8 coverage was not sung as
    written, or not at all. Whisper's own mishearings ("praise" for "prays") still cover ~0.9 of the
    line, so the threshold reads absence, not spelling."""
    import difflib
    import re

    timing = take.with_suffix(".timing.json")
    if not timing.exists():
        return
    plan = json.loads(timing.read_text())["composition_plan"]
    # Whisper writes numbers as digits; the lyric spells them. Spell the common shapes back.
    SPELL = {"1492": "fourteen ninetytwo", "1494": "fourteen ninetyfour", "3am": "three am", "3 am": "three am",
             "25": "twentyfive", "30": "thirty", "75": "seventyfive", "%": " percent", "-": ""}

    def norm(x):
        x = x.lower()
        for k, v in SPELL.items():
            x = x.replace(k, v)
        return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]", "", x)).strip()

    def score(want, got):
        """How much of the wanted line appears, in order, inside what was heard (coverage), so a
        line packed into one long segment with its neighbours still counts as sung."""
        if not got:
            return 0.0
        m = difflib.SequenceMatcher(None, want, got, autojunk=False)
        return sum(b.size for b in m.get_matching_blocks()) / max(1, len(want))
    windows = []
    for i in range(len(segs)):
        for n in (1, 2, 3):
            if i + n <= len(segs):
                windows.append((segs[i][0], norm(" ".join(t for _, t in segs[i:i + n]))))
    print("== lyric gate (line, best match score, where)")
    misses = 0
    for chunk in plan.get("chunks", []):
        for line in chunk["text"].split("\n"):
            if not line.strip() or line.startswith("[") or line.startswith("{"):
                continue
            want = norm(line)
            best = max(windows, key=lambda w: score(want, w[1]), default=(0, ""))
            sc = score(want, best[1])
            flag = "  " if sc >= 0.8 else "✗ "
            misses += sc < 0.8
            print(f"{flag}{sc:.2f} {best[0]:6.1f}s  {line}")
    print(f"== {misses} line(s) not found")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("take")
    ap.add_argument("--png")
    ap.add_argument("--no-transcript", action="store_true")
    ap.add_argument("--verbose", action="store_true", help="print every transcript segment")
    a = ap.parse_args()
    take = pathlib.Path(a.take)

    if not a.no_transcript:
        import mlx_whisper
        # Transcribe the separated VOCAL stem when Demucs made one (a full mix sends Whisper into
        # repetition loops on loud choruses), and never condition on the previous segment, which is
        # what turns one misheard chorus into "Who? Who? Who?" for a minute.
        stem = take.parent / "stems" / "htdemucs" / take.stem / "vocals.wav"
        src = stem if stem.exists() else take
        print(f"== transcript ({'vocal stem' if stem.exists() else 'full mix'})")
        r = mlx_whisper.transcribe(str(src), path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="en",
                                   condition_on_previous_text=False, no_speech_threshold=0.5)
        segs = [(s["start"], s["text"].strip()) for s in r["segments"] if s["text"].strip()]
        if a.verbose:
            for st, tx in segs:
                print(f"{st:6.2f} {tx}")
        lyric_gate(take, segs)

    y, sr = librosa.load(str(take), sr=22050)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    print(f"== tempo {float(np.atleast_1d(tempo)[0]):.1f} bpm, first beats {np.round(librosa.frames_to_time(beats, sr=sr)[:4], 2).tolist()}")

    rms = librosa.feature.rms(y=y)[0]
    t = librosa.times_like(rms, sr=sr)
    secs = sections(take.with_suffix(".timing.json"))
    print("== energy per section")
    for a0, b0, name in secs:
        m = (t >= a0) & (t < b0)
        if m.any():
            print(f"{a0:6.1f}-{b0:6.1f}  rms {rms[m].mean():.3f}  {name}")

    print("== silent gaps > 0.4 s (inside the song)")
    quiet = rms < 0.01
    start = None
    end_of_song = t[np.nonzero(~quiet)[0][-1]] if (~quiet).any() else 0
    for i, q in enumerate(quiet):
        if q and start is None:
            start = t[i]
        if not q and start is not None:
            if t[i] - start > 0.4 and start > 1 and t[i] < end_of_song:
                print(f"{start:6.2f}-{t[i]:6.2f}  ({t[i] - start:.2f} s)")
            start = None

    if a.png:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=2048, hop_length=512)), ref=np.max)
        fig, ax = plt.subplots(2, 1, figsize=(18, 7), sharex=True)
        librosa.display.specshow(S, sr=sr, hop_length=512, x_axis="time", y_axis="log", ax=ax[0])
        ax[1].plot(t, rms)
        for a0, _, name in secs:
            for axis in ax:
                axis.axvline(a0, color="r")
            ax[0].text(a0 + 0.3, 8000, name, color="w")
        plt.tight_layout()
        plt.savefig(a.png, dpi=70)


if __name__ == "__main__":
    main()
