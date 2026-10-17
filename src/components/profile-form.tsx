'use client';

import { useState, type FormEvent } from 'react';
import { contextSchema, emptyContext, fields, type Context, type ProfileView } from '@/lib/contracts';
import { Alert, Button, describedBy, Field, TextArea, TextInput } from './ui';

const groups: { title: string; description: string; fields: (keyof Context)[] }[] = [
  { title: 'Dasar penelitian', description: 'Jelaskan persoalan yang ingin Anda jawab.', fields: ['title', 'background', 'problem'] },
  { title: 'Arah dan batasan', description: 'Tentukan tujuan, manfaat, dan batas pembahasan.', fields: ['goals', 'contribution', 'scope'] },
  { title: 'Metode dan evaluasi', description: 'Isi rencana yang tersedia. Bagian ini boleh dilengkapi nanti.', fields: ['method', 'evaluationPlan'] },
];
const hints: Record<keyof Context, string> = {
  title: 'Judul dapat diperbarui saat penelitian berkembang.', background: 'Ringkas kondisi saat ini dan alasan penelitian diperlukan.',
  problem: 'Tuliskan pertanyaan atau masalah utama yang ingin dijawab.', goals: 'Jelaskan hasil yang ingin dicapai, tanpa mengklaim hasil pengujian.',
  contribution: 'Apa manfaat atau kontribusi yang diharapkan?', scope: 'Jelaskan fokus dan batas penelitian yang sudah ditentukan.',
  method: 'Tuliskan metode dan alasan pemilihannya jika sudah tersedia.', evaluationPlan: 'Bagaimana penelitian atau prototipe akan dievaluasi?',
};
export function ProfileForm({ profile, busy, saving, onSave }: { profile: ProfileView | null; busy: boolean; saving: boolean; onSave: (value: Context) => Promise<void> }) {
  const [value, setValue] = useState<Context>(profile?.context ?? emptyContext);
  const [errors, setErrors] = useState<Partial<Record<keyof Context, string>>>({});
  const [formError, setFormError] = useState('');
  const total = Object.values(value).reduce((sum, v) => sum + v.length, 0);
  function submit(event: FormEvent) {
    event.preventDefault(); const parsed = contextSchema.safeParse(value);
    if (!parsed.success) {
      const next: Partial<Record<keyof Context, string>> = {};
      for (const issue of parsed.error.issues) { const key = issue.path[0] as keyof Context | undefined; if (key) next[key] = issue.message; }
      setErrors(next); setFormError(parsed.error.issues.find(i => !i.path.length)?.message ?? '');
      const first = Object.keys(next)[0]; if (first) document.getElementById(`profile-${first}`)?.focus();
      return;
    }
    setErrors({}); setFormError(''); void onSave(parsed.data);
  }
  return <form onSubmit={submit} noValidate className="profile-form">
    <div className="form-intro"><h2>{profile ? 'Edit profil penelitian' : 'Profil penelitian baru'}</h2><p>Gunakan informasi penelitian Anda. Kolom opsional yang kosong akan ditandai belum tersedia.</p><span className="field-hint"><span className="required-mark">*</span> Wajib diisi</span></div>
    {groups.map((group, index) => <fieldset key={group.title} className="form-section" disabled={busy}><legend><span className="section-number">{index + 1}</span>{group.title}</legend><p className="section-description">{group.description}</p><div className="form-fields">{group.fields.map(key => {
      const id = `profile-${key}`; const required = ['title', 'background', 'goals'].includes(key);
      const props = { id, required, value: value[key], 'aria-describedby': describedBy(id, hints[key], errors[key]), 'aria-invalid': Boolean(errors[key]), onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setValue({ ...value, [key]: e.target.value }); setErrors({ ...errors, [key]: undefined }); } };
      return <Field key={key} id={id} label={fields[key]} required={required} hint={hints[key]} error={errors[key]} count={`${value[key].length.toLocaleString('id-ID')} karakter`}>{key === 'title' ? <TextInput {...props} /> : <TextArea {...props} rows={key === 'background' || key === 'goals' ? 4 : 3} />}</Field>;
    })}</div></fieldset>)}
    {(formError || total > 30000) && <Alert tone="danger">{total > 30000 ? 'Total konteks melebihi 30.000 karakter. Kurangi teks sebelum menyimpan; teks tidak dipotong otomatis.' : formError}</Alert>}
    <div className="form-footer"><div><strong className={total > 30000 ? 'text-danger' : ''}>{total.toLocaleString('id-ID')} / 30.000 karakter</strong><p className="field-hint">Perubahan profil berlaku untuk sesi baru.</p></div><Button type="submit" disabled={busy} loading={saving}>{saving ? 'Menyimpan profil…' : 'Simpan profil'}</Button></div>
  </form>;
}
