/**
 * CONFITEOR (BE HONEST): the whole film. Song time in, frame out.
 *
 * Every shot starts on a SUNG WORD of the master take (`song/hits.json` + `song/words.json`), so a new
 * take re-times the edit by itself. A shot whose clip has not been made yet plays its plate in 2.5D
 * (depth layers), so the film renders end to end at every stage of production.
 *
 * Read STORYBOARD.md beside this file: the section numerals in the comments are its sections.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  H, INK, RUBRIC, W, chrome, clamp, clip, cover, deep, ease, free, hash, image, layer, lyric, prog, punch, roll,
  rubricStroke, shout, songClock, text, tuck, vignette,
} from '../engine/lib.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const GEN = join(HERE, '..', '..', '.generated');
const C = songClock(join(HERE, 'song', 'hits.json'), join(HERE, 'song', 'words.json'));

export const audio = join(GEN, 'music', 'confiteor-full-v2-s44.mp3');
export const duration = 208;

// ── media ───────────────────────────────────────────────────────────────────────────────────────
const PLATES = join(GEN, 'plates', 'confiteor');
const PLATE_FILES = ['P01-candle-macro', 'P02-scribe-desk', 'P03-dev-desk', 'P04-abbot-door', 'P05-press-nave', 'P06-abbot-printed-book',
  'P07-abbot-writing', 'P08-quill-macro', 'P09-monks-rows', 'P10-monk-prays', 'P11-ink-tears', 'P12-black-machine', 'P13-to-the-printer',
  'P14-type-case', 'P15-confessional', 'P16-cathedral-congregation', 'P17-mea-culpa-row', 'P19-rosary-keyboard', 'P20-blessing',
  'P21-works-on-my-machine', 'P22-friday-ship', 'P23-incident', 'P24-server-hall', 'P25-pages-up', 'P26-window-dawn', 'P27-scribe-looks-up',
  'P28-dev-looks-up', 'P29-mainz-dawn', 'P30-city-dawn', 'P31-stamp', 'P32-ledger-scroll', 'P33-eyes', 'P34-press-sunrise',
  'P35-servers-sunrise', 'P36-candle-daylight', 'P37-profile', 'P38-candle-out', 'P38L-candle-lit', 'P39-open-door', 'P40-colophon', 'P41-glass-door-peek'];
const P = Object.fromEntries(PLATE_FILES.map((f) => [f.split('-')[0], deep(join(PLATES, `${f}.jpg`))]));

/** A clip by prompt-book id (C09…), once made: frames under .generated/frames/confiteor-<id>. */
const CLIPS = {
  // The probe clips predate the naming: 002 the scribe, 003/005 the Abbot.
  C02: clip(join(GEN, 'frames', 'confiteor-probe-motion-01')),
  C03: clip(join(GEN, 'frames', 'confiteor-probe-motion-02')),
};
/**
 * Where each clip's action ACTUALLY happens, measured from its motion (`engine/tools/hitfind.py`), keyed
 * `<clip>@<second the prompt asked for>`. A shot with `hit: [songTime, askedSecond]` slides its clip so
 * the measured frame lands on the song's hit: Grok cannot hear the song, and does not always keep time.
 */
const HITS_FILE = join(HERE, 'clip-hits.json');
const CLIP_HITS = existsSync(HITS_FILE) ? JSON.parse(readFileSync(HITS_FILE, 'utf8')) : {};
function clipOffset(s) {
  if (!s.hit) return s.clipAt ?? 0;
  const [songT, asked] = s.hit;
  // keys are written as the prompt book writes the second ("1.0"); JavaScript prints 1.0 as "1", which
  // silently missed the stamp and the platen and fell back to the asked time. Match the number, not the text.
  const key = Object.keys(CLIP_HITS).find((k) => k.startsWith(`${s.clip}@`) && Number(k.split('@')[1]) === asked);
  if (!key && clipFor(s.clip)) throw new Error(`clip ${s.clip} has a hit at ${asked} s but no measurement in clip-hits.json`);
  const measured = key ? CLIP_HITS[key].measured : asked;
  return measured - (songT - s.from);
}
function clipFor(id) {
  if (!(id in CLIPS)) {
    const dir = join(GEN, 'frames', `confiteor-${id}`);
    CLIPS[id] = existsSync(dir) ? clip(dir) : null;
  }
  return CLIPS[id];
}

// ── the shot table ──────────────────────────────────────────────────────────────────────────────
const at = C.at;
const ph = C.phrase;
const SHOTS = [];
/**
 * A shot from song time `from` until the next shot starts.
 *   plate     drawn in 2.5D, the camera moving cam0 → cam1 over the shot; `push` = depth separation
 *   clip      replaces the plate once made, played from `clipAt` seconds
 *   tuck      type drawn BEHIND the subject (through the clip's or the plate's matte)
 *   draw      type and devices over everything
 *   kick      [time, strength]: a camera punch on a hit
 *   hud       place / year / readout for the chrome; functions get (lt) for year, (t) for readout
 */
function S(from, o) {
  SHOTS.push({ from, ...o });
}

/**
 * A montage cut on the KICKS of an instrumental drop: one shot every `every` kicks between t0 and t1,
 * each plate pushed in and punched on its own kick. `label(i, n)` returns the shot's big caption (or
 * nothing) and `hud(i)` its chrome. The cut is the beat: these sections have no voice to follow.
 */
function montage(t0, t1, plates, { every = 2, label, hud, sizes, overlay } = {}) {
  const kicks = C.hits.kicks.filter((k) => k >= t0 - 0.02 && k < t1 - 0.2);
  const cuts = kicks.filter((_, i) => i % every === 0);
  cuts.forEach((k, i) => {
    const entry = plates[i % plates.length];
    const { plate: id, clip: clipId, clipAt, fx: efx } = typeof entry === 'string' ? { plate: entry } : entry;
    const fx = efx ?? 0.42 + hash(i, 7) * 0.16;
    S(k - 1 / 24, {
      plate: id, clip: clipId, clipAt, cam0: { zoom: 1.06, fx, fy: 0.48 }, cam1: { zoom: 1.16, fx, fy: 0.46 }, push: 0.03, kick: [k, 0.06],
      hud: hud ? hud(i, cuts.length) : undefined,
      draw: label || overlay ? (g, t) => {
        // the montage index reaches the overlay, so each cut can carry its own line
        if (overlay) overlay(g, t, i);
        const str = label?.(i, cuts.length);
        if (str) shout(g, t, k, str, { size: sizes ? sizes(i) : 200, y: H - 130 });
      } : undefined,
    });
  });
}

/* I · The confession ─────────────────────────────────────────────────────────────────── 001–007 */
const T_I = at('I', 1);
const T_TESTS = at('tests', 1);
const T_HONEST1 = T_TESTS + 0.75; // the choir's first "Be honest" is too soft for either clock; it follows "tests."
const T_OKAY = at('Okay');
const T_ONCE = at('Once');
const T_HONEST2 = at('Be', 1, 10);
const T_PUSHED = at('pushed') - 0.15;
const T_PROD = at('prod');
const T_THANK1 = at('Thank', 1);
const T_MAINZ1 = at('Mainz', 1);

S(0, { hud: { place: '', year: '' }, draw: (g, t, lt) => {
  const k = prog(lt, 0.2, 3.5);
  text(g, 'Confiteor', { x: W / 2, y: H / 2 + 30, font: 'Maguntia', size: 130, align: 'center', reveal: ease.out3(k) });
  text(g, 'I CONFESS', { x: W / 2, y: H / 2 + 95, font: 'PlexMono', weight: 400, size: 16, align: 'center', tracking: 6, alpha: 0.5 * k });
} });
S(T_I - 0.1, { clip: 'C02', cam0: { zoom: 1.04, fx: 0.48, fy: 0.42 }, cam1: { zoom: 1.1, fx: 0.48, fy: 0.42 },
  hud: { place: 'MAINZ', year: '1492', readout: (t) => `COLLATION  ·  LINE ${String(1204 + (Math.floor(t * 3) % 40)).padStart(5, '0')}  ·  BY HAND` },
  draw: (g, t) => {
    const w1 = text(g, 'I wrote…', { x: 150, y: 250, size: 76, weight: 600, reveal: prog(t, T_I, T_I + 0.25) });
    const w2 = text(g, 'tests.', { x: 150 + w1 + 26, y: 250, size: 76, weight: 600, color: RUBRIC, reveal: prog(t, T_TESTS, T_TESTS + 0.3) });
    rubricStroke(g, 150 + w1 + 22, 272, w2 + 10, ease.out3(prog(t, T_TESTS + 0.2, T_TESTS + 0.9)), 3);
  } });
S(T_HONEST1, { clip: 'C03', cam0: { zoom: 1.02, fx: 0.55, fy: 0.45 }, cam1: { zoom: 1.06, fx: 0.55, fy: 0.45 },
  hud: { place: 'MAINZ', year: '1492', readout: 'THE ABBOT  ·  AT THE DOOR' },
  tuck: (gg, t) => {
    text(gg, 'Be', { x: 110, y: 520, font: 'Maguntia', size: 210, reveal: prog(t, T_HONEST1, T_HONEST1 + 0.2), rise: 0.1 });
    text(gg, 'honest.', { x: 230, y: 740, font: 'Maguntia', size: 210, reveal: prog(t, T_HONEST1 + 0.25, T_HONEST1 + 0.6), rise: 0.1 });
  } });
S(T_OKAY, { plate: 'P03', cam0: { zoom: 1.08, fx: 0.47, fy: 0.42 }, cam1: { zoom: 1.16, fx: 0.47, fy: 0.42 }, push: 0.02,
  hud: { place: 'OPEN SPACE', year: (lt) => String(roll(1492, 2026, prog(lt, 0, 0.7))), readout: (t) => `TEST RUNS  ·  ${t >= T_ONCE ? 1 : 0}` },
  draw: (g, t) => {
    lyric(g, t, ph('Okay.'), { x: 90, y: 200, size: 56, weight: 400 });
    lyric(g, t, ph('I RAN it. Once.'), { x: 90, y: 290, size: 66, accent: [3], maxWidth: 520 });
  } });
