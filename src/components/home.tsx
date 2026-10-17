'use client';

import { useRef, useState, type FormEvent } from 'react';
import { sessionInput, type Overview, type SessionSummary } from '@/lib/contracts';
import { Alert, Badge, Button, Card, EmptyState, Field, formatDate, Icon, modeLabel, PageHeader, Select, sessionStatus, TextInput } from './ui';

export function HomePanel({ data, busy, starting, showStart, onShowStart, onProfile, onStart, onOpen }: {
  data: Overview; busy: boolean; starting: boolean; showStart: boolean; onShowStart: () => void; onProfile: () => void;
  onStart: (value: unknown) => Promise<void>; onOpen: (id: string) => Promise<void>;
}) {
  const start = useRef<HTMLElement>(null);
  const active = data.sessions.filter(s => s.status !== 'completed'); const completed = data.sessions.filter(s => s.status === 'completed');
  function begin() { if (!data.profiles.length) { onProfile(); return; } onShowStart(); requestAnimationFrame(() => { start.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); document.getElementById('start-profile')?.focus({ preventScroll: true }); }); }
  return <>
    <PageHeader eyebrow="Persiapan sidang" title="Beranda & riwayat" description="Bangun jawaban yang lebih jelas, satu sesi latihan pada satu waktu." action={!showStart && <Button onClick={begin} disabled={busy}>Mulai latihan<Icon name="arrow" /></Button>} />
    {!data.profiles.length ? <Card><EmptyState title="Mulai dari konteks penelitianmu" action={<Button variant="secondary" onClick={onProfile}><Icon name="plus" />Buat profil penelitian</Button>}>Tambahkan judul, latar belakang, dan tujuan. Informasi ini menjadi dasar pertanyaan dalam sesi pertama.</EmptyState></Card> : showStart && <section ref={start} className="start-section" aria-label="Pengaturan sesi"><Card><StartForm data={data} busy={busy} starting={starting} onStart={onStart} /></Card></section>}
    {!!active.length && <section className="history-section"><div className="section-title"><h2>Lanjutkan latihan</h2><span className="field-hint">Sesi yang belum selesai</span></div><Card className="session-list">{active.map(s => <SessionRow key={s.id} session={s} busy={busy} onOpen={onOpen} />)}</Card></section>}
    <section className="history-section"><div className="section-title"><h2>Riwayat selesai</h2><span className="field-hint">Tinjau kembali jawaban dan evaluasi</span></div>{completed.length ? <Card className="session-list">{completed.map(s => <SessionRow key={s.id} session={s} busy={busy} onOpen={onOpen} />)}</Card> : <Card><EmptyState title="Belum ada sesi yang selesai" icon="chat">{active.length ? 'Selesaikan sesi aktif untuk melihat evaluasi dan memilih kelemahan yang ingin dilatih kembali.' : data.profiles.length ? 'Profil sudah tersedia. Tekan Mulai latihan untuk memilih mode dan jumlah pertanyaan.' : 'Setelah profil dibuat, jalani satu sesi. Riwayat dan hasil latihan akan tersimpan di sini.'}</EmptyState></Card>}</section>
    <div className="practice-note"><Icon name="book" /><p><strong>Latihan yang terarah.</strong> Tinjau bukti pada evaluasi, catat perbaikannya, lalu pilih kelemahan untuk sesi berikutnya.</p></div>
  </>;
}
function SessionRow({ session: s, busy, onOpen }: { session: SessionSummary; busy: boolean; onOpen: (id: string) => Promise<void> }) {
  const completed = s.status === 'completed';
  return <article className="session-row"><span className="session-row-icon"><Icon name={completed ? 'file' : 'chat'} /></span><div className="session-row-content"><div className="row"><Badge tone={completed ? 'neutral' : 'info'}>{modeLabel(s.mode)}</Badge><span className="row-status">{sessionStatus(s.status)}</span></div><h3>{s.snapshot.title}</h3><p>{formatDate(s.createdAt)}<span aria-hidden="true"> · </span>{s.total} pertanyaan utama</p></div><Button variant="secondary" disabled={busy} onClick={() => void onOpen(s.id)}>{completed ? 'Lihat hasil' : 'Lanjutkan sesi'}<Icon name="arrow" /></Button></article>;
}
function StartForm({ data, busy, starting, onStart }: { data: Overview; busy: boolean; starting: boolean; onStart: (value: unknown) => Promise<void> }) {
  const [profileId, setProfileId] = useState(data.profiles[0]?.id ?? ''); const [mode, setMode] = useState('latihan'); const [total, setTotal] = useState(5); const [error, setError] = useState('');
  function submit(e: FormEvent) {
    e.preventDefault(); const value = sessionInput.safeParse({ profileId, mode, total, weaknessIds: [] });
    if (!value.success) { setError('Pilih profil, mode, dan 1–10 pertanyaan utama.'); return; }
    setError(''); void onStart(value.data);
  }
  return <form className="start-form" onSubmit={submit} noValidate><div className="section-title"><div><h2>Atur sesi latihan</h2><p className="section-description">Pilih konteks dan ritme latihan yang sesuai.</p></div><Badge>1–10 pertanyaan utama</Badge></div><Field id="start-profile" label="Profil penelitian"><Select id="start-profile" value={profileId} onChange={e => setProfileId(e.target.value)} disabled={busy}>{data.profiles.map(p => <option key={p.id} value={p.id}>{p.context.title}</option>)}</Select></Field><div className="start-options"><Field id="start-mode" label="Mode" hint={mode === 'latihan' ? 'Evaluasi ditampilkan setelah setiap jawaban.' : 'Evaluasi hanya tersedia setelah sesi selesai.'}><Select id="start-mode" aria-describedby="start-mode-hint" value={mode} onChange={e => setMode(e.target.value)} disabled={busy}><option value="latihan">Latihan</option><option value="simulasi">Simulasi</option></Select></Field><Field id="start-total" label="Jumlah pertanyaan utama" hint="Maksimal satu susulan per pertanyaan utama."><TextInput id="start-total" type="number" min={1} max={10} required aria-describedby="start-total-hint" value={total} onChange={e => setTotal(Number(e.target.value))} disabled={busy} /></Field></div>{error && <Alert tone="danger">{error}</Alert>}<div className="form-footer"><p className="field-hint">Konteks profil disalin saat sesi dibuat.</p><Button type="submit" disabled={busy} loading={starting}>{starting ? 'Menyiapkan sesi…' : 'Buat sesi'}<Icon name="arrow" /></Button></div></form>;
}
