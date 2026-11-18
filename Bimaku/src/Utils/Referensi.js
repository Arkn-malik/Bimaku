import { DAFTAR_AWAL } from "../Data/Dummy";
import { tglUI } from "./Tanggal";

export const KUNCI_REF = "ak_referensi";

const REF_AWAL = {
  daftar: DAFTAR_AWAL,
  klas: [
    { kode: "KU.01.01", uraian: "Berkas kontrak / perjanjian kerja sama", jenis: "Kontrak Kerja Sama", aktif: 5, inaktif: 10, nasib: "Dinilai kembali" },
    { kode: "PL.01.01", uraian: "Berkas pengadaan barang/jasa (HPS, KAK, evaluasi, SPK)", jenis: "Pengadaan", aktif: 5, inaktif: 5, nasib: "Dinilai kembali" },
    { kode: "KU.02.03", uraian: "Berkas kuitansi, SP2D, dan tagihan berjalan", jenis: "Tagihan Rutin", aktif: 2, inaktif: 8, nasib: "Musnah" },
    { kode: "KU.03.01", uraian: "Jaminan pelaksanaan kontrak", jenis: "Jaminan Pelaksanaan", aktif: 5, inaktif: 5, nasib: "Musnah" },
    { kode: "UM.01.01", uraian: "Surat dan berkas umum", jenis: "Arsip Umum", aktif: 2, inaktif: 5, nasib: "Musnah" },
  ],
  satker: [
    { kantor: "Yogyakarta", nama: "KPTIK BMN Yogyakarta", kode: "690001", ppk: "Budi Santoso", nip: "198503122010011004" },
    { kantor: "Semarang", nama: "KPTIK BMN Semarang", kode: "689334", ppk: "Rina Wulandari", nip: "198806212012022001" },
    { kantor: "Bandung", nama: "KPTIK BMN Bandung", kode: "690003", ppk: "Agus Prasetyo", nip: "198210052008011009" },
  ],
};

export const muatRef = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KUNCI_REF) || "null");
    return v ? { ...REF_AWAL, ...v, satker: REF_AWAL.satker } : REF_AWAL;
  } catch { return REF_AWAL; }
};

const cariKlas = (ref, kode) => ref.klas.find((k) => k.kode === kode) || REF_AWAL.klas.find((k) => k.kode === kode);

export const hitungRetensi = (ref, kode, tanggal) => {
  const k = cariKlas(ref, kode), t = parseInt(String(tanggal || "").slice(0, 4), 10);
  return k && t ? String(t + k.aktif + k.inaktif) : "";
};
export const satkerUntuk = (ref, kantor) => ref.satker.find((s) => s.kantor === kantor);

const tgl = (d) => tglUI(d);
const NBSP = "\u00a0";
const JUDUL_LABEL = "KPTIK BMN SEMARANG";
const KODE_SATKER_LABEL = "689334";
export function isiLabel(a, ref) {
  const ta = (a.tanggal || "").slice(0, 4);
  return {
    judul: JUDUL_LABEL,
    ta,
    baris: [
      { k: "No. SPM", v: a.nomor + NBSP.repeat(6) + "/" + KODE_SATKER_LABEL + "/" + ta },
      { k: "Tanggal SPM", v: tgl(a.tanggal) },
      { k: "Nilai Tagihan", v: a.nilai > 0 ? new Intl.NumberFormat("id-ID").format(a.nilai) : "—" },
      { k: "Uraian Tagihan", v: a.judul },
      { k: "Jenis SPM", v: a.jenisSpm || "—" },
    ],
  };
}