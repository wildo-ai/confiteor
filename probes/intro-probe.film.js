/**
 * CONFITEOR (BE HONEST) — the film. Song time in, frame out.
 *
 * Probe 3 covers the intro (0–21 s of take `confiteor-probe-02`): the meme's three rounds of
 * confession, the Abbot at the door, the year rolling 1492 → 2026 on each match cut, and the beat
 * dropping on "Mainz". Every caption appears on its word's sung time, read from the take's timing JSON.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { H, INK, RUBRIC, W, chrome, clip, cover, ease, plate, prog, punch, roll, rubricStroke, text, tuck, vignette } from '../../engine/lib.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const GEN = join(HERE, '..', '..', '..', '.generated');
const TAKE = join(GEN, 'music', 'confiteor-probe-02');

export const audio = `${TAKE}.mp3`;
export const duration = 21;

// ── the song's clock: every sung word with its time ──────────────────────────────────────────────
const WORDS = JSON.parse(readFileSync(`${TAKE}.timing.json`, 'utf8'))
  .words_timestamps.filter((w) => w.end_ms > w.start_ms)
  .map((w) => ({ w: w.word, s: w.start_ms / 1000, e: w.end_ms / 1000 }));
/** The time of the n-th sung occurrence of `word` (punctuation ignored), so captions follow the take. */
function at(word, n = 1) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const hits = WORDS.filter((x) => norm(x.w) === norm(word));
  if (!hits[n - 1]) throw new Error(`"${word}" #${n} is not in the take`);
  return hits[n - 1].s;
}

// ── media ───────────────────────────────────────────────────────────────────────────────────────
const SCRIBE = clip(join(GEN, 'frames', 'confiteor-probe-motion-01'));
const ABBOT = clip(join(GEN, 'frames', 'confiteor-probe-motion-02'));
const DEV = plate(join(GEN, 'plates', 'be-honest-sf02.jpg'));
const PRESS = plate(join(GEN, 'plates', 'be-honest-sf03.jpg'));

// ── the edit: shots keyed to sung words ─────────────────────────────────────────────────────────
const T = {
  wrote: at('I', 1),
  tests: at('tests'),
  honest1: at('Be', 1),
  okay: at('Okay'),
  ran: at('RAN'),
  once: at('Once'),
  honest2: at('Be', 2),
  pushed: at('I', 3),
  straight: at('straight'),
  prod: at('prod'),
  thank: at('Thank'),
  mainz: at('Mainz', 1),
};

const SHOTS = [
  { from: 0, to: T.wrote, draw: confiteor },
  { from: T.wrote, to: T.honest1, draw: scribe },
  { from: T.honest1, to: T.okay, draw: abbotWide },
  { from: T.okay, to: T.honest2, draw: devRan },
  { from: T.honest2, to: T.pushed, draw: abbotClose },
  { from: T.pushed, to: T.thank, draw: devProd },
  { from: T.thank, to: T.mainz, draw: thankYou },
  { from: T.mainz, to: duration, draw: mainz },
];

export async function frame(g, t) {
  const shot = SHOTS.find((s) => t >= s.from && t < s.to) ?? SHOTS[SHOTS.length - 1];
  await shot.draw(g, t, t - shot.from, shot);
}

// ── the shots ───────────────────────────────────────────────────────────────────────────────────

/** Black. The choir's first word, set in the blackletter of Mainz. */
async function confiteor(g, t, lt, s) {
  const k = prog(lt, 0, s.to - s.from);
  text(g, 'Confiteor', { x: W / 2, y: H / 2 + 30, font: 'Maguntia', weight: 400, size: 120, align: 'center', reveal: ease.out3(k * 1.4), alpha: 0.9 });
  text(g, 'I CONFESS', { x: W / 2, y: H / 2 + 90, font: 'PlexMono', weight: 400, size: 16, align: 'center', tracking: 6, alpha: 0.5 * k });
}

/** 1492. He checks his copy, finds the mistake, looks up at the door. "I wrote… tests." */
async function scribe(g, t, lt) {
  const cam = { zoom: 1.04 + lt * 0.012, fx: 0.48, fy: 0.42 };
  cover(g, await SCRIBE.image(lt), cam);
  vignette(g);
  const x = 150;
  const y = 250;
  const w1 = text(g, 'I wrote…', { x, y, size: 76, weight: 600, reveal: prog(t, T.wrote, T.wrote + 0.5) });
  const tk = prog(t, T.tests, T.tests + 0.35);
  const w2 = text(g, 'tests.', { x: x + w1 + 26, y, size: 76, weight: 600, color: RUBRIC, reveal: tk });
  rubricStroke(g, x + w1 + 22, y + 22, w2 + 10, ease.out3(prog(t, T.tests + 0.2, T.tests + 0.9)), 3);
  chrome(g, t, { place: 'MAINZ', year: '1492', readout: `COLLATION  ·  LINE ${String(1204 + Math.floor(lt * 3)).padStart(5, '0')}  ·  CHECKED BY HAND` });
}

/** The meme's peek, transposed: the Abbot at the door. "Be honest." tucked behind him. */
async function abbotWide(g, t, lt) {
  const cam = { zoom: 1.02 + lt * 0.01, fx: 0.55, fy: 0.45 };
  const img = await ABBOT.image(lt);
  cover(g, img, cam);
  vignette(g, 0.35);
  tuck(g, img, await ABBOT.matte(lt), cam, (gg) => {
    text(gg, 'Be', { x: 110, y: 520, font: 'Maguntia', size: 210, reveal: prog(t, T.honest1, T.honest1 + 0.2), rise: 0.1 });
    text(gg, 'honest.', { x: 230, y: 740, font: 'Maguntia', size: 210, reveal: prog(t, at('honest', 1), at('honest', 1) + 0.3), rise: 0.1 });
  });
  chrome(g, t, { place: 'MAINZ', year: '1492', readout: 'THE ABBOT  ·  AT THE DOOR' });
}

