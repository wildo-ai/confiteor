#!/usr/bin/env node
/**
 * Paint every plate in plates.json that does not exist yet, through `wm image` (gpt-image-2).
 *
 *   node tools/plates.mjs [--only P07,P12] [--redo P07] [--jobs 4]
 *
 * Refs are resolved against plates/, so an established plate keeps a face or a place the same.
 * Generated files land in marketing/.generated/images and are copied into plates/ under their id,
 * so plates/ is the storyboard's one source of pictures. Idempotent: an existing plate is skipped
 * unless --redo names it.
 */
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILM = join(HERE, '..');
const TOOLING = join(FILM, '..', '..', 'tooling');
const GEN = join(FILM, '..', '..', '.generated', 'images');
const { values: o } = parseArgs({ options: { only: { type: 'string' }, redo: { type: 'string' }, jobs: { type: 'string', default: '4' } } });
const only = o.only ? new Set(o.only.split(',')) : null;
const redo = new Set((o.redo ?? '').split(',').filter(Boolean));

const { plates } = JSON.parse(readFileSync(join(FILM, 'plates.json'), 'utf8'));
const todo = plates.filter((p) => (!only || only.has(p.id)) && (redo.has(p.id) || !existsSync(join(FILM, 'plates', p.file))));
console.log(`${todo.length} plate(s) to paint`);

async function paint(p) {
  const name = `confiteor-${p.id}-${p.name}${redo.has(p.id) ? `-${Date.now()}` : ''}`;
  const args = ['src/cli.ts', 'image', '--no-open', '--name', name, '--size', '2048x1152', '--quality', 'high', '--prompt', p.prompt];
  for (const r of p.refs) args.push('--ref', join(FILM, 'plates', r));
  const code = await new Promise((res) => spawn('node', args, { cwd: TOOLING, stdio: ['ignore', 'ignore', 'inherit'] }).on('close', res));
  if (code !== 0) return console.log(`✗ ${p.id} ${p.name} (exit ${code})`);
  copyFileSync(join(GEN, `${name}.png`), join(FILM, 'plates', p.file));
  console.log(`✓ ${p.id} ${p.name}`);
}

const queue = [...todo];
await Promise.all(Array.from({ length: Number(o.jobs) }, async () => {
  while (queue.length) await paint(queue.shift());
}));
