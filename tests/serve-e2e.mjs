// Gateway dan database palsu hanya untuk pengujian. Aplikasi produksi selalu memakai RouterAdapter.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { once } from 'node:events';
mkdirSync(resolve('test-results'), { recursive: true });
const directory = mkdtempSync(resolve('test-results/browser-'));
const path = resolve(directory, 'test.db');
const sqlite = new DatabaseSync(path);
sqlite.exec(readFileSync(resolve('prisma/migrations/202610170001_initial/migration.sql'), 'utf8')); sqlite.close();
let failNext = false;
let child;
let restarting = false;
const gateway = createServer(async (req, res) => {
  if (req.url === '/fail-next') { failNext = true; res.end('ok'); return; }
  if (req.url === '/restart-app') {
    restarting = true;
    const exited = once(child, 'exit'); child.kill(); await exited;
    startApp(); restarting = false; res.end('ok'); return;
  }
  if (failNext) { failNext = false; req.socket.destroy(); return; }
  let body = ''; for await (const chunk of req) body += chunk;
  try {
    const request = JSON.parse(JSON.parse(body).messages[1].content);
    const value = request.kind === 'question' ? { question: `Bagaimana penelitian Anda mendukung tujuan pada bagian ${request.main}?` } : {
      summary: 'Alasan dapat dibuat lebih rinci.',
      dimensions: { relevansi: 'Jawaban terkait pertanyaan.', kejelasanAlasan: 'Hubungan dengan tujuan perlu diperjelas.', dukunganBukti: 'Bukti perlu dijelaskan bila tersedia.', konsistensi: 'Metode belum tersedia pada profil, tidak diasumsikan.' },
      weaknesses: [{ dimension: 'kejelasanAlasan', title: 'Hubungan alasan dan tujuan', quote: request.history.at(-1).answer, reason: 'Alasan perlu dihubungkan dengan tujuan penelitian.', improvement: 'Jelaskan hubungan dengan [bukti yang tersedia].', contextRefs: [{ field: 'goals', quote: request.context.goals }] }],
      contextRefs: [], followup: request.allowFollowup && !request.target ? 'Dapatkah Anda menjelaskan hubungan alasan tersebut dengan tujuan?' : null,
    };
    // Regresi layout memakai evaluasi panjang melalui jalur API/validasi yang sama.
    if (request.kind !== 'question' && request.context.title.startsWith('Regresi alur vertikal ')) {
      value.summary = 'Jawaban singkat perlu menjelaskan hubungan alasan, bukti, dan tujuan penelitian.';
      value.weaknesses = Array.from({ length: 3 }, (_, index) => ({
        dimension: 'kejelasanAlasan', title: `Temuan terperinci ${index + 1}`,
        quote: request.history.at(-1).answer,
        reason: 'Alasan perlu dihubungkan dengan tujuan penelitian. Jelaskan bagaimana keputusan tersebut mengikuti kebutuhan yang tersedia dan bedakan informasi yang sudah diketahui dari rencana yang belum diuji. '.repeat(8).trim(),
        improvement: 'Uraikan hubungan alasan dan tujuan secara bertahap, sertakan [bukti yang tersedia], lalu jelaskan keterbatasannya tanpa mengarang hasil penelitian. '.repeat(6).trim(),
        contextRefs: [{ field: 'goals', quote: request.context.goals }],
      }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ model: 'browser-fixture-only', choices: [{ message: { content: JSON.stringify(value) } }] }));
  } catch { res.writeHead(400); res.end(); }
});
function startApp() {
  child = spawn(process.execPath, [resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3100'], {
    stdio: 'inherit', windowsHide: true,
    env: { ...process.env, DATABASE_URL: `file:${path.replaceAll('\\', '/')}`, AI_BASE_URL: 'http://127.0.0.1:3101/v1', AI_API_KEY: 'browser-fixture-no-real-key', AI_MODEL: 'browser-fixture-requested' },
  });
  child.on('exit', code => { if (!restarting) { gateway.closeAllConnections(); gateway.close(); process.exit(code ?? 0); } });
}
const stop = () => { child?.kill(); gateway.closeAllConnections(); gateway.close(); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
gateway.listen(3101, '127.0.0.1', startApp);
