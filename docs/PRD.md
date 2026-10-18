# PRD — Urai

Versi: 0.1 | Tanggal: 17 Oktober 2026 | Status: spesifikasi MVP, belum diimplementasikan

Identitas aplikasi: **Urai**. Tagline: **Latih jawaban. Perkuat argumen.** Tagline ditempatkan pada header bersama, tanpa diulang dalam isi setiap halaman. Perubahan identitas tidak mengubah lingkup MVP, data, integrasi, atau riwayat migrasi. Konfigurasi domain publik menunggu alamat lengkap dari pemilik proyek.

## 1. Masalah dan tujuan

Mahasiswa dapat berlatih sidang melalui chatbot umum, tetapi perlu mengatur sesi, merangkum kelemahan, dan membandingkan latihan secara manual. Urai membantu pengguna menjalani siklus: **konteks penelitian → latihan → kelemahan dengan bukti → perbaikan → pengujian ulang**.

Pengguna utama adalah mahasiswa yang mempersiapkan kolokium atau sidang skripsi. MVP digunakan oleh satu pengguna pada komputer lokal. Nilai produk terletak pada kesinambungan latihan dan keterlacakan evaluasi; kualitas penilaian AI tetap perlu diperiksa pengguna.

## 2. Hasil yang dituju

Pengguna dapat menyelesaikan satu sesi, menemukan bagian jawaban yang perlu diperbaiki, lalu menguji kembali kelemahan yang dipilih pada sesi berikutnya. Keberhasilan MVP dibuktikan oleh alur tersebut, termasuk penyimpanan riwayat setelah aplikasi dimuat ulang. Tidak ada klaim peningkatan nilai akademik atau prediksi kelulusan.

## 3. Alur pengguna

1. Membuat profil penelitian dan menempelkan konteks yang tersedia.
2. Memilih mode Latihan atau Simulasi serta jumlah pertanyaan utama.
3. Menjawab satu pertanyaan per giliran dan pertanyaan susulan bila diperlukan.
4. Mengakhiri sesi, membaca evaluasi, dan memilih kelemahan untuk dipelajari.
5. Memulai sesi baru untuk menguji ulang kelemahan dari profil yang sama.
6. Membandingkan jawaban lama dan baru serta mencatat tindak lanjut.

## 4. Kebutuhan fungsional wajib

| ID | Kebutuhan dan perilaku |
| --- | --- |
| FR-01 | Membuat dan mengedit profil: judul sementara, latar belakang, rumusan masalah, tujuan, kontribusi, ruang lingkup, metode pengembangan/penelitian, dan rencana evaluasi. Judul, ringkasan latar belakang, dan tujuan wajib; kolom lain boleh kosong dan ditandai belum tersedia. |
| FR-02 | Memulai sesi dengan mode dan 1–10 pertanyaan utama; default 5. Menyimpan salinan konteks dan konfigurasi AI saat sesi dimulai. Perubahan profil tidak mengubah sesi lama. |
| FR-03 | Menampilkan satu pertanyaan per giliran. Pertanyaan harus relevan dengan konteks atau meminta klarifikasi atas informasi yang belum tersedia. Maksimal satu pertanyaan susulan per pertanyaan utama; susulan tidak menambah hitungan pertanyaan utama. |
| FR-04 | Menyimpan jawaban sebelum memanggil AI. Menolak jawaban kosong dan mencegah pengiriman ganda. Saat AI gagal, jawaban dan posisi sesi tetap tersedia; pengguna dapat mencoba kembali. |
| FR-05 | Mode Latihan menampilkan evaluasi setelah setiap jawaban. Mode Simulasi menyembunyikan evaluasi hingga sesi berakhir, termasuk dari respons API yang dikirim ke browser. |
| FR-06 | Menyediakan tombol akhiri sesi lebih awal. Evaluasi hanya mencakup jawaban yang tersedia; sesi tanpa jawaban ditandai belum dapat dievaluasi. |
| FR-07 | Mengevaluasi relevansi, kejelasan alasan, dukungan bukti, dan konsistensi terhadap konteks. Setiap kelemahan memuat kutipan jawaban, alasan, dan langkah perbaikan. Rujukan konteks menyebut field dan kutipan pendukung. |
| FR-08 | Menyimpan kelemahan beserta profil, sesi, pertanyaan, dan jawaban sumber. Status: perlu dilatih, sedang diperbaiki, sudah dilatih ulang. Pengguna dapat menambahkan catatan dan mengubah status. |
| FR-09 | Memulai latihan ulang dari satu atau lebih kelemahan yang dipilih pada profil yang sama. Menyimpan hubungan dengan kelemahan asal dan menampilkan jawaban lama serta baru berdampingan. Pertanyaan yang diulang tidak otomatis berarti kelemahan terselesaikan. |
| FR-10 | Menampilkan daftar sesi, detail percakapan, evaluasi, dan kelemahan. Sesi aktif dapat dilanjutkan setelah halaman dimuat ulang atau aplikasi dimulai kembali. |

## 5. Aturan evaluasi AI

