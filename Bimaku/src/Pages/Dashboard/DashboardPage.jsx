import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../Context/AppContext";
import { KANTOR } from "../../Data/Dummy";
import CountUp from "../../Components/CountUp";
import "./dashboard-home.css";


const Ic = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcFolder = () => <Ic><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></Ic>;
const IcUnggah = () => <Ic><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></Ic>;
const IcTag = () => <Ic><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></Ic>;
const IcKeranjang = () => <Ic><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></Ic>;
const IcPasir = () => <Ic><path d="M7 3h10M7 21h10M8 3v4a4 4 0 001.6 3.2L12 12l2.4 1.8A4 4 0 0116 17v4M16 3v4a4 4 0 01-1.6 3.2L12 12l-2.4 1.8A4 4 0 008 17v4" /></Ic>;


const IcCetak = () => <Ic><path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><path d="M6 14h12v7H6z" /></Ic>;
const IcCari = () => <Ic><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Ic>;
const IcDb = () => <Ic><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></Ic>;
const AKSES = [
  { to: "/upload", t: "Upload Baru", s: "Tagihan / Kontrak / Pengadaan", ic: <IcUnggah />, w: "#0f6b5b" },
  { to: "/label", t: "Cetak Label", s: "Format HVS A4", ic: <IcCetak />, w: "#eba800", admin: true },
  { to: "/arsip", t: "Cari Arsip", s: "Cari No. SPM/Uraian", ic: <IcCari />, w: "#0f9488" },
  { to: "/referensi", t: "Update Ref", s: "Kelola Tagihan", ic: <IcDb />, w: "#374151", admin: true },
];

