export const KANTOR = ["Yogyakarta", "Semarang", "Bandung"];
export const USERS = [
  { email: "admin@siparker.id", password: "admin123", nama: "Administrator", role: "admin", kantor: "Semua", nip: "19850101 200101 1 001" },
  { email: "yogyakarta@siparker.id", password: "staff123", nama: "Staff Yogyakarta", role: "staff", kantor: "Yogyakarta", nip: "19900101 201501 1 002" },
  { email: "semarang@siparker.id", password: "staff123", nama: "Staff Semarang", role: "staff", kantor: "Semarang", nip: "19900202 201501 1 003" },
  { email: "bandung@siparker.id", password: "staff123", nama: "Staff Bandung", role: "staff", kantor: "Bandung", nip: "19900303 201501 1 004" },
];
const a = (id, nomor, jenis, kantor, pihak, judul, nilai, tanggal, status, extra = {}) =>
  ({ id, nomor, jenis, kantor, pihak, judul, nilai, tanggal, status, catatan: "", file: null, ...extra });
export const ARSIP_AWAL = [
  a("A1", "KTR/YGY/2026/001", "Kontrak Kerja", "Yogyakarta", "PT Maju Bersama", "Kontrak pengadaan perangkat", 150000000, "2026-02-10", "Berjalan",
    { klasifikasi: "KTR", boks: "12", lokasiKode: "RAK-A1-L2", mak: "521211 · Belanja bahan", retensi: "2031", statusArsip: "Aktif", isi: "Pengadaan perangkat komputer dan jaringan kantor, garansi satu tahun." }),
  a("A2", "INV/YGY/2026/014", "Penagihan", "Yogyakarta", "PT Maju Bersama", "Tagihan termin 1", 50000000, "2026-03-01", "Selesai",
    { klasifikasi: "TGH", boks: "14", lokasiKode: "RAK-A1-L2", mak: "521211 · Belanja bahan", retensi: "2031", statusArsip: "Aktif" }),
  a("A3", "KTR/SMG/2026/003", "Kontrak Kerja", "Semarang", "CV Sinar Jaya", "Kontrak jasa pemeliharaan", 90000000, "2026-04-05", "Berjalan",
    { klasifikasi: "KTR", boks: "07", lokasiKode: "RAK-B2-L1", mak: "521211 · Belanja bahan", retensi: "2031", statusArsip: "Aktif", isi: "Jasa pemeliharaan gedung dan peralatan, kunjungan bulanan." }),
  a("A4", "INV/BDG/2026/007", "Penagihan", "Bandung", "PT Cipta Karya", "Tagihan jasa instalasi", 32500000, "2026-05-12", "Bermasalah",
    { klasifikasi: "TGH", boks: "03", lokasiKode: "LEMARI-C1", mak: "521211 · Belanja bahan", retensi: "2031", statusArsip: "Aktif" }),
  a("A5", "TGH/SMG/2026/011", "Penagihan", "Semarang", "CV Sinar Jaya", "Tagihan termin 1", 30000000, "2026-05-01", "Berjalan",
    { klasifikasi: "TGH", boks: "08", lokasiKode: "RAK-B2-L1", mak: "521211 · Belanja bahan", retensi: "2031", statusArsip: "Aktif" }),
  a("A6", "TGH/SMG/2026/012", "Penagihan", "Semarang", "CV Sinar Jaya", "Tagihan termin 1 (kirim ulang)", 30000000, "2026-05-03", "Draft",
    { klasifikasi: "TGH", boks: "08", lokasiKode: "RAK-B2-L1", mak: "521211 · Belanja bahan", retensi: "2031", statusArsip: "Aktif" }),
  a("A7", "SRT/BDG/2020/021", "Arsip", "Bandung", "Dinas Perhubungan", "Surat izin lokasi parkir", 0, "2020-08-17", "Selesai",
    { klasifikasi: "SRT", boks: "21", lokasiKode: "DEPO-INAKTIF-01", mak: "521211 · Belanja bahan", retensi: "2025", statusArsip: "Inaktif", isi: "Surat izin penggunaan lahan parkir tahun 2020." }),
];