S(T_HONEST2, { clip: 'C03', clipAt: 0.1, cam0: { zoom: 1.25, fx: 0.66, fy: 0.32 }, cam1: { zoom: 1.32, fx: 0.66, fy: 0.32 },
  hud: { place: 'MAINZ', year: (lt) => String(roll(2026, 1492, prog(lt, 0, 0.5))), readout: 'THE ABBOT  ·  UNCONVINCED' },
  tuck: (gg, t) => {
    text(gg, 'Be', { x: 90, y: 470, font: 'Maguntia', size: 200, reveal: prog(t, T_HONEST2, T_HONEST2 + 0.2), rise: 0.08 });
    text(gg, 'honest.', { x: 90, y: 690, font: 'Maguntia', size: 200, reveal: prog(t, T_HONEST2 + 0.3, T_HONEST2 + 0.7), rise: 0.08 });
  } });
S(T_PUSHED, { plate: 'P03', cam0: { zoom: 1.5, fx: 0.5, fy: 0.72 }, cam1: { zoom: 1.65, fx: 0.5, fy: 0.72 }, kick: [T_PROD, 0.08],
  hud: { place: 'OPEN SPACE', year: '2026', readout: (t) => `TESTS  ·  0 WRITTEN  ·  ${t > T_PROD ? 'SHIPPED' : 'PENDING'}` },
  draw: (g, t) => {
    lyric(g, t, ph('I pushed it straight to prod.'), { x: 90, y: 440, size: 72, accent: [5], maxWidth: 460 });
    const cmd = '$ git push origin main --no-verify';
    text(g, cmd.slice(0, Math.floor(prog(t, T_PUSHED + 0.2, T_PROD - 0.2) * cmd.length)), { x: 90, y: 150, font: 'PlexMono', size: 26, weight: 400, alpha: 0.8 });
    if (t > T_PROD) text(g, '→ production   deployed', { x: 90, y: 190, font: 'PlexMono', size: 26, weight: 400, color: RUBRIC });
  } });
S(T_THANK1 - 0.3, { plate: 'P05', fadeIn: 0.6, cam0: { zoom: 1.12, fx: 0.5, fy: 0.38 }, cam1: { zoom: 1.2, fx: 0.5, fy: 0.38 }, push: 0.03,
  hud: { place: 'MAINZ', year: '1494', readout: 'THE PRESS' },
  draw: (g, t) => {
    shade(g, W / 2, H / 2, 520, 160, 0.55 * ease.out3(prog(t, T_THANK1 - 0.2, T_THANK1 + 0.4)));
    lyric(g, t, ph('Thank you.', 1), { x: W / 2, y: H / 2 + 20, size: 64, weight: 300, align: 'center', fadeIn: 0.5 });
  } });

/* II · Mainz ──────────────────────────────────────────────────────────────────────────── 008–019 */
const T_3AM = at('Three');
const T_ABBOT = at('The', 1, 24);
const T_TOOFAST = at('too', 1, 26);
const T_COPY = at('A', 1, 28.5);
const T_MONK = at('monk');
const T_WIPE = at('Wipe', 1);
const T_HE = at('He');
const T_AGAINST2 = at('against', 2);
const T_THEN = at('then', 1, 43);
const T_MAINZ2 = at('Mainz', 2);
const T_CLEAN = at('Clean');
const VERSE = { place: 'MAINZ', year: '1492' };

const T_DROP0 = C.hits.kicks.find((k) => k > T_THANK1 + 0.5);
S(T_DROP0 - 1 / 24, { plate: 'P05', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.08, fx: 0.5, fy: 0.45 }, push: 0.03, kick: [T_DROP0, 0.06],
  hud: { ...VERSE, readout: 'VERSE 1' },
  draw: (g, t) => {
    text(g, 'MAINZ,', { x: 150, y: 930, font: 'Anton', size: 150, tracking: 4, reveal: prog(t, T_MAINZ1, T_MAINZ1 + 0.12), rise: 0.05 });
    const k = prog(t, at('ninety-two'), at('ninety-two') + 0.5);
    if (t >= at('fourteen', 1)) text(g, k > 0 ? String(roll(1400, 1492, k)) : '14', { x: 660, y: 930, font: 'Anton', size: 150, tracking: 4, color: RUBRIC });
  } });
S(T_3AM, { clip: 'C09', hit: [C.hits.kicks.find((k) => k > T_3AM), 0.47], plate: 'P01', cam0: { zoom: 1.05, fx: 0.7, fy: 0.4 }, cam1: { zoom: 1.12, fx: 0.72, fy: 0.38 }, push: 0.02,
  hud: { ...VERSE, readout: '03:00  ·  ONE CANDLE' },
  draw: (g, t) => lyric(g, t, ph('Three a.m. One candle.'), { x: 150, y: 220, size: 72, accent: [3] }) });
S(T_ABBOT, { clip: 'C10', plate: 'P07', cam0: { zoom: 1.04, fx: 0.55, fy: 0.45 }, cam1: { zoom: 1.12, fx: 0.58, fy: 0.42 }, push: 0.025,
  hud: { ...VERSE, readout: 'DE LAUDE SCRIPTORUM  ·  DRAFT' },
  draw: (g, t) => lyric(g, t, ph('The abbot writes against the press:'), { x: 120, y: 200, size: 64, accent: [3, 4, 5], maxWidth: 560 }) });
S(T_TOOFAST, { plate: 'P12', cam0: { zoom: 1.15, fx: 0.5, fy: 0.45 }, cam1: { zoom: 1.0, fx: 0.5, fy: 0.5 }, push: 0.04,
  hud: { ...VERSE, readout: 'THE PRESS' },
  draw: (g, t) => lyric(g, t, ph('too fast, too much to handle.'), { x: W / 2, y: 940, size: 72, align: 'center' }) });
S(T_COPY, { plate: 'P09', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.12, fx: 0.5, fy: 0.55 }, push: 0.03,
  hud: { ...VERSE, readout: 'ONE COPY  ·  ONE SCRIBE  ·  MONTHS' },
  draw: (g, t) => lyric(g, t, ph('A copy made by hand will last a thousand years.'), { x: 140, y: 200, size: 68, accent: [7, 8, 9], maxWidth: 1300 }) });
S(T_MONK - 0.25, { plate: 'P10', cam0: { zoom: 1.06, fx: 0.42, fy: 0.42 }, cam1: { zoom: 1.14, fx: 0.42, fy: 0.42 }, push: 0.02,
  hud: { ...VERSE, readout: 'LABORARE EST ORARE' },
  tuck: (gg, t) => lyric(gg, t, ph('A monk who copies, prays.'), { x: 1100, y: 330, size: 72, accent: [4], maxWidth: 700 }) });
S(T_WIPE - 0.1, { clip: 'C14', hit: [C.hits.kicks.find((k) => k > T_WIPE + 2), 2.93], plate: 'P11', cam0: { zoom: 1.05, fx: 0.5, fy: 0.4 }, cam1: { zoom: 1.13, fx: 0.52, fy: 0.38 }, push: 0.02,
  hud: { ...VERSE, readout: '04:12' },
  draw: (g, t) => {
    lyric(g, t, ph('Wipe the ink away.'), { x: 130, y: 200, size: 68 });
    lyric(g, t, ph('Wipe the tears.'), { x: 130, y: 290, size: 68, accent: [2] });
  } });
S(T_HE - 0.1, { clip: 'C15', plate: 'P08', cam0: { zoom: 1.0, fx: 0.4, fy: 0.5 }, cam1: { zoom: 1.08, fx: 0.6, fy: 0.5 },
  hud: { ...VERSE, readout: 'TEXTURA  ·  BY HAND' },
  draw: (g, t) => {
    shade(g, W / 2, 900, 900, 140, 0.5);
    lyric(g, t, ph('He writes it all by hand, with love,'), { x: 140, y: 930, size: 80, font: 'Maguntia', weight: 400, accent: [4, 5] });
  } });
S(T_AGAINST2 - 0.1, { plate: 'P12', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.18, fx: 0.5, fy: 0.42 }, push: 0.04,
  hud: { ...VERSE, readout: 'THE PRESS' },
  draw: (g, t) => {
    g.fillStyle = `rgba(0,0,0,${0.25 * prog(t, T_AGAINST2, T_AGAINST2 + 0.8)})`;
    g.fillRect(0, 0, W, H);
    lyric(g, t, ph('against the black machine,'), { x: W / 2, y: 940, size: 80, align: 'center', accent: [2, 3] });
  } });
S(T_THEN - 0.1, { clip: 'C17', plate: 'P13', cam0: { zoom: 1.04, fx: 0.5, fy: 0.45 }, cam1: { zoom: 1.1, fx: 0.48, fy: 0.45 }, push: 0.02,
  hud: { ...VERSE, readout: 'MANUSCRIPT  →  PRINTER' },
  draw: (g, t) => lyric(g, t, ph('then sends it to the printer.'), { x: W / 2, y: 950, size: 76, align: 'center', accent: [4] }) });
S(T_MAINZ2, { plate: 'P06', cam0: { zoom: 1.03, fx: 0.4, fy: 0.5 }, cam1: { zoom: 1.12, fx: 0.42, fy: 0.55 }, push: 0.025, kick: [T_MAINZ2, 0.05],
  hud: { place: 'MAINZ', year: (lt) => String(roll(1492, 1494, prog(lt, 0.4, 1.0))), readout: 'DE LAUDE SCRIPTORUM  ·  PRINTED, PETER VON FRIEDBERG' },
  draw: (g, t) => {
    text(g, 'MAINZ,', { x: 1300, y: 860, font: 'Anton', size: 130, tracking: 3, reveal: prog(t, T_MAINZ2, T_MAINZ2 + 0.12) });
    text(g, '1494.', { x: 1300, y: 1000, font: 'Anton', size: 130, tracking: 3, color: RUBRIC, reveal: prog(t, at('fourteen', 2), at('fourteen', 2) + 0.2) });
  } });
