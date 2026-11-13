import { useRef, useState } from "react";
import { KANTOR } from "../../Data/Dummy";
import { konfirmasi } from "../../Utils/Helpers/SwalHelpers";
import { toast } from "../../Utils/Helpers/ToastHelpers";
import { rpLengkap, cariBerkas } from "../../Utils/DaftarTagihan";
import { useApp } from "../../Context/AppContext";
import TanggalInput from "../../Components/TanggalInput";
import { tglUI } from "../../Utils/Tanggal";
import { buatLaporan, simpanBlob } from "../../Utils/EksporTagihan";
import { simpanBerkas, MAKS_BERKAS, MAKS_BERKAS_MB } from "../../Utils/Berkas";
import "../Upload/upload.css";
import { parseTempel, gabung, timpaPeriode, labelBulan, kunciRow, kantorDariUraian, urutDaftar, dokKhusus } from "../../Utils/DaftarTagihan";

const MAKS_TOTAL = 3 * 1024 * 1024; 
const inline = (x) => (String(x.lampiran?.data || "").startsWith("data:") ? x.lampiran.size || 0 : 0); 
const bersihNama = (s) => String(s).trim().replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "");
const FORMAT = /\.(docx?|pdf|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)$/i;
const ukuran = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");
// input rupiah: saat diketik "Rp 10.000", setelah selesai "Rp 10.000,00"; yang disimpan angka murni
function NilaiInput({ value, onChange, ...sisa }) {
  const [fokus, setFokus] = useState(false);
  const n = Number(String(value).replace(/\D/g, "")) || 0;
  const tampil = !n && !fokus ? "" : fokus ? (n ? "Rp " + new Intl.NumberFormat("id-ID").format(n) : "") : rpLengkap(n);
  return <input inputMode="numeric" value={tampil} onFocus={() => setFokus(true)} onBlur={() => setFokus(false)} onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)} {...sisa} />;
}
const KOSONG = { noSpm: "", jenisSpm: "", tanggal: "", nilai: 0, uraian: "", kantor: "" };

