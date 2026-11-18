import { handler, TIDAK_MASUK } from "../lib/http.js";
import { KUNCI, bacaKunci } from "../lib/store.js";
import { sesi } from "../lib/auth.js";
import { KUNCI_BOLEH, saringBaca } from "../lib/policy.js";

export default handler(async (sql, req) => {
  const k = String(req.query.key || "");
  if (!KUNCI.test(k) || !KUNCI_BOLEH.includes(k)) return { kode: 404, isi: { error: "tidak ada" } };
  if (req.method !== "GET") return { kode: 405, isi: { error: "metode tidak didukung" } };
  const u = await sesi(sql, req);
  if (!u) return TIDAK_MASUK;
  const r = await bacaKunci(sql, k);
  return { isi: { ver: r.ver, data: saringBaca(u, k, r.data) } };
});
