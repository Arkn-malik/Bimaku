import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../Context/AppContext";
import LabelKartu from "./LabelKartu";
import "../mockup.css";
import "./label.css";

const PER_LEMBAR = 2; 
const PRATINJAU_MAKS = 4; 

const IcCetak = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><path d="M6 14h12v7H6z" />
  </svg>
);

export default function LabelPage() {
  const { daftarDok } = useApp();
  const urut = daftarDok.filter((x) => x.jenis === "Penagihan");
  const total = urut.length;
  const [awal, setAwal] = useState("00");
  const [akhir, setAkhir] = useState("00");
  const [penuh, setPenuh] = useState(false); 
  const a = /^\d+$/.test(awal) ? parseInt(awal, 10) : NaN;
  const b = /^\d+$/.test(akhir) ? parseInt(akhir, 10) : NaN;
  const diisi = a >= 1 && b >= 1;
  const fokus = (v, set) => { if (v === "00") set(""); };
  const rapikan = (v, set) => set(v === "" ? "00" : v.padStart(2, "0"));

  const lewat = diisi && b > total; 
  const terpilih = diisi && a <= b && !lewat ? urut.slice(a - 1, b) : [];
  const valid = terpilih.length > 0;
  const jmlLabel = terpilih.length;
  const jmlLembar = Math.ceil(jmlLabel / PER_LEMBAR);

  let pesan = "";
  if (total === 0) pesan = "";
  else if (!diisi) pesan = "Isi Nomor Awal dan Nomor Akhir.";
  else if (a > b) pesan = "Nomor Awal tidak boleh lebih besar dari Nomor Akhir.";
  else if (lewat) pesan = "Nomor akhir melebihi daftar referensi.";

  const lembar = useMemo(() => {
    const isi = terpilih.map((x, i) => ({ x, no: a + i }));
    return Array.from({ length: Math.ceil(isi.length / PER_LEMBAR) }, (_, i) => isi.slice(i * PER_LEMBAR, (i + 1) * PER_LEMBAR));
  }, [urut, awal, akhir]); 
  const tampil = penuh ? lembar : lembar.slice(0, PRATINJAU_MAKS);

  useEffect(() => {
    const selesai = () => setPenuh(false);
    window.addEventListener("afterprint", selesai);
    return () => window.removeEventListener("afterprint", selesai);
  }, []);

  const cetak = () => {
    if (!valid) return;
    setPenuh(true);
    setTimeout(() => window.print(), 300); 
  };

  return (
    <>
      <div className="hm-head no-print">
        <div>
          <h1>Cetak label</h1>
          <p className="hm-sub">Label arsip dokumen fisik, 2 label memenuhi 1 lembar HVS A4. Isi label (No. SPM, jenis, tanggal, nilai, uraian).</p>
        </div>
        <span className="mk-badge">2 label / lembar</span>
      </div>

      {total === 0 ? (
        <div className="lbr-kosong no-print"><b>📭</b>Daftar tagihan masih kosong. Isi dulu di menu Update referensi.</div>
      ) : (
        <div className="lbr-layout">
          <aside className="lbr-panel no-print">
            <h3 className="lbr-h">Rentang label</h3>

            <div className="lbr-range">
              <label><span>Nomor Awal</span>
                <input inputMode="numeric" value={awal} onFocus={(e) => fokus(e.target.value, setAwal)} onChange={(e) => setAwal(e.target.value.replace(/\D/g, ""))} onBlur={(e) => rapikan(e.target.value, setAwal)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} autoComplete="off" /></label>
              <i aria-hidden="true">–</i>
              <label><span>Nomor Akhir</span>
                <input inputMode="numeric" value={akhir} onFocus={(e) => fokus(e.target.value, setAkhir)} onChange={(e) => setAkhir(e.target.value.replace(/\D/g, ""))} onBlur={(e) => rapikan(e.target.value, setAkhir)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} autoComplete="off" /></label>
            </div>
            <button type="button" className="lbr-semua" onClick={() => { setAwal("01"); setAkhir(String(total).padStart(2, "0")); }}>Pilih semua (1–{total})</button>

            <div className="lbr-stats" aria-live="polite">
              <div className="t1"><b>{jmlLabel}</b><span>Jumlah Label</span></div>
              <div className="t2"><b>{jmlLembar}</b><span>Jumlah Lembar</span></div>
            </div>

            <p className={"lbr-info" + (pesan ? " warn" : "")} role={pesan ? "alert" : undefined}>
              {pesan || `Tersedia ${total} tagihan (nomor 1–${total}). Ketik nomor awal dan akhir sesuai kolom No di Update referensi.`}
            </p>

            <button type="button" className="lbr-cetak" disabled={!valid} onClick={cetak}><IcCetak />CETAK / PREVIEW</button>
          </aside>

          <section className="lbr-preview">
            <div className="lbr-pvh no-print">
              <h3>Pratinjau</h3>
              {valid && <span>{lembar.length > tampil.length ? `Menampilkan ${tampil.length} dari ${lembar.length} lembar · semua lembar ikut tercetak` : `${lembar.length} lembar`}</span>}
            </div>

            {valid ? (
              <div className="lb-stage lbr-stage" id="sectionCetakLabel">
                <div className="lbr-sheets">
                  {tampil.map((isi, i) => (
                    <div className="lb-sheet" key={i}>
                      <div className="lbr-slot"><LabelKartu a={isi[0].x} /></div>
                      <div className="lb-cut"><span>Batas potong · lembar {i + 1} dari {lembar.length}</span></div>
                      {isi[1]
                        ? <div className="lbr-slot"><LabelKartu a={isi[1].x} /></div>
                        : <div className="lbr-slot kosong" />}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="lbr-belum no-print"><b>🏷️</b>Isi rentang nomor yang benar untuk melihat pratinjau label.</div>
            )}
          </section>
        </div>
      )}
    </>
  );
}