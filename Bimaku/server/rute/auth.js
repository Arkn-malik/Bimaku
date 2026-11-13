import { handler, body, TIDAK_MASUK } from "../lib/http.js";
import {
  hashPassword, cekPassword, buatToken, pasangCookie, hapusCookie, sesi, publik, cariUser, userPenuh, simpanUser,
  aman, digit, kunciBatas, terkunci, catatGagal, bersihkan, MAKS_PASSWORD,
} from "../lib/auth.js";

const teks = (v) => (typeof v === "string" ? v : "");
const normId = (id) => { const t = teks(id).trim().toLowerCase(); return t.includes("@") ? t : digit(t); };
const TERKUNCI = { kode: 429, isi: { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." } };
const sama = (a, b) => teks(a).trim().toLowerCase() === teks(b).trim().toLowerCase();

export default handler(async (sql, req, res) => {
  const aksi = String(req.query.aksi || "");

  if (aksi === "me" && req.method === "GET") {
    const s = await sesi(sql, req);
    return s ? { isi: { user: publik(s) } } : TIDAK_MASUK;
  }
  if (req.method !== "POST") return { kode: 404, isi: { error: "tidak ada" } };
  const b = body(req);

  if (aksi === "logout") { hapusCookie(res, req); return { isi: { ok: true } }; }

  if (aksi === "login") {
    const id = normId(b.id), kunci = kunciBatas(req, id);
    if (!id || !teks(b.password) || teks(b.password).length > MAKS_PASSWORD) return { kode: 401, isi: { error: "NIP atau password salah" } };
    if (await terkunci(sql, kunci)) return TERKUNCI;
    const u = await cariUser(sql, id);
    const benar = await cekPassword(b.password, u?.hash); 
    if (!u || !benar) { await catatGagal(sql, kunci); return { kode: 401, isi: { error: "NIP atau password salah" } }; }
    if (u.aktif === false) return { kode: 403, isi: { error: "nonaktif" } };
    await bersihkan(sql, kunci.filter((k) => k.startsWith("id:")));
    const ingat = !!b.ingat, token = buatToken(u.email, u.hash, ingat);
    pasangCookie(res, req, token, ingat, Math.floor(Date.now() / 1000) + 30 * 24 * 3600);
    return { isi: { user: aman(u) } };
  }

  if (aksi === "ganti-password") {
    const s = await sesi(sql, req);
    if (!s) return TIDAK_MASUK;
    const kunci = kunciBatas(req, "id:" + s.email);
    if (await terkunci(sql, kunci)) return TERKUNCI;
    const u = await userPenuh(sql, s.email);
    if (!(await cekPassword(b.lama, u.hash))) { await catatGagal(sql, kunci); return { kode: 400, isi: { error: "Password lama salah" } }; }
    const baru = teks(b.baru);
    if (baru.length < 6) return { kode: 400, isi: { error: "Password baru minimal 8 karakter" } };
    if (baru.length > MAKS_PASSWORD) return { kode: 400, isi: { error: "Password terlalu panjang" } };
    if (baru === teks(b.lama)) return { kode: 400, isi: { error: "Password baru tidak boleh sama dengan password lama" } };
    if (baru !== teks(b.konfirm)) return { kode: 400, isi: { error: "Konfirmasi password baru tidak cocok" } };
    const hash = await hashPassword(baru);
    await simpanUser(sql, { ...u, hash, wajibGanti: false });
    const t = s._token;
    pasangCookie(res, req, buatToken(u.email, hash, !!t.p, t.x), !!t.p, t.x);
    return { isi: { ok: true } };
  }

  if (aksi === "cek" || aksi === "reset") {
    const id = normId(b.id), kunci = kunciBatas(req, id);
    if (await terkunci(sql, kunci)) return TERKUNCI;
    const u = id ? await cariUser(sql, id) : null;
    if (!u || u.role === "admin" || u.aktif === false || !sama(u.nama, b.nama) || u.kantor !== b.kantor) {
      await catatGagal(sql, kunci);
      return { kode: 400, isi: { error: "Data akun tidak cocok" } };
    }
    if (aksi === "cek") return { isi: { ok: true } };
    const baru = teks(b.password);
    if (baru.length < 6) return { kode: 400, isi: { error: "Password minimal 8 karakter" } };
    if (baru.length > MAKS_PASSWORD) return { kode: 400, isi: { error: "Password terlalu panjang" } };
    if (baru !== teks(b.konfirm)) return { kode: 400, isi: { error: "Konfirmasi password tidak sama" } };
    await simpanUser(sql, { ...u, hash: await hashPassword(baru), wajibGanti: false });
    await bersihkan(sql, kunci.filter((k) => k.startsWith("id:")));
    return { isi: { ok: true, email: u.nip || u.email } };
  }

  return { kode: 404, isi: { error: "tidak ada" } };
});
