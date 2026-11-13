import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { sql } from "../lib/db.js";
import { sesi } from "../lib/auth.js";

const akar = () => path.resolve(process.env.BERKAS_DIR || "berkas");
const maksMB = () => Number(process.env.BERKAS_MAKS_MB) || 200;
const KANTOR = ["Yogyakarta", "Semarang", "Bandung"];
const DILARANG = /\.(exe|msi|bat|cmd|com|scr|js|vbs|ps1|sh|jar|html?|svg)$/i;
const NAMA = /^[A-Za-z0-9][A-Za-z0-9._() -]{0,150}$/;
const MIME = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".bmp": "image/bmp", ".txt": "text/plain; charset=utf-8", ".csv": "text/csv; charset=utf-8" };
const TAMPIL_LANGSUNG = /\.(pdf|png|jpe?g|gif|webp|bmp|txt|csv)$/i;

const adm = (u) => u.role === "admin";
const galat = (res, k, pesan) => { res.setHeader("cache-control", "no-store"); res.statusCode = k; res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ error: pesan })); };
const encUrl = (kantor, tahun, nama) => `/api/berkas/${encodeURIComponent(kantor)}/${tahun}/${encodeURIComponent(nama)}`;

function urai(url) {
  const seg = url.replace(/^\/api\/berkas\/?/, "").split("/");
  if (seg.length !== 3) return null;
  let kantor, tahun, nama;
  try { [kantor, tahun, nama] = seg.map(decodeURIComponent); } catch { return null; }
  if (!(KANTOR.includes(kantor) || kantor === "Umum") || !/^\d{4}$/.test(tahun) || !NAMA.test(nama) || DILARANG.test(nama)) return null;
  const file = path.join(akar(), kantor, tahun, nama);
  if (!file.startsWith(akar() + path.sep)) return null;
  return { kantor, tahun, nama, file };
}

let cacheStatus = { t: 0, v: null };
async function ukuranFolder(dir) {
  let n = 0, jumlah = 0;
  let isi;
  try { isi = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return { n, jumlah }; }
  for (const e of isi) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { const x = await ukuranFolder(p); n += x.n; jumlah += x.jumlah; }
    else if (e.isFile() && !e.name.endsWith(".part")) { try { n += (await fs.promises.stat(p)).size; jumlah++; } catch {} }
  }
  return { n, jumlah };
}
async function statusDisk() {
  if (cacheStatus.v && Date.now() - cacheStatus.t < 30000) return cacheStatus.v;
  const dir = akar();
  const { n, jumlah } = await ukuranFolder(dir);
  let cek = dir, total = null, bebas = null;
  for (let i = 0; i < 20; i++) {
    try { const s = await fs.promises.statfs(cek); total = Number(s.blocks) * Number(s.bsize); bebas = Number(s.bavail) * Number(s.bsize); break; }
    catch { const atas = path.dirname(cek); if (atas === cek) break; cek = atas; }
  }
  cacheStatus = { t: Date.now(), v: { berkas: n, jumlah, total, bebas, folder: dir } };
  return cacheStatus.v;
}

export default async function berkas(req, res) {
  const MAKS_MB = maksMB(), MAKS = MAKS_MB * 1048576;
  const url = (req.url || "").split("?")[0];
  const u = await sesi(sql(), req);
  if (!u) return galat(res, 401, "Belum masuk");

  if (url === "/api/berkas") {
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ aktif: true, maksMB: MAKS_MB }));
  }

  if (url === "/api/berkas/status") {
    if (!adm(u)) return galat(res, 403, "Khusus admin");
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(await statusDisk()));
  }

  const t = urai(url);
  if (!t) return galat(res, 400, "Alamat berkas tidak valid");

  if (req.method === "GET") {
    if (!adm(u) && t.kantor !== "Umum" && t.kantor !== u.kantor) return galat(res, 403, "Tidak punya akses ke berkas ini");
    let st;
    try { st = await fs.promises.stat(t.file); } catch { return galat(res, 404, "Berkas tidak ditemukan"); }
    const ext = path.extname(t.nama).toLowerCase();
    res.setHeader("content-type", MIME[ext] || "application/octet-stream");
    res.setHeader("content-disposition", `${TAMPIL_LANGSUNG.test(t.nama) ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(t.nama)}`);
    res.setHeader("x-content-type-options", "nosniff");
    res.setHeader("cache-control", "private, no-cache");
    res.setHeader("accept-ranges", "bytes");

    let awal = 0, akhir = st.size - 1;
    const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ""));
    if (m && (m[1] || m[2])) {
      if (m[1] === "") awal = Math.max(0, st.size - Number(m[2]));
      else { awal = Number(m[1]); if (m[2] !== "") akhir = Math.min(akhir, Number(m[2])); }
      if (awal > akhir || awal >= st.size) { res.statusCode = 416; res.setHeader("content-range", `bytes */${st.size}`); return res.end(); }
      res.statusCode = 206;
      res.setHeader("content-range", `bytes ${awal}-${akhir}/${st.size}`);
    } else res.statusCode = 200;
    res.setHeader("content-length", akhir - awal + 1);
    return pipeline(fs.createReadStream(t.file, { start: awal, end: akhir }), res).catch(() => {});
  }

  if (req.method === "PUT") {
    if (!adm(u) && t.kantor !== u.kantor) return galat(res, 403, "Tidak punya akses ke kantor ini");
    if (Number(req.headers["content-length"] || 0) > MAKS) { res.setHeader("connection", "close"); return galat(res, 413, `File melebihi batas ${MAKS_MB} MB`); }
    await fs.promises.mkdir(path.dirname(t.file), { recursive: true });
    const sementara = `${t.file}.${crypto.randomBytes(6).toString("hex")}.part`;
    let total = 0;
    const batas = new Transform({ transform(c, _e, cb) { total += c.length; total > MAKS ? cb(Object.assign(new Error("terlalu besar"), { kode: 413 })) : cb(null, c); } });
    try {
      await pipeline(req, batas, fs.createWriteStream(sementara));
      if (total === 0) throw Object.assign(new Error("kosong"), { kode: 400 });
      await fs.promises.rename(sementara, t.file); 
    } catch (e) {
      fs.promises.unlink(sementara).catch(() => {});
      if (e.kode === 413) { res.setHeader("connection", "close"); return galat(res, 413, `File melebihi batas ${MAKS_MB} MB`); }
      if (e.kode === 400) return galat(res, 400, "File kosong");
      if (e.code === "ECONNRESET" || e.code === "ERR_STREAM_PREMATURE_CLOSE") return; 
      console.error("[berkas]", e);
      return galat(res, 500, "Berkas gagal disimpan");
    }
    res.statusCode = 201;
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ url: encUrl(t.kantor, t.tahun, t.nama), size: total }));
  }

  res.setHeader("allow", "GET, PUT");
  return galat(res, 405, "metode tidak didukung");
}
