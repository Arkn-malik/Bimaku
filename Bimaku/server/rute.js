import ver from "./rute/ver.js";
import health from "./rute/health.js";
import auth from "./rute/auth.js";
import data from "./rute/data.js";
import ops from "./rute/ops.js";
import berkas from "./rute/berkas.js";

const BATAS_JSON = 25 * 1024 * 1024; 

const bacaJson = (req) => new Promise((ok, gagal) => {
  const c = [];
  let n = 0;
  req.on("data", (d) => {
    n += d.length;
    if (n > BATAS_JSON) { gagal(Object.assign(new Error("terlalu besar"), { kode: 413 })); req.destroy(); return; }
    c.push(d);
  });
  req.on("end", () => {
    const t = Buffer.concat(c).toString();
    if (/json/i.test(req.headers["content-type"] || "")) { try { return ok(JSON.parse(t || "{}")); } catch { return ok(t); } }
    ok(t);
  });
  req.on("error", gagal);
});

const rute = (url) => {
  let m;
  if (url === "/api/ver") return [ver, {}];
  if (url === "/api/health") return [health, {}];
  if ((m = /^\/api\/auth\/([a-z-]+)$/.exec(url))) return [auth, { aksi: m[1] }];
  if ((m = /^\/api\/s\/([^/]+)\/ops$/.exec(url))) return [ops, { key: m[1] }];
  if ((m = /^\/api\/s\/([^/]+)$/.exec(url))) return [data, { key: m[1] }];
  return null;
};

export function apiLokal() {
  return async (req, res, next) => {
    const url = (req.url || "").split("?")[0];
    if (!url.startsWith("/api/")) return next();
    res.status = (k) => { res.statusCode = k; return res; };
    res.json = (o) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };

    if (url === "/api/berkas" || url.startsWith("/api/berkas/")) {
      try { await berkas(req, res); } catch (e) { console.error("[berkas]", e); if (!res.headersSent) res.status(500).json({ error: "Kesalahan server" }); }
      return;
    }
    const r = rute(url);
    if (!r) return res.status(404).json({ error: "tidak ada" });
    try {
      req.query = r[1];
      req.body = await bacaJson(req);
      await r[0](req, res);
    } catch (e) {
      if (e?.kode === 413) return res.status(413).json({ error: "Permintaan terlalu besar" });
      console.error("[bimaku-api]", e);
      if (!res.headersSent) res.status(500).json({ error: "Kesalahan server" });
    }
  };
}
