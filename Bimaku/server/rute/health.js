import { handler } from "../lib/http.js";

export default handler(async (sql) => {
  const [r] = await sql`select now() as waktu`;
  return { isi: { ok: true, waktu: r.waktu } };
});
