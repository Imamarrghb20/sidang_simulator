import { service } from '@/lib/runtime';
import { body, handle } from '@/lib/http';
export const runtime = 'nodejs';
export function POST(request: Request) { return handle(request, async () => service.create(await body(request))); }
