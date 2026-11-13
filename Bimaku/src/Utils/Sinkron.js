import { useEffect, useRef, useState } from "react";

export const server = { aktif: false }; 

const pelanggan = new Map(); 
let pemeriksa = null;
const mulaiPantau = () => {
  if (pemeriksa) return;
  const periksa = async () => {
    try {
      const r = await fetch("/api/ver", { cache: "no-store" });
      if (r.status === 401) window.dispatchEvent(new Event("bimaku-401")); 
      if (!r.ok) throw new Error();
      const v = await r.json();
      server.aktif = true;
      pelanggan.forEach((fn, k) => fn(v[k] || 0));
    } catch {}
  };
  const jeda = import.meta.env.PROD ? 15000 : 2500;
  pemeriksa = setInterval(() => { if (!document.hidden) periksa(); }, jeda);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) periksa(); });
};

const potret = (d, id) => (id ? new Map((d || []).map((x) => [id(x), x])) : d);
const tulisLokal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* kuota penuh: server tetap menyimpan */ } };

/**
 * @param kunci   nama data di server (huruf kecil/underscore)
 * @param awal    nilai awal (dari localStorage)
 * @param opsi    { id: (item)=>string  -> data berupa daftar; tanpa id -> data berupa objek,

 */
export function useSinkron(kunci, awal, { id, lokal, migrasi = (x) => x, aktif = true } = {}) {
  const [data, setData] = useState(awal);
  const terbaru = useRef(awal);
  const sudah = useRef(potret(awal, id)); 
  const verLokal = useRef(-1);
  const sibuk = useRef(0);
  const siap = useRef(false);
  terbaru.current = data;

  const terapkan = (d, ver) => {
    sudah.current = potret(d, id);
    verLokal.current = ver;
    terbaru.current = d;
    setData(d);
  };

  const dorong = async () => {
    if (!siap.current || sibuk.current) return;
    const cur = terbaru.current;
    let body, potretBaru;
    if (id) {
      potretBaru = potret(cur, id);
      const naik = [], hapus = [];
      potretBaru.forEach((x, k) => { if (sudah.current.get(k) !== x) naik.push({ id: k, item: x }); });
      sudah.current.forEach((_, k) => { if (!potretBaru.has(k)) hapus.push(k); });
      if (!naik.length && !hapus.length) return;
      body = { kind: "list", upsert: naik, remove: hapus };
    } else {
      if (sudah.current === cur) return;
      potretBaru = cur;
      body = { kind: "obj", obj: cur };
    }
    sibuk.current++;
    try {
      const r = await fetch(`/api/s/${kunci}/ops`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error();
      const { ver, prev } = await r.json();
      server.aktif = true;
      sudah.current = potretBaru;
      if (prev === verLokal.current) verLokal.current = ver; 
    } catch {}
    finally { sibuk.current--; }
    if (terbaru.current !== cur) dorong(); 
  };

  useEffect(() => {
    if (!aktif) return;
    let batal = false;
    (async () => {
      try {
        const r = await fetch(`/api/s/${kunci}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const { ver, data: d } = await r.json();
        if (batal) return;
        server.aktif = true;
        if (d === null) {
          const cur = terbaru.current;
          const body = id ? { kind: "list", replace: true, upsert: cur.map((x) => ({ id: id(x), item: x })), remove: [] } : { kind: "obj", obj: cur };
          const r2 = await fetch(`/api/s/${kunci}/ops`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
          if (r2.ok) { const j = await r2.json(); sudah.current = potret(cur, id); verLokal.current = j.ver; }
        } else terapkan(migrasi(d), ver);
      } catch {}
      if (batal) return;
      siap.current = true;
      dorong();
    })();

    pelanggan.set(kunci, async (verServer) => {
      if (!siap.current) return;
      await dorong();
      if (sibuk.current || verServer === verLokal.current) return;
      try {
        const antes = terbaru.current;
        const r = await fetch(`/api/s/${kunci}`, { cache: "no-store" });
        if (!r.ok) return;
        const { ver, data: d } = await r.json();
        if (d !== null && terbaru.current === antes) terapkan(migrasi(d), ver); 
      } catch { /* abaikan */ }
    });
    mulaiPantau();
    return () => { batal = true; pelanggan.delete(kunci); };
  }, [aktif]);

  useEffect(() => { dorong(); if (lokal) tulisLokal(lokal, data);}, [data]);

  useEffect(() => {
    if (!lokal) return;
    const f = (e) => {
      if (e.key !== lokal || server.aktif || !e.newValue) return;
      try { const v = migrasi(JSON.parse(e.newValue)); terbaru.current = v; sudah.current = potret(v, id); setData(v); } catch {}
    };
    window.addEventListener("storage", f);
    return () => window.removeEventListener("storage", f);
  }, []);

  return [data, setData];
}
