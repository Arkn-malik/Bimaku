import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../Context/AppContext";
import { toast } from "../Utils/Helpers/ToastHelpers";
import { tglDariWaktu } from "../Utils/Tanggal";
import "./lonceng.css";

const Ic = ({ children, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcLonceng = () => <Ic size={21}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></Ic>;
const IcUnggah = () => <Ic size={18}><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 8l-4-4-4 4M12 4v12" /></Ic>;
const IcUnduh = () => <Ic size={17}><path d="M12 4v12M7 11l5 5 5-5M4 20h16" /></Ic>;

const waktuRelatif = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "baru saja";
  if (s < 3600) return Math.floor(s / 60) + " menit lalu";
  if (s < 86400) return Math.floor(s / 3600) + " jam lalu";
  if (s < 172800) return "kemarin";
  return tglDariWaktu(iso);
};

export default function Lonceng() {
  const { notif, arsip, tandaiDibaca, tandaiSemuaDibaca, hapusNotif, bersihkanNotif } = useApp();
  const nav = useNavigate();
  const [buka, setBuka] = useState(false);
  const [, setTik] = useState(0);
  const ref = useRef(null);
  const belum = notif.filter((n) => !n.dibaca).length;

  const dilihat = useRef(null);
  if (dilihat.current === null) dilihat.current = new Set(notif.map((n) => n.id));
  useEffect(() => {
    const baru = notif.filter((n) => !dilihat.current.has(n.id));
    baru.forEach((n) => dilihat.current.add(n.id));
    if (baru.length) toast("info", baru.length === 1 ? `${baru[0].oleh}: ${baru[0].judul}` : `${baru.length} notifikasi baru`);
  }, [notif]);

  useEffect(() => {
    if (!buka) return;
    const klik = (e) => { if (ref.current && !ref.current.contains(e.target)) setBuka(false); };
    const esc = (e) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("mousedown", klik);
    document.addEventListener("keydown", esc);
    const t = setInterval(() => setTik((x) => x + 1), 60000);
    return () => { document.removeEventListener("mousedown", klik); document.removeEventListener("keydown", esc); clearInterval(t); };
  }, [buka]);

  const fileDari = (n) => (n.arsipId && arsip.find((x) => x.id === n.arsipId)?.file) || null;

  const bukaItem = (n) => {
    tandaiDibaca(n.id);
    setBuka(false);
    nav("/referensi");
  };

  return (
    <div className="ln" ref={ref}>
      <button type="button" className={"ln-btn" + (belum ? " ada" : "")} onClick={() => setBuka((b) => !b)}
        aria-label={belum ? `Notifikasi, ${belum} belum dibaca` : "Notifikasi"} aria-haspopup="dialog" aria-expanded={buka}>
        <IcLonceng />
        {belum > 0 && <span className="ln-badge">{belum > 99 ? "99+" : belum}</span>}
      </button>

      {buka && (
        <div className="ln-panel" role="dialog" aria-label="Notifikasi">
          <div className="ln-head">
            <b>Notifikasi{belum > 0 && <em>{belum} baru</em>}</b>
            <div>
              <button type="button" disabled={!belum} onClick={tandaiSemuaDibaca}>Tandai semua dibaca</button>
              <button type="button" disabled={!notif.length} onClick={bersihkanNotif}>Hapus semua</button>
            </div>
          </div>

          {notif.length ? (
            <ul className="ln-list">
              {notif.map((n) => {
                const f = fileDari(n);
                return (
                <li key={n.id} className={n.dibaca ? "" : "baru"}>
                  <button type="button" className="ln-item" onClick={() => bukaItem(n)}>
                    <span className="ln-ic"><IcUnggah /></span>
                    <span className="ln-tx">
                      <b>{n.judul}</b>
                      <span className="ln-ps">{n.pesan}</span>
                      <small>{n.oleh} · {n.kantor} · {waktuRelatif(n.waktu)}</small>
                    </span>
                    {!n.dibaca && <i className="ln-dot" aria-label="Belum dibaca" />}
                  </button>
                  <div className="ln-aksi">
                    {f && <a className="ln-dl" href={f.data} download={f.name} title={"Unduh " + f.name} aria-label={"Unduh " + f.name} onClick={() => tandaiDibaca(n.id)}><IcUnduh /></a>}
                    <button type="button" className="ln-x" aria-label="Hapus notifikasi" onClick={() => hapusNotif(n.id)}>×</button>
                  </div>
                </li>
                );
              })}
            </ul>
          ) : (
            <div className="ln-kosong">
              <IcLonceng />
              <p>Belum ada notifikasi</p>
              <small>Anda akan diberi tahu saat staf mengunggah dokumen.</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
