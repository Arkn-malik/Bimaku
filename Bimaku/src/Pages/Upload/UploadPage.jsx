import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../Context/AppContext";
import { KANTOR } from "../../Data/Dummy";
import { toast } from "../../Utils/Helpers/ToastHelpers";
import { hitungRetensi } from "../../Utils/Referensi";
import { simpanBerkas, MAKS_BERKAS, MAKS_BERKAS_MB } from "../../Utils/Berkas";
import TanggalInput from "../../Components/TanggalInput";
import PratinjauBerkas from "./PratinjauBerkas";
import "../mockup.css";
import "./upload.css";

const MAKS = MAKS_BERKAS;
const DILARANG = /\.(exe|msi|bat|cmd|com|scr|js|vbs|ps1|sh|jar|html?|svg)$/i;
const TAHUN = new Date().getFullYear();
const DAFTAR_TAHUN = Array.from({ length: 6 }, (_, i) => String(TAHUN - i));
const ukuran = (n) => (n >= 1024 * 1024 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");

const Ic = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcTagihan = () => <Ic><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Ic>;
const IcKontrak = () => <Ic><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></Ic>;
const IcPengadaan = () => <Ic><path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></Ic>;
const IcUnggah = () => <Ic size={26}><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></Ic>;
const IcFile = () => <Ic size={26}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /></Ic>;

const JENIS = {
  Tagihan: { label: "Nomor Tagihan", akhiran: "T", awalan: "SPP", klasifikasi: "KU.02.03", judul: (n) => "Tagihan SPP " + n, ikon: <IcTagihan /> },
  Kontrak: { label: "Nomor Kontrak", akhiran: "", awalan: "Kontrak", klasifikasi: "KU.01.01", judul: (n) => "Kontrak " + n, ikon: <IcKontrak /> },
  Pengadaan: { label: "Nomor Dokumen", akhiran: "", awalan: "Pengadaan", klasifikasi: "PL.01.01", judul: (n) => "Pengadaan " + n, ikon: <IcPengadaan /> },
};
const JENIS_PENGADAAN = ["Proses Pengadaan", "Proses Pelaksanaan"];
const METODE_PENGADAAN = ["Pengadaan langsung", "E-purchasing", "Tender"];
const tipeArsip = (a) => (a.jenis === "Pengadaan" ? "pengadaan" : a.jenis === "Kontrak Kerja" || /K$/i.test(a.nomor) ? "kontrak" : "tagihan");
const lengkapiNol = (v) => v.trim().replace(/^(\d+)/, (d) => d.padStart(5, "0"));

const lengkapi = (isi, akhiran) => {
  const v = isi.trim();
  if (!v) return "";
  return v.toUpperCase().endsWith(akhiran) ? v : v + akhiran;
};
const rupiah = (n) => (n ? new Intl.NumberFormat("id-ID").format(n) : "");
const digit = (v) => Number(String(v).replace(/\D/g, "")) || 0;
// karakter yang tidak boleh ada di nama file diganti "-"
const bersih = (s) => String(s).trim().replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "");
const ekstensi = (nama) => { const m = /\.([A-Za-z0-9]{1,8})$/.exec(nama); return m ? "." + m[1].toLowerCase() : ""; };

const namaBerkas = (j, nomorLengkap, tahun, asli) => `${j.awalan}_${bersih(nomorLengkap)}_${tahun}${ekstensi(asli)}`;

