import { sql } from "./db.js";
import { GalatInput, GalatAkses } from "./store.js";

export const handler = (fn) => async (req, res) => {
  res.setHeader("cache-control", "no-store");
  try {
    if (req.method === "POST" && !/application\/json/i.test(req.headers?.["content-type"] || "")) {
      return res.status(415).json({ error: "content-type harus application/json" });
    }
    const { kode = 200, isi } = await fn(sql(), req, res);
    res.status(kode).json(isi);
  } catch (e) {
    if (e instanceof GalatInput) return res.status(400).json({ error: e.message });
    if (e instanceof GalatAkses) return res.status(403).json({ error: e.message });
    console.error("[bimaku-api]", e);
    res.status(500).json({ error: "Kesalahan server" });
  }
};

export const body = (req) => {
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch { throw new GalatInput("JSON tidak valid"); } }
  return req.body ?? {};
};
export const TIDAK_MASUK = { kode: 401, isi: { error: "Belum masuk" } };
