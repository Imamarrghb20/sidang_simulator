# Adaptasi Stitch — Urai

Perubahan 18 Oktober 2026 mengadaptasi referensi di `design/stitch/stitch_sidang_simulator_interface_redesign/stitch_sidang_simulator_interface_redesign/`, termasuk lima screenshot, HTML referensi, dan `academic_monograph_editorial/DESIGN.md`. Aturan proyek tersedia sebagai `AGENT.MD`; tidak ada `AGENTS.md`. Lingkup tetap mengikuti PRD.

Identitas aplikasi kini **Urai**, dengan tagline **Latih jawaban. Perkuat argumen.** pada header bersama. Metadata browser, footer, README, PRD, serta nama package mengikuti identitas ini. Label halaman tetap berdasarkan fungsinya. Isi dan path arsip referensi Stitch dipertahankan; nama dalam arsip tidak dipakai sebagai identitas aplikasi berjalan. Folder lokal, remote Git, riwayat migrasi dan data pengguna tidak diganti.

Verifikasi branding menambahkan pemeriksaan browser untuk judul tab `Urai`, metadata `application-name`, nama pada header/footer, dan satu kemunculan tagline. Enam tes browser lulus pada 360/768/1440 px (38,8 detik); lint, typecheck, 12 tes service/konfigurasi dan build Next.js langsung juga lulus. Screenshot branding desktop dan mobile telah ditinjau, tersedia di `playwright-report/urai-review/` dengan nama `beranda-desktop-1440.png` dan `beranda-mobile-360.png`. Pemeriksaan hash atas 16 berkas terlindungi memastikan file lingkungan, database, migrasi dan arsip desain tetap sama; workspace serta remote Git juga tidak berubah. Tidak ditemukan API key maupun nama lama yang tampil dalam 12 aset client yang diperiksa. Pemeriksaan domain/deployment lokal tidak menemukan konfigurasi publik; akun hosting eksternal belum diperiksa dan DNS tidak diubah.

## Koreksi alur vertikal sesi

Grid dua kolom per giliran sebelumnya memiliki tinggi baris yang mengikuti evaluasi kanan. Saat jawaban pendek dan evaluasi panjang, ruang tersisa di kiri tetap menjadi bagian baris dan mendorong pertanyaan berikutnya ke bawah. Penyebabnya struktur grid, bukan tinggi tetap pada kartu atau jarak antar-kartu.

Grid dan kolom evaluasi kanan telah dihapus. Setiap artikel percakapan memuat pertanyaan, jawaban, dan evaluasi secara berurutan. Ringkasan evaluasi selalu terlihat ketika evaluasi diizinkan; seluruh temuan, kutipan, alasan, tindakan, empat aspek dan rujukan tersedia melalui `details/summary` yang awalnya tertutup. Tinggi artikel mengikuti konten. Membuka rincian mengalirkan pertanyaan berikutnya secara alami; menutupnya mengembalikan posisi semula. Tidak ada margin negatif, pemotongan isi, tinggi percakapan tetap, atau ruang cadangan. Jarak antar-giliran 28 px dan lebar baca maksimal 780 px berlaku pada semua ukuran. Panduan menjawab dipindahkan ke buka/tutup di bawah formulir; salinan konteks lengkap tetap tersedia. Aturan mode Simulasi tidak berubah.

## Implementasi

Halaman sesi dikerjakan terlebih dahulu, lalu tema diterapkan ke komponen bersama, navigasi, beranda/riwayat, profil, evaluasi, dan kelemahan.

