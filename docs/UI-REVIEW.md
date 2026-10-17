# Tinjauan UI Sidang Simulator

Perubahan 18 Oktober 2026 mengikuti PRD dan mempertahankan API, adapter AI, skema database, riwayat, serta konfigurasi lokal. Tidak ada dependensi baru atau font jaringan.

## Perubahan

- Latar abu-abu muda, kartu putih, teks charcoal, aksen indigo, border halus dan bayangan ringan. Palet status konsisten dengan label teks.
- Sidebar desktop dengan halaman aktif; menu mobile dibuka di alur dokumen, sehingga tidak menutupi konten. Escape menutup menu dan mengembalikan fokus. Tautan langsung ke konten memindahkan fokus ke main.
- Beranda mengutamakan Mulai latihan, sesi yang dapat dilanjutkan, riwayat selesai, dan langkah pertama pada kondisi kosong. Metrik ringkasan dihapus.
- Profil dikelompokkan menjadi dasar penelitian, arah/batasan, serta metode/evaluasi. Label permanen, tanda wajib, petunjuk, penghitung karakter dan error dekat field. Tidak ada profil contoh yang dimuat otomatis ke data pengguna.
- Area sesi maksimal 780 px. Mode, progres pertanyaan utama, dan susulan ditampilkan terpisah. Pertanyaan, jawaban tersimpan, dan evaluasi memiliki hierarki yang berbeda. Textarea nyaman untuk jawaban panjang; aksi akhir sesi terpisah dari pengiriman.
- Status proses sesuai permintaan yang berjalan; label tersimpan hanya berasal dari jawaban yang dikonfirmasi server. Draf jawaban disimpan di state aplikasi selama halaman tetap terbuka dan bertahan saat navigasi atau kegagalan. Jawaban yang telah disimpan server tetap bertahan setelah reload/restart.
- Evaluasi disusun sebagai temuan → kutipan → alasan → tindakan perbaikan. Rincian empat dimensi dan rujukan konteks dapat dibuka. Evaluasi Simulasi tetap disaring server serta tidak dirender sebelum selesai.
- Latih kembali menjadi aksi utama untuk kelemahan yang dipilih. Perbandingan jawaban berdampingan pada desktop dan bertumpuk di ponsel.
- Komponen bersama ada di `src/components/ui.tsx`; formulir, beranda, sesi, kelemahan dan evaluasi dipisahkan agar lebih mudah dirawat.

## Pemeriksaan browser

Chrome headless menjalankan aplikasi produksi lokal melalui fixture yang sudah tersedia, menggunakan database sintetis dan gateway palsu pada loopback. Alur yang sama diperiksa pada tiga ukuran:

| Lebar | Navigasi | Area sesi | Perbandingan |
| --- | --- | --- | --- |
| 360 px | Menu yang dapat dibuka/tutup | Mengikuti lebar layar | Bertumpuk, label lama/baru jelas |
| 768 px | Menu yang dapat dibuka/tutup | Mengikuti lebar layar | Dua kolom |
| 1440 px | Sidebar 236 px | Maksimal 780 px | Dua kolom |

Tes meliputi:

1. Tautan langsung ke konten lewat Tab/Enter, menu melalui Escape, serta fokus field invalid pertama.
2. Label dan petunjuk profil, error field wajib, kegagalan menyimpan, serta teks yang bertahan saat memuat ulang status.
3. Mulai latihan, sesi aktif di beranda, dan draf jawaban yang tetap tersedia ketika sesi dilanjutkan.
4. Dua klik dalam giliran yang sama menghasilkan satu permintaan. Kegagalan jaringan tidak menghapus teks dan tidak memberi label tersimpan yang keliru.
5. Kegagalan gateway sesudah commit, restart proses aplikasi, reload, dan retry tanpa giliran ganda.
6. Evaluasi Simulasi tidak tampil atau dikirim dalam DTO sebelum selesai; evaluasi tampil setelah akhir awal.
7. Catatan/status, pemilihan kelemahan, latihan ulang, dan perbandingan lama/baru dengan susunan responsif.
8. Tidak ada overflow horizontal pada beranda, profil, pengaturan, sesi, kondisi gagal, evaluasi, kelemahan, dan perbandingan; tidak ada pageerror JavaScript.

Lint, typecheck, build, 12 tes service/konfigurasi dan 3 tes browser lulus. Rasio kontras palet utama dihitung: tombol utama 6,29:1, teks utama 14,33:1, teks sekunder 5,77:1, badge informasi 7,77:1, sukses 6,37:1, peringatan 5,47:1, dan bahaya 6,17:1. Ini pemeriksaan palet, bukan audit aksesibilitas menyeluruh.

## Screenshot lokal

Setiap proyek browser merekam beranda, profil, pengaturan, sesi aktif, kondisi gagal, evaluasi, kelemahan, serta latihan ulang di `playwright-report/artifacts/`. Salinan dengan nama singkat tersedia di `playwright-report/ui-review/` setelah peninjauan. Direktori tersebut diabaikan Git; screenshot hanya berisi data sintetis.

Screenshot terpilih: `beranda-1440.png`, `riwayat-1440.png`, `profil-1440.png`, `sesi-1440.png`, `sesi-768.png`, `sesi-360.png`, `hasil-1440.png`, `hasil-360.png`, dan `kelemahan-360.png`.

Integritas akhir diperiksa lewat hash: `.env`, `.env.local`, dan `prisma/dev.db` sama dengan awal pekerjaan. Nilai API key tidak ditemukan dalam 11 aset browser yang diperiksa. Tidak ada dependensi baru. Server pengujian sudah dihentikan setelah seluruh tes browser lulus.

## Batas verifikasi

AI nyata tidak dipanggil ulang untuk perubahan presentasi ini; hasil uji nyata sebelumnya tetap ada di `AI-VALIDATION.md`. Pengujian baru memeriksa alur melalui gateway palsu dan mempertahankan integrasi server. Screen reader dan browser selain Chrome belum diuji secara langsung. Tidak ada klaim audit WCAG penuh.
