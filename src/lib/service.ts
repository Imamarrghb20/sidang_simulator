import { randomUUID } from 'node:crypto';
import { type PrismaClient, type Prisma } from '@prisma/client';
import { AppError, type AIAdapter, type AIConfig, aiReady, configuration } from './ai';
import {
  answerSchema, contextSchema, sessionInput, weaknessUpdate, questionSchema, validateEvaluation,
  type Context, type Evaluation, type Evidence, type Overview, type SessionView, type TurnView, type WeaknessView,
} from './contracts';

const includeSession = { turns: { orderBy: { ordinal: 'asc' as const } }, weaknesses: { include: { turn: true, profile: true } }, targets: { include: { weakness: { include: { turn: true } } }, orderBy: { main: 'asc' as const } } };
type FullSession = Prisma.SessionGetPayload<{ include: typeof includeSession }>;
type FullWeakness = Prisma.WeaknessGetPayload<{ include: { turn: true; profile: true } }>;
function weaknessView(w: FullWeakness): WeaknessView {
  return { id: w.id, profileId: w.profileId, sessionId: w.sessionId, turnId: w.turnId, status: w.status as WeaknessView['status'], note: w.note,
    evidence: JSON.parse(w.evidence), question: w.turn.question, answer: w.turn.answer ?? '', profileTitle: (JSON.parse(w.profile.context) as Context).title };
}
export function sessionView(s: FullSession): SessionView {
  const visible = s.mode === 'latihan' || s.status === 'completed';
  const turns: TurnView[] = s.turns.map(t => ({ id: t.id, ordinal: t.ordinal, main: t.main, followup: t.followup,
    question: t.question, answer: t.answer, evaluation: visible && t.evaluation ? JSON.parse(t.evaluation) : null }));
  return {
    id: s.id, profileId: s.profileId, snapshot: JSON.parse(s.snapshot), mode: s.mode as SessionView['mode'], total: s.total,
    status: s.status, createdAt: s.createdAt.toISOString(), busy: Boolean(s.leaseUntil && s.leaseUntil > new Date()), error: s.error,
    requestedModel: (JSON.parse(s.aiConfig) as AIConfig).model, actualModel: s.actualModel,
    turns, weaknesses: visible ? s.weaknesses.map(weaknessView) : [],
    comparisons: s.targets.map(t => ({ weaknessId: t.weaknessId, main: t.main, evidence: JSON.parse(t.weakness.evidence),
      oldQuestion: t.weakness.turn.question, oldAnswer: t.weakness.turn.answer ?? '', newTurns: turns.filter(turn => turn.main === t.main) })),
  };
}
export class SidangService {
  constructor(private db: PrismaClient, private ai: AIAdapter) {}
  private async full(id: string) {
    const s = await this.db.session.findUnique({ where: { id }, include: includeSession });
    if (!s) throw new AppError('Sesi tidak ditemukan.', 404);
    return s;
  }
  async get(id: string) { return sessionView(await this.full(id)); }
  async overview(): Promise<Overview> {
    const [profiles, sessions, weaknesses] = await Promise.all([
      this.db.profile.findMany({ orderBy: { updatedAt: 'desc' } }),
      this.db.session.findMany({ orderBy: { createdAt: 'desc' } }),
      this.db.weakness.findMany({ where: { session: { OR: [{ mode: 'latihan' }, { status: 'completed' }] } }, include: { turn: true, profile: true } }),
    ]);
    return {
      profiles: profiles.map(p => ({ id: p.id, context: JSON.parse(p.context) })),
      sessions: sessions.map(s => ({ id: s.id, profileId: s.profileId, snapshot: JSON.parse(s.snapshot), mode: s.mode as SessionView['mode'], total: s.total, status: s.status, createdAt: s.createdAt.toISOString() })),
      weaknesses: weaknesses.map(weaknessView), aiReady: aiReady(),
    };
  }
  async saveProfile(value: unknown, id?: string) {
    const context = JSON.stringify(contextSchema.parse(value));
    if (id && !await this.db.profile.findUnique({ where: { id } })) throw new AppError('Profil tidak ditemukan.', 404);
    const p = id ? await this.db.profile.update({ where: { id }, data: { context } }) : await this.db.profile.create({ data: { context } });
    return { id: p.id, context: JSON.parse(p.context) as Context };
  }
  async create(value: unknown) {
    const input = sessionInput.parse(value);
    const profile = await this.db.profile.findUnique({ where: { id: input.profileId } });
    if (!profile) throw new AppError('Profil tidak ditemukan.', 404);
    const targets = await this.db.weakness.findMany({ where: { id: { in: input.weaknessIds }, profileId: profile.id, session: { OR: [{ mode: 'latihan' }, { status: 'completed' }] } } });
    if (targets.length !== input.weaknessIds.length) throw new AppError('Kelemahan harus tersedia dan berasal dari profil yang sama.');
    const s = await this.db.session.create({ data: {
      profileId: profile.id, snapshot: profile.context, mode: input.mode, total: input.total, aiConfig: JSON.stringify(configuration()),
      targets: { create: input.weaknessIds.map((weaknessId, i) => ({ weaknessId, main: i + 1 })) },
    } });
    return this.get(s.id);
  }
  async answer(id: string, turnId: string, value: unknown) {
    const answer = answerSchema.parse(value);
    await this.db.$transaction(async tx => {
      const s = await tx.session.findUnique({ where: { id }, include: { turns: { orderBy: { ordinal: 'desc' }, take: 1 } } });
      if (!s) throw new AppError('Sesi tidak ditemukan.', 404);
      const turn = await tx.turn.findFirst({ where: { id: turnId, sessionId: id } });
      if (!turn) throw new AppError('Giliran tidak ditemukan.', 404);
      if (turn.answer !== null) {
        if (turn.answer !== answer) throw new AppError('Jawaban sudah tersimpan dan tidak dapat ditimpa.', 409);
        return;
      }
      if (s.status !== 'active' || s.turns[0]?.id !== turnId) throw new AppError('Giliran ini sudah berakhir.', 409);
      await tx.turn.updateMany({ where: { id: turnId, answer: null }, data: { answer } });
    });
    // Jawaban telah commit sebelum panggilan adapter. Duplikasi lama tidak memajukan giliran baru.
    const turn = await this.db.turn.findUniqueOrThrow({ where: { id: turnId } });
    if (turn.evaluation) return this.get(id);
    return this.advance(id);
  }
  async end(id: string) {
    const s = await this.full(id);
    if (s.leaseUntil && s.leaseUntil > new Date()) throw new AppError('AI sedang memproses. Tunggu sebelum mengakhiri sesi.', 409);
    await this.db.session.updateMany({ where: { id, status: 'active', OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }] }, data: { status: 'ending', error: null } });
    return this.advance(id);
  }
  async updateWeakness(id: string, value: unknown) {
    const data = weaknessUpdate.parse(value);
    const w = await this.db.weakness.findFirst({ where: { id, session: { OR: [{ mode: 'latihan' }, { status: 'completed' }] } } });
    if (!w) throw new AppError('Kelemahan tidak ditemukan.', 404);
    await this.db.weakness.update({ where: { id }, data });
  }
  async advance(id: string): Promise<SessionView> {
    const token = randomUUID();
    const locked = await this.db.session.updateMany({
      where: { id, status: { in: ['active', 'ending'] }, OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }] },
      data: { leaseToken: token, leaseUntil: new Date(Date.now() + 210_000), error: null },
    });
    if (!locked.count) {
      const current = await this.get(id);
      if (current.status === 'completed') return current;
      throw new AppError('Sesi sedang diproses. Muat ulang status sebentar lagi.', 409);
    }
    try {
      let s = await this.full(id);
      let last = s.turns.at(-1);
      const pending = s.turns.find(t => t.answer !== null && !t.evaluation);
      if (pending) {
        const result = await this.ai.call(JSON.parse(s.aiConfig), {
          kind: 'evaluation', context: JSON.parse(s.snapshot), history: s.turns.filter(t => t.ordinal <= pending.ordinal).map(t => ({ question: t.question, answer: t.answer })),
          main: pending.main, total: s.total, allowFollowup: !pending.followup && s.status !== 'ending',
          target: this.target(s, pending.main),
        });
        let evaluation: Evaluation;
        try {
          evaluation = validateEvaluation(result.value, pending.answer!, JSON.parse(s.snapshot));
          if ((pending.followup || s.status === 'ending') && evaluation.followup) throw new Error('Susulan tidak diizinkan.');
        } catch { throw new AppError('Evaluasi AI tidak memenuhi struktur atau bukti kutipan. Jawaban tersimpan; coba kembali.', 502); }
        await this.db.$transaction(async tx => {
          await this.checkLease(tx, id, token);
          await tx.turn.update({ where: { id: pending.id }, data: { evaluation: JSON.stringify(evaluation) } });
          for (const evidence of evaluation.weaknesses) await tx.weakness.create({ data: { profileId: s.profileId, sessionId: id, turnId: pending.id, evidence: JSON.stringify(evidence) } });
          if (result.model) await tx.session.update({ where: { id }, data: { actualModel: result.model } });
        });
        s = await this.full(id); last = s.turns.at(-1);
      }
      if (s.status === 'ending') {
        await this.db.session.updateMany({ where: { id, leaseToken: token }, data: { status: 'completed' } });
      } else if (!last || last.answer !== null) {
        const evaluation: Evaluation | null = last?.evaluation ? JSON.parse(last.evaluation) : null;
        const followup = Boolean(last && !last.followup && evaluation?.followup);
        const main = last ? (followup ? last.main : last.main + 1) : 1;
        if (main > s.total) {
          await this.db.session.updateMany({ where: { id, leaseToken: token }, data: { status: 'completed' } });
        } else {
          let question = evaluation?.followup ?? '';
          let model: string | null = null;
          if (!followup) {
            const result = await this.ai.call(JSON.parse(s.aiConfig), { kind: 'question', context: JSON.parse(s.snapshot),
              history: s.turns.map(t => ({ question: t.question, answer: t.answer })), main, total: s.total, allowFollowup: false, target: this.target(s, main) });
            try { question = questionSchema.parse(result.value).question; }
            catch { throw new AppError('Struktur pertanyaan AI tidak valid. Coba kembali.', 502); }
            model = result.model;
          }
          await this.db.$transaction(async tx => {
            await this.checkLease(tx, id, token);
            await tx.turn.create({ data: { sessionId: id, ordinal: (last?.ordinal ?? 0) + 1, main, followup, question } });
            if (model) await tx.session.update({ where: { id }, data: { actualModel: model } });
          });
        }
      }
    } catch (error) {
      const message = error instanceof AppError ? error.message : 'Proses sesi gagal. Data yang sudah tersimpan tetap tersedia; coba kembali.';
      await this.db.session.updateMany({ where: { id, leaseToken: token }, data: { error: message } });
    } finally {
      await this.db.session.updateMany({ where: { id, leaseToken: token }, data: { leaseToken: null, leaseUntil: null } });
    }
    return this.get(id);
  }
  private target(s: FullSession, main: number): Evidence | null {
    const target = s.targets.find(t => t.main === main);
    return target ? JSON.parse(target.weakness.evidence) : null;
  }
  private async checkLease(tx: Prisma.TransactionClient, id: string, token: string) {
    const s = await tx.session.findFirst({ where: { id, leaseToken: token, leaseUntil: { gt: new Date() } } });
    if (!s) throw new AppError('Permintaan lama kedaluwarsa. Muat ulang dan coba kembali.', 409);
  }
}
