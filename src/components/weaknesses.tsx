'use client';

import { useState } from 'react';
import { statuses, type Overview, type WeaknessView } from '@/lib/contracts';
import { EvidenceBlock } from './evaluation';
import { Badge, Button, Card, EmptyState, Field, Icon, PageHeader, Select, TextArea, weaknessTone } from './ui';

export function WeaknessList({ data, busy, initialProfileId, onUpdate, onStart, onOpen }: {
  data: Overview; busy: boolean; initialProfileId?: string; onUpdate: (id: string, value: unknown) => Promise<void>;
  onStart: (value: unknown) => Promise<void>; onOpen: (id: string) => Promise<void>;
}) {
  const [profileId, setProfileId] = useState(initialProfileId ?? data.profiles[0]?.id ?? ''); const [selected, setSelected] = useState<string[]>([]);
  const list = data.weaknesses.filter(w => w.profileId === profileId);
  return <>
    <PageHeader eyebrow="Perbaikan berkelanjutan" title="Daftar kelemahan" description="Pelajari bukti, catat tindak lanjut, lalu uji kembali jawabanmu." action={<Button disabled={busy || !selected.length} onClick={() => void onStart({ profileId, mode: 'latihan', total: selected.length, weaknessIds: selected })}><Icon name="target" />Latih kembali{selected.length ? ` (${selected.length})` : ''}</Button>} />
    <Card className="weakness-filter"><Field id="weakness-profile" label="Profil penelitian"><Select id="weakness-profile" value={profileId} onChange={e => { setProfileId(e.target.value); setSelected([]); }} disabled={busy}><option value="" disabled>Pilih profil</option>{data.profiles.map(p => <option key={p.id} value={p.id}>{p.context.title}</option>)}</Select></Field><div className="selection-info"><strong>{selected.length} dari 10 kelemahan dipilih</strong><p>Pilih kelemahan dari profil yang sama. Status tetap diubah secara manual setelah latihan ulang.</p></div></Card>
    <div className="weakness-list">{list.length ? list.map(w => <Card as="article" className={`weakness-card${selected.includes(w.id) ? ' is-selected' : ''}`} key={w.id}><header className="weakness-heading"><label className="checkbox-label"><input type="checkbox" disabled={busy || (!selected.includes(w.id) && selected.length >= 10)} checked={selected.includes(w.id)} onChange={e => setSelected(e.target.checked ? [...selected, w.id] : selected.filter(id => id !== w.id))} /><span><span className="sr-only">Pilih kelemahan: </span>{w.evidence.title}</span></label><Badge tone={weaknessTone(w.status)}>{w.status}</Badge></header><EvidenceBlock evidence={w.evidence} title={false} /><details className="source-details"><summary>Pertanyaan dan jawaban sumber</summary><p className="source-question">{w.question}</p><blockquote>{w.answer}</blockquote><Button variant="ghost" disabled={busy} onClick={() => void onOpen(w.sessionId)}>Buka sesi asal<Icon name="arrow" /></Button></details><WeaknessForm key={`${w.id}-${w.status}-${w.note}`} weakness={w} busy={busy} onSave={value => onUpdate(w.id, value)} /></Card>) : <Card><EmptyState title="Belum ada kelemahan untuk profil ini" icon="target">Kelemahan akan dicatat dari jawaban yang sudah dievaluasi. Pada mode Simulasi, temuan tersedia setelah sesi berakhir.</EmptyState></Card>}</div>
  </>;
}
function WeaknessForm({ weakness, busy, onSave }: { weakness: WeaknessView; busy: boolean; onSave: (value: unknown) => Promise<void> }) {
  const [status, setStatus] = useState<string>(weakness.status); const [note, setNote] = useState(weakness.note);
  return <form className="weakness-form" onSubmit={e => { e.preventDefault(); void onSave({ status, note }); }}><div className="section-title"><h3>Tindak lanjut</h3><span className="field-hint">Disimpan sesuai pilihan Anda</span></div><Field id={`status-${weakness.id}`} label="Status"><Select id={`status-${weakness.id}`} value={status} onChange={e => setStatus(e.target.value)} disabled={busy}>{statuses.map(s => <option key={s}>{s}</option>)}</Select></Field><Field id={`note-${weakness.id}`} label="Catatan tindak lanjut" count={`${note.length.toLocaleString('id-ID')} / 6.000 karakter`}><TextArea id={`note-${weakness.id}`} rows={3} maxLength={6000} value={note} onChange={e => setNote(e.target.value)} disabled={busy} /></Field><div className="row end"><Button variant="secondary" type="submit" disabled={busy}>Simpan status & catatan</Button></div></form>;
}