export default function TabTagihan({ admin, kantorBatas = "", referensi, simpanRef }) {
  const { arsip } = useApp();
  const dokDari = (r) => r.lampiran || cariBerkas(r, arsip)?.file || null;
  const bolehLihat = (r) => !kantorBatas || !r.kantor || r.kantor === kantorBatas;
  const semua = urutDaftar((referensi.daftar || []).filter((r) => !dokKhusus(r) && bolehLihat(r)));
  const urutTanggal = (d) => [...d].sort((a, b) => (a.tanggal || "").localeCompare(b.tanggal || "") || String(a.noSpm).localeCompare(String(b.noSpm), undefined, { numeric: true }));
  const semuaKontrak = urutTanggal((referensi.daftar || []).filter((r) => r.jenisDok === "Kontrak" && bolehLihat(r)));
  const semuaPengadaan = urutTanggal((referensi.daftar || []).filter((r) => r.jenisDok === "Pengadaan" && bolehLihat(r)));
  const [q, setQ] = useState("");
  const [f, setF] = useState(KOSONG);
  const [tempel, setTempel] = useState("");
  const [pesan, setPesan] = useState(null);
  const [mode, setMode] = useState("excel"); 
  const berkasRef = useRef(null);
  const [lamp, setLamp] = useState(null); 
  const [seret, setSeret] = useState(false);

  const daftar = semua.map((r, i) => ({ r, no: i + 1 })).filter(({ r }) => (r.noSpm + r.jenisSpm + r.uraian + r.tanggal + tglUI(r.tanggal) + r.kantor).toLowerCase().includes(q.trim().toLowerCase()));
  const BATAS = 10;
  const tampil = q.trim() ? daftar : daftar.slice(0, BATAS);
  const ubah = (r, patch) => simpanRef({ ...referensi, daftar: (referensi.daftar || []).map((x) => (kunciRow(x) === kunciRow(r) ? { ...x, ...patch } : x)) });

  const tambah = async (e) => {
    e.preventDefault();
    const nilai = Number(f.nilai) || 0;
    if (!f.noSpm.trim() || !f.tanggal || !f.uraian.trim()) return setPesan({ t: "No. SPM, tanggal, dan uraian wajib diisi." });
    const baru = { ...f, noSpm: f.noSpm.trim(), uraian: f.uraian.trim(), nilai, kantor: f.kantor || kantorDariUraian(f.uraian) };
    delete baru.lampiran;
    const lama = (referensi.daftar || []).find((x) => kunciRow(x) === kunciRow(baru));
    let berkas = lama?.lampiran;
    if (lamp) {
      try {
        const s = await simpanBerkas(lamp.raw, { kantor: baru.kantor || "Umum", tahun: baru.tanggal.slice(0, 4), nama: bersihNama(baru.noSpm) + "_" + bersihNama(lamp.name) });
        berkas = { ...s, waktu: new Date().toISOString() };
      } catch (err) { return setPesan({ t: err.message }); }
    }
    if (berkas) baru.lampiran = berkas;
    const lain = (referensi.daftar || []).filter((x) => x !== lama).reduce((n, x) => n + inline(x), 0);
    if (berkas && String(berkas.data).startsWith("data:") && lain + berkas.size > MAKS_TOTAL) return setPesan({ t: "Total dokumen lampiran melebihi 3 MB. Hapus lampiran lama dulu." });
    const { daftar: d, tambah: t } = gabung(referensi.daftar || [], [baru]);
    if (simpanRef({ ...referensi, daftar: d })) {
      setPesan(null);
      toast("success", t ? `SPM ${baru.noSpm} ditambahkan${lamp ? " beserta dokumennya" : ""}` : `SPM ${baru.noSpm} diperbarui${lamp ? " beserta dokumennya" : ""}`);
      setF(KOSONG); setLamp(null);
    }
  };

  const impor = async () => {
    const { ok, gagal } = parseTempel(tempel);
    if (!ok.length) return setPesan({ t: "Tidak ada baris yang terbaca. Pastikan kolom: No. SPM, Jenis SPM, Tanggal SPM, Nilai Tagihan, Uraian." });
    const r = timpaPeriode(referensi.daftar || [], ok);
    const rentang = r.dari === r.sampai ? labelBulan(r.dari) : `${labelBulan(r.dari)} – ${labelBulan(r.sampai)}`;
    if (r.hapus && !(await konfirmasi(`Timpa data ${rentang}?`, `${r.hapus} baris lama pada periode itu akan dihapus dan diganti ${r.tambah} baris baru. Riwayat lama tidak disimpan.`, "warning"))) return;
    if (simpanRef({ ...referensi, daftar: r.daftar })) {
      setPesan(gagal.length ? { t: `${gagal.length} baris dilewati karena tidak terbaca (baris ${gagal.slice(0, 5).join(", ")}${gagal.length > 5 ? "…" : ""}).` } : null);
      toast("success", `Periode ${rentang}: ${r.hapus} baris lama diganti ${r.tambah} baris baru`);
      setTempel("");
    }
  };
  const berkas = (e) => {
    const b = e.target.files?.[0]; e.target.value = "";
    if (!b) return;
    if (!/\.(csv|tsv|txt)$/i.test(b.name)) return toast("error", "Pakai berkas .csv / .tsv, atau tempel langsung dari Excel");
    const r = new FileReader(); r.onload = () => setTempel(String(r.result)); r.readAsText(b);
  };

  const bacaLampiran = (b) => {
    if (!b) return;
    if (!FORMAT.test(b.name)) return toast("error", "Format belum didukung. Gunakan Word (.doc/.docx), PDF, Excel (.xls/.xlsx), PowerPoint, .odt/.ods, .rtf, .txt, atau .csv");
    if (b.size > MAKS_BERKAS) return toast("error", `File maksimal ${MAKS_BERKAS_MB} MB`);
    setLamp({ name: b.name, type: b.type || "application/octet-stream", size: b.size, raw: b }); 
  };

  const dokRef = useRef(null);
  const targetDok = useRef(null); 
  const pilihDok = (r) => { targetDok.current = r; dokRef.current.click(); };
  const unggahDok = async (b) => {
    const r = targetDok.current;
    if (!b || !r) return;
    if (!FORMAT.test(b.name)) return toast("error", "Format belum didukung. Gunakan Word (.doc/.docx), PDF, Excel (.xls/.xlsx), PowerPoint, .odt/.ods, .rtf, .txt, atau .csv");
    if (b.size > MAKS_BERKAS) return toast("error", `File maksimal ${MAKS_BERKAS_MB} MB`);
    let s;
    try { s = await simpanBerkas(b, { kantor: r.kantor || "Umum", tahun: String(r.tanggal || "").slice(0, 4) || String(new Date().getFullYear()), nama: bersihNama(r.noSpm) + "_" + bersihNama(b.name) }); }
    catch (err) { return toast("error", err.message); }
    const lain = (referensi.daftar || []).filter((x) => kunciRow(x) !== kunciRow(r)).reduce((n, x) => n + inline(x), 0);
    if (String(s.data).startsWith("data:") && lain + s.size > MAKS_TOTAL) return toast("error", "Total dokumen lampiran melebihi 3 MB. Hapus lampiran lama dulu.");
    const lampiran = { ...s, waktu: new Date().toISOString() };
    if (simpanRef({ ...referensi, daftar: (referensi.daftar || []).map((x) => (kunciRow(x) === kunciRow(r) ? { ...x, lampiran } : x)) })) {
      toast("success", `Dokumen SPM ${r.noSpm} ${r.lampiran ? "diganti" : "diunggah"}`);
    }
  };
  const hapusDok = async (r) => {
    if (!(await konfirmasi("Hapus dokumen SPM " + r.noSpm + "?", r.lampiran.name + " tidak lagi bisa diunduh dari Cari arsip. Data tagihan tetap ada.", "warning"))) return;
    simpanRef({ ...referensi, daftar: (referensi.daftar || []).map((x) => { if (kunciRow(x) !== kunciRow(r)) return x; const { lampiran: _l, ...sisa } = x; return sisa; }) });
    toast("success", "Dokumen dihapus");
  };

  const hapus = async (r) => {
    if (!(await konfirmasi("Hapus SPM " + r.noSpm + "?", "Baris ini tidak lagi muncul di pencarian arsip dan cetak label.", "warning"))) return;
    simpanRef({ ...referensi, daftar: (referensi.daftar || []).filter((x) => kunciRow(x) !== kunciRow(r)) });
  };

  const [mencetak, setMencetak] = useState(""); 
  const cetakLaporan = async (jenis) => {
    const d = jenis === "kontrak" ? semuaKontrak : jenis === "pengadaan" ? semuaPengadaan : semua;
    if (!d.length || mencetak) return;
    const satuan = jenis === "pengadaan" ? "dokumen pengadaan" : jenis;
    setMencetak(jenis);
    try {
      const hasil = await buatLaporan(d, { jenis, dokumenDari: dokDari });
      simpanBlob(hasil.blob, hasil.nama);
      toast("success", hasil.dokumen
        ? `Laporan ${hasil.jumlah} ${satuan} + ${hasil.dokumen} dokumen diunduh (ZIP). Ekstrak dulu agar tautan dokumen bisa dibuka`
        : `Laporan ${hasil.jumlah} ${satuan} diunduh`);
    } catch { toast("error", "Laporan gagal dibuat"); }
    setMencetak("");
  };

  const hapusSemua = async () => {
    if (!(await konfirmasi("Kosongkan seluruh daftar tagihan?", `${semua.length} baris akan dihapus.`, "warning"))) return;
    simpanRef({ ...referensi, daftar: (referensi.daftar || []).filter(dokKhusus) }); 
  };

  const IcExcel = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12l4 5M13 12l-4 5" /></svg>;
  const IcSatu = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;

  return (
    <>
      {admin && (
        <section className="mk-card up-card">
          <div className="mk-head">
            <div><h3>Input referensi daftar tagihan</h3><p>Pilih cara input. Dokumen yang diunggah sekaligus atau satu-satu.</p></div>
            <span className="mk-badge">Admin</span>
          </div>

          <div className="up-jenis" role="group" aria-label="Cara input">
            <button type="button" className={mode === "excel" ? "on" : ""} aria-pressed={mode === "excel"} onClick={() => setMode("excel")}>{IcExcel}Tempel dari Excel</button>
            <button type="button" className={mode === "satu" ? "on" : ""} aria-pressed={mode === "satu"} onClick={() => setMode("satu")}>{IcSatu}Tambah satu tagihan</button>
          </div>

          {mode === "excel" ? (
            <div className="up-grid">
              <div className="up-f up-full"><span>Data dari Excel</span>
                <textarea className="up-ta" rows={7} value={tempel} onChange={(e) => setTempel(e.target.value)} placeholder={"Silahkan upload file atau salin kolom dari excel"} aria-label="Data tempel" />
                <small className="up-hint">Dokumen tagihan (PDF, Word, dll.) tidak ikut terbaca dari Excel. Unggah per tagihan lewat kolom Dokumen di tabel Daftar referensi tagihan di bawah.</small>
                <small className="up-hint">semua data lama pada bulan yang tercakup data tempelan (bulan terawal sampai terakhir) dihapus dan diganti data baru.</small>
              </div>
              <div className="up-full" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" className="up-simpan" disabled={!tempel.trim()} onClick={impor}>MASUKKAN &amp; TIMPA PERIODE</button>
                <label className="mk-btn" style={{ cursor: "pointer" }}>Pilih berkas .csv<input type="file" accept=".csv,.tsv,.txt" hidden onChange={berkas} /></label>
              </div>
            </div>
          ) : (
            <form onSubmit={tambah}>
              <div className="up-grid">
                <label className="up-f"><span>No. SPM</span><input value={f.noSpm} onChange={(e) => setF({ ...f, noSpm: e.target.value })} placeholder="Masukkan No.SPM" autoComplete="off" /></label>
                <label className="up-f"><span>Jenis SPM</span><input value={f.jenisSpm} onChange={(e) => setF({ ...f, jenisSpm: e.target.value })} placeholder="Masukkan jenis SPM" /></label>
                <label className="up-f"><span>Tanggal SPM</span><TanggalInput value={f.tanggal} onChange={(v) => setF({ ...f, tanggal: v })} label="Tanggal SPM" /></label>
                <label className="up-f"><span>Nilai Tagihan</span><NilaiInput value={f.nilai} onChange={(v) => setF({ ...f, nilai: v })} placeholder="Masukkan nilai Tagihan" /></label>
                <label className="up-f up-full"><span>Uraian Tagihan</span><textarea className="up-ta" rows={3} value={f.uraian} onChange={(e) => setF({ ...f, uraian: e.target.value })} placeholder="Masukkan uraian Tagihan" /></label>
                <label className="up-f up-full"><span>Lokasi kantor</span>
                  <select value={f.kantor} onChange={(e) => setF({ ...f, kantor: e.target.value })}><option value="">Silahkan pilih lokasi...</option>{KANTOR.map((k) => <option key={k}>{k}</option>)}</select></label>
                <div className="up-f up-full"><span>Unggah dokumen (opsional)</span>
                  <input ref={berkasRef} type="file" hidden accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv" onChange={(e) => { bacaLampiran(e.target.files[0]); e.target.value = ""; }} />
                  <div className={"up-drop up-drop-s" + (lamp ? " ada" : "") + (seret ? " seret" : "")} role="button" tabIndex={0}
                    onClick={() => berkasRef.current.click()}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); berkasRef.current.click(); } }}
                    onDragOver={(e) => { e.preventDefault(); setSeret(true); }} onDragLeave={() => setSeret(false)}
                    onDrop={(e) => { e.preventDefault(); setSeret(false); bacaLampiran(e.dataTransfer.files[0]); }}>
                    <span className="up-drop-t">{lamp
                      ? <><b title={lamp.name}>{lamp.name}</b><small>{ukuran(lamp.size)} · klik untuk mengganti file</small></>
                      : <><b>Klik untuk memilih file atau seret ke sini</b><small>Word (.doc/.docx), PDF, Excel (.xls/.xlsx), PowerPoint, .odt/.ods, .rtf, .txt, .csv · maks. {MAKS_BERKAS_MB} MB</small></>}</span>
                  </div>
                  {lamp && <button type="button" className="mk-link" onClick={() => setLamp(null)}>Hapus pilihan file</button>}
                  <small className="up-hint">Dokumen ini melekat pada tagihan dan bisa diunduh dari Cari arsip. Tagihan dengan No. SPM dan tahun yang sama otomatis menggantikan data (dan dokumen) lama.</small>
                </div>
              </div>
              <div style={{ marginTop: 18 }}><button type="submit" className="up-simpan">SIMPAN TAGIHAN</button></div>
            </form>
          )}
          {pesan && <p className={"rf-msg" + (pesan.ok ? " ok" : "")} role="status">{pesan.t}</p>}
        </section>
      )}

      <section className="mk-card">
        <div className="mk-head">
          <div><h3>Daftar referensi tagihan</h3><p>Sumber data menu Cari arsip{admin && <> dan Cetak label</>}.</p></div>
          <span className="mk-badge">{semua.length} tagihan</span>
        </div>

        <label className="mk-f"><span>Cari di daftar</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="No. SPM, jenis, tanggal, atau kata di uraian..." /></label>
        <div className="rf-tw"><table className="rf-t">
          <thead><tr><th>No</th><th>No. SPM</th><th>Jenis SPM</th><th>Tanggal SPM</th><th>Nilai Tagihan</th><th>Uraian Tagihan</th><th>Kantor</th><th>Dokumen</th>{admin && <th />}</tr></thead>
          <tbody>
            {tampil.map(({ r, no }) => (
              <tr key={kunciRow(r)}>
                <td>{no}</td>
                <td><span className="rf-code">{r.noSpm}</span></td>
                <td>{admin ? <input className="rf-i" aria-label={"Jenis SPM " + r.noSpm} value={r.jenisSpm} onChange={(e) => ubah(r, { jenisSpm: e.target.value })} /> : r.jenisSpm}</td>
                <td style={{ whiteSpace: "nowrap" }}>{tglUI(r.tanggal)}</td>
                <td style={{ whiteSpace: "nowrap" }}>{admin ? <NilaiInput className="rf-i" aria-label={"Nilai " + r.noSpm} value={r.nilai} onChange={(v) => ubah(r, { nilai: v })} /> : rpLengkap(r.nilai)}</td>
                <td style={{ minWidth: 320 }}>{admin ? <textarea className="rf-i" rows={3} aria-label={"Uraian " + r.noSpm} value={r.uraian} onChange={(e) => ubah(r, { uraian: e.target.value })} /> : r.uraian}</td>
                <td>{admin ? <select className="rf-s" aria-label={"Kantor " + r.noSpm} value={r.kantor || ""} onChange={(e) => ubah(r, { kantor: e.target.value })}><option value="">—</option>{KANTOR.map((k) => <option key={k}>{k}</option>)}</select> : r.kantor || "—"}</td>
                <td className="rf-dok">
                  {dokDari(r) && <a className="rf-dl" href={dokDari(r).data} download={dokDari(r).name} title={"Unduh " + dokDari(r).name}>📎 <span>{dokDari(r).name}</span></a>}
                  {admin && r.jenisDok !== "Kontrak" && (
                    <span className="rf-dok-a">
                      <button type="button" className="mk-btn" onClick={() => pilihDok(r)}>{r.lampiran ? "Ganti" : "⬆ Unggah"}</button>
                      {r.lampiran && <button type="button" className="mk-btn del" title={"Hapus dokumen " + r.lampiran.name} onClick={() => hapusDok(r)}>Hapus dokumen</button>}
                    </span>
                  )}
                  {!dokDari(r) && (!admin || r.jenisDok === "Kontrak") && <span className="rf-note">—</span>}
                </td>
                {admin && <td><button type="button" className="mk-btn del" onClick={() => hapus(r)}>Hapus</button></td>}
              </tr>
            ))}
            {!daftar.length && <tr><td colSpan={admin ? 9 : 8} className="rf-note">{semua.length ? "Tidak ada yang cocok." : "Daftar masih kosong. Tempel data dari Excel di atas."}</td></tr>}
          </tbody>
        </table></div>
        {!q.trim() && semua.length > BATAS && <p className="rf-note">Menampilkan {BATAS} dari {semua.length} tagihan. Ketik di kolom pencarian untuk melihat yang lain.</p>}
        {q.trim() && <p className="rf-note">{daftar.length} tagihan cocok dengan pencarian.</p>}
        {admin && <input ref={dokRef} type="file" hidden accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.csv" onChange={(e) => { unggahDok(e.target.files[0]); e.target.value = ""; }} />}
        {!!(semua.length || semuaKontrak.length || semuaPengadaan.length) && (
          <div className="rf-act" style={{ flexWrap: "wrap" }}>
            {admin && !!semua.length && <button type="button" className="mk-btn del" onClick={hapusSemua}>Kosongkan daftar</button>}
            {[["tagihan", "Tagihan", semua], ["kontrak", "Kontrak", semuaKontrak], ["pengadaan", "Pengadaan", semuaPengadaan]].map(([jenis, nama, d]) => (
              <button key={jenis} type="button" className="mk-btn pri" onClick={() => cetakLaporan(jenis)} disabled={!!mencetak || !d.length}
                title={d.length ? `${d.length} ${nama.toLowerCase()} akan dicetak` : `Belum ada data ${nama.toLowerCase()}`}>
                {mencetak === jenis ? "Membuat laporan…" : "Cetak Laporan " + nama}
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}