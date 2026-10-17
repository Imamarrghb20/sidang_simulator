# Sidang Simulator

Aplikasi lokal untuk latihan kolokium atau sidang skripsi: konteks penelitian → latihan → kelemahan dengan bukti → perbaikan → latihan ulang. Acuan lingkup adalah [PRD](docs/PRD.md), dengan instruksi proyek di [AGENT.MD](AGENT.MD) (repository memakai nama tunggal ini; tidak ada AGENTS.md).

Implementasi mencakup alur MVP. **Siklus dua sesi dengan AI nyata melalui 9Router telah lulus**, menggunakan data sintetis dan database terpisah. Konfigurasi `.env.local` dipertahankan. Tes browser dengan gateway palsu dilaporkan terpisah dari uji AI nyata; pemadaman proses 9Router secara langsung masih belum diuji. Lihat [catatan penerimaan](docs/IMPLEMENTATION.md) dan [hasil validasi AI](docs/AI-VALIDATION.md).

## Setup Windows

Gunakan Node.js 24 LTS (diverifikasi dengan 24.21.0), npm, dan PowerShell. Node.js 22.12+ juga sesuai persyaratan dependensi. Jalankan dari direktori repository:

```powershell
npm.cmd ci
# Pertahankan konfigurasi yang sudah ada.
if (-not (Test-Path .env.local) -and -not (Test-Path .env)) {
  Copy-Item .env.example .env.local
}
npm.cmd run db:generate
npm.cmd run db:setup
npm.cmd run dev
```

Buka http://127.0.0.1:3000. Skrip dev dan start mengikat server ke `127.0.0.1`. `npm.cmd` menghindari pemblokiran npm.ps1 oleh execution policy Windows tanpa mengubah kebijakan sistem. Instalasi awal dan Prisma generate memerlukan jaringan untuk mengunduh paket dan engine Windows.

SQLite tersimpan di `prisma/dev.db`, mengikuti `DATABASE_URL="file:./dev.db"`. Migrasi awal tersimpan di Git; `db:setup` menerapkan migrasi tanpa mereset data. Profil, sesi aktif, snapshot, jawaban, evaluasi, kelemahan, dan hubungan latihan ulang bertahan setelah reload dan restart aplikasi.

Untuk hasil build, hentikan server dev terlebih dahulu:

```powershell
npm.cmd run build
npm.cmd start
```

Di Windows, Prisma generate dapat gagal dengan EPERM saat server lain masih memuat DLL engine Prisma dari checkout yang sama. Hentikan proses server milik checkout ini lalu ulangi build.

## Konfigurasi 9Router

Gunakan `.env.local` pada server; pertahankan isinya bila sudah dikonfigurasi. `.env` tetap didukung sebagai konfigurasi dasar. Contoh berikut hanya untuk instalasi baru:

```dotenv
DATABASE_URL="file:./dev.db"
AI_BASE_URL=http://localhost:20128/v1
AI_API_KEY=isi_kunci_gateway_anda
AI_MODEL=isi_id_model_yang_tersedia_di_gateway
```

Perintah database, build, aplikasi, dan uji AI memakai pemuatan lingkungan Next.js. Variabel proses diprioritaskan; `.env.local` mengungguli `.env`. File tersebut hanya dibaca. Skrip uji memuat lingkungan sebelum mengimpor Prisma agar `.env` tidak lebih dahulu mengisi nilai kosong.

`AI_BASE_URL` adalah URL dasar API chat completions, berakhiran `/v1` jika gateway menggunakannya. Adapter menambahkan `/chat/completions`. URL tidak boleh memuat kredensial, query, atau fragmen. Model tidak diganti otomatis. Mulai ulang server setelah mengubah konfigurasi, lalu buat sesi baru. Setiap sesi menyimpan URL dan ID model awal; kunci dibaca dari lingkungan server saat panggilan berlangsung. Sesi yang dibuat tanpa ID model harus diakhiri dan diganti sesi baru setelah konfigurasi diisi.