- Tema editorial memakai permukaan putih, latar mint muda untuk halaman umum dan kertas hangat untuk sesi aktif, teks tinta, aksen Oxford navy, garis tipis, sudut tegas, serta tanpa bayangan dekoratif.
- Token warna dan font tersedia di `@theme inline` Tailwind dan variabel CSS proyek. Tombol, input, kartu, badge, error, keadaan kosong, dan header tetap melalui komponen bersama `src/components/ui.tsx`.
- Navigasi desktop berada di atas dengan penanda halaman aktif. Sesi terbuka hanya muncul ketika ada sesi yang dibuka. Menu mobile menggeser konten ke bawah; Escape menutup menu dan mengembalikan fokus ke tombol. Skip link, label permanen, focus keyboard, error field dan penghitung karakter dipertahankan.
- Sesi menampilkan judul snapshot penelitian, mode, status, tanggal pembuatan, progres utama dan penanda susulan dari data API. Transkrip satu kolom maksimal 780 px, dengan evaluasi tepat di bawah jawaban asal. Pertanyaan aktif diberi border navy dan textarea panjang.
- Kutipan mahasiswa dibedakan dari alasan AI. Di dalam rincian evaluasi, urutan temuan → kutipan → alasan → tindakan dipertahankan tanpa pemotongan. Konteks lengkap tetap tersedia di bagian bawah sesi.
- Hanya jawaban yang dikonfirmasi server diberi label tersimpan. Draf tetap berada di state aplikasi ketika berpindah halaman atau permintaan gagal; pengiriman ganda dicegah. Status proses mengikuti permintaan sebenarnya. Aksi akhiri sesi terpisah dari kirim jawaban.
- Evaluasi Simulasi tetap disaring oleh server dan tidak dirender sebelum selesai. Adapter AI, API, kontrak validasi, skema database, snapshot dan penyimpanan riwayat tidak diubah.
- Pengaturan sesi menggunakan pilihan radio Latihan/Simulasi dengan petunjuk masing-masing. Panel naskah menampilkan profil yang benar-benar dipilih. Riwayat berasal dari sesi tersimpan.
- Profil dibagi menjadi tiga bagian bernomor. Kelemahan menempatkan bukti dan formulir status/catatan berdampingan di desktop, bertumpuk di ponsel. Latih kembali tetap menjadi aksi utama. Perbandingan lama/baru tetap tersedia pada hasil sesi latihan ulang.

## Perbedaan dari referensi

| Bagian | Adaptasi dan alasan |
| --- | --- |
| Tipografi dan ikon | Georgia/Cambria serta sans-serif sistem menggantikan Newsreader/Inter jaringan. Ikon SVG lokal menggantikan Material Symbols. Aplikasi tidak membutuhkan CDN baru. |
| Isi naskah dan evaluasi | Judul DIVA, kandidat, penguji, kutipan dan metadata contoh tidak disalin ke aplikasi. Isi berasal dari Overview, profil dan SessionView API yang sudah ada. Screenshot pengujian memakai database sintetis terpisah. |
| Evaluasi | Evaluasi berada di bawah jawaban pada semua ukuran. Ringkasan langsung terlihat dan rincian bisa dibuka/tutup. Kolom kanan referensi dihapus untuk mencegah tinggi baris tidak seimbang. Mode Simulasi tidak membuka catatan lebih awal. |
| Tablet dan mobile | Alur percakapan sama dengan desktop. Tidak memakai tab atau bottom sheet tambahan; urutan baca dan navigasi keyboard tetap linear. Panduan menjawab dapat dibuka di bawah formulir; konteks lengkap tetap tersedia. |
| Statistik dan status | Tidak ada skor kelulusan/kesiapan, durasi rekaan, kategori yang tidak tersimpan, identitas dewan penguji, akreditasi, atau klaim kerahasiaan mutlak. Status disimpan, mengirim, dan gagal mengikuti keadaan aplikasi. |
| Aksi di luar MVP | Ekspor PDF/teks, transkrip suara, unggah naskah, kutip bab otomatis, duplikasi/versi profil, dan tombol simulasi status desain tidak ditambahkan. Perbandingan tetap melalui sesi latihan ulang yang tersedia. |
| Formulir dan penyimpanan | Wajib hanya judul, latar belakang dan tujuan sesuai PRD. Batas tetap total profil 30.000 karakter dan jawaban 6.000 karakter, tanpa batas per-field rekaan dari desain. Tidak ada autosave draf ke disk; penyimpanan profil dan catatan tetap eksplisit. |
| Beranda | Mulai latihan tetap membuka pengaturan sesi. Keadaan kosong dan data riwayat menyesuaikan data pengguna, sehingga tidak selalu menyerupai referensi yang seluruhnya sudah terisi. |

## Verifikasi

Lint, typecheck, build Next.js, 12 tes service/konfigurasi dan 6 tes browser lulus. Skrip npm build sempat gagal dengan EPERM ketika Prisma mencoba mengganti DLL yang digunakan server dev. Karena tidak ada perubahan skema, build produksi dijalankan langsung dengan `node node_modules/next/dist/bin/next build` menggunakan client yang tersedia; proses tersebut lulus dan server dev tetap berjalan. Tes browser memakai Chrome headless, build produksi, database terpisah, dan gateway palsu pada loopback.

