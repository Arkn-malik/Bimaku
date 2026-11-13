import { GalatInput } from "./store.js";
import { hashPassword, digit, MAKS_PASSWORD } from "./auth.js";

export const KUNCI_BOLEH = ["users", "arsip", "notif", "ref_daftar", "ref_lain"];
const KANTOR = ["Yogyakarta", "Semarang", "Bandung"];
const EMAIL = /^\S+@\S+\.\S+$/;
const BOLEH_USER = ["email", "nama", "nip", "role", "kantor", "aktif", "wajibGanti", "foto"];
const FOTO_MAKS = 3_500_000;
const adm = (u) => u.role === "admin";

export function saringBaca(u, key, data) {
  if (data === null) return null;
  switch (key) {
    case "users": { const l = data.map(({ hash: _h, password: _p, ...r }) => r); return adm(u) ? l : l.filter((x) => x.email === u.email); }
    case "arsip": return adm(u) ? data : data.filter((a) => a.kantor === u.kantor);
    case "notif": return adm(u) ? data : [];
    case "ref_daftar": return adm(u) ? data : data.filter((r) => !r.kantor || r.kantor === u.kantor);
    default: return data; 
  }
}

const ambil = async (sql, key, ids) =>
  ids.length
    ? new Map((await sql`select id, item from store_item where key = ${key} and id in (select jsonb_array_elements_text(${JSON.stringify(ids)}::jsonb))`).map((r) => [r.id, r.item]))
    : new Map();

const kosong = (b) => !b.replace && !b.upsert.length && !b.remove.length;

export async function saringTulis(sql, u, key, b) {
  if (!KUNCI_BOLEH.includes(key)) return null;
  if (!b || typeof b !== "object") throw new GalatInput("body tidak valid");
  if (key === "ref_lain") return adm(u) && b.kind === "obj" && b.obj !== undefined ? { kind: "obj", obj: b.obj } : null;
  if (b.kind !== "list") return null;

  const naik = (Array.isArray(b.upsert) ? b.upsert : []).filter((x) => x && typeof x.id === "string" && x.item && typeof x.item === "object");
  const hapus = (Array.isArray(b.remove) ? b.remove : []).filter((x) => typeof x === "string");
  let out;

  if (key === "users") out = await tulisUsers(sql, u, naik, hapus);
  else if (adm(u)) out = { kind: "list", replace: !!b.replace, upsert: naik, remove: hapus };
  else {
    const ada = await ambil(sql, key, naik.map((x) => x.id));
    let up = [];
    if (key === "arsip") {
      up = naik.filter((x) => x.item.kantor === u.kantor && (!ada.has(x.id) || ada.get(x.id).kantor === u.kantor));
    } else if (key === "notif") { 
      up = naik.filter((x) => !ada.has(x.id)).map((x) => ({ id: x.id, item: { ...x.item, oleh: u.nama, kantor: u.kantor, dibaca: false } }));
    } else if (key === "ref_daftar") { 
      const milik = (r) => (r.jenisDok === "Kontrak" || r.jenisDok === "Pengadaan") && r.kantor === u.kantor;
      up = naik.filter((x) => milik(x.item) && (!ada.has(x.id) || milik(ada.get(x.id))));
    }
    out = { kind: "list", replace: false, upsert: up, remove: [] };
  }
  return out && !kosong(out) ? out : null;
}

async function tulisUsers(sql, u, naik, hapus = []) {
  const semua = new Map((await sql`select id, item from store_item where key = 'users'`).map((r) => [r.id, r.item]));

  if (!adm(u)) { 
    const x = naik.find((n) => n.id === u.email);
    const lama = semua.get(u.email);
    if (!x || !lama) return null;
    const foto = x.item.foto ?? null;
    if (foto !== null && !(typeof foto === "string" && foto.startsWith("data:image/") && foto.length <= FOTO_MAKS)) throw new GalatInput("Foto tidak valid");
    if (foto === (lama.foto ?? null)) return null;
    return { kind: "list", replace: false, upsert: [{ id: u.email, item: { ...lama, foto } }], remove: [] };
  }

  const out = [];
  for (const x of naik) {
    const email = String(x.item.email || "").trim().toLowerCase();
    if (email !== x.id || !EMAIL.test(email)) throw new GalatInput("Email tidak valid");
    const lama = semua.get(email);
    const baru = {};
    for (const k of BOLEH_USER) if (x.item[k] !== undefined) baru[k] = x.item[k];
    baru.email = email;
    baru.nama = String(baru.nama || "").trim();
    if (!baru.nama) throw new GalatInput("Nama lengkap wajib diisi");
    if (baru.role !== "admin" && baru.role !== "staff") throw new GalatInput("Role tidak valid");
    if (baru.role === "admin") baru.kantor = "Semua";
    else if (!KANTOR.includes(baru.kantor)) throw new GalatInput("Kantor tidak valid");
    baru.aktif = baru.aktif !== false;
    if (baru.nip !== undefined && baru.nip !== "") {
      const d = digit(baru.nip);
      if (d.length < 8) throw new GalatInput("NIP minimal 8 angka");
      for (const [id, o] of semua) if (id !== email && digit(o.nip) === d) throw new GalatInput("NIP sudah terdaftar");
    }
    if (baru.foto != null && !(typeof baru.foto === "string" && baru.foto.startsWith("data:image/") && baru.foto.length <= FOTO_MAKS)) delete baru.foto;
    baru.hash = lama?.hash;
    if (typeof x.item.password === "string" && x.item.password) {
      if (x.item.password.length < 6 || x.item.password.length > MAKS_PASSWORD) throw new GalatInput("Password minimal 8 karakter");
      baru.hash = await hashPassword(x.item.password);
    }
    if (!baru.hash) throw new GalatInput("Password wajib diisi untuk akun baru");
    semua.set(email, baru);
    out.push({ id: email, item: baru });
  }
  const buang = [...new Set(hapus)].filter((id) => semua.has(id));
  for (const id of buang) {
    if (id === u.email) throw new GalatInput("Akun sendiri tidak bisa dihapus");
    semua.delete(id);
  }
  if ((out.length || buang.length) && ![...semua.values()].some((o) => o.role === "admin" && o.aktif !== false)) throw new GalatInput("Harus tersisa minimal satu admin aktif");
  return { kind: "list", replace: false, upsert: out, remove: buang };
}