Tanpa konfigurasi AI, profil dan riwayat tetap tersedia. Meminta pertanyaan menampilkan kegagalan konfigurasi yang jelas. Tidak ada jawaban palsu atau fallback dalam aplikasi. Konteks dan jawaban dikirim ke penyedia AI melalui 9Router. Rahasia tidak dikirim ke browser, disimpan dalam sesi, atau dicatat ke log aplikasi.

## Menggunakan aplikasi

1. Buat profil. Judul, latar belakang, dan tujuan wajib; lima field lain boleh kosong dan ditandai **Belum tersedia**. Total konteks maksimal 30.000 karakter.
2. Di beranda, tekan **Mulai latihan**, pilih mode dan 1–10 pertanyaan utama (default 5), buat sesi, lalu tekan **Mulai pertanyaan**. Sesi aktif tersedia di bagian **Lanjutkan latihan**. Konteks dan konfigurasi disalin ketika sesi dibuat; edit profil tidak mengubah sesi lama.
3. Jawab satu giliran, maksimal 6.000 karakter. Jawaban disimpan sebelum AI dipanggil. Maksimal satu susulan per pertanyaan utama; susulan tidak menambah hitungan utama.
4. Mode **Latihan** menampilkan evaluasi setelah jawaban. Mode **Simulasi** menyaring evaluasi dan kelemahan di server sampai sesi selesai, termasuk pada respons API.
5. Jika AI gagal, muat ulang status atau tekan **Coba kembali**. Jawaban tersimpan tidak ditimpa dan pengiriman ulang tidak menggandakan giliran. Timeout 90 detik per permintaan, retry manual. Satu pengiriman dapat memerlukan dua panggilan: evaluasi lalu pertanyaan berikutnya.
6. **Akhiri sesi lebih awal** mengevaluasi hanya jawaban yang tersedia. Jika evaluasi akhir gagal, sesi menunggu retry. Sesi kosong ditandai belum dapat dievaluasi. Restart server saat AI berjalan dapat menyisakan kunci proses hingga 210 detik; setelah itu sesi dapat dilanjutkan.
7. Di **Daftar kelemahan**, tinjau kutipan, alasan, rujukan field konteks, dan perbaikan. Tambahkan catatan dan ubah status secara manual.
8. Pilih 1–10 kelemahan dari satu profil, lalu tekan **Latih kembali**. Satu pertanyaan utama dibuat per kelemahan. Jawaban lama dan baru tampil berdampingan pada desktop dan bertumpuk pada ponsel; status tidak otomatis berubah setelah pertanyaan diulang.

Antarmuka memakai sidebar desktop dan menu mobile yang dibuka di alur halaman. Formulir profil dikelompokkan menjadi dasar, arah/batasan, serta metode/evaluasi, dengan error dan penghitung karakter di dekat field. Area baca sesi dibatasi 780 px; pertanyaan, jawaban, dan evaluasi dibedakan secara visual. Draf jawaban dipertahankan selama halaman aplikasi tetap terbuka, termasuk ketika berpindah ke riwayat atau permintaan gagal. Rincian desain dan bukti pemeriksaan ada di [tinjauan UI](docs/UI-REVIEW.md).

Keluaran AI diperiksa dengan Zod dan pencocokan kutipan terhadap jawaban atau field salinan konteks. Keluaran tidak valid ditolak tanpa menyimpan evaluasi sukses. Validasi ini tidak menjamin kebenaran ilmiah, relevansi semantik, atau ketahanan sempurna terhadap instruksi dalam data. Umpan balik bukan penilaian resmi, verifikasi pustaka, atau prediksi kelulusan. Jawaban baru tidak otomatis menjadi fakta profil.

## Pemeriksaan

