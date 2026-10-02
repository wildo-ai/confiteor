#!/usr/bin/env node
/**
 * Make the clips in PROMPTS.md with Grok Imagine (1080p, no audio), as written: the prompt book is
 * the source, read and approved by Paul before anything spent.
 *
 *   node tools/clips.mjs [--only C09,C10] [--redo C09] [--jobs 4] [--dry-run]
 *
 * Each entry's first frame is its plate (marketing/.generated/plates/confiteor/<P>.jpg), or a reframing
 * of it (FRAMINGS below) where the book says so. A finished clip is extracted to
 * marketing/.generated/frames/confiteor-<id>/ at 1920×1080, 24 fps, where the film picks it up instead
 * of the plate. Idempotent: a clip whose frames exist is skipped unless --redo names it.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILM = join(HERE, '..');
const MARKETING = join(FILM, '..', '..');
const TOOLING = join(MARKETING, 'tooling');
const GEN = join(MARKETING, '.generated');
const PLATES = join(GEN, 'plates', 'confiteor');
const { values: o } = parseArgs({ options: { only: { type: 'string' }, redo: { type: 'string' }, jobs: { type: 'string', default: '4' }, 'dry-run': { type: 'boolean' } } });
const only = o.only ? new Set(o.only.split(',')) : null;
const redo = new Set((o.redo ?? '').split(',').filter(Boolean));

/** First frames the book asks for as a reframing of a plate: crop (zoom about a focus) then 1920×1080. */
const FRAMINGS = {
  C25: { plate: 'P17', zoom: 1.6, fx: 0.3, fy: 0.45 }, // "cropped on the three nearest people"
  C66: { plate: 'P34', zoom: 1.5, fx: 0.48, fy: 0.42 }, // "reframed on the platen"
};

// ── parse the book ──────────────────────────────────────────────────────────────────────────────
const book = readFileSync(join(FILM, 'PROMPTS.md'), 'utf8');
const entries = [];
for (const block of book.split(/^### /m).slice(1)) {
  const head = /^(C\d+)\s*·[^·]*·[^·]*·\s*(\d+)\s*s/.exec(block);
  if (!head) continue;
  const plate = /\*\*plate\*\*\s+(P\d+L?)/.exec(block)?.[1];
  const prompt = /```\n([\s\S]*?)\n```/.exec(block)?.[1];
  if (!plate || !prompt) throw new Error(`${head[1]}: no plate or no prompt in the book`);
  entries.push({ id: head[1], seconds: Number(head[2]), plate, prompt });
}
const plateFile = (id) => readdirSync(PLATES).find((f) => f.startsWith(`${id}-`) && /^P\d+L?-[a-z-]+\.jpg$/.test(f));

const todo = entries.filter((e) => (!only || only.has(e.id)) && (redo.has(e.id) || !existsSync(join(GEN, 'frames', `confiteor-${e.id}`))));
console.log(`${entries.length} clips in the book · ${todo.length} to make · ${todo.reduce((a, e) => a + e.seconds, 0)} s · ~$${(todo.reduce((a, e) => a + e.seconds, 0) * 0.25).toFixed(2)} at $0.25/s`);
if (o['dry-run']) {
  for (const e of todo) console.log(`  ${e.id}  ${e.seconds}s  ${FRAMINGS[e.id] ? `${FRAMINGS[e.id].plate} (reframed)` : e.plate}`);
  process.exit(0);
}

const run = (cmd, args, cwd) => new Promise((res) => {
  const p = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  p.stdout.on('data', (d) => (out += d));
  p.stderr.on('data', (d) => (out += d));
  p.on('close', (code) => res({ code, out }));
});

async function firstFrame(e) {
  const f = FRAMINGS[e.id];
  if (!f) {
    const file = plateFile(e.plate);
    if (!file) throw new Error(`${e.id}: plate ${e.plate} has no 1080p file in ${PLATES}`);
    return join(PLATES, file);
  }
  const src = join(PLATES, plateFile(f.plate));
  const out = join(GEN, 'clips-first-frames', `${e.id}.jpg`);
  mkdirSync(dirname(out), { recursive: true });
  const w = 1920 / f.zoom;
  const h = 1080 / f.zoom;
  const x = Math.max(0, Math.min(1920 - w, f.fx * 1920 - w / 2));
  const y = Math.max(0, Math.min(1080 - h, f.fy * 1080 - h / 2));
  await run('ffmpeg', ['-loglevel', 'error', '-y', '-i', src, '-vf', `crop=${Math.round(w)}:${Math.round(h)}:${Math.round(x)}:${Math.round(y)},scale=1920:1080:flags=lanczos`, '-q:v', '2', out]);
  return out;
}

async function make(e) {
  const image = await firstFrame(e);
  const name = `confiteor-${e.id}${redo.has(e.id) ? `-${Date.now()}` : ''}`;
  const r = await run('node', ['src/cli.ts', 'video', '--no-open', '--no-audio', '--duration', String(e.seconds), '--resolution', '1080p', '--image', image, '--name', name, '--prompt', e.prompt], TOOLING);
  const mp4 = join(GEN, 'videos', `${name}.mp4`);
  if (r.code !== 0 || !existsSync(mp4)) {
    console.log(`✗ ${e.id}: ${r.out.split('\n').filter((l) => /HTTP|error|fail|✗|x /i.test(l)).slice(0, 3).join(' | ') || `exit ${r.code}`}`);
    return;
  }
  const dir = join(GEN, 'frames', `confiteor-${e.id}`);
  mkdirSync(dir, { recursive: true });
  await run('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp4, '-vf', 'fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080', '-q:v', '2', join(dir, '%05d.jpg')]);
  console.log(`✓ ${e.id} (${readdirSync(dir).filter((f) => f.endsWith('.jpg')).length} frames)`);
}

const queue = [...todo];
await Promise.all(Array.from({ length: Number(o.jobs) }, async () => {
  while (queue.length) await make(queue.shift());
}));
