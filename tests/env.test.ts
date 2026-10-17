import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('.env.local dimuat sebelum Prisma, konfigurasi proses diprioritaskan, file tidak ditulis ulang', () => {
  mkdirSync(resolve('test-results'), { recursive: true });
  const directory = mkdtempSync(resolve('test-results/env-'));
  const fallback = 'AI_MODEL=fallback\nAI_API_KEY=synthetic-fallback\nDATABASE_URL=file:./fallback.db\n';
  const local = 'AI_MODEL=local\nAI_API_KEY=synthetic-local\nDATABASE_URL=file:./local.db\n';
  writeFileSync(resolve(directory, '.env'), fallback);
  writeFileSync(resolve(directory, '.env.local'), local);
  const environment = { ...process.env };
  for (const key of ['AI_MODEL', 'AI_API_KEY', 'DATABASE_URL', '__NEXT_PROCESSED_ENV']) delete environment[key];
  const check = `require('@next/env').loadEnvConfig(process.argv[1]);require('@prisma/client');console.log(JSON.stringify({model:process.env.AI_MODEL===process.argv[2],key:process.env.AI_API_KEY==='synthetic-local',database:process.env.DATABASE_URL==='file:./local.db'}))`;
  for (const processOverride of [false, true]) {
    const result = spawnSync(process.execPath, ['-e', check, directory, processOverride ? 'process' : 'local'], {
      env: processOverride ? { ...environment, AI_MODEL: 'process' } : environment,
      encoding: 'utf8', windowsHide: true,
    });
    assert.equal(result.status, 0, 'Subproses pemeriksaan konfigurasi gagal.');
    assert.deepEqual(JSON.parse(result.stdout.trim()), { model: true, key: true, database: true });
  }
  assert.equal(readFileSync(resolve(directory, '.env'), 'utf8'), fallback);
  assert.equal(readFileSync(resolve(directory, '.env.local'), 'utf8'), local);
});
