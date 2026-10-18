'use client';

import { useRef, useState, type FormEvent } from 'react';
import { fields, type Context, type SessionView } from '@/lib/contracts';
import { EvaluationBlock } from './evaluation';
import { Alert, Badge, Button, Card, describedBy, EmptyState, Field, formatDate, Icon, modeLabel, PageHeader, sessionStatus, TextArea } from './ui';

type Props = {
  session: SessionView; busy: boolean; pending: string | null; drafts: Record<string, string>;
  onDraft: (id: string, text: string) => void; onAction: (value: unknown) => Promise<void>;
  onRefresh: () => Promise<void>; onWeaknesses: () => void; onHistory: () => void;
};
export function SessionPanel({ session: s, busy, pending, drafts, onDraft, onAction, onRefresh, onWeaknesses, onHistory }: Props) {
  const last = s.turns.at(-1); const active = s.status === 'active'; const completed = s.status === 'completed';
  const disabled = busy || s.busy; const canEvaluate = s.mode === 'latihan' || completed;
  const answered = s.turns.filter(t => t.answer !== null);
  const answeredMain = s.turns.filter(t => !t.followup && t.answer !== null).length;
  return <div className={`session-page${completed ? ' session-completed' : ''}`}>
    <PageHeader eyebrow={completed ? '03. Arsip latihan / Evaluasi sesi' : '03. Ruang latihan / Transkrip sesi'} title={completed ? 'Hasil evaluasi' : 'Sesi latihan'} description={completed ? 'Tinjau temuan penguji dan bukti jawaban, lalu tentukan langkah perbaikan.' : 'Susun jawaban dengan alasan yang jelas dan bukti yang tersedia.'} action={completed && <Button onClick={s.weaknesses.length ? onWeaknesses : onHistory}>{s.weaknesses.length ? 'Pelajari kelemahan' : 'Kembali ke riwayat'}<Icon name="arrow" /></Button>} />
    <div className="session-dossier"><div className="dossier-title"><span className="content-label">Naskah penelitian</span><p>{s.snapshot.title}</p></div><div className="dossier-meta"><div className="row"><Badge tone="info">{modeLabel(s.mode)}</Badge><Badge tone={completed ? 'success' : 'neutral'}>{sessionStatus(s.status)}</Badge></div><span className="field-hint">Dibuat {formatDate(s.createdAt)}</span></div></div>
    <div className="session-progress"><div className="row between"><div className="row"><strong>{last ? `Pertanyaan utama ${last.main} dari ${s.total}` : `0 dari ${s.total} pertanyaan utama`}</strong>{!completed && last?.followup && <Badge tone="warning">Pertanyaan susulan</Badge>}<span className="field-hint">{answeredMain} pertanyaan utama dijawab</span></div><Button variant="ghost" onClick={() => void onRefresh()} disabled={busy}><Icon name="refresh" />Muat ulang status</Button></div><progress max={s.total} value={answeredMain} aria-label="Progres pertanyaan utama" /></div>
    {s.error && <Alert tone="danger" title="Proses belum selesai">{s.error}{answered.length > 0 && <p className="notice-detail">Jawaban yang berlabel tersimpan tetap tersedia di percakapan.</p>}</Alert>}
    {s.busy && !busy && <Alert title="AI sedang memproses">Status diperbarui otomatis. Jika server baru dimulai ulang, tunggu hingga proses sebelumnya kedaluwarsa, lalu coba kembali.</Alert>}
    {s.mode === 'simulasi' && !completed && <div className="mode-notice"><Icon name="book" /><p><strong>Fokus pada jawabanmu.</strong> Evaluasi akan tersedia setelah sesi Simulasi berakhir.</p></div>}
    {!s.turns.length && <Card><EmptyState title={completed ? 'Belum dapat dievaluasi' : 'Siap untuk pertanyaan pertama?'} icon="chat" action={!completed && <Button disabled={disabled} loading={pending === 'Meminta pertanyaan…'} onClick={() => void onAction({ action: 'retry' })}>{pending === 'Meminta pertanyaan…' ? 'Menyiapkan pertanyaan…' : s.error ? 'Coba kembali' : 'Mulai pertanyaan'}<Icon name="arrow" /></Button>}>{completed ? 'Sesi ini berakhir tanpa jawaban. Mulai sesi baru saat Anda siap.' : `${s.total} pertanyaan utama akan diberikan satu per satu, dengan maksimal satu susulan untuk setiap pertanyaan.`}</EmptyState></Card>}
    {completed && <Card className="result-summary"><span className="result-icon"><Icon name="check" /></span><div><h2>Hasil sesi</h2>{answered.length ? <p>{answered.length} jawaban telah dievaluasi dan {s.weaknesses.length} kelemahan dicatat. Tinjau buktinya, lalu pilih bagian yang perlu dilatih kembali.</p> : <p>Belum dapat dievaluasi: sesi berakhir tanpa jawaban.</p>}<p className="field-hint">Umpan balik latihan, bukan penilaian resmi.</p></div></Card>}
    <div className="transcript-list">{s.turns.map(t => {
      const writing = active && t.id === last?.id && t.answer === null;
      return <Card as="article" className={`turn-card${writing ? ' turn-active' : ''}`} key={t.id} aria-label={`Percakapan pertanyaan ${t.main}${t.followup ? ' susulan' : ''}`}>
          <div className="turn-ledger"><div className="row"><span className="turn-number">{String(t.ordinal).padStart(2, '0')}</span><span>{t.followup ? 'Susulan · klarifikasi' : 'Pertanyaan utama'}</span></div><span>{writing ? 'Menunggu jawaban' : `Pertanyaan ${t.main}`}</span></div>
          <div className="question-block"><span className="content-label">Pertanyaan penguji</span><h2 className="question-text">{t.question}</h2></div>
          {t.answer !== null ? <div className="student-block"><div className="row between"><span className="content-label">Jawaban mahasiswa</span><Badge tone="success">Jawaban tersimpan</Badge></div><p className="transcript">{t.answer}</p></div> : writing ? <AnswerForm value={drafts[t.id] ?? ''} onChange={text => onDraft(t.id, text)} disabled={disabled} sending={pending === 'Mengirim jawaban…'} onSubmit={answer => onAction({ action: 'answer', turnId: t.id, answer })} /> : <div className="unanswered"><span className="content-label">Jawaban mahasiswa</span><p>Belum dijawab.</p></div>}
          {writing && <details className="answer-guidance"><summary>Panduan menjawab & konteks penelitian</summary><p>Jawab pertanyaan secara langsung. Jelaskan alasan, lalu hubungkan dengan konteks atau bukti yang tersedia. Sebutkan informasi yang belum diketahui.</p><a href="#konteks-sesi" onClick={() => { const context = document.getElementById('konteks-sesi'); if (context instanceof HTMLDetailsElement) context.open = true; }}>Lihat salinan konteks lengkap</a></details>}
          {canEvaluate && t.evaluation && <EvaluationBlock evaluation={t.evaluation} />}
        </Card>;
    })}</div>
    {!completed && s.turns.length > 0 && (last?.answer !== null || s.status === 'ending') && <div className="session-continue"><p>{s.error ? 'Lanjutkan dari jawaban yang sudah tersimpan.' : s.status === 'ending' ? 'Selesaikan evaluasi untuk mengakhiri sesi.' : 'Jawaban tersimpan. Lanjutkan untuk mendapatkan pertanyaan berikutnya.'}</p><Button disabled={disabled} loading={pending === 'Meminta pertanyaan…'} onClick={() => void onAction({ action: 'retry' })}>{s.error ? 'Coba kembali' : 'Lanjutkan proses'}<Icon name="arrow" /></Button></div>}
    {!!s.comparisons.length && <section className="comparison-section"><h2>Perbandingan latihan ulang</h2><p className="section-description">Tinjau perubahan jawaban. Tentukan status dan tindak lanjut secara manual.</p><div className="stack">{s.comparisons.map(c => <Card key={c.weaknessId} className="comparison-card"><div className="comparison-heading"><h3>{c.evidence.title}</h3><Badge>Pertanyaan {c.main}</Badge></div><div className="comparison"><div><span className="comparison-label">Jawaban sebelumnya</span><p className="comparison-question">{c.oldQuestion}</p><blockquote>{c.oldAnswer}</blockquote></div><div><span className="comparison-label comparison-label-new">Jawaban latihan ini</span>{c.newTurns.length ? c.newTurns.map(t => <div key={t.id}><p className="comparison-question">{t.question}</p><blockquote>{t.answer ?? 'Belum dijawab.'}</blockquote></div>) : <p className="muted">Pertanyaan belum tersedia.</p>}</div></div></Card>)}</div></section>}
    <details className="session-context" id="konteks-sesi"><summary>Salinan konteks & konfigurasi sesi</summary><p className="field-hint">Model diminta: {s.requestedModel || 'Belum diisi'} · Model aktual terakhir: {s.actualModel || 'Belum dilaporkan gateway'}</p><dl className="context-fields">{Object.entries(fields).map(([key, label]) => <div key={key}><dt>{label}</dt><dd className="transcript">{s.snapshot[key as keyof Context] || 'Belum tersedia'}</dd></div>)}</dl></details>
    {!completed && <section className="session-end" aria-label="Mengakhiri sesi"><div><h2>Ingin berhenti di sini?</h2><p>Hanya jawaban yang sudah tersedia akan dievaluasi.</p></div><Button variant="danger" disabled={disabled || s.status === 'ending'} onClick={() => void onAction({ action: 'end' })}>Akhiri sesi lebih awal</Button></section>}
  </div>;
}

