import { useEffect, useState } from "react";
import { statusArsip, WARNA_ARSIP } from "../../../Utils/ArsipFisik";
import { useApp } from "../../../Context/AppContext";
import { satkerUntuk } from "../../../Utils/Referensi";
import { rpLengkap } from "../../../Utils/DaftarTagihan";
import { tglUI } from "../../../Utils/Tanggal";
import "../../mockup.css";

const tglPanjang = (d) => tglUI(d);
const ukuran = (f) => {
  const n = f.size || Math.round(((f.data || "").split(",")[1] || "").length * 0.75); // berkas di server membawa ukurannya sendiri
  return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
};

function PdfPratinjau({ file }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let u = "", batal = false;
    fetch(file.data).then((r) => r.blob()).then((b) => { if (!batal) { u = URL.createObjectURL(new Blob([b], { type: "application/pdf" })); setUrl(u); } }).catch(() => {});
    return () => { batal = true; if (u) URL.revokeObjectURL(u); };
  }, [file.data]);
  return url ? <iframe className="mk-pdf" src={url} title={"Pratinjau " + file.name} /> : null;
}
const adalahPdf = (f) => f && (/\.pdf$/i.test(f.name || "") || f.type === "application/pdf");

function Detail({ a, onHapus, onHapusData }) {
  const { referensi } = useApp();
  const satker = satkerUntuk(referensi, a.kantor);
  const kon = a.jenisSpm === "Kontrak", pen = a.jenisSpm === "Pengadaan";
  return (
    <section className="mk-card mk-detail" aria-live="polite">
      <div className="mk-head">
        <div className="mk-dt">
          <i className="mk-pulse" />
          <div>
            <h3>Detail rincian dokumen arsip <span className="mk-no">{a.nomor}</span></h3>
            <p>Kantor {a.kantor && a.kantor !== "—" ? a.kantor : "belum diatur"} · Tahun {(a.tanggal || "").slice(0, 4)}</p>
          </div>
        </div>
        <span className={"md-pill " + WARNA_ARSIP[statusArsip(a)]}>{statusArsip(a)}</span>
      </div>

      <div className="mk-grid3">
        <div className="mk-cell"><small>Tahun</small><b>{(a.tanggal || "").slice(0, 4)}</b></div>
        <div className="mk-cell"><small>{pen ? "No. dokumen" : kon ? "No. Kontrak" : "No. SPM"}</small><b className="mono">{a.nomor}</b></div>
        <div className="mk-cell"><small>{pen ? "Tanggal dokumen" : kon ? "Tanggal kontrak" : "Tanggal SPM"}</small><b>{tglPanjang(a.tanggal)}</b></div>
      </div>
      <div className="mk-grid2">
        <div className="mk-cell"><small>{pen ? "Nilai HPS / pagu" : kon ? "Nilai kontrak" : "Nilai tagihan"}</small><b className="nilai">{a.nilai > 0 ? rpLengkap(a.nilai) : "—"}</b></div>
        <div className="mk-cell"><small>{pen || kon ? "Jenis dokumen" : "Jenis SPM"}</small><b>{pen ? [a.jenisPengadaan || "Pengadaan", a.metode].filter(Boolean).join(" · ") : a.jenisSpm || a.jenis}</b></div>
      </div>
      <div className="mk-cell"><small>{pen ? "Nama paket" : kon ? "Uraian kontrak" : "Uraian tagihan"}</small><p>{a.judul}{a.pihak ? " — " + a.pihak : ""}{a.isi ? ". " + a.isi : ""}</p></div>
      {pen && a.termin && <div className="mk-cell"><small>Termin</small><p>{a.termin}</p></div>}
      <div className="mk-cell"><small>Lokasi kantor</small><b>{satker ? `${satker.nama} (${a.kantor})` : a.kantor && a.kantor !== "—" ? a.kantor : "—"}</b></div>

      {onHapus && <div className="mk-act">
        {onHapus && <button type="button" className="mk-btn del" onClick={() => onHapus(a)} disabled={!a.arsipId}>🗑 Hapus berkas</button>}
        {onHapusData && (pen || kon) && <button type="button" className="mk-btn del" onClick={() => onHapusData(a)}>🗑 Hapus data {pen ? "pengadaan" : "kontrak"}</button>}
      </div>}

      <div className="mk-file">
        <div className="mk-file-l">
          <span className="mk-file-ic">{a.file ? (a.file.name.split(".").pop() || "FILE").slice(0, 4).toUpperCase() : "—"}</span>
          <div>
            <b>{a.file ? a.file.name : "Belum ada berkas diunggah"}</b>
            <small>{a.file ? "Ukuran: " + ukuran(a.file) : "Unggah lewat menu Upload dokumen dengan nomor " + a.nomor + (pen || kon ? "" : "T")}</small>
          </div>
        </div>
        {a.file && <a className="mk-btn dark" href={a.file.data} download={a.file.name}>⬇ Unduh berkas</a>}
      </div>
      {adalahPdf(a.file) && <PdfPratinjau file={a.file} />}
    </section>
  );
}