```powershell
npm.cmd run db:generate
npm.cmd run db:setup
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Tes service memakai SQLite sementara di `test-results/`, adapter palsu yang diinjeksi secara eksplisit, dan fetch palsu untuk format gateway, timeout, serta HTTP gagal. Tidak ada panggilan model nyata. Tes mencakup snapshot, persistensi, batas giliran, pengiriman serentak, retry, bukti, kerahasiaan evaluasi Simulasi, sesi kosong, dan siklus dua sesi.

Hasil pemeriksaan pada 18 Oktober 2026: lint, tipe, build, **12 tes service/konfigurasi** dan **3 tes browser pada lebar 360, 768, serta 1440 px lulus**. Migrasi sebelumnya sudah diterapkan; perubahan UI tidak mengubah skema. Tampilan ditinjau melalui tangkapan layar dengan data sintetis. Pemeriksaan aset browser tidak menemukan nilai API key.

Tes browser membutuhkan build terbaru dan Chromium Playwright atau Chrome terpasang:

```powershell
# Pilih browser Playwright (unduhan sekali):
npm.cmd exec -- playwright install chromium
npm.cmd run test:e2e

# Atau gunakan Chrome yang sudah terpasang:
$env:BROWSER_EXECUTABLE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
npm.cmd run test:e2e
```

Tes browser menjalankan server produksi sementara di port 3100 dan gateway palsu di port 3101, keduanya di loopback, dengan database terpisah. Tes memeriksa desktop dan ponsel, gateway putus, restart proses aplikasi, reload, respons API, catatan/status, serta latihan ulang. Fixture hanya ada di `tests/`, tidak dapat diaktifkan sebagai fallback aplikasi. Artefak browser berada di `playwright-report/artifacts/`, terpisah dari database uji di `test-results/`, agar pembersihan output Playwright tidak menyentuh database. Kedua direktori diabaikan Git.

Uji AI nyata dijalankan terpisah dan menggunakan kuota model yang dikonfigurasi:

```powershell
npm.cmd run test:ai
```

Skrip membaca `.env.local`, membuat database baru di `private-data/ai-validation/run-*/`, dan menyimpan laporan beserta percakapan sintetis di direktori yang sama. Database utama dan file lingkungan tidak ditulis. Alur ini menguji mode Latihan, pemutusan koneksi evaluasi terkontrol dan retry manual, latihan ulang dalam mode Simulasi, perbandingan, serta persistensi. Tidak ada penggantian model. Laporan lokal tidak masuk Git dan tidak memuat API key.

## Batasan dan status integrasi

- **AI nyata telah diuji melalui service**, dengan enam panggilan termasuk satu permintaan yang dibatalkan terkontrol. Kutipan, konteks kosong, placeholder perbaikan, dan pengabaian instruksi dalam data ditinjau pada sampel tersebut. Uji browser tetap menggunakan gateway palsu. Pemadaman proses 9Router ketika permintaan berlangsung masih perlu diperiksa untuk menutup AC-04 secara harfiah; definisi selesai PRD belum dinyatakan terpenuhi seluruhnya.
- Satu pengguna lokal tanpa autentikasi. API menolak host publik dan permintaan browser lintas asal. Jangan membuka server ke jaringan atau melakukan port forwarding; publikasi memerlukan rancangan lanjutan.
- `.env`, database, `private-data/`, `uploads/`, `backups/`, dan artefak tes diabaikan Git. Simpan naskah pribadi di direktori yang diabaikan. Backup database secara mandiri ketika aplikasi berhenti jika diperlukan.
- Audit produksi setelah override `deepmerge-ts` 8.x: 0 kerentanan. Audit penuh menyisakan 5 advisory high pada rantai `braces` → `micromatch` → `fast-glob` → plugin/config ESLint Next. Belum ada versi perbaikan braces di registry saat pemeriksaan. Tidak dilakukan downgrade Next melalui `audit fix --force`; lint memproses berkas repository lokal.
- Tidak ada unggah dokumen, RAG, suara/video, avatar, banyak agen, multiuser, pembayaran, leaderboard, publikasi, atau fallback model.

Fondasi memakai Next.js App Router, React, TypeScript, Tailwind CSS, Prisma 6, dan SQLite. Versi persis disimpan di `package-lock.json`. Adapter: `src/lib/ai.ts`; logika sesi: `src/lib/service.ts`; skema: `prisma/schema.prisma`.
