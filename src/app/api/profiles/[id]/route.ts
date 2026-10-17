import { service } from '@/lib/runtime';
import { body, handle } from '@/lib/http';
export const runtime = 'nodejs';
export function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => service.saveProfile(await body(request), (await params).id));
}
