import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './ai';
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
export function guard(request: Request) {
  const url = new URL(request.url);
  if (!localHosts.has(url.hostname)) throw new AppError('Aplikasi hanya tersedia di localhost.', 403);
  // Next dapat menormalisasi request.url ke localhost walau browser memakai 127.0.0.1.
  // Host HTTP tetap harus loopback; jangan mempercayai x-forwarded-host.
  const host = request.headers.get('host') ?? url.host;
  let browserOrigin: URL;
  try { browserOrigin = new URL(`${url.protocol}//${host}`); }
  catch { throw new AppError('Host tidak valid.', 403); }
  if (!localHosts.has(browserOrigin.hostname) || browserOrigin.username || browserOrigin.password || browserOrigin.pathname !== '/' || browserOrigin.search || browserOrigin.hash) throw new AppError('Aplikasi hanya tersedia di localhost.', 403);
  const origin = request.headers.get('origin');
  if (origin && origin !== browserOrigin.origin) throw new AppError('Asal permintaan tidak diizinkan.', 403);
  if (request.headers.get('sec-fetch-site') === 'cross-site') throw new AppError('Permintaan lintas situs tidak diizinkan.', 403);
}
export async function body(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new AppError('Gunakan JSON.', 415);
  const text = await request.text();
  if (text.length > 150_000) throw new AppError('Permintaan terlalu besar.', 413);
  try { return JSON.parse(text) as unknown; } catch { throw new AppError('JSON tidak valid.'); }
}
export async function handle(request: Request, work: () => Promise<unknown>) {
  try {
    guard(request);
    return NextResponse.json(await work(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof AppError ? error.message : error instanceof ZodError ? error.issues.map(i => i.message).join(' ') : 'Penyimpanan gagal. Periksa setup database lalu coba kembali.';
    return NextResponse.json({ error: message }, { status: error instanceof AppError ? error.status : error instanceof ZodError ? 400 : 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