S(T_CLEAN - 0.1, { plate: 'P14', cam0: { zoom: 1.1, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.2, fx: 0.5, fy: 0.5 },
  hud: { place: 'MAINZ', year: '1494', readout: 'MOVABLE TYPE' },
  draw: (g, t) => {
    shade(g, W / 2, H / 2, 800, 260, 0.6);
    morph(g, t, 'Clean.', T_CLEAN, { x: W / 2, y: H / 2 + 90, size: 260 });
  } });

/* III · Mea culpa (pre + chorus 1) ──────────────────────────────────────────────────────── 020–028 */
const T_PRE1 = at('Be', 1, 48);
const T_DROP1 = at('Who', 1, 55);
const CHORUS = { place: 'CATHEDRAL', year: '2026' };
const mea = (n) => C.word('MEA', n).s;
const culpa = (n) => C.word('CULPA', n).s;

S(T_PRE1 - 0.2, { clip: 'C20', plate: 'P15', cam0: { zoom: 1.02, fx: 0.55, fy: 0.45 }, cam1: { zoom: 1.6, fx: 0.42, fy: 0.42 }, camEase: 'in3', push: 0.02,
  hud: { ...CHORUS, place: 'CONFESSIONAL', readout: 'BE HONEST' }, hideHudAfter: 3.3, // the meme grid owns the whole frame
  draw: async (g, t, lt, s) => {
    lattice(g, prog(t, s.to - 4.4, s.to - 3.0));
    lyric(g, t, ph('Be honest.', 1, 48), { x: 150, y: 860, size: 56, weight: 300 });
    lyric(g, t, ph('Be honest.', 1, 52), { x: 150, y: 930, size: 56, weight: 300 });
    await memeGrid(g, t, s.to - 3.3, s.to);
  } });
S(T_DROP1, { plate: 'P16', cam0: { zoom: 1.0, fx: 0.5, fy: 0.55 }, cam1: { zoom: 1.06, fx: 0.5, fy: 0.5 }, push: 0.03, kick: [T_DROP1, 0.05],
  hud: { ...CHORUS, readout: 'THE CONGREGATION' },
  draw: (g, t) => lyric(g, t, ph('Who wrote the tests?', 1, 55), { x: W / 2, y: 200, size: 96, weight: 700, align: 'center', accent: [3] }) });
S(mea(1), { clip: 'C23', hit: [culpa(1), 0.8], plate: 'P17', cam0: { zoom: 1.05, fx: 0.4, fy: 0.45 }, cam1: { zoom: 1.1, fx: 0.4, fy: 0.45 }, kick: [culpa(1), 0.07],
  hud: { ...CHORUS, readout: 'MEA CULPA  ·  I' },
  draw: (g, t) => shout(g, t, mea(1), 'MEA CULPA!', { size: 320, y: 880, invert: true }) });
S(at('Who', 1, 61), { plate: 'P03', cam0: { zoom: 1.25, fx: 0.47, fy: 0.42 }, cam1: { zoom: 1.32, fx: 0.47, fy: 0.42 }, push: 0.02,
  hud: { place: 'OPEN SPACE', year: '2026', readout: 'LINES REVIEWED  ·  0' },
  draw: (g, t) => lyric(g, t, ph('Who read the code?', 1, 61), { x: 90, y: 300, size: 92, weight: 700, accent: [3], maxWidth: 480 }) });
S(mea(2), { clip: 'C25', hit: [culpa(2), 0.7], plate: 'P17', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.05, fx: 0.5, fy: 0.5 }, kick: [culpa(2), 0.07],
  hud: { ...CHORUS, readout: 'MEA CULPA  ·  II' },
  draw: (g, t) => shout(g, t, mea(2), 'MEA CULPA!', { size: 270, y: 1010, invert: true }) });
S(at('Who', 1, 65), { plate: 'P02', cam0: { zoom: 1.1, fx: 0.4, fy: 0.55 }, cam1: { zoom: 1.2, fx: 0.38, fy: 0.6 }, push: 0.025,
  hud: { place: 'MAINZ', year: (lt) => String(roll(2026, 1492, prog(lt, 0, 0.5))), readout: 'ONE CANDLE  ·  EVERY LINE' },
  draw: (g, t) => lyric(g, t, ph('Who held a candle to every line?'), { x: 90, y: 200, size: 80, weight: 700, accent: [3, 6], maxWidth: 480 }) });
S(mea(3), { clip: 'C22', plate: 'P16', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.04, fx: 0.5, fy: 0.45 }, push: 0.03, kick: [culpa(3), 0.07],
  hud: { ...CHORUS, readout: 'MEA CULPA  ·  III' },
  draw: (g, t) => shout(g, t, mea(3), 'MEA CULPA!', { size: 300, y: 400, invert: true }) });
S(at('Be', 1, 71), { plate: 'P04', cam0: { zoom: 1.02, fx: 0.55, fy: 0.45 }, cam1: { zoom: 1.08, fx: 0.55, fy: 0.45 }, push: 0.02,
  hud: { place: 'MAINZ', year: '1492', readout: 'THE ABBOT' },
  tuck: (gg, t) => lyric(gg, t, ph('Be honest...', 1, 71), { x: 110, y: 560, size: 190, font: 'Maguntia', weight: 400, maxWidth: 700, fadeIn: 0.3 }) });

// The drop after chorus 1: the press runs. 1492 and 2026 alternate; every cut doubles the copies.
// The figure is sourced (LYRICS.md): "European printing presses c. 1600 could produce between 1,500
// and 3,600 impressions per workday" (Wolf 1974). It is c. 1600, not 1494, and the caption says so.
const T_RUN0 = at('honest', 1, 71) + 1.4;
const T_RUN1 = at('Twenty-five') - 0.3;
montage(T_RUN0, T_RUN1, ['P05', 'P25', 'P12', 'P14', 'P07', 'P09', 'P08', 'P25'], {
  hud: (i, n) => ({ place: 'MAINZ', year: String(roll(1494, 1600, i / (n - 1))), readout: 'ONE HAND PRESS  ·  IMPRESSIONS PER WORKDAY  ·  c. 1600  ·  WOLF 1974' }),
  overlay: (g, t) => {
    const k = ease.inOut3(prog(t, T_RUN0 + 0.3, T_RUN1 - 1.2));
    shade(g, W / 2, H - 200, 760, 190, 0.55);
    text(g, roll(1, 3600, k).toLocaleString('en-US'), { x: W / 2, y: H - 160, font: 'Anton', size: 220, align: 'center' });
    text(g, 'IMPRESSIONS PER WORKDAY  ·  ONE HAND PRESS, c. 1600', { x: W / 2, y: H - 100, font: 'PlexMono', size: 28, weight: 500, align: 'center', alpha: 0.85 });
  },
});

/* IV · The numbers (verse 2) ────────────────────────────────────────────────────────────── 029–041 */
const T_25 = at('Twenty-five');
const T_HALF = at('half');
const CURVE = [
  { t: T_25, v: 25, label: '25%', when: 'OCT 2024' },
  { t: at('thirty'), v: 30, label: '30%', when: 'APR 2025', dy: -46 },
  { t: T_HALF, v: 50, label: '~50%', when: 'LATE 2025' },
  { t: at('quarters'), v: 75, label: '75%', when: 'APR 2026' },
];
const T_LAUGH = at('Go');
const T_YOU = at('You', 1, 89);
const T_QUILL = at('a', 1, 92);
const T_GREEN = at('green');
const T_LOOKS = at('Looks');
const T_WORKS = at('Works');
const T_SHIP = at('Ship');
const T_CONFESS = at('then', 1, 103);
const CURVE_HUD = 'NEW CODE GENERATED BY AI AT GOOGLE  ·  AS STATED BY GOOGLE';

S(T_25 - 0.3, { plate: 'P25', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.15, fx: 0.5, fy: 0.5 }, push: 0.03,
  hud: { place: 'MAINZ', year: '1494', readout: CURVE_HUD }, draw: (g, t) => { curve(g, t); numbersLine(g, t); } });
S(T_HALF - 0.15, { clip: 'C32', plate: 'P24', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.12, fx: 0.5, fy: 0.48 }, push: 0.03,
  hud: { place: 'DATA CENTRE', year: (lt) => String(roll(1494, 2026, prog(lt, 0, 0.6))), readout: CURVE_HUD }, draw: (g, t) => { curve(g, t); numbersLine(g, t); } });
S(T_LAUGH, { plate: 'P41', cam0: { zoom: 1.02, fx: 0.6, fy: 0.45 }, cam1: { zoom: 1.08, fx: 0.6, fy: 0.45 }, push: 0.02,
  hud: { place: 'OPEN SPACE', year: '2026', readout: 'THE SENIOR REVIEWER' },
  draw: (g, t) => lyric(g, t, ph('Go ahead and laugh.'), { x: 120, y: 880, size: 96, weight: 300, maxWidth: 1300 }) });
S(T_YOU, { plate: 'P03', cam0: { zoom: 1.4, fx: 0.55, fy: 0.68 }, cam1: { zoom: 1.5, fx: 0.55, fy: 0.68 }, push: 0.02,
  hud: { place: 'OPEN SPACE', year: '2026', readout: (t) => `LINES REVIEWED  ·  ${(1204 + Math.floor(prog(t, T_YOU, T_QUILL) * 380)).toLocaleString('en-US')}` },
  draw: (g, t) => lyric(g, t, ph('You still read it line by line,'), { x: 140, y: 220, size: 76, accent: [4, 5, 6] }) });
S(T_QUILL - 0.05, { plate: 'P02', cam0: { zoom: 1.4, fx: 0.55, fy: 0.68 }, cam1: { zoom: 1.5, fx: 0.55, fy: 0.68 }, push: 0.02,
  hud: { place: 'MAINZ', year: (lt) => String(roll(2026, 1492, prog(lt, 0, 0.4))), readout: 'COLLATION  ·  BY HAND' },
  draw: (g, t) => lyric(g, t, ph('a candle and a quill,'), { x: 140, y: 220, size: 84, font: 'Maguntia', weight: 400 }) });
