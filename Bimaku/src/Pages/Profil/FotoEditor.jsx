import { useEffect, useRef, useState } from "react";

const V = 300;   // ukuran kanvas 
const OUT = 320; // ukuran foto 

export default function FotoEditor({ sumber, onTerapkan, onBatal }) {
  const kanvas = useRef(null);
  const kotak = useRef(null);
  const gambar = useRef(null);
  const tarik = useRef(null);
  const [siap, setSiap] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [s, setS] = useState({ zoom: 1, x: 0, y: 0 });

  useEffect(() => {
    const im = new Image();
    im.onload = () => { gambar.current = im; setSiap(true); };
    im.onerror = () => setGagal(true);
    im.src = sumber;
  }, [sumber]);

  const skala = (zoom, L) => (L / Math.min(gambar.current.width, gambar.current.height)) * zoom;
  const batasXY = (zoom) => {
    const im = gambar.current, k = skala(zoom, V);
    return { mx: Math.max(0, (im.width * k - V) / 2), my: Math.max(0, (im.height * k - V) / 2) };
  };
  const rapikan = (n) => {
    const { mx, my } = batasXY(n.zoom);
    return { ...n, x: Math.max(-mx, Math.min(mx, n.x)), y: Math.max(-my, Math.min(my, n.y)) };
  };

  const gambarKe = (ctx, L, st) => {
    const im = gambar.current, k = skala(st.zoom, L), r = L / V;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, L, L);
    ctx.drawImage(im, L / 2 + st.x * r - (im.width * k) / 2, L / 2 + st.y * r - (im.height * k) / 2, im.width * k, im.height * k);
  };

  useEffect(() => {
    if (!siap) return;
    const c = kanvas.current; c.width = c.height = V;
    gambarKe(c.getContext("2d"), V, s);
  }, [siap, s]);

  const turun = (e) => { tarik.current = { x: e.clientX, y: e.clientY, ox: s.x, oy: s.y }; e.currentTarget.setPointerCapture(e.pointerId); };
  const gerak = (e) => {
    const t = tarik.current; if (!t || !siap) return;
    setS((p) => rapikan({ ...p, x: t.ox + e.clientX - t.x, y: t.oy + e.clientY - t.y }));
  };
  const lepas = () => { tarik.current = null; };

  const ubahZoom = (zoom) => setS((p) => rapikan({ ...p, zoom }));

  useEffect(() => {
    const el = kotak.current; if (!el) return;
    const w = (e) => {
      e.preventDefault();
      if (!gambar.current) return;
      setS((p) => rapikan({ ...p, zoom: Math.max(1, Math.min(4, +(p.zoom - e.deltaY * 0.0015).toFixed(3))) }));
    };
    el.addEventListener("wheel", w, { passive: false });
    return () => el.removeEventListener("wheel", w);
  });

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onBatal();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onBatal]);

  const terapkan = () => {
    const c = document.createElement("canvas"); c.width = c.height = OUT;
    gambarKe(c.getContext("2d"), OUT, s);
    onTerapkan(c.toDataURL("image/jpeg", 0.88));
  };

  return (
    <div className="pf-ed" onClick={onBatal}>
      <div className="pf-ed-card" role="dialog" aria-modal="true" aria-label="Potong foto profil" onClick={(e) => e.stopPropagation()}>
        <h3>Potong foto</h3>
        <p className="pf-ed-sub">Geser foto untuk mengatur posisi. Gulir atau pakai slider untuk memperbesar.</p>

        {gagal ? <p className="rf-msg">Gambar tidak bisa dibaca.</p> : (
          <div ref={kotak} className="pf-ed-stage" onPointerDown={turun} onPointerMove={gerak} onPointerUp={lepas} onPointerCancel={lepas}>
            <canvas ref={kanvas} width={V} height={V} />
            <span className="pf-ed-mask" aria-hidden="true" />
          </div>
        )}

        <div className="pf-ed-sl">
          <label><span>Zoom <b>{Math.round(s.zoom * 100)}%</b></span>
            <input type="range" min="1" max="4" step="0.01" value={s.zoom} onChange={(e) => ubahZoom(+e.target.value)} /></label>
        </div>

        <div className="pf-ed-act">
          <button type="button" className="mk-link" onClick={onBatal}>Batal</button>
          <button type="button" className="up-simpan pf-btn" onClick={terapkan} disabled={!siap}>POTONG</button>
        </div>
      </div>
    </div>
  );
}