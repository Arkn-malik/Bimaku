# BIMAKU

Aplikasi arsip penagihan dan kontrak kerja untuk kantor Yogyakarta, Semarang, dan Bandung.

## Cara menjalankan

1. Ekstrak ZIP, lalu buka folder yang ada file `package.json`-nya di VS Code.
2. Copy `.env.example` jadi `.env`, kemudian isi `DATABASE_URL` dan `SESSION_SECRET`. Penjelasannya ada di bagian "Server lokal" di bawah.
3. Di terminal, jalankan `npm install` lalu `npm run dev`.
4. Buka http://localhost:5173 di browser.

## Akun dan login

Semua akun disimpan di database (Neon). Akun pertama dibuat lewat perintah `npm run buat-admin`. Setelah itu, akun staf maupun admin lain dibuat oleh admin dari menu **Kelola user**. Halaman login tidak punya tombol daftar, jadi pengguna tidak bisa mendaftar sendiri.

Login memakai **NIP dan password**. Pengguna yang akunnya baru dibuat atau baru direset mendapat password sementara, dan langsung diarahkan ke halaman Profil saya untuk menggantinya sebelum bisa memakai menu lain.

Kalau lupa password, pengguna memilih tautan "Lupa kata sandi?" di halaman masuk, memverifikasi nama lengkap, NIP, dan kantornya, lalu membuat password baru.

## Daftar menu

| Menu | Siapa yang bisa | Kegunaan |
| --- | --- | --- |
| Dashboard | Semua | Ringkasan data, akses cepat, serta grafik aktivitas dan komposisi dokumen |
| Arsip | Semua | Mencari dokumen berdasarkan tahun dan nomor/uraian, melihat detail, mengunduh berkas, serta mengecek retensi dan lokasi fisik |
| Upload dokumen | Semua | Mengunggah tagihan (SPP), kontrak, atau dokumen pengadaan. Pratinjau file muncul di samping form dan nama file dibuat otomatis |
| Update referensi | Admin | Mengelola daftar tagihan (SPM) yang jadi sumber untuk Cari arsip dan Cetak label |
| Cetak label | Admin | Mencetak 2 label per lembar A4, bisa langsung dicetak atau disimpan sebagai PDF lewat dialog cetak browser |
| Kelola user | Admin | Membuat akun, mengubah data, mereset password, serta menonaktifkan atau mengaktifkan kembali akun |
| Profil saya | Semua | Mengganti foto (JPG atau PNG, maksimal 2 MB) dan password |

Di dashboard, admin bisa menyaring angka per kantor lewat tombol di bagian atas.

## Notifikasi untuk admin (lonceng)

Ikon lonceng di header hanya tampil untuk admin, lengkap dengan angka jumlah notifikasi yang belum dibaca.

Notifikasi muncul ketika staf mengunggah dokumen baru atau mengganti file dokumen yang sudah ada. Setiap notifikasi bisa dibuka (langsung ke halaman Arsip), diunduh filenya, ditandai sudah dibaca, atau dihapus. Ada juga tombol untuk menandai semuanya sudah dibaca.

Notifikasi disimpan di database dan disinkronkan ke semua perangkat admin. Jumlah yang disimpan paling banyak 1.000 notifikasi terbaru. Browser juga menyimpan salinannya di `localStorage` (kunci `ak_notif`).

## Daftar tagihan (Update referensi)

Tabel ini berisi No. SPM, Jenis SPM, Tanggal SPM, Nilai Tagihan, Uraian Tagihan, Kantor, dan Dokumen. Kolom Kantor terisi otomatis dari nama kantor yang disebut di uraian, dan admin bisa mengubahnya langsung di tabel. Datanya bisa diisi dengan tiga cara: tempel langsung dari Excel, unggah file `.csv`/`.tsv`/`.txt`, atau tambah satu per satu lewat **Tambah satu tagihan**.

