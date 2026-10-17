# Status implementasi dan penerimaan

Acuan: [PRD v0.1](PRD.md). Pemeriksaan pada 18 Oktober 2026. Repository awal hanya berisi dokumen, AGENT.MD, dan contoh lingkungan. Pekerjaan mengikuti urutan bagian 10 PRD tanpa fitur tambahan.

## Implementasi

1. Fondasi Next.js App Router, TypeScript, Tailwind, SQLite/Prisma; migrasi awal, profil, riwayat.
2. Adapter server 9Router; snapshot konteks/config tanpa rahasia; dua mode; batas giliran; commit jawaban sebelum AI; kunci proses dengan masa berlaku; retry manual dan akhir awal.
3. Evaluasi empat dimensi dengan Zod dan pemeriksaan kutipan; kelemahan terhubung ke profil/sesi/giliran; status/catatan manual; target latihan ulang dan perbandingan.
4. Tes service/database, tes browser dengan gateway palsu, lint, tipe, build, dokumentasi Windows.

## Penerimaan

| Kriteria | Bukti otomatis / status |
| --- | --- |
| AC-01 | Profil diedit setelah sesi dibuat; snapshot judul dan konfigurasi awal tetap sama. |
| AC-02 | Tes 3 utama + 3 susulan; kirim berulang dan serentak menyimpan satu jawaban/evaluasi per giliran. |
| AC-03 | DTO dan overview menyembunyikan evaluasi/kelemahan Simulasi; browser memeriksa respons API dan tampilan setelah akhir awal. |
| AC-04 | Adapter gagal, fetch timeout/HTTP gagal, gateway HTTP palsu diputus, dan koneksi evaluasi nyata dibatalkan saat berlangsung. Jawaban bertahan dan retry manual lulus. Pemadaman proses 9Router secara langsung **belum diuji**. |
| AC-05 | Client database dibuka ulang; tes browser memuat ulang dan memulai ulang proses server dengan database yang sama. |
| AC-06 | Kutipan jawaban palsu dan rujukan ke field kosong ditolak tanpa evaluasi/kelemahan sukses. |
| AC-07 | Tes palsu dan siklus dua sesi dengan AI nyata memeriksa target satu profil, jawaban lama/baru, serta status/catatan manual. |
| AC-08 | Sampel percakapan AI nyata dengan metode/rencana evaluasi kosong ditinjau: tidak ada fakta penelitian rekaan, usulan dibedakan dari hasil, dan instruksi pengacau dalam profil diabaikan. Pemeriksaan kutipan tetap dilakukan otomatis. |
| AC-09 | Lint, tipe, build, 12 tes service/konfigurasi dan 3 tes browser (360, 768, 1440 px) lulus. Migrasi sebelumnya telah diterapkan. Uji AI nyata terpisah sebelumnya lulus dengan 6 panggilan melalui 9Router. `.env` dan `.env.local` dipertahankan; API key tidak ditemukan pada aset browser yang diperiksa. |

Tes service: `tests/session.test.ts`. Tes browser: `tests/browser/cycle.spec.ts`. Gateway palsu hanya ada di `tests/serve-e2e.mjs`; aplikasi selalu memakai RouterAdapter tanpa fallback palsu.

Tes browser terbaru lulus memakai Chrome terpasang di Windows. Tangkapan layar desktop dan ponsel sebelumnya ditinjau; perbandingan jawaban terbaca, tidak ada luapan lebar, dan tidak ada pageerror JavaScript. Server tes dihentikan setelah pengujian. Direktori artefak Playwright dipisahkan dari direktori database uji agar pembersihan output tidak menyentuh database.

Uji nyata `npm.cmd run test:ai` memakai database sintetis terpisah dan RouterAdapter yang sama dengan aplikasi. Siklus Latihan → kelemahan → latihan ulang Simulasi → perbandingan lulus. Lihat [laporan validasi AI](AI-VALIDATION.md). Skrip Prisma kini memuat lingkungan Next.js agar prioritas `.env.local` sama dengan aplikasi; tes konfigurasi memakai file sintetis di direktori sementara.

Pembaruan UI memakai palet abu-abu/indigo, sidebar desktop, menu mobile di alur halaman, formulir profil berkelompok, komponen kontrol bersama, dan area baca sesi maksimal 780 px. Tes browser memeriksa error formulir, pengiriman ganda, draf yang bertahan setelah koneksi gagal atau navigasi, fokus keyboard, Simulasi, dan perbandingan responsif. Integrasi AI, API, dan skema tidak diubah dalam pembaruan ini. Lihat [tinjauan UI](UI-REVIEW.md).

## Validasi nyata dan sisa penerimaan

1. Konfigurasi yang disediakan pengguna telah dikenali. Profil sintetis sengaja membiarkan metode, ruang lingkup, dan rencana evaluasi kosong, serta memuat instruksi pengacau sebagai data.
2. Latihan dan Simulasi nyata lulus melalui service; evaluasi Simulasi disaring sebelum akhir sesi. Browser/API diuji terpisah dengan gateway palsu.
3. Kutipan diperiksa otomatis dan isi evaluasi nyata ditinjau. Tidak ditemukan hasil, responden, metode final, atau referensi rekaan pada sampel tersebut. Perbaikan memakai placeholder dan membedakan usulan dari fakta.
4. Koneksi permintaan evaluasi nyata dibatalkan terkontrol, jawaban dipertahankan, dan retry lulus. **Masih perlu pemadaman proses 9Router secara langsung saat permintaan berlangsung** untuk menutup skenario AC-04 secara harfiah. Proses 9Router pengguna tidak dihentikan dalam pengujian ini.
5. Latihan ulang, perbandingan, status/catatan manual, dan pembukaan ulang database nyata lulus; reload dan restart proses aplikasi lulus dalam tes browser dengan gateway palsu.

Siklus dua sesi nyata sudah terpenuhi, tetapi MVP belum dinyatakan menutup seluruh kriteria penerimaan selama skenario pemadaman proses 9Router di atas belum diperiksa.

## Lingkungan dan dependensi

Persiapan helper Codex sempat gagal dengan os error 112 ketika menyalin helper ke penyimpanan lokal Codex; kegagalan tersebut tidak membuktikan drive workspace penuh. Rincian diagnosis komputer disimpan lokal dan tidak dimasukkan ke repository. Instalasi, engine Prisma, migrasi, dan build kemudian berhasil. Tes tsx memerlukan eksekusi di luar sandbox karena `uv_os_get_passwd` gagal di sandbox. Browser menemukan penolakan asal permintaan akibat normalisasi localhost/127.0.0.1 oleh Next; implementasi kini memakai Host loopback tervalidasi dan memiliki tes regresi.

Audit produksi: 0 kerentanan setelah override deepmerge-ts 8.x dan pemeriksaan ulang Prisma/build. Audit penuh menyisakan 5 advisory high pada rantai alat lint dari braces, tanpa versi perbaikan yang tersedia saat pemeriksaan.