// ---- migrasi data lama di localStorage (Jogja → Yogyakarta, username → email) ----
const ganti = (v) => (v === "Jogja" ? "Yogyakarta" : v);
const gantiNomor = (n) => (typeof n === "string" ? n.replace("/JGJ/", "/YGY/") : n);
// akun contoh bawaan yang dibuat sebelum ada NIP diberi NIP-nya agar bisa masuk dengan NIP
const NIP_CONTOH = Object.fromEntries(USERS.map((x) => [x.email, x.nip]));
export const migrasiUser = (u) => {
  if (!u) return u;
  const email = u.email || `${(u.username || "pengguna").toLowerCase().replace("jogja", "yogyakarta")}@siparker.id`;
  const { username: _x, ...sisa } = u;
  return { ...sisa, ...(!u.nip && NIP_CONTOH[email] ? { nip: NIP_CONTOH[email] } : {}), email, kantor: ganti(u.kantor), nama: typeof u.nama === "string" ? u.nama.replace("Jogja", "Yogyakarta") : u.nama };
};
const KLAS_LAMA = { KTR: "KU.01.01", TGH: "KU.02.03", SRT: "UM.01.01" };
export const migrasiArsip = (a) => ({ ...a, kantor: ganti(a.kantor), nomor: gantiNomor(a.nomor), klasifikasi: KLAS_LAMA[a.klasifikasi] || a.klasifikasi });

// Daftar tagihan (SPM) awal — contoh dari Excel "Update Referensi Daftar Tagihan". Admin menggantinya lewat Update referensi › Daftar tagihan.
export const DAFTAR_AWAL = [
  {"noSpm": "00001A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-07", "nilai": 7480750, "uraian": "Pembayaran Jasa Sewa Pengharum Ruangan, Dustmatt, dan Hygiene Service GKN Yogyakarta Tahun 2025 sesuai BAST/BAPP Nomor BAST.PPK.3-239.3/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Yogyakarta"},
  {"noSpm": "00002A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-07", "nilai": 85122066, "uraian": "Pembayaran JASA OUTSOURCING TENAGA PENGAMANAN DAN TENAGA PENGEMUDI GEDUNG KEUANGAN NEGARA YOGYAKARTA TA 2025 sesuai BAST/BAPP Nomor BAST.PPK.3-239.1/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Yogyakarta"},
  {"noSpm": "00003A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-07", "nilai": 8700000, "uraian": "Pembayaran Pemeliharaan Lift Schindler 3000 GKN Yogyakarta Tahun 2025 sesuai BAST/BAPP Nomor BAST.PPK.3-239.4/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Yogyakarta"},
  {"noSpm": "00004A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-07", "nilai": 8080800, "uraian": "Pembayaran Jasa Pemeliharaan PUTR, Travo, Genset, Instalasi Air Kotor (STP) dan Intalasi Air Bersih GKN Yogyakarta sesuai BAST/BAPP Nomor BAST.PPK.3-239.2/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Yogyakarta"},
  {"noSpm": "00005A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-07", "nilai": 91313837, "uraian": "Pembayaran JASA OUTSOURCING KEBERSIHAN GEDUNG DAN TAMAN/HALAMAN TENAGA OPERATOR MEP DAN TENAGA PENDUKUNG GEDUNG KEUANGAN NEGARA YOGYAKARTA TA 2025 sesuai BAST/BAPP Nomor BAST.PPK.3-239/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Yogyakarta"},
  {"noSpm": "00006A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-08", "nilai": 168896260, "uraian": "Pembayaran PEKERJAAN PENGADAAN JASA OUTSOURCING TENAGA PENGAMANAN PADA GKN BANDUNG TAHUN ANGGARAN 2025 sesuai BAST/BAPP Nomor BAST.PPK.4-94/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Bandung"},
  {"noSpm": "00007A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-08", "nilai": 330732889, "uraian": "Pembayaran Pekerjaan Pengadaan Jasa Outsourcing Tenaga Kebersihan, Taman dan Pendukung Perkantoran pada GKN Bandung Tahun Anggaran 2025 sesuai BAST/BAPP Nomor BAST.PPK.4-95/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Bandung"},
  {"noSpm": "00008A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-08", "nilai": 11382125, "uraian": "Pembayaran Pekerjaan Penyediaan Pengharum Ruangan dan Perlengkapan Toilet pada GKN Bandung Tahun Anggaran 2025 sesuai BAST/BAPP Nomor BAST.PPK.4-96/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Bandung"},
  {"noSpm": "00009A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-08", "nilai": 8652000, "uraian": "Pembayaran Pekerjaan Jasa Pengendali Hama Umum pada GKN Bandung Tahun Anggaran 2025 sesuai BAST/BAPP Nomor BAST.PPK.4-97/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Bandung"},
  {"noSpm": "00010A", "jenisSpm": "172 - Pembayaran RPATA", "tanggal": "2026-01-08", "nilai": 13557600, "uraian": "Pembayaran Jasa Sewa Tanaman Hias Pada GKN Semarang I dan II TA 2025 sesuai BAST/BAPP Nomor BAST.PPK.1-158/TIKBMN.2/2025 Tanggal 31-12-2025", "kantor": "Semarang"},
];
