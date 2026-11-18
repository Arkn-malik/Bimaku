import { handler, TIDAK_MASUK } from "../lib/http.js";
import { semuaVersi } from "../lib/store.js";
import { sesi } from "../lib/auth.js";

export default handler(async (sql, req) => {
  if (req.method !== "GET") return { kode: 405, isi: { error: "metode tidak didukung" } };
  if (!(await sesi(sql, req))) return TIDAK_MASUK;
  return { isi: await semuaVersi(sql) };
});