| Lebar | Navigasi | Transkrip dan evaluasi | Perbandingan |
| --- | --- | --- | --- |
| 360 px | Menu buka/tutup di alur dokumen | Satu kolom, evaluasi sesudah jawaban asal | Bertumpuk |
| 768 px | Menu buka/tutup di alur dokumen | Satu kolom agar area baca nyaman | Dua kolom |
| 1440 px | Navigasi atas | Transkrip maksimal 780 px, evaluasi sesudah jawaban asal | Dua kolom |

Alur browser memeriksa profil → sesi Simulasi → kegagalan jaringan/gateway → restart aplikasi → retry → akhir sesi → evaluasi → catatan/status kelemahan → latihan ulang → perbandingan. Pemeriksaan tambahan membuka mode Latihan dengan susulan aktif dan evaluasi di bawah jawaban, menolak jawaban 6.001 karakter, memastikan draf bertahan, dan memastikan dua klik hanya menghasilkan satu permintaan.

Skenario regresi `tests/browser/session-flow.spec.ts` menyiapkan tiga jawaban pendek dengan masing-masing tiga temuan panjang melalui gateway pengujian dan validasi aplikasi. Pada ketiga ukuran, tes memeriksa urutan pertanyaan/jawaban/evaluasi, rincian yang awalnya tertutup, lebar baca, jarak antar-giliran 24–32 px (CSS 28 px), ketiadaan min-height/max-height/clipping pada artikel, dan posisi pertanyaan berikutnya. Buka/tutup dengan Enter mengubah tinggi artikel sesuai konten lalu mengembalikannya. Isi alasan dan tindakan dicocokkan dengan DTO sehingga rincian panjang tidak terpotong.

Ketiga ukuran tidak memiliki overflow horizontal pada halaman yang diperiksa atau error JavaScript; tes siklus lengkap juga memeriksa ketiadaan permintaan browser ke font/CDN eksternal. Fokus skip link, menu Escape, fokus field invalid pertama, label dan keadaan disabled diperiksa. Selector sesi mengikuti profil yang sedang diuji ketika terdapat beberapa sesi aktif. Runner terakhir selesai dengan exit code 0: 6 passed (38,6 detik). Server fixture ditutup oleh runner.

Kontras pasangan utama dihitung: tombol navy 13,93:1, teks utama 17,08:1, teks sekunder 6,38:1, badge informasi 12,73:1, sukses 7,06:1, peringatan 5,98:1, dan bahaya 6,73:1. Ini pemeriksaan palet, bukan audit aksesibilitas menyeluruh.

Integritas akhir diperiksa lewat hash: `.env`, `.env.local`, dan `prisma/dev.db` sama dengan awal pekerjaan. Nilai API key tidak ditemukan dalam 12 aset client yang diperiksa. Tidak ada dependensi baru, migrasi baru, data contoh desain yang dimasukkan ke database utama, atau perubahan konfigurasi lokal.

## Screenshot lokal dan batas verifikasi

Screenshot koreksi alur dengan rincian tertutup dan terbuka telah ditinjau pada desktop 1440 px dan mobile 360 px. Salinan berada di `playwright-report/session-flow-review/`: `desktop-1440-tertutup.png`, `desktop-1440-terbuka.png`, `mobile-360-tertutup.png`, dan `mobile-360-terbuka.png`; artefak tablet 768 px juga direkam dan diperiksa melalui tes geometri browser. Screenshot siklus lengkap diperbarui di `playwright-report/stitch-review/`. Artefak asli berada di `playwright-report/artifacts/`. Direktori screenshot diabaikan Git dan hanya memuat data sintetis.

AI nyata tidak dipanggil ulang untuk adaptasi tampilan. Hasil integrasi nyata sebelumnya tetap tercatat di [AI-VALIDATION.md](AI-VALIDATION.md); pemadaman langsung 9Router masih belum diuji. Screen reader, browser selain Chrome, serta kecocokan pixel terhadap font Newsreader asli belum diverifikasi. Referensi HTML tidak dijalankan atau disisipkan ke aplikasi sebagai halaman statis.
