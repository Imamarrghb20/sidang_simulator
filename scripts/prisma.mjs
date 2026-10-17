import nextEnv from '@next/env';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

// Gunakan prioritas lingkungan Next.js: env proses, .env.local, lalu .env.
// Hanya baca konfigurasi; tidak membuat atau menulis file lingkungan.
nextEnv.loadEnvConfig(process.cwd());
const child = spawn(process.execPath, [resolve('node_modules/prisma/build/index.js'), ...process.argv.slice(2)], {
  stdio: 'inherit', env: process.env, windowsHide: true,
});
child.on('error', () => { console.error('Prisma tidak dapat dijalankan. Periksa instalasi dependensi.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
