import { z } from 'zod';
import { service } from '@/lib/runtime';
import { body, handle } from '@/lib/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => service.get((await params).id));
}
const action = z.discriminatedUnion('action', [
  z.object({ action: z.literal('answer'), turnId: z.string().min(1), answer: z.string() }).strict(),
  z.object({ action: z.literal('retry') }).strict(), z.object({ action: z.literal('end') }).strict(),
]);
export function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(request, async () => {
    const input = action.parse(await body(request)); const { id } = await params;
    if (input.action === 'answer') return service.answer(id, input.turnId, input.answer);
    return input.action === 'end' ? service.end(id) : service.advance(id);
  });
}
