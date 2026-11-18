import { useEffect, useState } from "react";
import { useApp } from "../Context/AppContext";

const fmt = (n) => (n >= 1024 ** 4 ? (n / 1024 ** 4).toFixed(2).replace(".", ",") + " TB"
  : n >= 1024 ** 3 ? (n / 1024 ** 3).toFixed(n >= 10 * 1024 ** 3 ? 0 : 1).replace(".", ",") + " GB"
  : n >= 1024 ** 2 ? (n / 1024 ** 2).toFixed(n >= 10 * 1024 ** 2 ? 0 : 1).replace(".", ",") + " MB"
  : Math.max(0, Math.round(n / 1024)) + " KB");

/* Penyimpanan disk komputer */
export default function SidebarInfo() {
  const { user } = useApp();
  const admin = user?.role === "admin";
  const [s, setS] = useState(null);
  const [gagal, setGagal] = useState(false);

  useEffect(() => {
    if (!admin) return;
    let hidup = true;
    const muat = () => {
      if (document.hidden) return;
      fetch("/api/berkas/status", { credentials: "same-origin", cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((j) => { if (hidup) { setS(j); setGagal(false); } })
        .catch(() => { if (hidup) setGagal(true); });
    };
    muat();
    const t = setInterval(muat, 60000);
    return () => { hidup = false; clearInterval(t); };
  }, [admin]);

  if (!admin) return null;
  const ada = s?.total > 0;
  const terpakai = ada ? s.total - s.bebas : 0;
  const persen = ada ? Math.min(100, Math.round((terpakai / s.total) * 100)) : 0;

  const level = !ada ? "" : persen >= 90 || s.bebas < 5 * 1024 ** 3 ? "hi" : persen >= 70 ? "mid" : "";

  return (
    <div className="sp-info">
      <div className="sp-w" title={s?.folder ? "Folder berkas: " + s.folder : undefined}>
        <p className="sp-wt">Disk server {ada && <span>{persen}%</span>}</p>
        {ada && <div className={"sp-store " + level}><i style={{ width: Math.max(persen, 3) + "%" }} /></div>}
        <small className="sp-sm">
          {gagal && !s ? "Status disk tidak tersedia"
            : !s ? "Memuat…"
            : ada ? `Sisa ${fmt(s.bebas)} dari ${fmt(s.total)}`
            : "Kapasitas disk tidak terbaca"}
        </small>
        {s && <small className="sp-sm">Berkas: {fmt(s.berkas)} ({s.jumlah} file)</small>}
        {level === "hi" && <small className="sp-sm" style={{ color: "#b91c1c", fontWeight: 700 }}>Disk hampir penuh, upload bisa gagal</small>}
      </div>
    </div>
  );
}
