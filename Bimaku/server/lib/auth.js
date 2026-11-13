import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
const N = 16384, R = 8, P = 1;
export const COOKIE = "bimaku_sesi";
export const MAKS_PASSWORD = 200;
const DETIK_INGAT = 30 * 24 * 3600, DETIK_BIASA = 12 * 3600;

export async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const k = await scrypt(String(pw), salt, 64, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${k.toString("base64")}`;
}
const GARAM_PALSU = Buffer.alloc(16, 1);
export async function cekPassword(pw, hash) {
  const [tipe, n, r, p, s, h] = String(hash || "").split("$");
  if (tipe !== "scrypt" || !s || !h) { await scrypt(String(pw), GARAM_PALSU, 64, { N, r: R, p: P }); return false; } // waktu tetap, tidak membocorkan "user tidak ada"
  const harap = Buffer.from(h, "base64");
  const k = await scrypt(String(pw), Buffer.from(s, "base64"), harap.length, { N: +n, r: +r, p: +p });
  return crypto.timingSafeEqual(k, harap);
}

export const pv = (hash) => crypto.createHash("sha256").update(String(hash || "")).digest("base64url").slice(0, 10);

const rahasia = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET belum diatur (minimal 32 karakter)");
  return s;
};
const ttd = (isi) => crypto.createHmac("sha256", rahasia()).update(isi).digest("base64url");
export function buatToken(email, hash, ingat, kedaluwarsa) {
  const x = kedaluwarsa || Math.floor(Date.now() / 1000) + (ingat ? DETIK_INGAT : DETIK_BIASA);
  const isi = Buffer.from(JSON.stringify({ e: email, v: pv(hash), x, p: ingat ? 1 : 0 })).toString("base64url");
  return isi + "." + ttd(isi);
}
export function bacaToken(t) {
  const [isi, tt] = String(t || "").split(".");
  if (!isi || !tt) return null;
  const harap = Buffer.from(ttd(isi)), ada = Buffer.from(tt);
  if (harap.length !== ada.length || !crypto.timingSafeEqual(harap, ada)) return null;
  try {
    const p = JSON.parse(Buffer.from(isi, "base64url").toString());
    return p && p.e && p.x > Date.now() / 1000 ? p : null;
  } catch { return null; }
}

const dariCookie = (req) => {
  for (const c of String(req.headers?.cookie || "").split(";")) {
    const i = c.indexOf("=");
    if (i > 0 && c.slice(0, i).trim() === COOKIE) { try { return decodeURIComponent(c.slice(i + 1).trim()); } catch { return null; } }
  }
  return null;
};
const https = (req) => req.headers?.["x-forwarded-proto"] === "https";
export function pasangCookie(res, req, token, ingat, kedaluwarsa) {
  const umur = ingat ? Math.max(60, kedaluwarsa - Math.floor(Date.now() / 1000)) : null;
  res.setHeader("set-cookie", `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${https(req) ? "; Secure" : ""}${umur ? "; Max-Age=" + umur : ""}`);
}
export const hapusCookie = (res, req) =>
  res.setHeader("set-cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax${https(req) ? "; Secure" : ""}; Max-Age=0`);

export const aman = (u) => { const { hash: _h, password: _p, ...s } = u; return s; };
export const digit = (s) => String(s || "").replace(/\D/g, "");

export async function userPenuh(sql, email) {
  const [r] = await sql`select item from store_item where key = 'users' and id = ${email}`;
  return r ? r.item : null;
}

export async function cariUser(sql, id) {
  const t = String(id || "").trim().toLowerCase();
  if (!t) return null;
  if (t.includes("@")) return userPenuh(sql, t);
  const d = digit(t);
  if (!d) return null;
  const [r] = await sql`select item from store_item where key = 'users' and regexp_replace(coalesce(item->>'nip', ''), '[^0-9]', '', 'g') = ${d} limit 1`;
  return r ? r.item : null;
}

export async function sesi(sql, req) {
  const t = bacaToken(dariCookie(req));
  if (!t) return null;
  const u = await userPenuh(sql, t.e);
  if (!u || u.aktif === false || pv(u.hash) !== t.v) return null;
  return { ...aman(u), _token: t };
}
export const publik = (s) => { const { _token, ...u } = s; return u; };

export async function simpanUser(sql, u) {
  await sql.transaction([
    sql`update store_item set item = ${JSON.stringify(u)}::jsonb, updated_at = now() where key = 'users' and id = ${u.email}`,
    sql`update store set ver = ver + 1, updated_at = now() where key = 'users'`,
  ]);
}

const BATAS_ID = 8, BATAS_IP = 40;

export const ipDari = (req) => {
  if (process.env.PERCAYA_PROXY === "1") {
    const h = String(req.headers?.["x-real-ip"] || String(req.headers?.["x-forwarded-for"] || "").split(",")[0]).trim();
    if (h) return h;
  }
  return req.socket?.remoteAddress || "tidak-diketahui";
};
export const kunciBatas = (req, id) => [`ip:${ipDari(req)}`, ...(id ? [`id:${id}`] : [])];
export async function terkunci(sql, daftar) {
  const rows = await sql`
    select jumlah, kunci from percobaan_login
    where kunci in (select jsonb_array_elements_text(${JSON.stringify(daftar)}::jsonb))
      and mulai > now() - interval '15 minutes'`;
  return rows.some((r) => r.jumlah >= (r.kunci.startsWith("ip:") ? BATAS_IP : BATAS_ID));
}
export async function catatGagal(sql, daftar) {
  await sql`
    insert into percobaan_login (kunci, jumlah, mulai)
    select t.k, 1, now() from jsonb_array_elements_text(${JSON.stringify(daftar)}::jsonb) as t(k)
    on conflict (kunci) do update set
      jumlah = case when percobaan_login.mulai > now() - interval '15 minutes' then percobaan_login.jumlah + 1 else 1 end,
      mulai  = case when percobaan_login.mulai > now() - interval '15 minutes' then percobaan_login.mulai else now() end`;
}
export const bersihkan = (sql, daftar) =>
  sql`delete from percobaan_login where kunci in (select jsonb_array_elements_text(${JSON.stringify(daftar)}::jsonb))`;
