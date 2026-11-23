#!/usr/bin/env node
// Runs only for commits affecting API generation; unrelated commits stay fast.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const outputs = ['frontend/src/shared/api/generated/contracts.ts', 'mobile/src/api/generated/contracts.ts'];
function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'Git command failed.');
  return result.stdout;
}
export function isContractInput(path) {
  return /^backend\/src\/main\/java\/.*\.java$/.test(path)
    || path === 'backend/src/test/java/com/transportplatform/tms/contracts/ApiContractGenerationTest.java'
    || path === 'backend/pom.xml'
    || path === 'scripts/generate-api-types.mjs'
    || path === 'scripts/sync-api-contracts.mjs';
}
export function needsContractSync(paths) {
  return paths.some(path => isContractInput(path) || outputs.includes(path));
}
export function hasUnstagedContractChanges(paths) {
  return paths.some(path => isContractInput(path) || outputs.includes(path));
}
function main() {
  const staged = git(['diff', '--cached', '--name-only', '-z']).split('\0').filter(Boolean);
  if (!needsContractSync(staged)) return;
  const unstaged = [
    ...git(['diff', '--name-only', '-z']).split('\0'),
    ...git(['ls-files', '--others', '--exclude-standard', '-z', '--', 'backend/src/main/java']).split('\0'),
  ].filter(Boolean);
  if (hasUnstagedContractChanges(unstaged)) {
    console.error('API contract inputs or outputs have unstaged changes. Stage those changes together, or stash the unfinished changes, then commit again. No files were generated or staged.');
    process.exitCode = 1;
    return;
  }
  // A deleted Java class can survive in target/classes. Clean before exporting
  // so the contract represents source files in this commit, including deletions.
  const result = spawnSync(process.execPath, ['scripts/sync-api-contracts.mjs', '--clean'], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) { process.exitCode = result.status ?? 1; return; }
  git(['add', '--', ...outputs]);
  console.log('Included synchronized web and mobile API contracts in this commit.');
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