S(T_GREEN - 0.05, { clip: 'C19', plate: 'P19', cam0: { zoom: 1.05, fx: 0.55, fy: 0.45 }, cam1: { zoom: 1.12, fx: 0.55, fy: 0.45 },
  hud: { place: 'OPEN SPACE', year: '2026', readout: (t) => `CHECKS PASSED  ·  ${ticksCounted(t, T_GREEN)}` },
  draw: (g, t) => {
    // one block, one layout: wrapping the two lines separately printed the second over the first
    const couplet = ph('green ticks like a rosary,').concat(ph('and you count them still.'));
    lyric(g, t, couplet, { x: 140, y: 200, size: 72, accent: [8], maxWidth: 560 });
    ticks(g, t, T_GREEN);
  } });
S(T_LOOKS - 0.05, { clip: 'C38', plate: 'P20', cam0: { zoom: 1.04, fx: 0.5, fy: 0.42 }, cam1: { zoom: 1.12, fx: 0.48, fy: 0.4 }, push: 0.025,
  hud: { place: 'OPEN SPACE', year: '2026', readout: 'REVIEW  ·  APPROVED' },
  // drawn, not tucked: in the clip his raised hand crosses the left of the frame and ate the letters
  draw: (g, t) => {
    lyric(g, t, ph('Looks good to me.'), { x: 100, y: 150, size: 72 });
    lyric(g, t, ph('Amen.', 1), { x: 1460, y: 420, size: 130, font: 'Maguntia', weight: 400, color: RUBRIC });
  } });
S(T_WORKS - 0.05, { plate: 'P21', cam0: { zoom: 1.05, fx: 0.5, fy: 0.42 }, cam1: { zoom: 1.12, fx: 0.5, fy: 0.42 }, push: 0.025,
  hud: { place: 'OPEN SPACE', year: '2026', readout: 'ENV  ·  LOCALHOST' },
  tuck: (gg, t) => {
    lyric(gg, t, ph('Works on my machine.'), { x: 100, y: 260, size: 80, maxWidth: 640 });
    lyric(gg, t, ph('Amen.', 2), { x: 100, y: 470, size: 130, font: 'Maguntia', weight: 400, color: RUBRIC });
  } });
S(T_SHIP - 0.05, { plate: 'P22', cam0: { zoom: 1.1, fx: 0.3, fy: 0.75 }, cam1: { zoom: 1.2, fx: 0.3, fy: 0.78 }, push: 0.025,
  hud: { place: 'OPEN SPACE', year: '2026', readout: 'FRI 18:47' },
  draw: (g, t) => lyric(g, t, ph('Ship it on a Friday,'), { x: 980, y: 340, size: 80, accent: [4] }) });
S(T_CONFESS - 0.05, { clip: 'C41', plate: 'P23', cam0: { zoom: 1.04, fx: 0.5, fy: 0.42 }, cam1: { zoom: 1.12, fx: 0.5, fy: 0.42 }, push: 0.02,
  hud: { place: 'OPEN SPACE', year: '2026', readout: (t) => (t > T_CONFESS + 0.6 ? 'INCIDENT #1  ·  SEV 1  ·  03:12' : 'INCIDENT') },
  draw: (g, t) => lyric(g, t, ph('then confess it all again.'), { x: 100, y: 620, size: 70, accent: [1], maxWidth: 480 }) });

/* V · Mea culpa again (pre + chorus 2) ──────────────────────────────────────────────────── 042–049 */
const T_PRE2 = at('Be', 1, 106);
const T_DROP2 = at('Who', 1, 112);
S(T_PRE2 - 0.2, { plate: 'P15', cam0: { zoom: 1.6, fx: 0.42, fy: 0.42 }, cam1: { zoom: 1.02, fx: 0.55, fy: 0.45 }, camEase: 'out3', push: 0.02,
  hud: { ...CHORUS, place: 'CONFESSIONAL', readout: 'BE HONEST' },
  draw: (g, t, lt) => {
    lattice(g, 1 - prog(lt, 0, 1.6));
    lyric(g, t, ph('Be honest.', 1, 106), { x: 150, y: 900, size: 56, weight: 300 });
  } });
S(T_DROP2, { split: ['P02', 'P03'], kick: [T_DROP2, 0.05], hud: { place: 'MAINZ  |  OPEN SPACE', year: '1492  |  2026', readout: 'THE SAME HAND' },
  draw: (g, t) => lyric(g, t, ph('Who wrote the tests?', 2), { x: W / 2, y: 690, size: 96, weight: 700, align: 'center', accent: [3] }) });
S(mea(4), { clip: 'C23', hit: [culpa(4), 0.8], plate: 'P17', cam0: { zoom: 1.35, fx: 0.72, fy: 0.5 }, cam1: { zoom: 1.4, fx: 0.72, fy: 0.5 }, kick: [culpa(4), 0.07],
  hud: { ...CHORUS, readout: 'MEA CULPA  ·  IV' }, draw: (g, t) => shout(g, t, mea(4), 'MEA CULPA!', { size: 320, y: 880, invert: true }) });
S(at('Who', 1, 116.5), { plate: 'P20', cam0: { zoom: 1.3, fx: 0.42, fy: 0.45 }, cam1: { zoom: 1.4, fx: 0.42, fy: 0.45 }, push: 0.02,
  hud: { place: 'OPEN SPACE', year: '2026', readout: 'MERGE  ·  APPROVED  ·  0 COMMENTS' },
  draw: (g, t) => lyric(g, t, ph('Who approved the merge?'), { x: 110, y: 240, size: 88, weight: 700, accent: [3], maxWidth: 760 }) });
S(mea(5), { clip: 'C23', hit: [culpa(5), 3.0], plate: 'P16', cam0: { zoom: 1.3, fx: 0.28, fy: 0.5 }, cam1: { zoom: 1.34, fx: 0.28, fy: 0.5 }, push: 0.03, kick: [culpa(5), 0.07],
  hud: { ...CHORUS, readout: 'MEA CULPA  ·  V' }, draw: (g, t) => shout(g, t, mea(5), 'MEA CULPA!', { size: 300, y: 880, invert: true }) });
S(at('Who', 1, 120.5), { plate: 'P21', cam0: { zoom: 1.2, fx: 0.5, fy: 0.4 }, cam1: { zoom: 1.3, fx: 0.5, fy: 0.4 }, push: 0.02,
  hud: { place: 'OPEN SPACE', year: '2026', readout: 'ENV  ·  EVERY MACHINE?' },
  draw: (g, t) => lyric(g, t, ph('Who swore it worked on every machine?'), { x: 90, y: 300, size: 80, weight: 700, accent: [5, 6], maxWidth: 560 }) });
S(mea(6), { clip: 'C25', hit: [culpa(6), 0.7], plate: 'P17', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.08, fx: 0.55, fy: 0.5 }, kick: [culpa(6), 0.1],
  hud: { ...CHORUS, readout: 'MEA CULPA  ·  VI' }, draw: (g, t) => shout(g, t, mea(6), 'MEA CULPA!', { size: 290, y: 1015, invert: true }) });
S(at('Be', 1, 126.5), { plate: 'P04', cam0: { zoom: 1.25, fx: 0.66, fy: 0.32 }, cam1: { zoom: 1.32, fx: 0.66, fy: 0.32 }, push: 0.02,
  hud: { place: 'MAINZ', year: '1492', readout: 'THE ABBOT' },
  tuck: (gg, t) => lyric(gg, t, ph('Be honest...', 1, 126.5), { x: 90, y: 520, size: 200, font: 'Maguntia', weight: 400, maxWidth: 600, fadeIn: 0.3 }) });

/* VI · Look up (bridge, the beat stops) ─────────────────────────────────────────────────── 050–056 */
const T_CANDLE = at('It', 2, 136);
const T_ROOM = at('in', 1, 142.5);
const T_OUTSIDE = at('Outside');
const T_LOOKUP = at('Look', 1, 150);
const BRIDGE = { place: 'MAINZ', year: '1492' };
// The drop after chorus 2: every ritual we have seen, one per cut, accelerating to one per beat.
const T_DROP2_END = C.hits.kicks.filter((k) => k > 132 && k < 138).pop();
// The same hand, the same gesture, 534 years apart: four pairs, one every four kicks.
const PAIRS = [['P02', 'P03', 'Collation', 'Code review'], ['P11', 'P23', 'Wipe the tears', 'Incident #1'], ['P10', 'P21', 'Copying is prayer', 'Works on my machine'], ['P08', 'P19', 'The quill', 'The green ticks']];
const PAIR_CUTS = C.hits.kicks.filter((k) => k > at('honest', 1, 127) + 1.0 && k < T_DROP2_END).filter((_, i) => i % 4 === 0).slice(0, 4);
PAIR_CUTS.forEach((k, i) => {
  S(k - 1 / 24, { split: PAIRS[i].slice(0, 2), kick: [k, 0.05], hud: { place: 'MAINZ  |  OPEN SPACE', year: '1492  |  2026', readout: 'THE SAME RITUAL' },
    draw: (g, t) => {
      // each half captioned in its own era's type; struck through in vermilion half a bar before the next pair
      const strike = ease.out3(prog(t, (PAIR_CUTS[i + 1] ?? T_DROP2_END + 0.3) - 0.5, (PAIR_CUTS[i + 1] ?? T_DROP2_END + 0.3) - 0.2));
      const left = text(g, PAIRS[i][2], { x: W / 4, y: 990, font: 'Maguntia', size: 56, align: 'center', reveal: prog(t, k, k + 0.3) });
      const right = text(g, PAIRS[i][3], { x: (3 * W) / 4, y: 990, size: 46, weight: 600, align: 'center', reveal: prog(t, k + 0.15, k + 0.45) });
      if (strike > 0) {
        g.fillStyle = RUBRIC;
        g.fillRect(W / 4 - left / 2 - 10, 972, (left + 20) * strike, 6);
        g.fillRect((3 * W) / 4 - right / 2 - 10, 974, (right + 20) * strike, 6);
      }
    } });
});
S(T_DROP2_END + 0.3, { plate: 'P26', fadeIn: 1.2, cam0: { zoom: 1.0, fx: 0.5, fy: 0.45 }, cam1: { zoom: 1.12, fx: 0.5, fy: 0.4 }, push: 0.03,
  hud: { ...BRIDGE, readout: 'FIRST LIGHT' },
  draw: (g, t) => {
    shade(g, W / 2, 860, 760, 110, 0.55);
    lyric(g, t, ph('It was never about the tests.'), { x: W / 2, y: 880, size: 60, weight: 400, align: 'center', accent: [5], fadeIn: 0.4 });
  } });
