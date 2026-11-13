import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../Context/AppContext";
import { Logo, Wordmark } from "../Components/Logo";
import { useTampilan } from "../Utils/Tampilan";
import SidebarInfo from "./SidebarInfo";
import Lonceng from "../Components/Lonceng";
import "./dashboard.css";
import "./sidebar.css";
import "./motion.css";

const Ic = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcDash = () => <Ic><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Ic>;
const IcArsip = () => <Ic><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /><path d="M3 11h18" /></Ic>;
const IcUpload = () => <Ic><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 8l-4-4-4 4M12 4v12" /></Ic>;
const IcReferensi = () => <Ic><path d="M4 4v5h.6m15.4 2A8 8 0 004.6 9m0 0H9m11 11v-5h-.6m0 0a8 8 0 01-15.4-2m15.4 2H15" /></Ic>;
const IcLabel = () => <Ic><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2" /><rect x="7" y="14" width="10" height="7" rx="1" /><path d="M17 9V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4" /></Ic>;
const IcUser = () => <Ic><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0" /><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.2A6.5 6.5 0 0121.5 20" /></Ic>;
const IcProfil = () => <Ic><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></Ic>;
const IcKeluar = () => <Ic size={18}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></Ic>;

const UTAMA = [
  { to: "/", icon: <IcDash />, t: "Dashboard", end: true },
  { to: "/arsip", icon: <IcArsip />, t: "Arsip" },
  { to: "/upload", icon: <IcUpload />, t: "Upload dokumen" },
  { to: "/referensi", icon: <IcReferensi />, t: "Update referensi", admin: true },
  { to: "/label", icon: <IcLabel />, t: "Cetak label", admin: true },
  { to: "/user", icon: <IcUser />, t: "Kelola user", admin: true },
  { to: "/profil", icon: <IcProfil />, t: "Profil saya" },
];

export default function AdminLayout() {
  const tampil = useTampilan();
  const { user, logout } = useApp();
  const [open, setOpen] = useState(false);
  // animasi masuk sidebar hanya di ~2 detik pertama setelah dashboard dibuka
  const [go, setGo] = useState(true);
  useEffect(() => { const t = setTimeout(() => setGo(false), 2200); return () => clearTimeout(t); }, []);
  const ini = user.nama.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const Tautan = ({ m }) => (
    <NavLink to={m.to} end={m.end} onClick={() => setOpen(false)}>
      <i className="sp-ic">{m.icon}</i>
      <span className="sp-tx"><b>{m.t}</b></span>
    </NavLink>
  );

  return (
    <div className={"sp-shell" + (go ? " go" : "")}>
      <header className="sp-top">
        <div className="sp-top-l">
          <button className="sp-burger" onClick={() => setOpen(true)} aria-label="Buka menu">☰</button>
          <Logo size={34} />
          <div>
            <h1>{tampil.judul}</h1>
            <p>{tampil.sub}</p>
          </div>
        </div>
        <div className="sp-top-r">
          {user.role === "admin" && <Lonceng />}
          <span className="sp-pill"><i />{user.role === "admin" ? "Semua kantor" : "Kantor " + user.kantor}</span>
        </div>
      </header>

      <div className="sp-body">
        {open && <div className="sp-scrim" onClick={() => setOpen(false)} />}
        <aside className={"sp-side" + (open ? " open" : "")}>
          <button className="sp-close" onClick={() => setOpen(false)} aria-label="Tutup menu">✕</button>

          <div className="sp-brand">
            <div>
              <div className="sp-bn"><Wordmark tone="#f7c93a" /></div>
              <div className="sp-bs">Arsip & Kontrak Digital</div>
            </div>
          </div>

          <nav className="sp-nav">
            <p className="sp-lbl">Menu utama</p>
            {UTAMA.filter((m) => !m.admin || user.role === "admin").map((m) => <Tautan key={m.to} m={m} />)}
          </nav>

          <SidebarInfo />

          <div className="sp-me">
            <div className="sp-me-row">
              <NavLink to="/profil" className="sp-av" title="Profil saya" onClick={() => setOpen(false)}>{user.foto ? <img src={user.foto} alt="" /> : ini}</NavLink>
              <div className="sp-me-t">
                <b>{user.nama}</b>
                <span className={"sp-role" + (user.role === "admin" ? "" : " staff")}>
                  {user.role === "admin" ? "Admin · Semua kantor" : "Staff · " + user.kantor}
                </span>
              </div>
            </div>
            <button className="sp-out" onClick={logout}><IcKeluar /> Keluar</button>
          </div>
          <div className="sp-ver">{tampil.judul} v2.0</div>
        </aside>

        <main className="sp-content"><Outlet /></main>
      </div>
    </div>
  );
}