- Bedakan fakta dalam profil, pernyataan pengguna, dan informasi yang belum tersedia. Jawaban baru tidak otomatis menjadi fakta profil; pengguna memperbarui profil secara eksplisit.
- Jangan mengarang referensi, hasil pengujian, jumlah responden, metode final, atau fakta penelitian. Kekosongan konteks tidak otomatis dianggap kesalahan mahasiswa.
- Bedakan ketidaksesuaian dengan profil dari kebenaran ilmiah; MVP tidak memverifikasi pustaka atau fakta eksternal.
- Contoh struktur jawaban boleh diberikan pada evaluasi; informasi yang belum diketahui menggunakan placeholder, bukan fakta rekaan.
- Kutipan bukti harus benar-benar terdapat pada jawaban atau salinan konteks. Tolak keluaran yang tidak memenuhi struktur atau bukti kutipan, lalu tawarkan coba kembali tanpa kehilangan data.
- Teks profil dan jawaban diperlakukan sebagai data, bukan instruksi untuk mengubah perilaku penguji.
- Evaluasi adalah umpan balik latihan, bukan penilaian resmi. MVP tidak menampilkan skor kelulusan atau angka penilaian tanpa dasar.

## 6. Antarmuka dan batasan operasional

Halaman utama: beranda/riwayat, profil penelitian, sesi, hasil evaluasi, dan daftar kelemahan. Gunakan bahasa Indonesia, label yang jelas, navigasi keyboard, kontras memadai, serta tata letak yang dapat digunakan pada layar ponsel dan desktop. Tampilkan kondisi kosong, proses berjalan, kegagalan, dan progres pertanyaan.

Batasi total konteks profil hingga 30.000 karakter dan setiap jawaban hingga 6.000 karakter. Tampilkan validasi sebelum pengiriman; jangan memotong teks diam-diam. Permintaan AI memiliki timeout 90 detik dan retry manual. Batas tersebut merupakan keputusan awal MVP, bukan klaim kapasitas semua model.

## 7. Data dan integrasi

Entitas minimum: profil penelitian, sesi beserta salinan konteks, giliran pertanyaan/jawaban, evaluasi, kelemahan, dan hubungan latihan ulang. Simpan ID model yang diminta serta model aktual jika disediakan oleh gateway. Rahasia tidak disimpan dalam riwayat sesi.

Keputusan teknis awal: Next.js App Router, TypeScript, Tailwind CSS, SQLite dengan Prisma, dan npm. Pilih versi dependensi yang kompatibel saat implementasi. Panggilan AI hanya dari server melalui adapter 9Router dengan konfigurasi `AI_BASE_URL`, `AI_API_KEY`, dan `AI_MODEL`. Validasi keluaran menggunakan Zod; jangan mengandalkan dukungan JSON terstruktur khusus dari semua penyedia.

Kunci akses tidak dikirim ke browser atau log. File lingkungan, database, dan naskah pribadi tidak masuk Git. Mode produksi tidak boleh diam-diam mengganti kegagalan AI dengan jawaban palsu. Aplikasi lokal tanpa autentikasi dibatasi ke localhost; pembukaan akses publik memerlukan rancangan lanjutan. Prompt tetap dikirim ke penyedia AI melalui 9Router.

## 8. Di luar MVP

Unggah PDF/DOCX, RAG/vector database, suara/video, avatar dosen, banyak agen AI, autentikasi multiuser, pembayaran, leaderboard, deployment publik, dan fallback antar-model otomatis. Data contoh DIVA boleh disediakan sebagai contoh yang dapat diedit, tanpa menganggap judul atau metodenya sudah final.

## 9. Kriteria penerimaan

| ID | Skenario lulus |
| --- | --- |
| AC-01 | Profil tersimpan dan dapat diedit; sesi lama tetap menampilkan salinan konteks awal. |
| AC-02 | Sesi 3 pertanyaan utama tidak melebihi 3 pertanyaan utama dan 3 susulan. Pengiriman jawaban dua kali tidak menggandakan giliran. |
| AC-03 | Mode Latihan memperlihatkan koreksi per jawaban; mode Simulasi tidak mengirim evaluasi ke browser sebelum sesi berakhir. |
| AC-04 | Mematikan 9Router saat permintaan berlangsung menghasilkan pesan gagal yang jelas; jawaban tetap tersimpan dan retry tidak membuat duplikasi. |
| AC-05 | Memuat ulang dan memulai ulang aplikasi mempertahankan profil, riwayat, serta posisi sesi aktif. |
| AC-06 | Kelemahan memiliki bukti kutipan yang cocok; keluaran AI tidak valid tidak disimpan sebagai evaluasi sukses. |
| AC-07 | Kelemahan sesi pertama dapat dipilih untuk sesi kedua; jawaban lama/baru dapat dibandingkan dan status tidak berubah menjadi terselesaikan secara otomatis. |
| AC-08 | Profil dengan metode atau hasil yang kosong tidak menghasilkan klaim seolah informasi tersebut tersedia. Periksa manual dengan contoh konteks yang sengaja tidak lengkap. |
| AC-09 | Lint, pemeriksaan tipe, build, dan tes alur penting lulus. Pengujian dengan adapter palsu dan model nyata dilaporkan terpisah; integrasi nyata yang belum dijalankan ditandai belum diuji. |

## 10. Urutan implementasi dan definisi selesai

1. Fondasi proyek, konfigurasi, penyimpanan profil, serta riwayat sesi.
2. Alur pertanyaan dan jawaban, adapter AI, kedua mode, serta pemulihan kegagalan.
3. Evaluasi berbukti, pelacak kelemahan, latihan ulang, dan perbandingan jawaban.
4. Pemeriksaan otomatis, uji manual satu siklus lengkap, dan dokumentasi setup Windows.

MVP selesai bila seluruh kriteria penerimaan diperiksa, satu siklus lintas dua sesi berhasil dengan AI nyata, dan README memuat perintah setup database, menjalankan aplikasi, serta batasan yang masih ada. Jika kredensial atau layanan belum tersedia, implementasi dapat ditinjau tetapi validasi integrasi belum dinyatakan selesai.
