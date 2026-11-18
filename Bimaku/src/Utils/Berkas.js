export const MAKS_BERKAS_MB = 200; 
export const MAKS_BERKAS = MAKS_BERKAS_MB * 1024 * 1024;

let info; // { aktif, maksMB } dicek sekali
export const infoBerkas = () => (info ||= fetch("/api/berkas", { credentials: "same-origin" })
  .then((r) => (r.ok ? r.json() : { aktif: false }))
  .catch(() => ({ aktif: false })));

export async function simpanBerkas(raw, { kantor, tahun, nama, onProgress }) {
  const type = raw.type || "application/octet-stream";
  const { aktif, maksMB } = await infoBerkas();
  if (!aktif) throw new Error("Server penyimpanan berkas tidak merespons. Pastikan Anda sudah masuk dan server berjalan, lalu coba lagi.");
  if (raw.size > (maksMB || MAKS_BERKAS_MB) * 1048576) throw new Error(`File maksimal ${maksMB || MAKS_BERKAS_MB} MB`);
  const url = `/api/berkas/${encodeURIComponent(kantor || "Umum")}/${tahun}/${encodeURIComponent(nama)}`;
  const j = await new Promise((ok, gagal) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.setRequestHeader("content-type", type);
    if (onProgress) x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => {
      let r = {};
      try { r = JSON.parse(x.responseText); } catch { /* bukan JSON */ }
      if (x.status >= 200 && x.status < 300 && r.url) return ok(r);
      gagal(new Error(x.status === 401 ? "Sesi habis, silakan masuk lagi" : x.status === 413 ? `File maksimal ${maksMB || MAKS_BERKAS_MB} MB` : r.error || "Berkas gagal disimpan"));
    };
    x.onerror = () => gagal(new Error("Koneksi ke server terputus. Berkas belum tersimpan, coba lagi."));
    x.onabort = () => gagal(new Error("Unggahan dibatalkan"));
    x.send(raw);
  });
  return { name: nama, type, size: raw.size, data: j.url + "?v=" + Date.now() }; 
}

export async function ambilByte(data) {
  if (String(data).startsWith("data:")) {
    const bin = atob(String(data).split(",")[1] || ""), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const r = await fetch(data, { credentials: "same-origin" });
  if (!r.ok) throw new Error("Berkas tidak dapat diambil dari server");
  return new Uint8Array(await r.arrayBuffer());
}