function AnswerForm({ value, onChange, disabled, sending, onSubmit }: { value: string; onChange: (text: string) => void; disabled: boolean; sending: boolean; onSubmit: (answer: string) => Promise<void> }) {
  const [error, setError] = useState(''); const input = useRef<HTMLTextAreaElement>(null);
  const limitError = value.length > 6000 ? 'Jawaban melebihi 6.000 karakter. Kurangi teks sebelum mengirim.' : error;
  function submit(event: FormEvent) {
    event.preventDefault(); if (disabled) return;
    if (!value.trim() || value.length > 6000) { setError('Tulis jawaban antara 1 dan 6.000 karakter.'); input.current?.focus(); return; }
    setError(''); void onSubmit(value);
  }
  const hint = 'Jelaskan alasan dan bukti yang tersedia. Informasi yang belum diketahui boleh disebutkan secara terbuka.';
  return <form className="answer-form" onSubmit={submit} noValidate><Field id="answer" label="Jawabanmu" hint={hint} error={limitError} count={`${value.length.toLocaleString('id-ID')} / 6.000 karakter`}><TextArea ref={input} id="answer" required rows={9} className="answer-input" placeholder="Tuliskan jawaban akademik Anda di sini…" value={value} onChange={e => { onChange(e.target.value); setError(''); }} disabled={disabled} aria-invalid={Boolean(limitError)} aria-describedby={describedBy('answer', hint, limitError)} /></Field><div className="answer-footer"><span className="field-hint">{sending ? 'Sedang mengirim. Tunggu konfirmasi server.' : value ? 'Draf belum dikirim. Tetap tersedia selama aplikasi terbuka.' : 'Jawaban disimpan sebelum evaluasi AI dimulai.'}</span><Button type="submit" disabled={disabled || value.length > 6000} loading={sending}>{sending ? 'Mengirim jawaban…' : 'Kirim jawaban'}{!sending && <Icon name="arrow" />}</Button></div></form>;
}
