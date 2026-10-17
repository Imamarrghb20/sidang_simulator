import { service } from '@/lib/runtime';
import { body, handle } from '@/lib/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request) { return handle(request, () => service.overview()); }
export function POST(request: Request) { return handle(request, async () => service.saveProfile(await body(request))); }
