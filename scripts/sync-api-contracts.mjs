#!/usr/bin/env node
// Use the database-free schema exporter that CI runs, never a live API endpoint.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) {
    console.error(`Could not run ${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('mvn', ['-q', ...(process.argv.includes('--clean') ? ['clean'] : []), '-Dtest=ApiContractGenerationTest', 'test'], fileURLToPath(new URL('../backend/', import.meta.url)));
run(process.execPath, ['scripts/generate-api-types.mjs', 'backend/target/api-contracts.json']);
