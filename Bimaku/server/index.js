import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiLokal } from "./rute.js";

const akar = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const api = apiLokal();
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8",
};

const server = http.createServer((req, res) => {
  api(req, res, () => {
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
    let u;
    try { u = decodeURIComponent((req.url || "/").split("?")[0]); } catch { res.writeHead(400); return res.end(); }
    let f = path.join(akar, u);
    const dalam = f === akar || f.startsWith(akar + path.sep);
    if (!dalam || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(akar, "index.html"); // alamat aplikasi (SPA)
    if (!fs.existsSync(f)) { res.writeHead(404); return res.end("Jalankan 'npm run build' dulu."); }
    const ext = path.extname(f);
    res.writeHead(200, {
      "content-type": MIME[ext] || "application/octet-stream",
      "x-content-type-options": "nosniff",
      "cache-control": ext === ".html" ? "no-cache" : "public, max-age=3600",
    });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(f).pipe(res);
  });
});
server.requestTimeout = 0;
server.timeout = 0;

const port = Number(process.env.PORT) || 3000;
server.listen(port, process.env.HOST || "0.0.0.0", () => {
  console.log(`BIMAKU berjalan di http://localhost:${port}`);
  const alamat = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === "IPv4" && !i.internal).map((i) => i.address);
  for (const a of alamat) console.log(`Alamat di jaringan: http://${a}:${port}`);
  if (!alamat.length) console.warn("PERINGATAN: komputer ini tidak terhubung ke jaringan, jadi belum bisa dibuka dari komputer lain");
  console.log(`Berkas disimpan di ${path.resolve(process.env.BERKAS_DIR || "berkas")} (maks. ${Number(process.env.BERKAS_MAKS_MB) || 200} MB per file)`);
  if (!process.env.DATABASE_URL) console.warn("PERINGATAN: DATABASE_URL belum diatur (lihat .env.example)");
});
