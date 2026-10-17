import { service } from '@/lib/runtime';
import { body, handle } from '@/lib/http';
export const runtime = 'nodejs';
export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => { await service.updateWeakness((await params).id, await body(request)); return { ok: true }; });
}