export default function DashboardPage() {
  const DELAY = 150;
  const pindah = useNavigate();
  const klik = (e, to) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    const el = e.currentTarget, r = el.getBoundingClientRect();
    const rip = document.createElement("span");
    rip.className = "d-rip";
    rip.style.left = (e.clientX ? e.clientX - r.left : r.width / 2) + "px";
    rip.style.top = (e.clientY ? e.clientY - r.top : r.height / 2) + "px";
    el.appendChild(rip);
    el.classList.add("pressed");
    setTimeout(() => pindah(to), 260);
  };
  const { arsip, user } = useApp();
  const admin = user.role === "admin";
  const [kantor, setKantor] = useState("");

  const data = arsip.filter((a) => !kantor || a.kantor === kantor);

  const jenisDok = (a) => (a.jenis === "Pengadaan" ? "pengadaan" : a.jenis === "Kontrak Kerja" || /K$/i.test(a.nomor) ? "kontrak" : a.jenis === "Penagihan" || /T$/i.test(a.nomor) ? "tagihan" : "lain");
  const terunggah = data.filter((a) => a.file);
  const dokTagihan = terunggah.filter((a) => jenisDok(a) === "tagihan");
  const dokKontrak = terunggah.filter((a) => jenisDok(a) === "kontrak");
  const dokPengadaan = terunggah.filter((a) => jenisDok(a) === "pengadaan");
  // waktu unggah: field "diunggah" (dokumen baru); dokumen lama memakai cap waktu pada id-nya
  const tglLokal = (w) => { const x = new Date(w); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const waktuUnggah = (a) => a.diunggah || (/^A\d{10,}$/.test(String(a.id)) ? Number(String(a.id).slice(1)) : null);
  const hariIni = tglLokal(new Date());
  const masukHariIni = (arr) => arr.filter((a) => { const w = waktuUnggah(a); return w && tglLokal(w) === hariIni; }).length;
  const bulanIni = hariIni.slice(0, 7);
  const bulanTotal = terunggah.filter((a) => { const w = waktuUnggah(a); return w && tglLokal(w).slice(0, 7) === bulanIni; }).length;
  const hariTagihan = masukHariIni(dokTagihan), hariKontrak = masukHariIni(dokKontrak), hariPengadaan = masukHariIni(dokPengadaan);

  const pct = (n, total) => (total ? Math.min(100, Math.round((n / total) * 100)) : 0);
  const stats = [
    { kelas: "c-a", to: "/arsip", l: "Total dokumen masuk / terunggah", v: terunggah.length, bar: pct(bulanTotal, terunggah.length), ic: <IcUnggah />, info: `${bulanTotal} diunggah bulan ini` },
    { kelas: "c-b", to: admin ? "/referensi" : "/arsip", l: "Tagihan Masuk  / referensi", v: dokTagihan.length, bar: pct(hariTagihan, dokTagihan.length), ic: <IcTag />, info: `${hariTagihan} tagihan diunggah hari ini` },
    { kelas: "c-c", to: "/upload", l: "Kontrak masuk", v: dokKontrak.length, bar: pct(hariKontrak, dokKontrak.length), ic: <IcPasir />, info: `${hariKontrak} kontrak diunggah hari ini` },
    { kelas: "c-r", to: "/upload", l: "Pengadaan masuk", v: dokPengadaan.length, bar: pct(hariPengadaan, dokPengadaan.length), ic: <IcKeranjang />, info: `${hariPengadaan} pengadaan diunggah hari ini` },
  ];

  const tahunIni = new Date().getFullYear(), bulanKe = new Date().getMonth();
  const NAMA_BLN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const perBulan = NAMA_BLN.slice(0, bulanKe + 1).map((n, i) => {
    const ym = `${tahunIni}-${String(i + 1).padStart(2, "0")}`;
    const di = (arr) => arr.filter((a) => (a.tanggal || "").slice(0, 7) === ym).length;
    return { n, t: di(dokTagihan), k: di(dokKontrak), p: di(dokPengadaan) };
  });
  const maksBar = Math.max(4, ...perBulan.map((m) => Math.max(m.t, m.k, m.p)));
  const langkah = Math.ceil(maksBar / 4), yMaks = langkah * 4;

  const hari = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const namaDepan = user.nama.split(" ")[0];

  return (
    <>
      <section className="db-hero">
        <div className="db-hero-t">
          <p className="db-date">{hari}</p>
          <h1>Halo, {namaDepan}</h1>
          <p className="db-scope">{kantor ? "Kantor " + kantor : admin ? "Ringkasan seluruh kantor" : "Ringkasan kantor " + user.kantor}</p>
          {admin ? (
            <div className="db-pills" role="group" aria-label="Pilih kantor">
              {["", ...KANTOR].map((k) => (
                <button key={k || "semua"} type="button" className={kantor === k ? "on" : ""} onClick={() => setKantor(k)}>{k || "Semua kantor"}</button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="d-stats">
        {stats.map((s) => (
          <Link className={"d-stat " + s.kelas} key={s.l} to={s.to} onClick={(e) => klik(e, s.to)}>
            <div className="d-stat-top">
              <div className="d-ico">{s.ic}</div>
              <div className="d-txt"><span className="d-l">{s.l}</span><span className="d-v"><CountUp value={s.v} delay={DELAY} /></span></div>
            </div>
            <div className="d-meter"><i style={{ width: s.bar + "%" }} /></div>
            <small className="d-info">{s.info}</small>
          </Link>
        ))}
      </div>

      <section className="hm-card dq-cepat">
        <p className="dq-lbl">Akses cepat fitur</p>
        <div className="dq-tiles" style={{ "--n": AKSES.filter((x) => !x.admin || admin).length }}>
          {AKSES.filter((x) => !x.admin || admin).map((x) => (
            <Link key={x.to} to={x.to} className="dq-tile" onClick={(e) => klik(e, x.to)}>
              <span className="dq-ti" style={{ background: x.w }}>{x.ic}</span>
              <span className="dq-tt"><b>{x.t}</b><small>{x.s}</small></span>
            </Link>
          ))}
        </div>
      </section>

      <div className="dq-grid">
        <section className="hm-card">
          <div className="dq-h">
            <div><h3>Aktivitas Pengunggahan Arsip TA {tahunIni}</h3><p>Jumlah dokumen tagihan, kontrak &amp; pengadaan terunggah per bulan</p></div>
            <span className="dq-chip">Jan - {NAMA_BLN[bulanKe]} {tahunIni}</span>
          </div>
          <svg className="dq-chart" viewBox="0 0 760 270" role="img" aria-label="Grafik batang pengunggahan per bulan">
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 20 + (200 - i * 50);
              return <g key={i}><line x1="40" x2="750" y1={y} y2={y} stroke="#e2e8f0" /><text x="30" y={y + 4} textAnchor="end" fontSize="11" fill="#64748b">{i * langkah}</text></g>;
            })}
            {perBulan.map((m, i) => {
              const w = 710 / perBulan.length, x0 = 40 + i * w, bw = Math.min(26, w * 0.24), g = 2;
              const h = (v) => (v / yMaks) * 200;
              return (
                <g key={m.n}>
                  {m.t > 0 && <rect x={x0 + w / 2 - bw * 1.5 - g} y={220 - h(m.t)} width={bw} height={h(m.t)} rx="2" fill="#0f6b5b"><title>{m.n}: {m.t} tagihan</title></rect>}
                  {m.k > 0 && <rect x={x0 + w / 2 - bw / 2} y={220 - h(m.k)} width={bw} height={h(m.k)} rx="2" fill="#eba800"><title>{m.n}: {m.k} kontrak</title></rect>}
                  {m.p > 0 && <rect x={x0 + w / 2 + bw / 2 + g} y={220 - h(m.p)} width={bw} height={h(m.p)} rx="2" fill="#2563eb"><title>{m.n}: {m.p} pengadaan</title></rect>}
                  <text x={x0 + w / 2} y="240" textAnchor="middle" fontSize="11" fill="#64748b">{m.n}</text>
                </g>
              );
            })}
            <line x1="40" x2="750" y1="220" y2="220" stroke="#94a3b8" />
          </svg>
          <div className="dq-leg"><span><i style={{ background: "#0f6b5b" }} />Tagihan (SPP/SPM)</span><span><i style={{ background: "#eba800" }} />Kontrak</span><span><i style={{ background: "#2563eb" }} />Pengadaan</span></div>
        </section>

        <section className="hm-card">
          <div className="dq-h"><div><h3>Komposisi Dokumen</h3><p>Rincian kategori arsip terunggah</p></div></div>
          <svg className="dq-donat" viewBox="0 0 200 200" role="img" aria-label="Komposisi tagihan, kontrak, dan pengadaan">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#e2e8f0" strokeWidth="22" />
            {dokTagihan.length + dokKontrak.length + dokPengadaan.length > 0 && (() => {
              const tot = dokTagihan.length + dokKontrak.length + dokPengadaan.length, K = 2 * Math.PI * 80;
              let geser = 0;
              return <g transform="rotate(-90 100 100)">
                {[[dokTagihan.length, "#0f6b5b"], [dokKontrak.length, "#eba800"], [dokPengadaan.length, "#2563eb"]].map(([n, warna]) => {
                  const l = (n / tot) * K, el = l > 0 ? <circle key={warna} cx="100" cy="100" r="80" fill="none" stroke={warna} strokeWidth="22" strokeDasharray={`${l} ${K}`} strokeDashoffset={-geser} /> : null;
                  geser += l;
                  return el;
                })}
              </g>;
            })()}
          </svg>
          <div className="dq-kom">
            <div><small>TAGIHAN (SPP/SPM)</small><b style={{ color: "#0f6b5b" }}>{dokTagihan.length} Berkas</b></div>
            <div><small>KONTRAK DIGITAL</small><b style={{ color: "#eba800" }}>{dokKontrak.length} Berkas</b></div>
            <div><small>PENGADAAN</small><b style={{ color: "#2563eb" }}>{dokPengadaan.length} Berkas</b></div>
          </div>
        </section>
      </div>
    </>
  );
}