S(T_CANDLE - 0.1, { plate: 'P01', cam0: { zoom: 1.2, fx: 0.72, fy: 0.4 }, cam1: { zoom: 1.32, fx: 0.72, fy: 0.38 }, push: 0.02,
  hud: { ...BRIDGE, readout: 'ONE CANDLE' },
  draw: (g, t) => lyric(g, t, ph('It was the candle you were holding,'), { x: 140, y: 930, size: 60, weight: 300, accent: [3], fadeIn: 0.4 }) });
S(T_ROOM - 0.1, { plate: 'P09', cam0: { zoom: 1.25, fx: 0.5, fy: 0.55 }, cam1: { zoom: 1.0, fx: 0.5, fy: 0.5 }, camEase: 'out3', push: 0.04,
  hud: { ...BRIDGE, readout: 'THE WORLD  ·  ONE ROOM' },
  draw: (g, t) => lyric(g, t, ph('in a room you called the world.'), { x: W / 2, y: 150, size: 60, weight: 300, align: 'center', accent: [6], fadeIn: 0.4 }) });
S(T_OUTSIDE - 0.1, { plate: 'P29', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.08, fx: 0.55, fy: 0.45 }, push: 0.03,
  hud: { place: 'MAINZ', year: '1494', readout: 'PRINT SHOPS  ·  EVERY STREET' },
  draw: (g, t) => lyric(g, t, ph('Outside, the world is printing.'), { x: W / 2, y: 950, size: 64, weight: 300, align: 'center', accent: [4], fadeIn: 0.4 }) });
S(at('printing') + 0.9, { plate: 'P30', crossfrom: 'P29', cross: 1.2, cam0: { zoom: 1.08, fx: 0.55, fy: 0.45 }, cam1: { zoom: 1.12, fx: 0.55, fy: 0.45 }, push: 0.03,
  hud: { place: 'MAINZ', year: (lt) => String(roll(1494, 2026, prog(lt, 0, 1.6))), readout: 'THE SAME TOWN' } });
S(T_LOOKUP - 0.1, { clip: 'C55', clipAt: 0.53, plate: 'P27', cam0: { zoom: 1.05, fx: 0.42, fy: 0.4 }, cam1: { zoom: 1.14, fx: 0.42, fy: 0.36 }, push: 0.025,
  hud: { ...BRIDGE, readout: 'LOOK UP' },
  draw: (g, t) => {
    shade(g, 1480, 470, 420, 140, 0.45);
    lyric(g, t, ph('Look up.'), { x: 1260, y: 520, size: 150, weight: 500, fadeIn: 0.5 });
  } });
S(at('up', 1, 150) + 1.4, { clip: 'C56', clipAt: 1.45, plate: 'P28', cam0: { zoom: 1.05, fx: 0.42, fy: 0.4 }, cam1: { zoom: 1.12, fx: 0.42, fy: 0.36 }, push: 0.025,
  hud: { place: 'OPEN SPACE', year: (lt) => String(roll(1492, 2026, prog(lt, 0, 0.6))), readout: 'LOOK UP' } });

/* VII · Deprecated (break) ──────────────────────────────────────────────────────────────── 057–063 */
const RITUALS = ['Copied by hand.', 'Checked by eye.', 'Read every line.', 'Looks good to me.', 'Works on my machine.', 'Ship it on a Friday.'];
const T_DEP = [at('DEPRECATED', 1), at('DEPRECATED', 2), at('DEPRECATED', 3)];
const T_RIT = [at('Copied'), at('Checked'), at('Read', 1, 161)];
const T_ANDYOU = at('And', 1, 166);
const ledgerShot = (i) => ({ plate: 'P32', cam0: { zoom: 1.0 + i * 0.04, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.03 + i * 0.04, fx: 0.5, fy: 0.5 },
  hud: { place: 'NOW', year: '2026', readout: (t) => `RITUALS  ·  ${ritualsStruck(t)} OF 6 DEPRECATED` }, draw: (g, t) => ledger(g, t) });
const stampShot = (i) => ({ clip: 'C58', hit: [T_DEP[i], 1.0], plate: 'P31', cam0: { zoom: 1.0, fx: 0.5, fy: 0.62 }, cam1: { zoom: 1.0 + i * 0.07, fx: 0.5, fy: 0.62 }, kick: [T_DEP[i], 0.04],
  // the seal (the plate's subject) falls 120 px in three frames onto the word, presses, and lifts
  subjectDy: (t) => {
    const d = t - T_DEP[i];
    if (d < -3 / 24) return 0;
    if (d < 0) return 120 * ease.in3((d + 3 / 24) / (3 / 24));
    if (d < 3 / 24) return 120;
    return 120 * (1 - ease.inOut3(clamp((d - 3 / 24) / 0.35)));
  },
  // drawn between the clean vellum and the seal, so the seal covers its own mark until it lifts
  under: (g, t) => imprint(g, t, T_DEP[i], 'DEPRECATED', i),
  hud: { place: 'NOW', year: '2026', readout: `DEPRECATED  ·  ${i + 1}` },
  // with the clip, the word is knocked out of the ink the seal actually left, revealed as it lifts
  draw: async (g, t, lt, s) => { if (clipFor('C58')) await inkWord(g, Math.max(0, clipOffset(s) + lt)); } });
S(T_RIT[0] - 0.1, ledgerShot(0));
S(T_DEP[0] - 0.08, stampShot(0));
S(T_RIT[1] - 0.1, ledgerShot(1));
S(T_DEP[1] - 0.08, stampShot(1));
S(T_RIT[2] - 0.1, ledgerShot(2));
S(T_DEP[2] - 0.08, stampShot(2));
S(T_DEP[2] + 1.1, ledgerShot(3));
S(T_ANDYOU - 0.1, { clip: 'C33', clipAt: 0.75, plate: 'P33', cam0: { zoom: 1.0, fx: 0.5, fy: 0.45 }, cam1: { zoom: 1.08, fx: 0.5, fy: 0.42 },
  hud: { place: 'MAINZ', year: '????', readout: 'AND YOU?' },
  draw: (g, t) => lyric(g, t, ph('And you?', 1, 166), { x: 110, y: 990, size: 64, weight: 400, fadeIn: 0.3 }) });

/* VIII · I did (final chorus, the flip) ─────────────────────────────────────────────────── 064–072 */
const T_KEY = at('Be', 1, 168.9);
const T_W1 = at('Who', 1, 171);
const T_DID1 = at('DID', 1);
const T_W2 = at('Who', 1, 175.5);
const T_DID2 = at('DID', 2);
const T_HOLD = at("Who's");
const T_IDID = at('did', 1, 181.5);
const T_THANK2 = at('Thank', 2);
const FINAL = { place: 'MAINZ', year: '1494' };
S(T_KEY - 0.05, { clip: 'C64', plate: 'P34', cam0: { zoom: 1.12, fx: 0.5, fy: 0.55 }, cam1: { zoom: 1.0, fx: 0.5, fy: 0.5 }, camEase: 'out3', push: 0.02, kick: [T_KEY, 0.08],
  hud: { ...FINAL, readout: 'THE PRESS  ·  FULL SPEED' },
  draw: (g, t) => {
    shade(g, W / 2, 130, 700, 120, 0.5);
    text(g, 'Be honest!', { x: W / 2, y: 190, font: 'Maguntia', size: 170, align: 'center', reveal: prog(t, T_KEY, T_KEY + 0.35) });
  } });
S(T_W1 - 0.05, { clip: 'C65', clipAt: 2.5, plate: 'P35', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.15, fx: 0.5, fy: 0.5 }, push: 0.04,
  hud: { place: 'DATA CENTRE', year: '2026', readout: 'TESTS  ·  WRITTEN BY THE MACHINE' },
  draw: (g, t) => lyric(g, t, ph('Who wrote the tests?', 1, 171), { x: W / 2, y: 220, size: 96, weight: 700, align: 'center', accent: [3] }) });
const T_I1 = at('I', 1, 173.5);
const T_I2 = at('I', 1, 177.5);
const kickBefore = (t) => C.hits.kicks.filter((k) => k <= t + 0.03).pop();
S(kickBefore(T_I1), { clip: 'C66', hit: [T_DID1, 1.0], clipMax: 2.5, plate: 'P34', cam0: { zoom: 1.35, fx: 0.48, fy: 0.5 }, cam1: { zoom: 1.4, fx: 0.48, fy: 0.5 }, push: 0.02, kick: [T_DID1, 0.1],
  hud: { ...FINAL, readout: 'TESTS  ·  WRITTEN' }, draw: (g, t) => iDid(g, t, T_I1, T_DID1, { x: W / 2, y: H / 2 + 120, size: 300, invert: false }) });
S(T_W2 - 0.05, { clip: 'C65', clipAt: 2.6, glow: [0.1, 0.18], plate: 'P35', cam0: { zoom: 1.15, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.3, fx: 0.5, fy: 0.5 }, push: 0.04,
  hud: { place: 'DATA CENTRE', year: '2026', readout: 'CODE  ·  READ BY THE MACHINE' },
  draw: (g, t) => lyric(g, t, ph('Who read the code?', 1, 175.5), { x: W / 2, y: 220, size: 96, weight: 700, align: 'center', accent: [3] }) });
S(kickBefore(T_I2), { clip: 'C65', clipAt: 3.4, glow: [0.18, 0.26], plate: 'P35', cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.12, fx: 0.5, fy: 0.5 }, camEase: 'out3', kick: [T_DID2, 0.14],
  hud: { place: 'DATA CENTRE', year: '2026', readout: 'CODE  ·  READ' }, draw: (g, t) => iDid(g, t, T_I2, T_DID2, { x: W / 2 + 170, y: H / 2 + 150, size: 420, invert: true }) });
