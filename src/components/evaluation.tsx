import { fields, type Evaluation, type Evidence } from '@/lib/contracts';
import { Icon } from './ui';

export function References({ refs }: { refs: Evidence['contextRefs'] }) {
  return refs.length ? <details className="context-references"><summary>Rujukan konteks ({refs.length})</summary><dl>{refs.map((ref, i) => <div key={i}><dt>{fields[ref.field]}</dt><dd><q>{ref.quote}</q></dd></div>)}</dl></details> : null;
}
export function EvidenceBlock({ evidence, title = true }: { evidence: Evidence; title?: boolean }) {
  return <div className="evidence-block">{title && <h4>{evidence.title}</h4>}<div className="evidence-quote"><span className="content-label">Kutipan jawaban</span><blockquote>{evidence.quote}</blockquote></div><div className="evidence-reason"><span className="content-label">Alasan</span><p>{evidence.reason}</p></div><div className="improvement"><span className="content-label">Tindakan perbaikan</span><p>{evidence.improvement}</p></div><References refs={evidence.contextRefs} /></div>;
}
export function EvaluationBlock({ evaluation }: { evaluation: Evaluation }) {
  const labels = { relevansi: 'Relevansi', kejelasanAlasan: 'Kejelasan alasan', dukunganBukti: 'Dukungan bukti', konsistensi: 'Konsistensi terhadap konteks' };
  return <section className="evaluation-block"><div className="section-heading"><span className="role-icon role-evaluation"><Icon name="target" /></span><h3>Evaluasi jawaban</h3></div><p className="evaluation-summary">{evaluation.summary}</p>{evaluation.weaknesses.length ? <div className="findings">{evaluation.weaknesses.map((w, i) => <div className="finding" key={i}><div className="finding-heading"><span className="finding-number">{i + 1}</span><h4>{w.title}</h4></div><EvidenceBlock evidence={w} title={false} /></div>)}</div> : <p className="muted">Tidak ada kelemahan khusus yang dicatat pada jawaban ini.</p>}<details className="dimension-details"><summary>Tinjau empat aspek evaluasi</summary><dl>{Object.entries(evaluation.dimensions).map(([key, value]) => <div key={key}><dt>{labels[key as keyof typeof labels]}</dt><dd>{value}</dd></div>)}</dl></details><References refs={evaluation.contextRefs} /></section>;
}
