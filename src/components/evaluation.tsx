import { fields, type Evaluation, type Evidence } from '@/lib/contracts';
import { Icon } from './ui';

export function References({ refs }: { refs: Evidence['contextRefs'] }) {
  return refs.length ? <details className="context-references"><summary>Rujukan konteks ({refs.length})</summary><dl>{refs.map((ref, i) => <div key={i}><dt>{fields[ref.field]}</dt><dd><q>{ref.quote}</q></dd></div>)}</dl></details> : null;
}
export function EvidenceBlock({ evidence, title = true }: { evidence: Evidence; title?: boolean }) {
  return <div className="evidence-block">{title && <h4>{evidence.title}</h4>}<div className="evidence-quote"><span className="content-label">Kutipan jawaban mahasiswa</span><blockquote>{evidence.quote}</blockquote></div><div className="evidence-reason"><span className="content-label">Alasan penguji</span><p>{evidence.reason}</p></div><div className="improvement"><span className="content-label">Tindakan perbaikan</span><p>{evidence.improvement}</p></div><References refs={evidence.contextRefs} /></div>;
}
export function EvaluationBlock({ evaluation }: { evaluation: Evaluation }) {
  const labels = { relevansi: 'Relevansi', kejelasanAlasan: 'Kejelasan alasan', dukunganBukti: 'Dukungan bukti', konsistensi: 'Konsistensi terhadap konteks' };
  return <section className="evaluation-block"><div className="section-heading"><span className="role-icon role-evaluation"><Icon name="target" /></span><h3>Evaluasi jawaban</h3></div><p className="evaluation-summary">{evaluation.summary}</p><details className="evaluation-details"><summary>Rincian evaluasi<span className="evaluation-count">{evaluation.weaknesses.length} temuan · 4 aspek</span></summary><div className="evaluation-detail-content">{evaluation.weaknesses.length ? <div className="findings">{evaluation.weaknesses.map((w, i) => <div className="finding" key={i}><div className="finding-heading"><span className="finding-number">{i + 1}</span><h4>{w.title}</h4></div><EvidenceBlock evidence={w} title={false} /></div>)}</div> : <p className="muted">Tidak ada kelemahan khusus yang dicatat pada jawaban ini.</p>}<section className="dimension-details"><h4>Empat aspek evaluasi</h4><dl>{Object.entries(evaluation.dimensions).map(([key, value]) => <div key={key}><dt>{labels[key as keyof typeof labels]}</dt><dd>{value}</dd></div>)}</dl></section><References refs={evaluation.contextRefs} /></div></details></section>;
}