S(T_HOLD - 0.05, { clip: 'C69', plate: 'P36', cam0: { zoom: 1.0, fx: 0.5, fy: 0.45 }, cam1: { zoom: 1.12, fx: 0.5, fy: 0.5 }, push: 0.025,
  hud: { ...FINAL, year: '1492', readout: 'ONE CANDLE  ·  DAYLIGHT' },
  draw: (g, t) => {
    shade(g, W / 2, 150, 900, 120, 0.55);
    lyric(g, t, ph("Who's still holding the candle?"), { x: W / 2, y: 180, size: 80, weight: 700, align: 'center', accent: [4] });
  } });
S(T_IDID - 0.35, { plate: 'P37', cam0: { zoom: 1.05, fx: 0.6, fy: 0.45 }, cam1: { zoom: 1.2, fx: 0.62, fy: 0.45 }, push: 0.025,
  hud: { ...FINAL, year: '1492', readout: '' },
  draw: (g, t) => text(g, 'I did.', { x: 300, y: 600, size: 72, weight: 300, reveal: prog(t, T_IDID - 0.15, T_IDID + 0.1) }) });
// The drop after "I did": the presses and the racks at sunrise, his candle between them; the copies
// keep doubling past a million.
// Sunrise plates only (round 3: night plates had crept into the dawn), and no counters: a doubling
// "copies" number was invented, and the film shows only numbers it can source. The montage ends on the
// meme INVERTED: the questions on the left, the answers on the right, the last answer his own.
const T_FLIP_GRID = C.hits.kicks.filter((k) => k < T_THANK2 - 0.6 - 4.2).pop();
// The flip's own explaining device (review round 6 asked for one; a doubling "copies" counter was
// declined three times as an invented number): the rituals of the ledger return, each with its new owner.
const HANDOVER = [
  ['Copied by hand.', 'The press.'],
  ['Checked by eye.', 'The machine.'],
  ['Read every line.', 'The machine.'],
  ['Wrote the tests.', 'I did.'],
  ['Held the candle.', 'He did.'],
];
// each line over the one who now does it: the press, the racks in sunrise, the racks reading at speed,
// the press again for the machine's "I did.", and HIM, still holding his candle
montage(T_IDID + 1.6, T_FLIP_GRID, [
  'P34',
  { plate: 'P35', clip: 'C65', clipAt: 3.2, fx: 0.5 },
  { plate: 'P24', clip: 'C32', clipAt: 3.6, fx: 0.5 },
  { plate: 'P34', clip: 'C64', clipAt: 2.4, fx: 0.5 },
  { plate: 'P37', fx: 0.62 },
], {
  hud: (i) => ({ place: i % 2 ? 'DATA CENTRE' : 'MAINZ', year: i % 2 ? '2026' : '1494', readout: 'THE HANDOVER' }),
  overlay: (g, t, i) => {
    const [ritual, owner] = HANDOVER[i % HANDOVER.length];
    shade(g, W / 2, H - 175, 900, 150, 0.6);
    const w = text(g, ritual, { x: W / 2 - 30, y: H - 160, font: 'Maguntia', size: 72, align: 'right' });
    g.fillStyle = RUBRIC;
    g.fillRect(W / 2 - 40 - w, H - 186, w + 20, 6);
    text(g, owner, { x: W / 2 + 30, y: H - 160, size: 62, weight: 700, color: i === 3 ? RUBRIC : INK });
  },
});
// the grid owns the frame; its captions are the readout, so no HUD
S(T_FLIP_GRID, { hud: null, draw: async (g, t, lt, s) => flipGrid(g, t, s.from, s.to) });
S(T_THANK2 - 0.6, { clip: 'C72', hit: [T_THANK2, 0.6], plate: 'P38L', cam0: { zoom: 1.0, fx: 0.4, fy: 0.5 }, cam1: { zoom: 1.02, fx: 0.4, fy: 0.48 },
  hud: { place: 'MAINZ', year: '2026', readout: '' },
  // the caption lives on the shot that carries the word, so it survives the stopgap retiring
  draw: (g, t) => lyric(g, t, ph('Thank you.', 2), { x: W / 2 + 260, y: H / 2 - 40, size: 76, weight: 500, align: 'center', color: '#2A2420', fadeIn: 0.8 }) });
// until C72 exists, the smoke is a cut on the word; the clip will carry both halves in one take
S(T_THANK2, { skipIfClip: 'C72', plate: 'P38', cam0: { zoom: 1.0, fx: 0.4, fy: 0.5 }, cam1: { zoom: 1.08, fx: 0.4, fy: 0.4 },
  hud: { place: 'MAINZ', year: '2026', readout: '' },
  draw: (g, t) => lyric(g, t, ph('Thank you.', 2), { x: W / 2 + 200, y: H / 2, size: 72, weight: 300, align: 'center', fadeIn: 0.8 }) });

const CREDITS = [
  'SONG  ·  ElevenLabs Music',
  'IMAGES  ·  gpt-image-2',
  'MOTION  ·  Grok Imagine',
  'EDIT, TYPE AND MOTION DESIGN  ·  Claude, frame by frame in code',
  'SOURCES  ·  Trithemius, De laude scriptorum (1492; printed Mainz 1494)  ·  Google (2024–2026)  ·  Wolf (1974)',
];

/* IX · Confiteor (outro) ───────────────────────────────────────────────────────────────── 073–075 */
S(C.hits.kicks.find((k) => k > T_THANK2 + 2.6 && k < 199.0) ?? 196.5, { clip: 'C73', plate: 'P39', fadeIn: 0.8, cam0: { zoom: 1.1, fx: 0.64, fy: 0.5 }, cam1: { zoom: 1.18, fx: 0.64, fy: 0.5 }, push: 0,
  hud: { place: 'MAINZ', year: '2026', readout: '' } });
const T_CONF = at('Con-fi-te-or...', 2);
S(199.2, { plate: 'P40', fadeIn: 0.6, cam0: { zoom: 1.0, fx: 0.5, fy: 0.5 }, cam1: { zoom: 1.06, fx: 0.5, fy: 0.55 }, hud: { place: '', year: '', readout: '' },
  draw: (g, t) => {
    // set in ink on the page's clear vellum, as a printer would: the colophon, then the song's last word
    const INK_DARK = '#1A1714';
    text(g, 'Confiteor', { x: W / 2, y: 330, font: 'Maguntia', size: 120, align: 'center', color: INK_DARK, reveal: prog(t, T_CONF, T_CONF + 1.2) });
    text(g, 'Printed at Mainz, 1494.', { x: W / 2, y: 470, font: 'PlexMono', size: 38, weight: 500, align: 'center', color: INK_DARK, reveal: prog(t, 199.8, 200.8) });
    text(g, 'Written in 2026.', { x: W / 2, y: 530, font: 'PlexMono', size: 38, weight: 500, align: 'center', color: RUBRIC, reveal: prog(t, 200.9, 201.5) });
  } });
S(204.5, { hud: null, draw: (g, t) => {
  text(g, 'CONFITEOR', { x: W / 2, y: H / 2 - 60, font: 'Anton', size: 120, align: 'center', tracking: 6, reveal: prog(t, 204.5, 205.0) });
  text(g, '(BE HONEST)', { x: W / 2, y: H / 2, font: 'PlexMono', size: 22, weight: 500, align: 'center', tracking: 8, color: RUBRIC, alpha: prog(t, 204.9, 205.4) });
  CREDITS.forEach((c, i) => text(g, c, { x: W / 2, y: H / 2 + 110 + i * 34, font: 'PlexMono', size: 20, weight: 400, align: 'center', alpha: 0.7 * prog(t, 205.3 + i * 0.15, 205.8 + i * 0.15) }));
} });

// a stopgap shot retires once the clip that replaces it exists
for (let i = SHOTS.length - 1; i >= 0; i--) if (SHOTS[i].skipIfClip && clipFor(SHOTS[i].skipIfClip)) SHOTS.splice(i, 1);
for (let i = 0; i < SHOTS.length; i++) SHOTS[i].to = SHOTS[i + 1]?.from ?? duration;
for (let i = 1; i < SHOTS.length; i++) {
  if (SHOTS[i].from <= SHOTS[i - 1].from) throw new Error(`shot ${i} starts at ${SHOTS[i].from.toFixed(2)} s, not after shot ${i - 1} (${SHOTS[i - 1].from.toFixed(2)} s)`);
}
export const shots = SHOTS;
export const clock = C;
/** Sung words shown in another form: the years are set in figures. */
export const aliases = { fourteen: '14', ninetytwo: '92', ninetyfour: '94' };

/**
 * The most a subject may separate from its clean plate. The fill behind a subject is a smear (OpenCV
 * inpainting), good only for the sliver a small push reveals; review round 3 saw halos at 0.04.
 */
const PUSH_CAP = 0.015;
/** Plates whose clean-plate fill shows even at the cap (round 4: halos round the pressmen): one layer. */
const NO_PARALLAX = new Set(['P34']);

