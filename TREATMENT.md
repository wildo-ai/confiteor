# CONFITEOR (BE HONEST) — treatment v1

A lyric music video, about 2:45. It starts from the meme ("I wrote tests" / "Be honest" / "Ok, I ran it
once" / "Be honest" / "I pushed it straight to prod" / "Thank you") and from Paul's answer: *AI should
write tests is a meme of the old world, from when humans had to care about the code. Beyond the tests,
the age of code is shifting. This is the moment to become aware, or be lost in the deprecated world.*

Reference bar: **CLODYSSEY (SUPERPERSUASION)** by anabology. We take its *method* (an old myth with
near-zero translation, real facts that land instantly, a recurring cast, chapters that move through the
light, a final role flip, graphics that explain, every word timed on screen, type tucked behind people).
We do not take its people, its sea or its look.

---

## The frame: it already happened, in Mainz, in 1492

In 1492 the abbot **Johannes Trithemius** wrote *De laude scriptorum* (*In Praise of Scribes*): monks
must keep copying books by hand, because a hand copy lasts longer, because copying is prayer, and
because the press would make them lazy. **It was printed in Mainz in 1494** (Peter von Friedberg).

That is the meme, five centuries early: a defence of the careful human ritual, delivered by the
machine it argues against. The myth needs almost no translation:

| 1492 | 2026 |
|---|---|
| the scribe copying by hand at 3 a.m., one candle | the developer reviewing by hand at 3 a.m., one screen |
| collation: finger on the exemplar, line by line | the diff, line by line |
| the rubricator's **red ink** marking errors | the **red** failing test |
| the press | the model |
| *In Praise of Scribes*, printed | "AI should write tests", typed into an AI |
| the scriptorium, the whole world to the monk | the old way of shipping code |
| the window | the shift |

**The song is a confession.** The *Confiteor* is the Mass's confession prayer: "I confess … in thought,
in word, in deed and in omission … through my fault (*mea culpa*)". The meme is already a confession
in three rounds. The song makes it literal, and the crowd answers every "Be honest" with **MEA CULPA!**,
the way CLODYSSEY's crowd answered with "TIE ME TO THE MAST!".

**The flip (CLODYSSEY flips who is tied to the mast; we flip who confesses).** For the whole song the
human confesses and lies. In the final chorus the questions come back, and the Machine answers them
truthfully: *Who wrote the tests? — I DID. Who read the code? — I DID.* The last question is the human's:
*Who's still holding the candle?* — *…I did.* And the meme's last line, re-heard: **Thank you.**

## The cast (canon text goes in every image prompt; style frame 1 is the identity reference)

- **The Scribe** = you, the developer. A lean Mediterranean man in his late twenties, dark curly hair
  tied back, short dark beard, tired dark eyes, ink-stained fingertips, **one thin vermilion thread
  knotted on his left wrist**. The same face in both worlds: wool tunic and quill in 1492, black hoodie
  and red pen in 2026. The thread is how the eye finds him across 534 years.
- **The Abbot** = the old guard (Trithemius as an archetype, not a portrait): elderly, lean, severe pale
  grey eyes, black habit, heavy iron ring. In 2026 the same face is the senior engineer who "needs to
  review everything", black turtleneck, the same ring.
- **The Machine** has no face and **never sings on camera**. It is the press in 1494 and the racks in
  2026, the same black iron and warm light. Its voice is the narrator. (This is also a production
  decision: Grok Imagine cannot lip-sync to our song, so nobody's mouth has to.)
- **The meme, transposed.** "Be honest" is said by the Abbot peeking round the scriptorium door frame,
  the same composition as the meme's man behind the wall. The real Beckhams never appear.

## The world and the light

The night runs toward dawn, one light per chapter, and the window is the clock:

| | light | world |
|---|---|---|
| Intro | black, one candle | the door, the peek |
| Verse 1 | candle night, 1492 | the scriptorium, the abbot writing |
| Chorus 1 | lamp light | the press wakes; the nave of hanging pages (style frame 3) |
| Verse 2 | cold screen night, 2026 | the open space; the match cuts |
| Chorus 2 | both at once | split frames, 1492 beside 2026 |
| Bridge | grey first light | the window |
| Break | white dawn | DEPRECATED, stamped in red |
| Final chorus | sunrise | the flip |
| Outro | full morning | the candle smoke; the open door |

**Grade:** style frame 4 is the reference (cool, clean, IMAX-sharp, no halftone, no grain added in
post). Everything is desaturated toward ink and vellum, and **vermilion is the only saturated colour**:
the rubric, the thread, the failing test, the stamp. Green ticks are drawn in ivory, never green.

## Type: the typography travels through time with the story

- **UnifrakturMaguntia** (a blackletter named after Mainz, *Maguntia*) for 1492 lines and the
  "Be honest" of the old world.
- A heavy condensed grotesque for the crowd's **MEA CULPA!**, **DEPRECATED** and **I DID**.
- **IBM Plex Mono** for readouts and sources.
- Signature move: a line set in blackletter **re-sets itself letter by letter** into the grotesque at
  the press's first strike, as movable type would.
- All three are open-licensed (Google Fonts).

## The devices that explain it (drawn by code, never generated)

1. **The meme grid**: the 3×2 "Be honest" structure returns at each chorus, its panels filled with
   1492 and 2026 frames.
2. **The collation readout**: the fingertip line check as a mono counter (`LINES CHECKED 1,204`),
   against the press's sheets per day and then tokens per second. Every number is sourced before it ships.
3. **The curve**: Google's share of new code written by AI, **25% (Oct 2024) → 30% (Apr 2025) →
   ~50% (fall 2025) → 75% (Apr 2026)**, drawn as one vermilion line rising through the hanging pages,
   each point stamped with its date and source.
4. **The rubric**: red ink marks bloom in the manuscript margins exactly where the 2026 diff has its
   failing lines, on the snare.
5. **The ledger of rituals**: a vellum scroll of habits (*copied by hand · checked by eye · read every
   line · LGTM · works on my machine · deploy on Friday*), struck through in red, one per beat.
6. **The colophon**: the last frame of the printed book, *"Printed at Mainz, 1494"*, becomes the
   film's end card.

## The song (draft v1, for Paul's notes; it gets scansion passes against the rendered take)

Style: a male Gregorian choir in stone reverb, spoken deadpan verses, a close and calm narrator, then a
dark electronic pulse whose kick is **the iron clank of a hand press**. Chant hits techno; sung chorus
lift with stacked crowd shouts; a key change into the final chorus. About 122 BPM.

```
[Intro: Gregorian choir, stone reverb, no beat]
Confiteor...
[spoken, close: the Scribe]   I wrote tests.
[choir, low]                  Be honest.
                              I... ran it once.
                              Be honest.
                              I pushed it straight to prod.
[the Machine, calm, close]    Thank you.

[Verse 1: spoken, deadpan; the press clank becomes the kick]
Mainz, fourteen ninety-two. Three a.m. One candle.
The abbot writes against the press: too fast, too much to handle.
"A copy made by hand will last a thousand years.
A monk who copies, prays." Wipe the ink. Wipe the tears.
He writes it all by hand, with love, against the black machine,
then sends it to the printer. Mainz, fourteen ninety-four. Clean.

[Pre: whispered]  Be honest. Be honest.

[Chorus: sung; the crowd answers]
Who wrote the tests?           MEA CULPA!
Who read the code?             MEA CULPA!
Who held a candle to every line?   MEA CULPA!
Be honest...

[Verse 2: spoken, bouncy; the numbers]
Twenty-five percent. Then thirty. Then a half.
Then three quarters of the new code. Go ahead and laugh.
You still review it line by line, a candle and a quill,
green ticks like a rosary, and you count them still.
"Looks good to me." Amen. "Works on my machine." Amen.
Ship it on a Friday, then confess it all again.

[Chorus]

[Bridge: the beat drops out; choir, then the Machine alone]
It was never about the tests.
It was the candle you were holding
in a room you thought was the world.
Look up.

[Break: chanted, stacked voices, on the clank]
Copied by hand.     DEPRECATED.
Checked by eye.     DEPRECATED.
Read every line.    DEPRECATED.
And you?            ...

[Final chorus: key change up; the flip]
Be honest: who wrote the tests?     I DID.
Be honest: who read the code?       I DID.
Be honest: who's still holding the candle?
[the Scribe, alone]                 ...I did.
[the Machine]                       Thank you.

[Outro: the choir returns, one held note; the candle goes out]
```

Every factual line will be traced to a source in `LYRICS.md`, as CLODYSSEY did (Trithemius' dates,
Google's figures and their dates). No real living person appears on screen.

## How we make it: their stack, and ours

| Role | CLODYSSEY | Us |
|---|---|---|
| Plates | Midjourney v8.2, canon text, no character reference | **gpt-image-2 with `--ref`**: identity held across 534 years on the first try (frames 1→2) |
| Plate fixes | Gemini 3 Pro Image edits | gpt-image-2 edits (same `--ref` path) |
| Song | Suno v6 + a Voice, 50 takes | **ElevenLabs Music**, composition plan + word timestamps |
| Moving shots | Seedance 2.5, audio-conditioned, lip sync | **Grok Imagine** image-to-video, up to 15 s at 1080p. **No audio input, so no lip sync**: designed out (nobody sings on camera) |
| Stems, beat and hit map, mattes, depth | a home RTX 3090 Ti | **this Mac (M4 Pro, 48 GB, Metal)**: Demucs, Depth Anything V2, BiRefNet, SAM 2 |
| Motion design and edit | a custom JS engine in headless Chromium; every frame a pure function of song time | the same principle, a new engine for this film, frames piped straight into ffmpeg |
| Review | agent reviewers on real renders, a director score, a flash test, a lyric gate | the same: lyric gate, WCAG flash check, renders reviewed shot by shot |

Their hardest lessons are rules from the first day:

- **The prompt is the product.** Every video prompt is written by one hand, in one context, with
  timestamps on the song's hits, full blocking, and an action plus a reaction. **Paul reads them
  before anything spends.**
- **Fix the source, not the frame.**
- **Measure, don't eyeball.**
- **A null review is a failure, not a pass.**

## Before the big spend: three probes (cheap, and each can change the plan)

1. **Song probe**: one 30–40 s ElevenLabs take of the intro and chorus 1. Can it do a Gregorian choir,
   a deadpan spoken voice and crowd shouts in one piece?
2. **Motion probe**: one Grok Imagine clip from style frame 1 with a CLODYSSEY-grade timestamped prompt.
   Does it follow blocking to the second, and does the face hold?
3. **Engine probe**: 8 seconds of the intro rendered end to end: the door peek, "Be honest" in
   blackletter tucked behind the Abbot through a matte, cut on the clank.

## Probe results (2026-10-01)

| Probe | Result | Evidence |
|---|---|---|
| Song | **Works.** ElevenLabs does the choir, two spoken voices and the crowd's MEA CULPA in one take. Take 1 had the richer choir but a dead seam before the chorus and a chorus *quieter* than the verse. Take 2 (one chunk from the pre-chorus through the chorus, more room around the meme lines) builds properly: the chorus is about 60% louder than the verse, and Whisper hears every line | `song/probe-0{1,2}.plan.json`, `probes/song-0{1,2}-spectrogram.png`, `tools/song_check.py` |
| Motion | **Works.** Grok Imagine 1.5 at 1080p follows timestamped blocking (finger on the line, freeze, look up at the door) and holds the face for 6 s. The Abbot clip broke the prompt once (smiles at 4.5 s), so it is cut before that. About $0.25/s | `probes/motion-0{1,2}*` |
| Engine | **Works.** Intro 0–21 s cut on take 2's word times, type tucked behind the Abbot through per-frame BiRefNet mattes made on the M4, HUD year rolling 1492 → 2026 on the match cuts. **20 ms per frame**, piped straight into ffmpeg (no frames on disk) | `renders/intro-probe-v1.mp4`, `film.js`, `../engine/` |

Tool fix along the way: `wm video --image` sent the image as a string, and xAI wants `{ url }`. It now also takes a local file and sends it as a data URI.

## Status (2026-10-02): v9

`renders/confiteor-v9.mp4`: 3:28, 1080p, the master take v2-44, 23 Grok clips, about 90 shots.

| Review round | Director (×2) | Craft | Sync | Story | Verdict |
|---|---|---|---|---|---|
| 1 (v1, stills) | 6.5 | 6.5 | 7.5 | 6.5 | fail |
| 4 (v4, stills) | 8.0 | 7.0 | 8.5 | 8.0 | pass |
| 5 (v6, first with clips) | 7.5 | 6.5 | 8.0 | 7.5 | fail (clip in-points, crops, tucks) |
| 7 (v8) | 8.0 | 7.5 | 8.5 | 8.0 | **pass**; v9 applies its six fixes |

Measured on v9: lyric gate 259/259 sung words on screen on their word; 0 type collisions; WCAG 2.3.1
flash check pass (at most 1 flash in any second); edge scan flags only dark scenery and the end grid
while it builds.

Declined three times on principle: an invented "COPIES ×2 → ×1,048,576" counter. The film shows only
numbers it can source; the final act's device is the handover (each ritual struck, with its new owner).

What still separates it from the reference (round 7): performance (no lip sync, short micro-actions),
plate economy (the press nave and sunrise plates recur), the Scribe's face drifting between plates,
explaining graphics laid on top rather than tracked into the scene, and camera energy in the drops.