Dokumen untuk tiap tagihan diunggah, diganti, atau dihapus langsung dari kolom Dokumen di tabel. Format yang diterima: Word, PDF, Excel, PowerPoint, `.odt`/`.ods`/`.odp`, `.rtf`, `.txt`, dan `.csv`.

Soal menimpa data: kalau data yang ditempel mencakup beberapa bulan, semua data lama di bulan-bulan tersebut dihapus dan diganti data baru (ada konfirmasi sebelumnya). Tagihan dengan No. SPM dan tahun yang sama hanya diperbarui, tidak dobel.

Tombol **Kosongkan daftar** menghapus seluruh baris tagihan. Dokumen kontrak dan pengadaan yang ditambahkan dari halaman Upload tidak ikut terhapus.

Dokumen yang diunggah cabang baru baru bisa dicari setelah admin memperbarui daftar ini, yang rutin dilakukan tiap akhir bulan.

## Berkas besar (sampai 200 MB) dan NAS

Berkas tidak disimpan di dalam data arsip. File dikirim ke folder di server dan ditulis langsung ke disk tanpa dimuat penuh ke memori, sementara data arsip hanya menyimpan alamat filenya.

- Lokasi folder diatur lewat `BERKAS_DIR` di `.env`. Kalau tidak diisi, dipakai folder `berkas` di dalam proyek. Folder ini boleh diarahkan ke NAS, misalnya `BERKAS_DIR=Z:\Arsip\Bimaku` atau `/mnt/nas/bimaku`. Batas ukuran file diatur lewat `BERKAS_MAKS_MB` (bawaannya 200).
- Susunan foldernya `<BERKAS_DIR>/<Kantor>/<Tahun>/<nama file>`. Lampiran referensi yang tidak terkait kantor tertentu masuk ke folder `Umum`. Hak akses berkas sama dengan hak akses data: staf hanya kantornya, admin semuanya.
- Di sidebar, admin bisa melihat widget **Disk server** yang menampilkan kapasitas dan sisa disk tempat `BERKAS_DIR` berada (termasuk drive NAS), total ukuran berkas, dan peringatan kalau disk sudah terpakai 90% atau lebih, atau sisanya kurang dari 5 GB. Staf tidak melihat widget ini.
- Saat upload berjalan, tombol Simpan menampilkan persentase. PDF berukuran besar dibuka bertahap karena server mendukung permintaan Range.
- Berkas lama yang masih tersimpan sebagai base64 di dalam data tetap bisa dibuka. Untuk memindahkannya ke folder berkas, jalankan `npm run migrasi-berkas -- --jalan` di komputer server dengan `BERKAS_DIR` yang sama. Tanpa `--jalan`, perintah ini hanya menghitung.
- Berkas yang dihapus dari arsip, atau diganti dengan file bernama lain, belum ikut terhapus otomatis dari folder. Kalau perlu, bersihkan manual.
- Laporan Excel+ZIP memuat semua dokumen ke memori browser, jadi totalnya dibatasi 1 GB per laporan.
- Folder `BERKAS_DIR` perlu dicadangkan secara berkala bersama database Neon. RAID di NAS tidak bisa menggantikan backup.

## Upload dokumen

Ada tiga jenis dokumen: tagihan, kontrak, dan pengadaan. Sebelum disimpan, pratinjau file (PDF, gambar, teks) bisa dilihat di samping form. Semua jenis file diterima, dengan batas 200 MB per file.

Untuk **tagihan** dan **kontrak**, nomor dilengkapi nol di depan secara otomatis sampai 5 digit (200 menjadi 00200), lalu diberi akhiran `T` untuk tagihan atau `K` untuk kontrak. Klasifikasi tagihan `KU.02.03`.