// ── frame ───────────────────────────────────────────────────────────────────────────────────────
export async function frame(g, t) {
  const s = SHOTS.findLast((x) => x.from <= t) ?? SHOTS[0];
  const lt = t - s.from;
  const span = s.to - s.from;
  const k = (s.camEase ? ease[s.camEase] : ease.inOutSine)(prog(lt, 0, span));
  const cam = s.cam0 ? lerpCam(s.cam0, s.cam1 ?? s.cam0, k) : null;
  if (cam && s.kick) cam.zoom *= 1 + punch(t, s.kick[0], s.kick[1]);

  // The base: the shot's clip if it has been made, else its plate in 2.5D, else black.
  let base = null;
  let matte = null;
  const c = s.clip ? (s.clip in CLIPS ? CLIPS[s.clip] : clipFor(s.clip)) : null;
  if (s.split) {
    await split(g, lt, s);
  } else if (c) {
    // clipMax holds a clip on a frame before something it should not show (C66: a stray arm at 2.6 s)
    const local = Math.min(s.clipMax ?? Infinity, Math.max(0, clipOffset(s) + lt));
    base = await c.image(local);
    matte = await c.matte(local);
    cover(g, base, cam);
  } else if (s.plate) {
    if (s.crossfrom) {
      await P[s.crossfrom].draw(g, cam, s.push ?? 0);
      g.globalAlpha = ease.inOut3(prog(lt, 0, s.cross ?? 1));
    } else if (s.fadeIn) g.globalAlpha = ease.out3(prog(lt, 0, s.fadeIn));
    await P[s.plate].draw(g, cam, NO_PARALLAX.has(s.plate) ? 0 : Math.min(PUSH_CAP, (s.push ?? 0) * 0.5) * k, s.subjectDy ? s.subjectDy(t) : 0, s.under ? (gg) => s.under(gg, t) : null);
    g.globalAlpha = 1;
    base = await P[s.plate].image();
    matte = await P[s.plate].matte();
  }
  // glow: a warm exposure ramp over the shot ([from, to] alpha, screen), so the sunrise keeps rising
  // across cuts that re-enter the same clip
  if (s.glow) {
    g.save();
    g.globalCompositeOperation = 'screen';
    g.fillStyle = `rgba(255,196,128,${s.glow[0] + (s.glow[1] - s.glow[0]) * prog(lt, 0, s.to - s.from)})`;
    g.fillRect(0, 0, W, H);
    g.restore();
  }
  if (cam && base) vignette(g, 0.42);
  // A tuck redraws the subject over the type, so it must use the zoom the subject was drawn at: the
  // pushed zoom when the plate has a clean plate, or the tuck would add a second, unpushed copy.
  const subjectCam = cam && s.plate && !c && !s.split && P[s.plate].hasClean && !NO_PARALLAX.has(s.plate) ? { ...cam, zoom: cam.zoom * (1 + Math.min(PUSH_CAP, (s.push ?? 0) * 0.5) * k) } : cam;
  if (s.tuck) tuck(g, base, matte, subjectCam, (gg) => s.tuck(gg, t, lt, s));
  if (s.draw) await s.draw(g, t, lt, s);
  if (s.hud !== null && !(s.hideHudAfter && t >= s.to - s.hideHudAfter)) {
    const h = s.hud ?? {};
    chrome(g, t, {
      place: h.place ?? '',
      year: typeof h.year === 'function' ? h.year(lt) : h.year ?? '',
      readout: typeof h.readout === 'function' ? h.readout(t) : h.readout ?? '',
    });
  }
}

function lerpCam(a, b, k) {
  const l = (x, y) => x + (y - x) * k;
  return { zoom: l(a.zoom ?? 1, b.zoom ?? 1), fx: l(a.fx ?? 0.5, b.fx ?? 0.5), fy: l(a.fy ?? 0.5, b.fy ?? 0.5) };
}

// ── devices ─────────────────────────────────────────────────────────────────────────────────────
const lerp2 = (a, b, k) => a + (b - a) * k;

/** A soft dark ellipse under a caption, so the ink reads on a busy plate without a visible box. */
function shade(g, cx, cy, rx, ry, a) {
  g.save();
  g.translate(cx, cy);
  g.scale(1, ry / rx);
  const r = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  r.addColorStop(0, `rgba(0,0,0,${a})`);
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r;
  g.fillRect(-rx, -rx, rx * 2, rx * 2);
  g.restore();
}

/**
 * The type arrives with the press: a word set in blackletter re-sets itself letter by letter into the
 * grotesque, each letter flipping over like a sort dropped into the composing stick.
 */
function morph(g, t, word, t0, { x, y, size }) {
  const chars = [...word];
  g.save();
  g.font = `400 ${size}px Anton`;
  const widths = chars.map((ch) => g.measureText(ch).width + size * 0.03);
  let cx = x - widths.reduce((a, b) => a + b, 0) / 2;
  g.textAlign = 'center';
  chars.forEach((ch, i) => {
    const k = clamp((t - (t0 + 0.3 + i * 0.09)) / 0.14);
    g.globalAlpha = clamp((t - t0) / 0.15);
    g.fillStyle = k >= 1 && i === chars.length - 1 ? RUBRIC : INK;
    g.save();
    g.translate(cx + widths[i] / 2, y);
    g.scale(1, Math.max(0.03, Math.abs(Math.cos(k * Math.PI))));
    g.font = k < 0.5 ? `400 ${size * 0.95}px Maguntia` : `400 ${size}px Anton`;
    g.fillText(ch, 0, 0);
    g.restore();
    cx += widths[i];
  });
  g.restore();
}

/**
 * THE MEME, re-cast: the 3×2 "Be honest" grid, the Scribe confessing on the left, the Abbot at the
 * door on the right, the panels landing one by one on the riser into the chorus. The lattice closes,
 * and what is behind it is the joke the whole film answers.
 */
const MEME = [
  ['P02', 'I wrote tests', 0.48, 0.42], ['P04', 'Be honest', 0.62, 0.28],
  ['P03', 'Ok, I ran it once', 0.47, 0.42], ['P41', 'Be honest', 0.72, 0.28],
  ['P22', 'I pushed it straight to prod', 0.62, 0.7], ['P05', 'Thank you', 0.5, 0.5],
];
async function memeGrid(g, t, t0, t1) {
  if (t < t0) return;
  const gut = 12;
  const pw = 948;
  const phh = 340;
  const ox = (W - 2 * pw - gut) / 2;
  const oy = (H - 3 * phh - 2 * gut) / 2;
  // one panel per measured beat, the last a beat before the drop
  const beats = C.hits.beats.filter((b) => b < t1 - 0.05).slice(-MEME.length - 1, -1);
  if (t < beats[0]) return;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  for (const [i, [id, caption, fx, fy]] of MEME.entries()) {
    const appear = beats[i];
    if (t < appear) continue;
    const x = ox + (i % 2) * (pw + gut);
    const y = oy + Math.floor(i / 2) * (phh + gut);
    const img = await P[id].image();
    const sc = Math.max(pw / img.width, phh / img.height) * 1.2;
    const iw = img.width * sc;
    const ih = img.height * sc;
    // centre the focus, then clamp so the image always covers its cell (no black gutter beside it)
    const ix = clamp(x + pw / 2 - fx * iw, x + pw - iw, x);
    const iy = clamp(y + phh / 2 - fy * ih, y + phh - ih, y);
    g.save();
    g.beginPath();
    g.rect(x, y, pw, phh);
    g.clip();
    g.drawImage(img, ix, iy, iw, ih);
    g.restore();
    text(g, caption, { x: x + pw / 2, y: y + phh - 30, size: 40, weight: 600, align: 'center', reveal: prog(t, appear, appear + 0.08) });
  }
}

/**
 * THE MEME, ANSWERED: the grid returns at the end of the flip with its sides swapped in meaning. Left,
 * the questions the Abbot used to ask; right, who answers them: the press, the racks, and last, the
 * Scribe himself holding his candle. One panel per beat, as the first grid was built.
 */
const FLIP = [
  ['P04', 'Who wrote the tests?', 0.62, 0.28], ['P34', 'I did.', 0.48, 0.5],
  ['P41', 'Who read the code?', 0.72, 0.28], ['P35', 'I did.', 0.5, 0.5],
  ['P05', "Who's still holding the candle?", 0.5, 0.45], ['P37', 'I did.', 0.6, 0.45],
];
async function flipGrid(g, t, t0, t1) {
  const gut = 12;
  const pw = 948;
  const phh = 340;
  const ox = (W - 2 * pw - gut) / 2;
  const oy = (H - 3 * phh - 2 * gut) / 2;
  // one panel per kick from the cut, the first ON the cut (no black frame before it)
  const beats = C.hits.kicks.filter((b) => b >= t0 - 0.06).slice(0, FLIP.length);
  beats[0] = t0;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  for (const [i, [id, caption, fx, fy]] of FLIP.entries()) {
    if (t < beats[i]) continue;
    const x = ox + (i % 2) * (pw + gut);
    const y = oy + Math.floor(i / 2) * (phh + gut);
    const img = await P[id].image();
    const sc = Math.max(pw / img.width, phh / img.height) * 1.2;
    const iw = img.width * sc;
    const ih = img.height * sc;
    g.save();
    g.beginPath();
    g.rect(x, y, pw, phh);
    g.clip();
    g.drawImage(img, clamp(x + pw / 2 - fx * iw, x + pw - iw, x), clamp(y + phh / 2 - fy * ih, y + phh - ih, y), iw, ih);
    g.restore();
    const answer = i % 2 === 1;
    const cx = x + pw / 2 - (i === 4 ? 80 : 0);
    text(g, caption, { x: cx, y: y + phh - 30, size: answer ? 46 : 38, weight: answer ? 700 : 500, align: 'center', color: i === 5 ? RUBRIC : INK, reveal: prog(t, beats[i], beats[i] + 0.08) });
  }
}

/** The confessional lattice: a diamond grille over the frame, closing in as k goes 0 → 1. */
function lattice(g, k) {
  if (k <= 0) return;
  g.save();
  g.globalAlpha = ease.inOut3(k);
  g.strokeStyle = '#0B0A09';
  const cell = lerp2(240, 120, k);
  g.lineWidth = lerp2(6, 26, k);
  for (let d = -H; d < W + H; d += cell) {
    g.beginPath();
    g.moveTo(d, 0);
    g.lineTo(d + H, H);
    g.moveTo(d + H, 0);
    g.lineTo(d, H);
    g.stroke();
  }
  g.restore();
}

/**
 * THE CURVE: Google's stated share of new code generated by AI, one vermilion line rising through the
 * frame, each point appearing on the word that sings it, with its date. Sources: LYRICS.md.
 */
