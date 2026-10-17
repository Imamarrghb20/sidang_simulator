import { z } from 'zod';

export const fields = {
  title: 'Judul sementara', background: 'Ringkasan latar belakang',
  problem: 'Rumusan masalah', goals: 'Tujuan', contribution: 'Kontribusi',
  scope: 'Ruang lingkup', method: 'Metode pengembangan / penelitian', evaluationPlan: 'Rencana evaluasi',
} as const;
export const contextSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi.'), background: z.string().trim().min(1, 'Latar belakang wajib diisi.'),
  goals: z.string().trim().min(1, 'Tujuan wajib diisi.'), problem: z.string().trim(), contribution: z.string().trim(),
  scope: z.string().trim(), method: z.string().trim(), evaluationPlan: z.string().trim(),
}).strict().refine(v => Object.values(v).reduce((sum, text) => sum + text.length, 0) <= 30_000, 'Total konteks maksimal 30.000 karakter.');
export type Context = z.infer<typeof contextSchema>;
export const emptyContext: Context = { title: '', background: '', goals: '', problem: '', contribution: '', scope: '', method: '', evaluationPlan: '' };
export const sessionInput = z.object({
  profileId: z.string().min(1), mode: z.enum(['latihan', 'simulasi']), total: z.number().int().min(1).max(10).default(5),
  weaknessIds: z.array(z.string().min(1)).max(10).default([]),
}).strict().refine(v => new Set(v.weaknessIds).size === v.weaknessIds.length && v.total >= v.weaknessIds.length,
  'Jumlah pertanyaan harus cukup untuk semua kelemahan yang dipilih, tanpa duplikasi.');
export const answerSchema = z.string().trim().min(1, 'Jawaban tidak boleh kosong.').max(6000, 'Jawaban maksimal 6.000 karakter.');
export const statuses = ['perlu dilatih', 'sedang diperbaiki', 'sudah dilatih ulang'] as const;
export const weaknessUpdate = z.object({ status: z.enum(statuses), note: z.string().max(6000) }).strict();
const text = z.string().trim().min(1).max(6000);
export const dimensions = ['relevansi', 'kejelasanAlasan', 'dukunganBukti', 'konsistensi'] as const;
const reference = z.object({ field: z.enum(Object.keys(fields) as [keyof Context, ...Array<keyof Context>]), quote: text }).strict();
export const evidenceSchema = z.object({ dimension: z.enum(dimensions), title: text, quote: text, reason: text, improvement: text, contextRefs: z.array(reference).max(8) }).strict();
export type Evidence = z.infer<typeof evidenceSchema>;
export const evaluationSchema = z.object({
  summary: text, dimensions: z.object({ relevansi: text, kejelasanAlasan: text, dukunganBukti: text, konsistensi: text }).strict(),
  weaknesses: z.array(evidenceSchema).max(8), contextRefs: z.array(reference).max(8), followup: text.nullable(),
}).strict();
export type Evaluation = z.infer<typeof evaluationSchema>;
export const questionSchema = z.object({ question: text }).strict();
export function validateEvaluation(value: unknown, answer: string, context: Context): Evaluation {
  const evaluation = evaluationSchema.parse(value);
  for (const weakness of evaluation.weaknesses) if (!answer.includes(weakness.quote)) throw new Error('Kutipan jawaban tidak cocok.');
  for (const ref of [...evaluation.contextRefs, ...evaluation.weaknesses.flatMap(w => w.contextRefs)]) {
    if (!context[ref.field] || !context[ref.field].includes(ref.quote)) throw new Error('Kutipan konteks tidak cocok.');
  }
  return evaluation;
}
export type TurnView = { id: string; ordinal: number; main: number; followup: boolean; question: string; answer: string | null; evaluation: Evaluation | null };
export type WeaknessView = {
  id: string; profileId: string; sessionId: string; turnId: string; status: typeof statuses[number]; note: string;
  evidence: Evidence; question: string; answer: string; profileTitle: string;
};
export type SessionView = {
  id: string; profileId: string; snapshot: Context; mode: 'latihan' | 'simulasi'; total: number; status: string; createdAt: string;
  busy: boolean; error: string | null; requestedModel: string; actualModel: string | null; turns: TurnView[]; weaknesses: WeaknessView[];
  comparisons: { weaknessId: string; evidence: Evidence; main: number; oldQuestion: string; oldAnswer: string; newTurns: TurnView[] }[];
};
export type ProfileView = { id: string; context: Context };
export type SessionSummary = Pick<SessionView, 'id' | 'profileId' | 'snapshot' | 'mode' | 'total' | 'status' | 'createdAt'>;
export type Overview = { profiles: ProfileView[]; sessions: SessionSummary[]; weaknesses: WeaknessView[]; aiReady: boolean };