Untuk **pengadaan**, isiannya meliputi tanggal dokumen, lokasi, jenis dokumen (Proses Pengadaan atau Proses Pelaksanaan), metode (opsional, pilihannya Pengadaan langsung, E-purchasing, atau Tender), nomor dokumen yang diketik manual, nama paket, serta penyedia, nilai HPS/pagu, dan termin yang sifatnya opsional. Nama file dibuat otomatis dengan pola `Pengadaan_<nomor>_<tahun>.<ext>` dan klasifikasinya `PL.01.01`. Angka retensinya baru contoh, sesuaikan di `src/Utils/Referensi.js`.

Beberapa aturan lain:
- File yang bisa dieksekusi atau berpotensi menjalankan skrip (.exe, .msi, .bat, .cmd, .com, .scr, .js, .vbs, .ps1, .sh, .jar, .html, .svg) ditolak.
- Mengunggah dokumen yang sama dua kali tidak membuat data ganda. Kalau nomor, tahun, dan kantornya sama, file lama diganti file baru.
- Kontrak dan pengadaan bisa dicari di Cari arsip, tetapi tidak muncul di Daftar referensi dan labelnya tidak dicetak.

## Cari arsip dan laporan Excel

Cari arsip punya tiga pilihan jenis dokumen: **Tagihan**, **Kontrak**, dan **Pengadaan**. Label isian dan hasil pencariannya menyesuaikan jenis yang dipilih.

Di bawah Daftar referensi ada tiga tombol laporan Excel: **Cetak Laporan Tagihan**, **Cetak Laporan Kontrak**, dan **Cetak Laporan Pengadaan**. Tiap tombol mengunduh seluruh daftar jenis itu, bukan hanya baris yang sedang tampil. Hasilnya berupa file `.xlsx` dengan kolom nomor, nilai (format Rp), uraian, kantor, dan Dokumen.

Jika ada dokumen yang sudah diunggah, unduhannya berupa `.zip` yang berisi laporan `.xlsx` dan folder `dokumen/`. Nama berkas di kolom Dokumen adalah tautan ke folder itu, jadi ekstrak ZIP-nya dulu sebelum mengklik tautan. Kodenya ada di `src/Utils/EksporTagihan.js` dan tidak memakai library tambahan.

## Struktur folder

```
src/
  Assets/       logo.png
  Components/   CountUp, Logo, Lonceng, TanggalInput (beserta CSS)
  Context/      AppContext (state, akses per kantor, notifikasi)
  Data/         Dummy.js (KANTOR, migrasi data lama, dan data contoh)
  Layouts/      AdminLayout, SidebarInfo (beserta CSS)
  Pages/        Auth, Dashboard, Arsip, Upload, Referensi, Label, Profil, User
  Routes/       Router (pengaman login dan halaman khusus admin)
  Utils/        Referensi, DaftarTagihan, EksporTagihan, ArsipFisik, Berkas,
                Sinkron, Tanggal, Tampilan, Helpers
```

## Mengganti logo dan nama aplikasi

- Logo di halaman login, topbar, dan sidebar: ganti file `src/Assets/logo.png`. Gunakan PNG persegi dengan latar transparan atau putih.
- Ikon di tab browser dan gambar pratinjau saat tautan dibagikan: ganti file `public/Logo bimaku.png`. Nama file ini dipanggil dari `index.html`.
- Nama aplikasi, subjudul, dan deskripsi: ubah objek `TAMPILAN` di `src/Utils/Tampilan.js`.
- Judul tab sebelum aplikasi selesai dimuat: ubah tag `<title>` di `index.html`.

Setelah itu jalankan ulang `npm run dev`, atau `npm run build` kalau untuk deploy.

## Catatan

- Angka retensi, nama satker, dan NIP PPK bawaan di `src/Utils/Referensi.js` hanya contoh. Ganti dengan data resmi kantor.
- Kalau tampilan terlihat janggal setelah update, ketik `localStorage.clear()` di Console browser (F12), lalu refresh dengan Ctrl+F5.

## Server lokal (produksi di jaringan kantor)

Aplikasi berjalan sebagai satu server Node (`server/index.js`) yang sekaligus menyajikan tampilan, API, dan penyimpanan berkas, tanpa layanan hosting pihak ketiga.

