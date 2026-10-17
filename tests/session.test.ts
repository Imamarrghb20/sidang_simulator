import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { PrismaClient } from '@prisma/client';
import { SidangService } from '../src/lib/service';
import { AppError, RouterAdapter, systemPrompt, type AIAdapter, type AIRequest } from '../src/lib/ai';
import { contextSchema, emptyContext, sessionInput, type Context, type Evaluation } from '../src/lib/contracts';
import { guard } from '../src/lib/http';

const context: Context = { ...emptyContext, title: 'Prototipe perpustakaan', background: 'Peminjaman masih dicatat manual.', goals: 'Mempermudah pencatatan peminjaman.' };
function evaluation(request: AIRequest): Evaluation {
  return { summary: 'Alasan perlu diperjelas.', dimensions: { relevansi: 'Sesuai pertanyaan.', kejelasanAlasan: 'Butuh alasan rinci.', dukunganBukti: 'Bukti belum diberikan.', konsistensi: 'Metode belum tersedia; perlu klarifikasi.' },
    weaknesses: [{ dimension: 'kejelasanAlasan', title: 'Alasan terlalu singkat', quote: request.history.at(-1)!.answer!, reason: 'Hubungan dengan tujuan perlu dijelaskan.', improvement: 'Jelaskan alasan dan gunakan [bukti yang tersedia].', contextRefs: [{ field: 'goals', quote: context.goals }] }], contextRefs: [], followup: null };
}
class FakeAI implements AIAdapter {
  calls: AIRequest[] = []; fail = false; invalid = false; followup = false;
  async call(_config: unknown, request: AIRequest) {
    this.calls.push(request);
    if (this.fail) throw new AppError('9Router tidak tersedia.', 502);
    if (request.kind === 'question') return { value: { question: `Jelaskan alasan penelitian bagian ${request.main}?` }, model: 'fake-actual' };
    const value = evaluation(request);
    if (this.invalid) value.weaknesses[0].quote = 'BUKTI YANG TIDAK PERNAH DIKATAKAN';
    if (this.followup && request.allowFollowup) value.followup = 'Bisakah alasan itu dikaitkan dengan tujuan?';
    return { value, model: 'fake-actual' };
  }
}
async function fixture(adapter: AIAdapter = new FakeAI()) {
  mkdirSync(resolve('test-results'), { recursive: true });
  const directory = mkdtempSync(resolve('test-results/session-'));
  const path = resolve(directory, 'test.db'); const sqlite = new DatabaseSync(path);
  sqlite.exec(readFileSync(resolve('prisma/migrations/202610170001_initial/migration.sql'), 'utf8')); sqlite.close();
  const client = new PrismaClient({ datasources: { db: { url: `file:${path.replaceAll('\\', '/')}` } } });
  const service = new SidangService(client, adapter); const profile = await service.saveProfile(context);
  return { client, service, profile, path };
}
test('AC-01/05: profil, snapshot konfigurasi, sesi aktif dan jawaban bertahan pada client baru', async () => {
  const { client, service, profile, path } = await fixture(); const original = process.env.AI_MODEL; process.env.AI_MODEL = 'requested-test';
  const s = await service.create({ profileId: profile.id, mode: 'latihan', total: 2 });
  if (original === undefined) delete process.env.AI_MODEL; else process.env.AI_MODEL = original;
  await service.saveProfile({ ...context, title: 'Judul baru' }, profile.id);
  const current = await service.advance(s.id); await service.answer(s.id, current.turns[0].id, 'Agar pencatatan lebih mudah.');
  await client.$disconnect();
  const next = new PrismaClient({ datasources: { db: { url: `file:${path.replaceAll('\\', '/')}` } } });
  try {
    const resumed = await new SidangService(next, new FakeAI()).get(s.id);
    assert.equal(resumed.snapshot.title, context.title); assert.equal(resumed.requestedModel, 'requested-test');
    assert.equal(resumed.actualModel, 'fake-actual'); assert.equal(resumed.turns.length, 2);
    assert.equal(resumed.turns[0].answer, 'Agar pencatatan lebih mudah.'); assert.equal(resumed.status, 'active');
    const overview = await new SidangService(next, new FakeAI()).overview(); assert.equal(overview.profiles[0].context.title, 'Judul baru');
    assert.ok(!JSON.stringify(resumed).includes('AI_API_KEY'));
  } finally { await next.$disconnect(); }
});
test('AC-02: tiga utama, maksimal tiga susulan; pengiriman ulang tidak menggandakan giliran', async () => {
  const ai = new FakeAI(); ai.followup = true; const { client, service, profile } = await fixture(ai);
  try {
    let s = await service.create({ profileId: profile.id, mode: 'latihan', total: 3 }); s = await service.advance(s.id);
    while (s.status !== 'completed') {
      const turn = s.turns.at(-1)!; s = await service.answer(s.id, turn.id, 'Saya perlu menjelaskan alasan pendukung tujuan.');
      const duplicate = await service.answer(s.id, turn.id, 'Saya perlu menjelaskan alasan pendukung tujuan.'); assert.equal(duplicate.turns.length, s.turns.length);
    }
    assert.equal(s.turns.filter(t => !t.followup).length, 3); assert.equal(s.turns.filter(t => t.followup).length, 3);
    assert.equal(s.turns.length, 6); assert.ok(s.turns.every(t => t.evaluation));
  } finally { await client.$disconnect(); }
});
test('AC-03: evaluasi Simulasi tidak keluar melalui detail atau daftar kelemahan sebelum selesai', async () => {
  const { client, service, profile } = await fixture();
  try {
    let s = await service.create({ profileId: profile.id, mode: 'simulasi', total: 2 }); s = await service.advance(s.id);
    s = await service.answer(s.id, s.turns[0].id, 'Alasan awal saya.');
    assert.equal(s.turns[0].evaluation, null); assert.deepEqual(s.weaknesses, []); assert.ok(!JSON.stringify(s).includes('Alasan terlalu singkat'));
    assert.deepEqual((await service.overview()).weaknesses, []);
    const stored = await client.weakness.findFirstOrThrow();
    await assert.rejects(service.updateWeakness(stored.id, { status: 'sedang diperbaiki', note: 'x' }), /tidak ditemukan/);
    s = await service.end(s.id); assert.equal(s.status, 'completed'); assert.ok(s.turns[0].evaluation); assert.equal(s.weaknesses.length, 1);
    let p = await service.create({ profileId: profile.id, mode: 'latihan', total: 2 }); p = await service.advance(p.id);
    p = await service.answer(p.id, p.turns[0].id, 'Alasan lain.'); assert.ok(p.turns[0].evaluation);
  } finally { await client.$disconnect(); }
});
test('AC-04/06: kegagalan dan kutipan palsu dapat diulang tanpa kehilangan jawaban atau duplikasi', async () => {
  const ai = new FakeAI(); const { client, service, profile } = await fixture(ai);
  try {
    let s = await service.create({ profileId: profile.id, mode: 'latihan', total: 1 }); s = await service.advance(s.id);
    ai.fail = true; s = await service.answer(s.id, s.turns[0].id, 'Jawaban yang harus tetap tersimpan.');
    assert.ok(s.error); assert.equal(s.turns[0].answer, 'Jawaban yang harus tetap tersimpan.'); assert.equal(s.turns[0].evaluation, null);
    ai.fail = false; ai.invalid = true; s = await service.advance(s.id); assert.match(s.error!, /bukti kutipan/);
    assert.equal(await client.weakness.count(), 0); ai.invalid = false;
    s = await service.advance(s.id); assert.equal(s.status, 'completed'); assert.equal(s.turns.length, 1); assert.equal(s.weaknesses.length, 1);
  } finally { await client.$disconnect(); }
});
test('AC-07: dua sesi, target satu profil, perbandingan jawaban dan status manual', async () => {
  const ai = new FakeAI(); const { client, service, profile } = await fixture(ai);
  try {
    let s = await service.create({ profileId: profile.id, mode: 'latihan', total: 1 }); s = await service.advance(s.id);
    s = await service.answer(s.id, s.turns[0].id, 'Jawaban lama.'); const weakness = s.weaknesses[0];
    await service.updateWeakness(weakness.id, { status: 'sedang diperbaiki', note: 'Tambahkan alasan terkait tujuan.' });
    const other = await service.saveProfile({ ...context, title: 'Profil lain' });
    await assert.rejects(service.create({ profileId: other.id, mode: 'latihan', total: 1, weaknessIds: [weakness.id] }), /profil yang sama/);
    let retry = await service.create({ profileId: profile.id, mode: 'latihan', total: 1, weaknessIds: [weakness.id] }); retry = await service.advance(retry.id);
    assert.equal(ai.calls.at(-1)!.target?.title, weakness.evidence.title);
    retry = await service.answer(retry.id, retry.turns[0].id, 'Jawaban baru dengan penjelasan tujuan.');
    assert.equal(retry.comparisons[0].oldAnswer, 'Jawaban lama.'); assert.equal(retry.comparisons[0].newTurns[0].answer, 'Jawaban baru dengan penjelasan tujuan.');
    const stored = await client.weakness.findUniqueOrThrow({ where: { id: weakness.id } }); assert.equal(stored.status, 'sedang diperbaiki'); assert.equal(stored.note, 'Tambahkan alasan terkait tujuan.');
  } finally { await client.$disconnect(); }
});
test('FR-06: sesi kosong selesai tanpa AI; akhir awal mengevaluasi jawaban tertunda saja', async () => {
  const ai = new FakeAI(); const { client, service, profile } = await fixture(ai);
  try {
    let s = await service.create({ profileId: profile.id, mode: 'simulasi', total: 5 }); s = await service.end(s.id);
    assert.equal(s.status, 'completed'); assert.equal(s.turns.length, 0); assert.equal(ai.calls.length, 0);
    s = await service.create({ profileId: profile.id, mode: 'simulasi', total: 5 }); s = await service.advance(s.id);
    ai.fail = true; s = await service.answer(s.id, s.turns[0].id, 'Satu jawaban saja.'); ai.fail = false;
    s = await service.end(s.id); assert.equal(s.status, 'completed'); assert.equal(s.turns.length, 1); assert.ok(s.turns[0].evaluation);
  } finally { await client.$disconnect(); }
});
test('FR-04: kirim serentak melihat jawaban commit dan hanya menyimpan satu evaluasi', async () => {
  let release!: () => void; let entered!: () => void; const gate = new Promise<void>(r => { release = r; }); const called = new Promise<void>(r => { entered = r; });
  const base = new FakeAI();
  const adapter: AIAdapter = { async call(config, request) {
    if (request.kind === 'evaluation') { const saved = await client.turn.findFirstOrThrow({ where: { answer: { not: null } } }); assert.equal(saved.answer, 'Jawaban serentak.'); entered(); await gate; }
    return base.call(config, request);
  } };
  const f = await fixture(adapter); const { service, profile, client } = f;
  try {
    let s = await service.create({ profileId: profile.id, mode: 'latihan', total: 1 }); s = await service.advance(s.id);
    const first = service.answer(s.id, s.turns[0].id, 'Jawaban serentak.'); await called;
    await assert.rejects(service.answer(s.id, s.turns[0].id, 'Jawaban serentak.'), /sedang diproses/);
    release(); const result = await first; assert.equal(result.turns.length, 1); assert.equal(await client.weakness.count(), 1);
  } finally { release(); await client.$disconnect(); }
});
test('lease proses kedaluwarsa dapat dipulihkan', async () => {
  const { client, service, profile } = await fixture();
  try {
    const s = await service.create({ profileId: profile.id, mode: 'latihan', total: 1 });
    await client.session.update({ where: { id: s.id }, data: { leaseToken: 'server-lama', leaseUntil: new Date(Date.now() - 1000) } });
    const resumed = await service.advance(s.id); assert.equal(resumed.turns.length, 1); assert.equal(resumed.busy, false);
  } finally { await client.$disconnect(); }
});
test('validasi batas profil, jawaban, jumlah pertanyaan dan kutipan field kosong', async () => {
  assert.equal(contextSchema.safeParse({ ...context, background: 'x'.repeat(30_001) }).success, false);
  assert.equal(contextSchema.safeParse({ ...context, title: '  ' }).success, false);
  assert.equal(sessionInput.safeParse({ profileId: 'a', mode: 'latihan', total: 11 }).success, false);
  assert.equal(sessionInput.safeParse({ profileId: 'a', mode: 'latihan', total: 1, weaknessIds: ['a', 'b'] }).success, false);
  const { client, service, profile } = await fixture();
  try {
    let s = await service.create({ profileId: profile.id, mode: 'latihan', total: 1 }); s = await service.advance(s.id);
    await assert.rejects(service.answer(s.id, s.turns[0].id, ' ')); await assert.rejects(service.answer(s.id, s.turns[0].id, 'x'.repeat(6001)));
    assert.equal((await service.get(s.id)).turns[0].answer, null);
    const badAI: AIAdapter = { async call(_config, request) { const value = evaluation(request); value.contextRefs = [{ field: 'method', quote: 'Waterfall' }]; return { value, model: null }; } };
    s = await new SidangService(client, badAI).answer(s.id, s.turns[0].id, 'Metode belum diputuskan.');
    assert.ok(s.error); assert.equal(s.turns[0].evaluation, null); assert.equal(s.snapshot.method, '');
  } finally { await client.$disconnect(); }
});
test('adapter: JSON tanpa response_format, model aktual, HTTP gagal, timeout dan konfigurasi kosong', async () => {
  const previous = process.env.AI_API_KEY; process.env.AI_API_KEY = 'test-only-secret';
  const request: AIRequest = { kind: 'question', context, history: [], main: 1, total: 1, allowFollowup: false, target: null };
  try {
    const adapter = new RouterAdapter(async (url, options) => {
      assert.equal(url, 'http://localhost:20128/v1/chat/completions'); const payload = JSON.parse(options!.body as string);
      assert.equal(payload.response_format, undefined); assert.equal(payload.messages[0].content, systemPrompt); assert.equal(payload.messages[1].role, 'user');
      assert.equal(JSON.parse(payload.messages[1].content).context.method, '');
      return Response.json({ model: 'gateway-actual', choices: [{ message: { content: '```json\n{"question":"Jelaskan tujuan?"}\n```' } }] });
    });
    const result = await adapter.call({ baseUrl: 'http://localhost:20128/v1', model: 'requested' }, request); assert.equal(result.model, 'gateway-actual');
    const failed = new RouterAdapter(async () => new Response('secret upstream body', { status: 500 }));
    await assert.rejects(failed.call({ baseUrl: 'http://localhost/v1', model: 'x' }, request), /HTTP 500/);
    const timeout = new RouterAdapter(async (_url, options) => { await new Promise(r => setTimeout(r, 25)); options!.signal!.throwIfAborted(); return Response.json({}); }, 5);
    await assert.rejects(timeout.call({ baseUrl: 'http://localhost/v1', model: 'x' }, request), /timeout/);
    delete process.env.AI_API_KEY; await assert.rejects(adapter.call({ baseUrl: 'http://localhost/v1', model: 'x' }, request), /belum lengkap/);
  } finally { if (previous === undefined) delete process.env.AI_API_KEY; else process.env.AI_API_KEY = previous; }
});
test('API menolak host publik dan permintaan lintas situs', () => {
  assert.doesNotThrow(() => guard(new Request('http://localhost:3000/api/profiles')));
  assert.doesNotThrow(() => guard(new Request('http://localhost:3000/api/profiles', { headers: { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' } })));
  assert.throws(() => guard(new Request('http://localhost:3000/api/profiles', { headers: { host: 'evil.example' } })), /localhost/);
  assert.throws(() => guard(new Request('http://example.com/api/profiles')), /localhost/);
  assert.throws(() => guard(new Request('http://localhost:3000/api/profiles', { headers: { origin: 'https://evil.example' } })), /Asal/);
  assert.throws(() => guard(new Request('http://localhost:3000/api/profiles', { headers: { 'sec-fetch-site': 'cross-site' } })), /lintas situs/);
});