/** 2026, the same man, the same pose. "Okay. I ran it. Once." The year rolls on the cut. */
async function devRan(g, t, lt) {
  const cam = { zoom: 1.08 + lt * 0.018, fx: 0.47, fy: 0.42 };
  cover(g, await DEV.image(), cam);
  vignette(g);
  const x = 150;
  text(g, 'Okay.', { x, y: 780, size: 60, weight: 400, alpha: 0.85, reveal: prog(t, T.okay, T.okay + 0.3) });
  const w1 = text(g, 'I ran it.', { x, y: 900, size: 76, weight: 600, reveal: prog(t, T.ran - 0.1, T.ran + 0.35) });
  text(g, 'Once.', { x: x + w1 + 26, y: 900, size: 76, weight: 600, color: RUBRIC, reveal: prog(t, T.once, T.once + 0.25) });
  const runs = t >= T.once ? '1' : '0';
  chrome(g, t, { place: 'OPEN SPACE', year: String(roll(1492, 2026, prog(lt, 0, 0.7))), readout: `TEST RUNS  ·  ${runs}` });
}

/** Closer, the eye. The second "Be honest." */
async function abbotClose(g, t, lt) {
  const local = 0.1 + lt; // the clip's opening stare and lean, reframed close: eyes open on the words
  const cam = { zoom: 1.25 + lt * 0.03, fx: 0.66, fy: 0.32 };
  const img = await ABBOT.image(local);
  cover(g, img, cam);
  vignette(g, 0.4);
  tuck(g, img, await ABBOT.matte(local), cam, (gg) => {
    text(gg, 'Be', { x: 90, y: 470, font: 'Maguntia', size: 200, reveal: prog(t, T.honest2, T.honest2 + 0.2), rise: 0.08 });
    text(gg, 'honest.', { x: 90, y: 690, font: 'Maguntia', size: 200, reveal: prog(t, at('honest', 2), at('honest', 2) + 0.35), rise: 0.08 });
  });
  chrome(g, t, { place: 'MAINZ', year: String(roll(2026, 1492, prog(lt, 0, 0.5))), readout: 'THE ABBOT  ·  UNCONVINCED' });
}

/** The hands, the keyboard, the printout. "I pushed it straight to prod." A punch on "prod". */
async function devProd(g, t, lt) {
  const cam = { zoom: 1.5 + lt * 0.05 + punch(t, T.prod, 0.08, 0.3), fx: 0.5, fy: 0.72 };
  cover(g, await DEV.image(), cam);
  vignette(g, 0.5);
  const x = 150;
  const w1 = text(g, 'I pushed it', { x, y: 820, size: 76, weight: 600, reveal: prog(t, T.pushed, T.pushed + 0.5) });
  const w2 = text(g, 'straight to', { x, y: 910, size: 76, weight: 600, reveal: prog(t, T.straight, T.straight + 0.35) });
  text(g, 'prod.', { x: x + w2 + 26, y: 910, size: 76, weight: 600, color: RUBRIC, reveal: prog(t, T.prod, T.prod + 0.2) });
  const cmd = '$ git push origin main --no-verify';
  const typed = Math.floor(prog(t, T.pushed + 0.2, T.straight) * cmd.length);
  text(g, cmd.slice(0, typed), { x, y: 700, font: 'PlexMono', size: 26, weight: 400, alpha: 0.75 });
  if (t > T.prod) text(g, '→ production   deployed', { x, y: 740, font: 'PlexMono', size: 26, weight: 400, color: RUBRIC });
  chrome(g, t, { place: 'OPEN SPACE', year: '2026', readout: `TESTS  ·  0 WRITTEN  ·  ${t > T.prod ? 'SHIPPED' : 'PENDING'}` });
  void w1;
}

/** The Machine answers, quietly, from the nave of hanging pages. */
async function thankYou(g, t, lt, s) {
  const cam = { zoom: 1.12 + lt * 0.03, fx: 0.5, fy: 0.38 };
  g.globalAlpha = ease.out3(prog(lt, 0, 0.6));
  cover(g, await PRESS.image(), cam);
  g.globalAlpha = 1;
  vignette(g, 0.55);
  shade(g, W / 2, H / 2, 520, 160, 0.55 * ease.out3(prog(t, T.thank - 0.2, T.thank + 0.4)));
  text(g, 'Thank you.', { x: W / 2, y: H / 2 + 20, size: 64, weight: 300, align: 'center', reveal: prog(t, T.thank, T.thank + 0.6), rise: 0.15 });
  const fade = 1 - prog(t, s.to - 0.25, s.to);
  chrome(g, t, { place: 'MAINZ', year: '1494', readout: 'THE PRESS', alpha: 0.7 * fade });
}

/** The beat drops on "Mainz": the press clank is the kick. */
async function mainz(g, t, lt) {
  const cam = { zoom: 1.0 + punch(t, T.mainz, 0.06, 0.35), fx: 0.5, fy: 0.5 };
  cover(g, await PRESS.image(), cam);
  vignette(g, 0.45);
  text(g, 'MAINZ,', { x: 150, y: 930, font: 'Anton', weight: 400, size: 150, tracking: 4, reveal: prog(lt, 0, 0.12), rise: 0.05 });
  chrome(g, t, { place: 'MAINZ', year: '1492', readout: 'VERSE 1' });
  void INK;
}

/** A soft dark ellipse under a caption: the ink reads on a busy plate without a visible box. */
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
