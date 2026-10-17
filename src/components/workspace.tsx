'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { type Context, type Overview, type ProfileView, type SessionView } from '@/lib/contracts';
import { HomePanel } from './home';
import { ProfileForm } from './profile-form';
import { SessionPanel } from './session-panel';
import { WeaknessList } from './weaknesses';
import { Alert, Badge, Button, Card, EmptyState, Icon, PageHeader } from './ui';

async function api<T>(path: string, method = 'GET', value?: unknown): Promise<T> {
  let response: Response; let data;
  try {
    response = await fetch(`/api/${path}`, { method, headers: value === undefined ? {} : { 'Content-Type': 'application/json' }, body: value === undefined ? undefined : JSON.stringify(value), cache: 'no-store' });
    data = await response.json();
  } catch { throw new Error('Permintaan belum dapat dikonfirmasi. Periksa status atau coba kembali. Teks formulir tetap dipertahankan.'); }
  if (!response.ok) throw new Error(data.error || 'Permintaan gagal. Coba kembali.');
  return data as T;
}
type Tab = 'beranda' | 'profil' | 'kelemahan' | 'sesi';
const navigation = [ { id: 'beranda', label: 'Beranda & riwayat', icon: 'home' }, { id: 'profil', label: 'Profil penelitian', icon: 'file' }, { id: 'kelemahan', label: 'Daftar kelemahan', icon: 'target' } ] as const;
function tabFromUrl(): Tab {
  const query = new URLSearchParams(location.search);
  if (query.get('sesi')) return 'sesi';
  const tab = query.get('halaman'); return tab === 'profil' || tab === 'kelemahan' ? tab : 'beranda';
}
export function Workspace() {
  const [data, setData] = useState<Overview | null>(null); const [tab, setTab] = useState<Tab>('beranda');
  const [session, setSession] = useState<SessionView | null>(null); const [editing, setEditing] = useState<ProfileView | null>(null);
  const [pending, setPending] = useState<string | null>(null); const [message, setMessage] = useState(''); const [success, setSuccess] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); const [showStart, setShowStart] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({}); const [weaknessProfile, setWeaknessProfile] = useState<string>();
  const running = useRef(false); const menuButton = useRef<HTMLButtonElement>(null); const busy = pending !== null;
  const refresh = useCallback(async () => { setData(await api<Overview>('profiles')); }, []);
  const loadSession = useCallback(async (id: string) => { setSession(await api<SessionView>(`sessions/${id}`)); setTab('sesi'); }, []);
  useEffect(() => {
    const load = async () => {
      try { await refresh(); const id = new URLSearchParams(location.search).get('sesi'); if (id) await loadSession(id); else setTab(tabFromUrl()); }
      catch (error) { setMessage((error as Error).message); }
    };
    void load();
    const onPop = () => { setMenuOpen(false); const id = new URLSearchParams(location.search).get('sesi'); if (id) void loadSession(id).catch(e => setMessage(e.message)); else setTab(tabFromUrl()); };
    window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop);
  }, [refresh, loadSession]);
  useEffect(() => {
    if (!session?.busy) return;
    const timer = setInterval(() => { void api<SessionView>(`sessions/${session.id}`).then(setSession).catch(e => setMessage(e.message)); }, 2500);
    return () => clearInterval(timer);
  }, [session?.busy, session?.id]);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [menuOpen]);
  async function run(work: () => Promise<void>, label: string) {
    if (running.current) return;
    running.current = true; setPending(label); setMessage(''); setSuccess('');
    try { await work(); } catch (error) { setMessage((error as Error).message); }
    finally { running.current = false; setPending(null); }
  }
  function focusPage() { requestAnimationFrame(() => { document.getElementById('utama')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }); }
  function navigate(next: Tab) {
    setTab(next); setMenuOpen(false); setMessage(''); setSuccess('');
    history.pushState(null, '', next === 'sesi' && session ? `?sesi=${encodeURIComponent(session.id)}` : next === 'beranda' ? '/' : `?halaman=${next}`);
    focusPage();
  }
  async function open(id: string) { await loadSession(id); setMenuOpen(false); history.pushState(null, '', `?sesi=${encodeURIComponent(id)}`); focusPage(); }
  function newProfile() { setEditing(null); navigate('profil'); }
  const start = (input: unknown) => run(async () => { const created = await api<SessionView>('sessions', 'POST', input); await refresh(); await open(created.id); }, 'Menyiapkan sesi…');
  const openSession = (id: string) => run(() => open(id), 'Memuat sesi…');
  async function sessionAction(value: unknown) {
    if (!session) return;
    const action = (value as { action: string }).action;
    await run(async () => {
      const updated = await api<SessionView>(`sessions/${session.id}`, 'POST', value); setSession(updated); await refresh();
      if (action === 'answer' && updated.turns.some(t => t.id === (value as { turnId: string }).turnId && t.answer !== null)) setSuccess('Jawaban tersimpan.');
    }, action === 'answer' ? 'Mengirim jawaban…' : action === 'end' ? 'Menyelesaikan sesi…' : 'Meminta pertanyaan…');
  }
  async function recover() { await run(async () => { await refresh(); if (tab === 'sesi' && session) await loadSession(session.id); }, 'Memuat ulang status…'); }
  return <div className="app-shell">
    <Link className="skip-link" href="#utama" onClick={event => { event.preventDefault(); document.getElementById('utama')?.focus(); }}>Langsung ke konten</Link>
    <aside className="sidebar" aria-label="Navigasi aplikasi"><div className="sidebar-top"><Link className="brand" href="/" onClick={e => { e.preventDefault(); if (!busy) navigate('beranda'); }}><span className="brand-mark"><Icon name="book" /></span><span>Sidang<span className="brand-subtitle">Simulator</span></span></Link><Button variant="ghost" className="menu-toggle" ref={menuButton} aria-expanded={menuOpen} aria-controls="navigasi-utama" aria-label={menuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></Button></div>
      <nav id="navigasi-utama" className={`navigation${menuOpen ? ' is-open' : ''}`} aria-label="Navigasi utama" onKeyDown={e => { if (e.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } }}><span className="nav-caption">RUANG LATIHAN</span>{navigation.map(item => <button type="button" className="nav-item" key={item.id} aria-current={tab === item.id ? 'page' : undefined} onClick={() => navigate(item.id)} disabled={busy}><Icon name={item.icon} />{item.label}</button>)}{session && <button type="button" className="nav-item session-nav" aria-current={tab === 'sesi' ? 'page' : undefined} onClick={() => navigate('sesi')} disabled={busy}><Icon name="chat" />{session.status === 'completed' ? 'Hasil sesi terbuka' : 'Sesi terbuka'}</button>}</nav><div className="sidebar-foot"><span className="local-dot" aria-hidden="true" /><div><strong>Ruang pribadi</strong><span>Lokal · satu pengguna</span></div></div>
    </aside>
    <div className="workspace"><div className="workspace-topline"><span>Latihan akademik yang terarah</span><Badge>Sidang Simulator</Badge></div><main id="utama" tabIndex={-1} aria-busy={busy}>
      <div className={tab === 'sesi' ? 'session-notices' : 'page-notices'}>{message && <Alert tone="danger" title="Permintaan belum selesai" action={<Button variant="secondary" disabled={busy} onClick={() => void recover()}>Periksa status</Button>}>{message}</Alert>}{success && !pending && <Alert tone="success">{success}</Alert>}{pending && <Alert title={pending}>Tunggu hingga proses selesai sebelum mengirim kembali.</Alert>}</div>
      {!data ? <Card><EmptyState title={message ? 'Data belum dapat dimuat' : 'Memuat ruang latihan…'}>{message ? 'Periksa koneksi aplikasi dan setup database, lalu muat ulang status.' : 'Profil dan riwayat sedang disiapkan.'}</EmptyState></Card> : <>
        {!data.aiReady && <div className={tab === 'sesi' ? 'session-notices' : ''}><Alert tone="warning" title="AI belum siap digunakan">Profil dan riwayat tetap tersedia. Periksa konfigurasi AI pada server sebelum memulai pertanyaan.</Alert></div>}
        {tab === 'beranda' && <HomePanel data={data} busy={busy} starting={pending === 'Menyiapkan sesi…'} showStart={showStart} onShowStart={() => setShowStart(true)} onProfile={newProfile} onStart={start} onOpen={openSession} />}
        {tab === 'profil' && <><PageHeader eyebrow="Konteks penelitian" title="Profil penelitian" description="Berikan konteks yang membantu penguji memahami arah penelitian Anda." action={editing && <Button variant="secondary" disabled={busy} onClick={() => setEditing(null)}><Icon name="plus" />Profil baru</Button>} /><div className="profile-layout"><Card className="profile-editor"><ProfileForm key={editing?.id ?? 'new'} profile={editing} busy={busy} saving={pending === 'Menyimpan profil…'} onSave={(value: Context) => run(async () => { const saved = await api<ProfileView>(editing ? `profiles/${editing.id}` : 'profiles', editing ? 'PUT' : 'POST', value); setEditing(saved); await refresh(); setSuccess('Profil tersimpan. Salinan konteks sesi lama tetap dipertahankan.'); }, 'Menyimpan profil…')} /></Card><aside className="profile-library"><h2>Profil tersimpan</h2>{data.profiles.length ? <div className="profile-items">{data.profiles.map(p => <Card as="article" key={p.id} className={`profile-item${editing?.id === p.id ? ' profile-item-active' : ''}`}><span className="content-label">Profil penelitian</span><h3>{p.context.title}</h3><p>{p.context.goals}</p><Button variant="ghost" disabled={busy} onClick={() => setEditing(p)}>Edit profil<Icon name="arrow" /></Button></Card>)}</div> : <EmptyState title="Profil pertama Anda" icon="file">Lengkapi formulir untuk memulai. Tidak perlu menunggu semua bagian penelitian final.</EmptyState>}</aside></div></>}
        {tab === 'kelemahan' && <WeaknessList data={data} busy={busy} initialProfileId={weaknessProfile} onUpdate={(id, value) => run(async () => { await api(`weaknesses/${id}`, 'PATCH', value); await refresh(); setSuccess('Catatan dan status tersimpan.'); }, 'Menyimpan tindak lanjut…')} onStart={start} onOpen={openSession} />}
        {tab === 'sesi' && session && <SessionPanel session={session} busy={busy} pending={pending} drafts={drafts} onDraft={(id, text) => setDrafts(current => ({ ...current, [id]: text }))} onAction={sessionAction} onRefresh={() => run(async () => { await loadSession(session.id); await refresh(); }, 'Memuat ulang status…')} onWeaknesses={() => { setWeaknessProfile(session.profileId); navigate('kelemahan'); }} onHistory={() => navigate('beranda')} />}
      </>}
    </main><footer className="app-footer"><Icon name="book" /><p>Umpan balik untuk belajar, bukan penilaian resmi atau prediksi kelulusan. Konteks dan jawaban dikirim melalui 9Router saat AI digunakan.</p></footer></div>
  </div>;
}