function curve(g, t) {
  const x0 = 260;
  const x1 = W - 260;
  const y0 = 860;
  const y1 = 220;
  const px = (i) => x0 + (i / (CURVE.length - 1)) * (x1 - x0);
  const py = (v) => y0 - (v / 100) * (y0 - y1);
  g.save();
  g.fillStyle = 'rgba(239,232,218,0.25)';
  g.fillRect(x0, y0, x1 - x0, 1);
  text(g, '100%', { x: x0 - 20, y: py(100) + 40, font: 'PlexMono', size: 18, weight: 400, align: 'right', alpha: 0.5 });
  text(g, '0', { x: x0 - 20, y: y0 + 8, font: 'PlexMono', size: 18, weight: 400, align: 'right', alpha: 0.5 });
  g.strokeStyle = RUBRIC;
  g.lineWidth = 6;
  g.lineJoin = 'round';
  g.beginPath();
  CURVE.forEach((p, i) => {
    const k = ease.out3(prog(t, p.t - 0.05, p.t + 0.35));
    if (k <= 0) return;
    if (i === 0) return g.moveTo(px(0), py(p.v));
    g.lineTo(lerp2(px(i - 1), px(i), k), lerp2(py(CURVE[i - 1].v), py(p.v), k));
  });
  g.stroke();
  CURVE.forEach((p, i) => {
    const k = prog(t, p.t, p.t + 0.25);
    if (k <= 0) return;
    g.fillStyle = RUBRIC;
    g.beginPath();
    g.arc(px(i), py(p.v), 10 * ease.outExpo(k), 0, Math.PI * 2);
    g.fill();
    const big = i === CURVE.length - 1;
    text(g, p.label, { x: px(i), y: py(p.v) - 34 + (p.dy ?? 0), font: big ? 'Anton' : 'Plex', weight: 700, size: big ? 150 : 64, align: 'center', reveal: k });
    shade(g, px(i), py(p.v) + 44 + (p.dy ?? 0) * 2.2, 120, 26, 0.7 * k);
    text(g, p.when, { x: px(i), y: py(p.v) + 50 + (p.dy ?? 0) * 2.2, font: 'PlexMono', size: 20, weight: 500, align: 'center', alpha: 0.9 * k });
  });
  g.restore();
}

/** Verse 2's numbers, sung word by word above the curve, so the lyric is on screen and not only its chart. */
function numbersLine(g, t) {
  lyric(g, t, ph('Twenty-five percent. Then thirty. Then a half.'), { x: 140, y: 120, size: 44, weight: 500, maxWidth: 1640 });
  lyric(g, t, ph('Then three quarters of the new code.'), { x: 140, y: 175, size: 44, weight: 500, accent: [1, 2] });
}

/**
 * DEPRECATED as the seal's IMPRINT, pressed into the empty vellum on the slam: vermilion, rotated,
 * with the ink's own gaps knocked out of it, so it reads as a mark made by the stamp and not as a
 * label laid over the shot.
 */
function imprint(g, t, t0, word, seed) {
  // pressed on the word; the seal above hides it until it lifts
  if (t < t0) return;
  const k = 1;
  const l = layer();
  const cx = 965;
  const cy = 800;
  l.g.save();
  l.g.translate(cx, cy);
  l.g.scale(1, 0.36); // the vellum is seen at a low angle: a round seal leaves an ellipse
  l.g.rotate((seed - 1) * 4 * (Math.PI / 180));
  l.g.strokeStyle = RUBRIC;
  l.g.lineWidth = 16;
  l.g.beginPath();
  l.g.arc(0, 0, 480, 0, Math.PI * 2);
  l.g.stroke();
  l.g.lineWidth = 6;
  l.g.beginPath();
  l.g.arc(0, 0, 446, 0, Math.PI * 2);
  l.g.stroke();
  // about 80% of the face's width, inside the ring
  text(l.g, word, { x: 0, y: 70, font: 'Anton', size: 190, align: 'center', color: RUBRIC, tracking: 3 });
  l.g.restore();
  l.g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 1600; i++) {
    const x = cx - 520 + hash(seed, i, 1) * 1040;
    const y = cy - 200 + hash(seed, i, 2) * 400;
    const r = 0.8 + hash(seed, i, 3) ** 3 * 6;
    l.g.globalAlpha = 0.35 + hash(seed, i, 4) * 0.65;
    l.g.beginPath();
    l.g.arc(x, y, r, 0, Math.PI * 2);
    l.g.fill();
  }
  g.save();
  g.globalAlpha = 0.92 * k;
  g.globalCompositeOperation = 'multiply';
  g.drawImage(l.c, 0, 0);
  g.restore();
  free(l);
}

/**
 * DEPRECATED knocked out of the seal's imprint in the C58 clip: vellum-coloured type inside the
 * vermilion disc, squashed to the disc's perspective, drawn only where the disc is visible (the clip's
 * per-frame ink mask, `engine/tools/inkmask.py`), so the word appears with the ink as the seal lifts.
 */
async function inkWord(g, local) {
  // the mask also catches the seal's own inked face while it presses: knock the word only once it lifts
  if (local < (CLIP_HITS['C58@1.0']?.measured ?? 3.42) + 0.12) return;
  const f = String(Math.min(121, Math.floor(local * 24) + 1)).padStart(5, '0');
  const maskPath = join(GEN, 'frames', 'confiteor-C58', 'ink', `${f}.png`);
  if (!existsSync(maskPath)) return;
  const l = layer();
  l.g.save();
  l.g.translate(960, 735);
  l.g.scale(1, 0.36);
  text(l.g, 'DEPRECATED', { x: 0, y: 70, font: 'Anton', size: 200, align: 'center', color: '#EFE6D8', tracking: 3 });
  l.g.restore();
  l.g.globalCompositeOperation = 'destination-in';
  l.g.drawImage(await image(maskPath), 0, 0, W, H);
  g.drawImage(l.c, 0, 0);
  free(l);
}

/**
 * The crowd's "I DID!": the "I" appears on its own sung onset, "DID!" slams on its word (the flash, when
 * asked, is on DID). Two hits, as it is sung, not one block arriving late.
 */
function iDid(g, t, tI, tDid, { x, y, size, invert }) {
  if (t < tI) return;
  g.save();
  g.font = `400 ${size}px Anton`;
  const wI = g.measureText('I ').width;
  const wD = g.measureText('DID!').width;
  g.restore();
  const left = x - (wI + wD) / 2;
  if (invert && t >= tDid && t < tDid + 2 / 24) {
    g.fillStyle = INK;
    g.fillRect(0, 0, W, H);
  }
  const flash = invert && t >= tDid && t < tDid + 2 / 24;
  const kI = 1 + 0.06 * (1 - ease.outExpo(clamp((t - tI) / 0.2)));
  g.save();
  g.translate(left + wI / 2, y);
  g.scale(kI, kI);
  text(g, 'I', { x: 0, y: 0, font: 'Anton', size, align: 'center', color: flash ? '#0B0A09' : INK });
  g.restore();
  if (t >= tDid) {
    const kD = 1 + 0.1 * (1 - ease.outExpo(clamp((t - tDid) / 0.25)));
    g.save();
    g.translate(left + wI + wD / 2, y);
    g.scale(kD, kD);
    text(g, 'DID!', { x: 0, y: 0, font: 'Anton', size, align: 'center', color: flash ? '#0B0A09' : INK });
    g.restore();
  }
}

/** How many ticks are drawn at t: one per bead the fingers slide, eight beads. The HUD reads the same number. */
function ticksCounted(t, t0) {
  return Math.min(8, Math.max(0, Math.floor((t - t0) / 0.25)));
}

/** Ticks counted like beads: one ivory tick per bead the fingers slide. Never green. */
function ticks(g, t, t0) {
  const n = ticksCounted(t, t0);
  g.save();
  g.strokeStyle = INK;
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.globalAlpha = 0.85;
  for (let i = 0; i < n; i++) {
    const x = 150 + i * 52;
    g.beginPath();
    g.moveTo(x, 600);
    g.lineTo(x + 12, 614);
    g.lineTo(x + 34, 584);
    g.stroke();
  }
  g.restore();
}

/** When each ritual is struck: the first three on their DEPRECATED, the rest on the next three beats. */
function strikeTime(i) {
  return i < 3 ? T_DEP[i] + 0.1 : T_DEP[2] + 1.45 + (i - 3) * 0.49;
}
function ritualsStruck(t) {
  return RITUALS.filter((_, i) => t >= strikeTime(i) + 0.1).length;
}

/** The ledger: the old rituals in blackletter on the scroll, struck through in red as each is deprecated. */
function ledger(g, t) {
  g.save();
  RITUALS.forEach((r, i) => {
    const appear = i < 3 ? T_RIT[i] : T_DEP[2] + 1.2 + (i - 3) * 0.49;
    if (t < appear) return;
    const y = 470 + i * 78;
    const w = text(g, r, { x: 300, y, font: 'Maguntia', size: 66, color: '#1A1714', reveal: prog(t, appear, appear + 0.4) });
    const k = ease.out3(prog(t, strikeTime(i), strikeTime(i) + 0.25));
    if (k > 0) {
      g.strokeStyle = RUBRIC;
      g.lineWidth = 9;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(290, y - 22 + hash(i) * 6);
      g.lineTo(290 + (w + 30) * k, y - 24 - hash(i, 2) * 8);
      g.stroke();
    }
  });
  g.restore();
}

/** 1492 and 2026 side by side: the same man, the same pose, a vermilion seam between them. */
async function split(g, lt, s) {
  const half = layer();
  const k = ease.out3(prog(lt, 0, 0.35));
  for (const [i, id] of s.split.entries()) {
    half.g.clearRect(0, 0, W, H);
    await P[id].draw(half.g, { zoom: 1.12, fx: 0.48, fy: 0.45 }, 0);
    g.save();
    g.beginPath();
    g.rect(i === 0 ? 0 : W / 2 + (1 - k) * (W / 2), 0, W / 2, H);
    g.clip();
    g.drawImage(half.c, i === 0 ? -W / 4 : W / 4, 0);
    g.restore();
  }
  free(half);
  vignette(g, 0.42);
  g.fillStyle = RUBRIC;
  g.fillRect(W / 2 - 2, 0, 4, H * k);
}
