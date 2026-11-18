import { KANTOR } from "../Data/Dummy";
import { hitungRetensi } from "./Referensi";

const KLAS_TAGIHAN = "KU.02.03";
const KLAS_KONTRAK = "KU.01.01";
const KLAS_PENGADAAN = "PL.01.01";
const tahunDari = (r) => String(r.tanggal || "").slice(0, 4);
const kontrakRow = (r) => r.jenisDok === "Kontrak";
const pengadaanRow = (r) => r.jenisDok === "Pengadaan";

export const dokKhusus = (r) => kontrakRow(r) || pengadaanRow(r);
export const kunciRow = (r) => (kontrakRow(r) ? "K:" : pengadaanRow(r) ? "P:" : "") + String(r.noSpm).trim().toUpperCase() + "|" + tahunDari(r);

export const kantorDariUraian = (u) => KANTOR.find((k) => String(u || "").toLowerCase().includes(k.toLowerCase())) || "";

const angka = (s) => Number(String(s ?? "").replace(/rp\.?/gi, "").replace(/\./g, "").replace(/,\d*$/, "").replace(/[^\d-]/g, "")) || 0;
const tanggal = (s) => {
  const v = String(s || "").trim();
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(v);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/.exec(v);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
};

export function parseTempel(teks) {
  const baris = String(teks || "").split(/\r?\n/).filter((l) => l.trim());
  const sep = baris.some((l) => l.includes("\t")) ? "\t" : baris.some((l) => l.includes(";")) ? ";" : ",";
  const ok = [], gagal = [];
  baris.forEach((l, i) => {
    let c = l.split(sep).map((x) => x.trim().replace(/^"|"$/g, ""));
    if (/^(no|nomor)\b/i.test(c[0]) && /spm/i.test(l)) return; 
    if (/^\d{1,5}$/.test(c[0]) && c.length >= 6) c = c.slice(1); 
    const [noSpm, jenisSpm, tgl, nilai, ...sisa] = c;
    const uraian = sisa.join(sep === "," ? ", " : " ").trim();
    const t = tanggal(tgl);
    if (!noSpm || !t || !uraian) return gagal.push(i + 1);
    ok.push({ noSpm, jenisSpm: jenisSpm || "", tanggal: t, nilai: angka(nilai), uraian, kantor: kantorDariUraian(uraian) });
  });
  return { ok, gagal };
}

export function gabung(lama, baru) {
  const peta = new Map(lama.map((r) => [kunciRow(r), r]));
  let tambah = 0, ubah = 0;
  baru.forEach((r) => { peta.has(kunciRow(r)) ? ubah++ : tambah++; peta.set(kunciRow(r), r); });
  return { daftar: [...peta.values()], tambah, ubah };
}

const bulanDari = (r) => String(r.tanggal || "").slice(0, 7);
export function timpaPeriode(lama, baru) {
  const bln = baru.map(bulanDari).filter(Boolean).sort();
  if (!bln.length) return { daftar: lama, hapus: 0, tambah: 0, dari: "", sampai: "" };
  const dari = bln[0], sampai = bln[bln.length - 1];
  const sisa = lama.filter((r) => dokKhusus(r) || bulanDari(r) < dari || bulanDari(r) > sampai);
  const lamaPeta = new Map(lama.map((r) => [kunciRow(r), r]));
  const peta = new Map(baru.map((r) => [kunciRow(r), r.lampiran || !lamaPeta.get(kunciRow(r))?.lampiran ? r : { ...r, lampiran: lamaPeta.get(kunciRow(r)).lampiran }])); // nomor kembar dalam data baru: yang terakhir dipakai
  return { daftar: [...sisa, ...peta.values()], hapus: lama.length - sisa.length, tambah: peta.size, dari, sampai };
}
const NAMA_BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const labelBulan = (ym) => (ym ? NAMA_BULAN[Number(ym.slice(5, 7)) - 1] + " " + ym.slice(0, 4) : "");

export const urutDaftar = (d) => [...d].sort((a, b) =>
  (dokKhusus(a) ? 1 : 0) - (dokKhusus(b) ? 1 : 0) || 
  (parseInt(String(a.noSpm).replace(/\D/g, ""), 10) || 0) - (parseInt(String(b.noSpm).replace(/\D/g, ""), 10) || 0)
  || String(a.noSpm).localeCompare(String(b.noSpm), undefined, { numeric: true }) || (a.tanggal || "").localeCompare(b.tanggal || ""));

const polos = (n) => String(n || "").trim().toUpperCase().replace(/[TK]$/, "");
const arsipPengadaan = (a) => a.jenis === "Pengadaan";
const arsipKontrak = (a) => !arsipPengadaan(a) && (a.jenis === "Kontrak Kerja" || /K$/i.test(a.nomor));
export const cariBerkas = (r, arsip) => dokKhusus(r)

  ? arsip.find((a) => a.file && (pengadaanRow(r) ? arsipPengadaan(a) : arsipKontrak(a)) && String(a.nomor).trim().toUpperCase() === String(r.noSpm).trim().toUpperCase() && (a.tanggal || "").slice(0, 4) === tahunDari(r))
  : arsip.find((a) => a.file && !arsipKontrak(a) && !arsipPengadaan(a) && polos(a.nomor) === String(r.noSpm).trim().toUpperCase() && (a.tanggal || "").slice(0, 4) === tahunDari(r));

export function daftarKeDokumen(r, arsip, ref) {
  const b = cariBerkas(r, arsip);
  const klas = kontrakRow(r) ? KLAS_KONTRAK : pengadaanRow(r) ? KLAS_PENGADAAN : KLAS_TAGIHAN;
  return {
    id: "SPM-" + kunciRow(r), nomor: String(r.noSpm), jenisSpm: r.jenisSpm, jenis: kontrakRow(r) ? "Kontrak Kerja" : pengadaanRow(r) ? "Pengadaan" : "Penagihan", jenisPengadaan: r.jenisPengadaan || "", termin: r.termin || "", metode: r.metode || "", kantor: r.kantor || "—",
    tanggal: r.tanggal, nilai: r.nilai, judul: r.uraian, pihak: r.penyedia || "", isi: "", catatan: "",
    klasifikasi: b?.klasifikasi || klas,
    retensi: b?.retensi || hitungRetensi(ref, klas, r.tanggal),
    mak: b?.mak || "", lokasiKode: b?.lokasiKode || "", boks: b?.boks || "", rak: b?.rak || "", lokasi: b?.lokasi || "",
    statusArsip: b?.statusArsip || "Aktif", file: b?.file || r.lampiran || null, arsipId: b?.id || null,
  };
}

export const rpLengkap = (n) => "Rp " + new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);