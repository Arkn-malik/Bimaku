import { handler, body, TIDAK_MASUK } from "../lib/http.js";
import { KUNCI, terapkanOps, versiKunci } from "../lib/store.js";
import { sesi } from "../lib/auth.js";
import { KUNCI_BOLEH, saringTulis } from "../lib/policy.js";

export default handler(async (sql, req) => {
  const k = String(req.query.key || "");
  if (!KUNCI.test(k) || !KUNCI_BOLEH.includes(k)) return { kode: 404, isi: { error: "tidak ada" } };
  if (req.method !== "POST") return { kode: 405, isi: { error: "metode tidak didukung" } };
  const u = await sesi(sql, req);
  if (!u) return TIDAK_MASUK;
  const b = await saringTulis(sql, u, k, body(req));
  if (!b) { const ver = await versiKunci(sql, k); return { isi: { ver, prev: ver } }; } 
  return { isi: await terapkanOps(sql, k, b) };
});
