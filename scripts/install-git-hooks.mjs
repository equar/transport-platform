#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
function git(args) { return spawnSync('git', args, { cwd: root, encoding: 'utf8' }); }
const hooks = git(['rev-parse', '--git-path', 'hooks']);
// npm installs from exported source archives should work without Git metadata.
if (hooks.status !== 0) process.exit(0);
const configured = git(['config', '--get', 'core.hooksPath']);
if (configured.status === 0 && configured.stdout.trim()) {
  console.warn('Custom core.hooksPath preserved. Add `node scripts/check-api-contracts.mjs` to your existing pre-commit hook.');
  process.exit(0);
}
const path = resolve(root, hooks.stdout.trim(), 'pre-commit');
const marker = '# transport-platform-api-contracts';
let existing = '';
try { existing = await readFile(path, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (existing && !existing.includes(marker)) {
  console.warn('Existing pre-commit hook preserved. Add `node scripts/check-api-contracts.mjs` to it to enable API contract synchronization.');
  process.exit(0);
}
await mkdir(dirname(path), { recursive: true });
await writeFile(path, `#!/bin/sh\n${marker}\nroot=$(git rev-parse --show-toplevel) || exit 1\nexec node "$root/scripts/check-api-contracts.mjs"\n`, { mode: 0o755 });
console.log('Installed API contract synchronization hook.');