const JENIS_CARI = [
  { id: "tagihan", nama: "Tagihan", jenis: "Penagihan", label: "Nomor SPM", placeholder: "Masukkan Nomor SPM" },
  { id: "kontrak", nama: "Kontrak", jenis: "Kontrak Kerja", label: "Nomor Kontrak", placeholder: "Masukkan Nomor Kontrak" },
  { id: "pengadaan", nama: "Pengadaan", jenis: "Pengadaan", label: "Nomor Dokumen", placeholder: "Masukkan Nomor Dokumen Pengadaan" },
];

const tipeBerkas = (a) => (a.jenis === "Pengadaan" ? "pengadaan" : a.jenis === "Kontrak Kerja" || /K$/i.test(a.nomor) ? "kontrak" : "tagihan");

export default function CariArsip({ dokumen: arsip, terunggah = [], onHapus, onHapusData }) {
  const PESAN_REF = "Referensi belum ada / belum diperbarui. Silakan hubungi Admin untuk melakukan Update Referensi.";
  const [tahun, setTahun] = useState("");
  const [nomor, setNomor] = useState("");
  const [jenisId, setJenisId] = useState("tagihan"); 
  const [ids, setIds] = useState(null); 
  const J = JENIS_CARI.find((x) => x.id === jenisId);

  const jalankan = (jenis) => {
    const n = nomor.trim().toLowerCase(), t = tahun.trim();
    if (!n && !t) return setIds(null);
    setIds(arsip.filter((a) =>
      a.jenis === jenis.jenis &&
      (!n || a.nomor.toLowerCase().includes(n) || a.judul.toLowerCase().includes(n)) &&
      (!t || (a.tanggal || "").slice(0, 4) === t)).map((a) => a.id));
  };
  const cari = (e) => { e?.preventDefault(); jalankan(J); };

  const pilihJenis = (j) => { setJenisId(j.id); jalankan(j); };
  const reset = () => { setTahun(""); setNomor(""); setIds(null); };

  const hasil = ids && ids.map((id) => arsip.find((x) => x.id === id)).filter(Boolean);

  const menunggu = hasil && !hasil.length ? terunggah.filter((a) => a.file && tipeBerkas(a) === J.id &&
    (!nomor.trim() || a.nomor.toLowerCase().includes(nomor.trim().toLowerCase())) &&
    (!tahun.trim() || (a.tanggal || "").slice(0, 4) === tahun.trim())) : [];
  const badge = hasil === null ? ["", "Silakan isi tahun atau nomor dokumen"]
    : hasil.length ? ["ok", `${hasil.length} dokumen ditemukan`]
    : ["bad", J.id === "tagihan" ? "Referensi belum diperbarui" : "Tidak ditemukan"];

  return (
    <>
      <form className="mk-card" onSubmit={cari}>
        <div className="mk-head">
          <h3 className="mk-h3"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>Cari dokumen arsip</h3>
          <span className={"mk-status " + badge[0]}>Status: <b>{badge[1]}</b></span>
        </div>
        <div className="mk-seg" role="radiogroup" aria-label="Jenis dokumen yang dicari">
          {JENIS_CARI.map((j) => (
            <button key={j.id} type="button" role="radio" aria-checked={j.id === jenisId} onClick={() => pilihJenis(j)}>{j.nama}</button>
          ))}
        </div>
        <div className="mk-grid2">
          <label className="mk-f"><span>Tahun anggaran</span>
            <input inputMode="numeric" maxLength={4} value={tahun} onChange={(e) => setTahun(e.target.value.replace(/\D/g, ""))} placeholder="Masukkan Tahun" /></label>
          <label className="mk-f"><span>{J.label}</span>
            <input value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder={J.placeholder} /></label>
        </div>
        <div className="mk-foot mk-split">
          <p>* Isi data di atas lalu tekan <b>Cari arsip</b> untuk memuat rincian.</p>
          <div>
            <button type="button" className="mk-link" onClick={reset}>Reset input</button>
            <button type="submit" className="mk-btn pri">🔍 Cari arsip</button>
          </div>
        </div>
      </form>

      {hasil && !hasil.length && (
        <div className="mk-card mk-none" role="alert">
          <b>{J.id === "tagihan" ? PESAN_REF : `Tidak ada dokumen ${J.nama.toLowerCase()} yang cocok dengan pencarian ini.`}</b>
          {menunggu.length > 0 && <p>Berkas Anda sudah terunggah ({menunggu.map((m) => m.nomor).join(", ")}) dan akan terbaca setelah admin memperbarui referensi.</p>}
        </div>
      )}

      {hasil?.map((d) => <Detail key={d.id} a={d} onHapus={onHapus} onHapusData={onHapusData} />)}
    </>
  );
}