- Data (akun, arsip, notifikasi, daftar tagihan) disimpan di database Neon (PostgreSQL), sedangkan berkas disimpan di disk atau NAS seperti dijelaskan di atas.
- Perintah `npm run dev` dan `npm run preview` memakai API yang sama dengan produksi, jadi perilakunya di laptop dan di server sama.

### Menjalankan di komputer server (Windows)

1. Cukup sekali saja: klik kanan `buka-firewall.bat` lalu pilih **Run as administrator**. Skrip ini membuka port 3000 (atau sesuai `PORT` di `.env`) di Windows Firewall.
2. Klik dua kali `jalankan-server.bat`. Skrip akan memasang paket kalau belum ada, membangun aplikasi, lalu menjalankannya. Biarkan jendelanya terbuka, karena menutup jendela berarti menghentikan server. Setelah ada pembaruan kode, jalankan ulang skrip ini.
3. Saat server aktif, jendela menampilkan alamat jaringan komputer server dan lokasi folder berkas. Dari komputer lain di jaringan yang sama, buka alamat itu, misalnya `http://<IP-server>:3000`.
4. Untuk mengecek server dan koneksi database, buka `/api/health`. Hasilnya seharusnya `{"ok":true,...}`.

### Pemasangan awal

1. Di Neon, buat project baru dan salin connection string tipe *Pooled* (Console > Connect). Lalu di **SQL Editor**, jalankan isi file `db/schema.sql`.
2. Copy `.env.example` jadi `.env`, isi `DATABASE_URL` dan `SESSION_SECRET` (acak, minimal 32 karakter). `PORT` dan `HOST` bisa dibiarkan bawaan.
3. Jalankan `npm install`, lalu `npm run buat-admin` untuk membuat akun admin. Kalau masih ada password lama yang tersimpan sebagai teks biasa, jalankan juga `npm run amankan-password`. Untuk memindahkan data dari `data/db.json` versi lama, tersedia `npm run migrasi`.
4. Jalankan `npm run build`, lalu `npm start`.

Kalau server diakses lewat reverse proxy, isi `PERCAYA_PROXY=1` di `.env` supaya alamat IP pengguna terbaca dengan benar.

```
server/index.js          server produksi (menyajikan dist/ dan API)
server/rute.js           penghubung /api/* ke rute (dipakai juga oleh `npm run dev`)
server/rute/             ver, health, auth, data (baca), ops (tulis), berkas (unggah/unduh)
server/lib/              db, auth, http, policy (hak akses), store
db/schema.sql            skema tabel Neon
scripts/                 buat-admin, amankan-password, migrasi-db-json, migrasi-berkas
```

## Hak akses dan login

Password disimpan dalam bentuk hash (scrypt) dan login diperiksa di server. Sesi memakai cookie `HttpOnly`, dan setiap permintaan data maupun berkas dicek hak aksesnya di server.

| Peran | Yang boleh dilakukan |
| --- | --- |
| Admin | Mengakses semua data di semua kantor, mengelola akun, mengubah referensi, mencetak label, dan menghapus dokumen |
| Staf | Hanya mengakses arsip, referensi, dan berkas kantornya sendiri. Boleh menambah dan mengubah dokumen kantornya, menambah kontrak dan pengadaan, serta mengganti foto dan password sendiri. Tidak bisa menghapus, mengubah role atau kantor, dan tidak bisa melihat akun orang lain |

Beberapa pengaman lain: salah memasukkan password 8 kali dalam 15 menit pada satu NIP akan mengunci login sementara (ada juga batas 40 percobaan per alamat IP). Akun yang dinonaktifkan atau diganti passwordnya langsung keluar dari semua perangkat. Saat pengguna menekan Keluar, salinan data di browser ikut dihapus.

Catatan keamanan yang masih berlaku: fitur "Lupa kata sandi" hanya meminta nama, NIP, dan kantor, tanpa email atau OTP.