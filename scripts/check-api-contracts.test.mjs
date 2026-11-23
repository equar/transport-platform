import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { needsContractSync, hasUnstagedContractChanges } from './check-api-contracts.mjs';

test('API inputs, deletions and generated outputs trigger synchronization; UI-only commits do not', () => {
  for (const path of ['backend/src/main/java/example/Request.java', 'backend/pom.xml',
    'backend/src/test/java/com/transportplatform/tms/contracts/ApiContractGenerationTest.java',
    'scripts/generate-api-types.mjs', 'frontend/src/shared/api/generated/contracts.ts']) {
    assert.equal(needsContractSync([path]), true);
  }
  assert.equal(needsContractSync(['frontend/src/example.tsx', 'mobile/src/example.tsx']), false);
  assert.equal(hasUnstagedContractChanges(['backend/src/main/java/example/Request.java']), true);
});
function fixture(run) {
  const root = mkdtempSync(join(tmpdir(), 'transport-contract-hook-'));
  const command = (cmd, args) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
  const git = (...args) => { const r = command('git', args); assert.equal(r.status, 0, r.stderr); return r.stdout; };
  const write = (path, text) => { mkdirSync(join(root, path, '..'), { recursive: true }); writeFileSync(join(root, path), text); };
  try {
    git('init', '-q');
    mkdirSync(join(root, 'scripts'));
    copyFileSync(new URL('./check-api-contracts.mjs', import.meta.url), join(root, 'scripts/check-api-contracts.mjs'));
    const output = 'frontend/src/shared/api/generated/contracts.ts';
    write(output, 'old'); write('mobile/src/api/generated/contracts.ts', 'old');
    write('backend/src/main/java/example/Request.java', 'class Request {}');
    write('scripts/sync-api-contracts.mjs', `import {writeFileSync} from 'node:fs'; for(const p of ${JSON.stringify([output, 'mobile/src/api/generated/contracts.ts'])}) writeFileSync(p, 'new');`);
    git('add', '.');
    run({ root, git, write, command, output });
  } finally { rmSync(root, { recursive: true, force: true }); }
}
test('hook includes regenerated outputs in staged changes', () => fixture(({ git, command, output }) => {
  const result = command(process.execPath, ['scripts/check-api-contracts.mjs']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(git('show', `:${output}`), 'new');
}));
test('hook refuses partial backend staging without changing generated files', () => fixture(({ root, write, command, output }) => {
  write('backend/src/main/java/example/Request.java', 'class Request { int unfinished; }');
  const result = command(process.execPath, ['scripts/check-api-contracts.mjs']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unstaged changes/);
  assert.equal(readFileSync(join(root, output), 'utf8'), 'old');
}));
test('hook refuses unstaged generated output edits', () => fixture(({ write, command, output }) => {
  write(output, 'unfinished');
  assert.equal(command(process.execPath, ['scripts/check-api-contracts.mjs']).status, 1);
}));
test('hook refuses untracked Java sources so they cannot leak into a commit contract', () => fixture(({ write, command }) => {
  write('backend/src/main/java/example/Unfinished.java', 'class Unfinished {}');
  assert.equal(command(process.execPath, ['scripts/check-api-contracts.mjs']).status, 1);
}));
test('installer is repeatable and preserves existing custom hooks', () => fixture(({ root, command, write }) => {
  copyFileSync(new URL('./install-git-hooks.mjs', import.meta.url), join(root, 'scripts/install-git-hooks.mjs'));
  const install = () => command(process.execPath, ['scripts/install-git-hooks.mjs']);
  assert.equal(install().status, 0);
  const hook = readFileSync(join(root, '.git/hooks/pre-commit'), 'utf8');
  assert.match(hook, /check-api-contracts\.mjs/);
  assert.equal(install().status, 0);
  assert.equal(readFileSync(join(root, '.git/hooks/pre-commit'), 'utf8'), hook);
  write('.git/hooks/pre-commit', '#!/bin/sh\necho custom\n');
  const result = install();
  assert.equal(result.status, 0);
  assert.match(result.stderr, /Existing pre-commit hook preserved/);
  assert.equal(readFileSync(join(root, '.git/hooks/pre-commit'), 'utf8'), '#!/bin/sh\necho custom\n');
}));
test('installer preserves a configured hooks directory', () => fixture(({ root, command, git }) => {
  copyFileSync(new URL('./install-git-hooks.mjs', import.meta.url), join(root, 'scripts/install-git-hooks.mjs'));
  git('config', 'core.hooksPath', '.custom-hooks');
  const result = command(process.execPath, ['scripts/install-git-hooks.mjs']);
  assert.equal(result.status, 0);
  assert.match(result.stderr, /Custom core.hooksPath preserved/);
}));