export default function UploadPage() {
  const { user, arsip, simpan, referensi, tambahRefKontrak } = useApp();
  const nav = useNavigate();
  const input = useRef(null);
  const admin = user.role === "admin";
  const kantorAwal = KANTOR.includes(user.kantor) ? user.kantor : KANTOR[0];
  const [jenis, setJenis] = useState("Tagihan");
  const [tahun, setTahun] = useState(String(TAHUN));
  const [lokasi, setLokasi] = useState(kantorAwal); 
  const [nomor, setNomor] = useState("");
  const [tglKontrak, setTglKontrak] = useState("");
  const [penyedia, setPenyedia] = useState("");
  const [nilai, setNilai] = useState(0);
  const [uraian, setUraian] = useState("");
  const [jenisPeng, setJenisPeng] = useState(""); 
  const [metode, setMetode] = useState("");
  const [paket, setPaket] = useState("");
  const [file, setFile] = useState(null);
  const [seret, setSeret] = useState(false);
  const [sukses, setSukses] = useState(null);
  const j = JENIS[jenis];

  const kontrak = jenis === "Kontrak", pengadaan = jenis === "Pengadaan";
  const manual = kontrak || pengadaan;
  const nomorLengkap = manual ? nomor.trim() : lengkapi(lengkapiNol(nomor), j.akhiran);
  const tahunDok = manual ? tglKontrak.slice(0, 4) : tahun;
  const pratinjauNama = `${j.awalan}_${nomorLengkap ? bersih(nomorLengkap) : "…"}_${tahunDok || "…"}${file ? ekstensi(file.asli) : ""}`;
  const beda = !admin && lokasi !== user.kantor;

  const baca = (berkas) => {
    if (!berkas) return;
    if (DILARANG.test(berkas.name)) return toast("error", "Berkas yang bisa dijalankan (.exe, .bat, .js, dll.) tidak boleh diunggah");
    if (berkas.size > MAKS) return toast("error", `File maksimal ${MAKS_BERKAS_MB} MB`);
    setFile((lama) => { if (lama?.data) URL.revokeObjectURL(lama.data); return { asli: berkas.name, type: berkas.type || "application/octet-stream", size: berkas.size, data: URL.createObjectURL(berkas), raw: berkas }; });
  };

  const [menyimpan, setMenyimpan] = useState(false);
  const [persen, setPersen] = useState(0);
  const submit = async (e) => {
    e.preventDefault();
    if (menyimpan) return;
    if (!nomorLengkap) return toast("error", j.label + " wajib diisi");
    if (kontrak) {
      if (!tglKontrak) return toast("error", "Tanggal kontrak wajib diisi");
      if (!penyedia.trim()) return toast("error", "Nama penyedia wajib diisi");
      if (!nilai) return toast("error", "Nilai kontrak wajib diisi");
      if (!uraian.trim()) return toast("error", "Uraian wajib diisi");
    }
    if (pengadaan) {
      if (!tglKontrak) return toast("error", "Tanggal dokumen wajib diisi");
      if (!jenisPeng) return toast("error", "Pilih jenis dokumen pengadaan");
      if (!paket.trim()) return toast("error", "Nama paket pengadaan wajib diisi");
    }
    if (!file) return toast("error", "Pilih file yang akan diunggah");
    const tanggal = manual ? tglKontrak : tahun === String(TAHUN) ? new Date().toISOString().slice(0, 10) : tahun + "-01-01";
    const nama = namaBerkas(j, nomorLengkap, tahunDok, file.asli);
    const kantorTujuan = admin ? lokasi : user.kantor;
    const lama = arsip.find((a) => a.kantor === kantorTujuan && a.nomor === nomorLengkap && (a.tanggal || "").slice(0, 4) === tahunDok && tipeArsip(a) === jenis.toLowerCase())
      || null;
    let tersimpan;
    setMenyimpan(true); setPersen(0);
    try { tersimpan = await simpanBerkas(file.raw, { kantor: kantorTujuan, tahun: tahunDok || String(TAHUN), nama, onProgress: setPersen }); }
    catch (err) { setMenyimpan(false); return toast("error", err.message); }
    setMenyimpan(false);
    const res = simpan({
      jenis: pengadaan ? "Pengadaan" : kontrak ? "Kontrak Kerja" : "Arsip", kantor: admin ? lokasi : user.kantor, nomor: nomorLengkap, judul: pengadaan ? paket.trim() : j.judul(nomorLengkap),
      pihak: manual ? penyedia.trim() : "", nilai: manual ? nilai : 0, uraian: kontrak ? uraian.trim() : "", tanggal,
      ...(pengadaan ? { jenisPengadaan: jenisPeng, metode, paket: paket.trim(), termin: uraian.trim() } : {}), 
      status: "Selesai", statusArsip: "Aktif", catatan: "", lokasi, boks: "", klasifikasi: j.klasifikasi, mak: "", lokasiKode: "",
      retensi: hitungRetensi(referensi, j.klasifikasi, tanggal),
      file: tersimpan, diunggah: new Date().toISOString(),
    }, lama?.id, { tanpaNotif: manual }); 
    if (!res.ok) return toast("error", res.msg);
    if (manual) {
      const rr = tambahRefKontrak(pengadaan
        ? { noSpm: nomorLengkap, jenisSpm: "Pengadaan", tanggal, nilai, uraian: paket.trim(), termin: uraian.trim(), penyedia: penyedia.trim(), kantor: kantorTujuan, jenisPengadaan: jenisPeng, metode, paket: paket.trim() }
        : { noSpm: nomorLengkap, jenisSpm: "Kontrak", tanggal, nilai, uraian: uraian.trim(), penyedia: penyedia.trim(), kantor: kantorTujuan },
      pengadaan ? "Pengadaan" : "Kontrak");
      if (!rr.ok) return toast("error", rr.msg);
    }
    setSukses({ nomor: nomorLengkap, nama, data: tersimpan.data });
    if (file.data) URL.revokeObjectURL(file.data);
    setNomor(""); setFile(null); setTglKontrak(""); setPenyedia(""); setNilai(0); setUraian(""); setJenisPeng(""); setMetode(""); setPaket(""); 
    toast("success", lama ? "Dokumen lama diganti dengan yang terbaru" : pengadaan ? "Dokumen pengadaan disimpan ke arsip dan bisa dicari di Cari arsip" : kontrak ? "Kontrak disimpan ke arsip dan otomatis masuk daftar referensi" : "Berkas disimpan ke arsip. Bisa dicari setelah admin update referensi");
  };

  return (
    <>
      <div className="hm-head">
        <div>
          <h1>Upload dokumen</h1>
          <p className="hm-sub">Unggah file tagihan (SPP/SPM), kontrak, atau dokumen pengadaan ke arsip</p>
        </div>
      </div>

      <div className="up-layout">
      <form className="mk-card up-card" onSubmit={submit}>
        <div className="mk-head">
          <div><h3>Upload dokumen</h3><p>Berkas masuk ke daftar Arsip secara otomatis.</p></div>
          <span className="mk-badge">Penyimpanan lokal</span>
        </div>

        {sukses && (
          <div className="up-ok" role="status">
            <span className="up-ok-ic">✓</span>
            <div className="up-ok-t">
              <b>Berkas berhasil disimpan & diarsipkan</b>
              <small>{sukses.nama} · nomor {sukses.nomor}</small>
            </div>
            <a className="up-unduh" href={sukses.data} download={sukses.nama}>⬇ Unduh</a>
            <button type="button" className="up-x" aria-label="Tutup" onClick={() => setSukses(null)}>×</button>
          </div>
        )}

        <div className="up-jenis" role="group" aria-label="Jenis dokumen">
          {Object.entries(JENIS).map(([k, v]) => (
            <button key={k} type="button" className={jenis === k ? "on" : ""} aria-pressed={jenis === k} onClick={() => setJenis(k)}>{v.ikon}{k}</button>
          ))}
        </div>

        <div className="up-grid">
          {manual ? (
            <label className="up-f"><span>{pengadaan ? "Tanggal dokumen" : "Tanggal kontrak"}</span>
              <TanggalInput value={tglKontrak} onChange={setTglKontrak} required label={pengadaan ? "Tanggal dokumen" : "Tanggal kontrak"} /></label>
          ) : (
            <label className="up-f"><span>Tahun</span>
              <select value={tahun} onChange={(e) => setTahun(e.target.value)}>{DAFTAR_TAHUN.map((t) => <option key={t}>{t}</option>)}</select></label>
          )}

          <label className="up-f"><span>Lokasi</span>
            <select value={lokasi} onChange={(e) => setLokasi(e.target.value)}>{KANTOR.map((k) => <option key={k}>{k}</option>)}</select></label>

          {beda && <p className="up-note up-full">Dokumen tetap tercatat atas kantor Anda ({user.kantor}), dengan lokasi fisik {lokasi}.</p>}

          {pengadaan && (
            <>
              <label className="up-f"><span>Jenis dokumen pengadaan</span>
                <select value={jenisPeng} onChange={(e) => setJenisPeng(e.target.value)}><option value="">Pilih jenis dokumen</option>{JENIS_PENGADAAN.map((x) => <option key={x}>{x}</option>)}</select></label>
              <label className="up-f"><span>Metode pengadaan (opsional)</span>
                <select value={metode} onChange={(e) => setMetode(e.target.value)}><option value="">Pilih metode</option>{METODE_PENGADAAN.map((x) => <option key={x}>{x}</option>)}</select></label>
            </>
          )}

          <label className="up-f up-full"><span>{j.label}</span>
            {manual ? (
              <>
                <input className="up-nomor-manual" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder={pengadaan ? "Masukkan nomor dokumen" : "Masukkan nomor kontrak"} autoComplete="off" />
                <small className="up-hint">Isi manual sesuai nomor pada dokumen {pengadaan ? "pengadaan" : "kontrak"}.</small>
              </>
            ) : (
              <>
                <div className="up-nomor">
                  <input value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="Nomor Tagihan" inputMode="numeric" autoComplete="off"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setNomor(lengkapiNol(nomor)); } }} />
                  <b aria-hidden="true">{j.akhiran}</b>
                </div>
                <small className="up-hint">Ketik angka lalu tekan Enter, nomor otomatis dilengkapi nol. </small>
              </>
            )}
          </label>

          {pengadaan && (
            <label className="up-f up-full"><span>Nama paket pengadaan</span>
              <input value={paket} onChange={(e) => setPaket(e.target.value)} placeholder="Masukkan nama paket" autoComplete="off" /></label>
          )}

          {manual && (
            <>
              <label className={"up-f" + (pengadaan ? "" : " up-full")}><span>{pengadaan ? "Nama penyedia (opsional)" : "Nama penyedia"}</span>
                <input value={penyedia} onChange={(e) => setPenyedia(e.target.value)} placeholder="Masukkan nama penyedia" autoComplete="off" /></label>

              <label className={"up-f" + (pengadaan ? "" : " up-full")}><span>{pengadaan ? "Nilai HPS / pagu (opsional)" : "Nilai kontrak"}</span>
                <div className="up-rp">
                  <b aria-hidden="true">Rp</b>
                  <input value={rupiah(nilai)} onChange={(e) => setNilai(digit(e.target.value))} placeholder="Masukkan Nilai" inputMode="numeric" autoComplete="off" />
                </div></label>

              <label className="up-f up-full"><span>{pengadaan ? "Termin (opsional)" : "Uraian"}</span>
                <textarea className="up-uraian" rows={3} value={uraian} onChange={(e) => setUraian(e.target.value)} placeholder={pengadaan ? "Masukkan Termin" : "Masukkan uraian kontrak"} /></label>
            </>
          )}

          <div className="up-f up-full"><span>Upload file</span>
            <input ref={input} type="file" hidden onChange={(e) => { baca(e.target.files[0]); e.target.value = ""; }} />
            <div className={"up-drop" + (file ? " ada" : "") + (seret ? " seret" : "")} role="button" tabIndex={0}
              onClick={() => input.current.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setSeret(true); }}
              onDragLeave={() => setSeret(false)}
              onDrop={(e) => { e.preventDefault(); setSeret(false); baca(e.dataTransfer.files[0]); }}>
              <span className="up-drop-ic">{file ? <IcFile /> : <IcUnggah />}</span>
              {file ? (
                <span className="up-drop-t"><b title={file.asli}>{file.asli}</b><small>{ukuran(file.size)} · klik untuk mengganti file</small></span>
              ) : (
                <span className="up-drop-t"><b>Klik untuk memilih file atau seret ke sini</b><small>Semua jenis file, maks. {MAKS_BERKAS_MB} MB (berkas .exe, .bat, .js, dll. tidak diterima). Pratinjau tampil di sebelah kanan.</small></span>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="up-simpan" disabled={menyimpan}>{menyimpan ? `MENGUNGGAH… ${persen}%` : "SIMPAN / UPLOAD"}</button>
        {menyimpan && <div className="up-prog" role="progressbar" aria-valuenow={persen} aria-valuemin={0} aria-valuemax={100}><i style={{ width: persen + "%" }} /></div>}
        <div className="up-kembali"><button type="button" onClick={() => nav("/arsip")}>Kembali ke Arsip</button></div>
      </form>

      <aside className="mk-card up-pv" aria-label="Pratinjau berkas">
        <PratinjauBerkas file={file} nama={pratinjauNama} />
      </aside>
      </div>
    </>
  );
}