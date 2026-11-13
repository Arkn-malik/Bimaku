import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { KANTOR, migrasiUser, migrasiArsip } from "../Data/Dummy";
import { muatRef, KUNCI_REF } from "../Utils/Referensi";
import { daftarKeDokumen, urutDaftar, kunciRow, dokKhusus } from "../Utils/DaftarTagihan";
import { useSinkron, server } from "../Utils/Sinkron";
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const bersihLokal = () => {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("ak_") && k !== "ak_ingat").forEach((k) => localStorage.removeItem(k));
    sessionStorage.removeItem("ak_user");
  } catch {}
};
const keluarPaksa = () => { bersihLokal(); window.location.assign("/login"); };
const kirimJson = async (url, body) => {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
  return { r, j: await r.json().catch(() => ({})) };
};
const GAGAL_JARINGAN = "Server tidak dapat dihubungi. Periksa koneksi internet lalu coba lagi.";

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return migrasiUser(JSON.parse(localStorage.getItem("ak_user") || sessionStorage.getItem("ak_user") || "null")); } catch { return null; }
  });
  const [users, setUsers] = useSinkron("users", [], { id: (u) => u.email, aktif: !!user, migrasi: (v) => v.map(migrasiUser) });
  const [semua, setSemua] = useSinkron("arsip", load("ak_arsip", []).map(migrasiArsip), { id: (a) => a.id, lokal: "ak_arsip", aktif: !!user, migrasi: (v) => v.map(migrasiArsip) });
  useEffect(() => {
    if (!user) return;
    let batal = false;
    fetch("/api/auth/me", { cache: "no-store" }).then(async (r) => {
      if (batal) return;
      if (r.status === 401) return keluarPaksa();
      if (r.ok) { const j = await r.json(); setUser(migrasiUser(j.user)); }
    }).catch(() => {});
    window.addEventListener("bimaku-401", keluarPaksa);
    return () => { batal = true; window.removeEventListener("bimaku-401", keluarPaksa); };
  }, [!!user]);
  useEffect(() => {
    try {
      const tetap = localStorage.getItem("ak_ingat") !== "0";
      const tujuan = tetap ? localStorage : sessionStorage;
      (tetap ? sessionStorage : localStorage).removeItem("ak_user");
      if (user) tujuan.setItem("ak_user", JSON.stringify(user)); else tujuan.removeItem("ak_user");
    } catch {}
  }, [user]);
  const [refDaftar, setRefDaftar] = useSinkron("ref_daftar", load("ak_ref_daftar", null) || muatRef().daftar || [], { id: kunciRow, lokal: "ak_ref_daftar", aktif: !!user });
  const [refLain, setRefLain] = useSinkron("ref_lain", (() => { const { daftar: _d, ...lain } = muatRef(); return lain; })(), { lokal: KUNCI_REF, aktif: !!user });
  const referensi = useMemo(() => ({ ...refLain, daftar: refDaftar }), [refLain, refDaftar]);

  const [notif, setNotif] = useSinkron("notif", load("ak_notif", []), { id: (n) => n.id, lokal: "ak_notif", aktif: !!user });
  const BATAS_NOTIF = 1000; 
  const catat = (n) => {
    if (!user || user.role === "admin") return;
    const baru = {
      id: "N" + Date.now() + Math.random().toString(36).slice(2, 6),
      waktu: new Date().toISOString(), dibaca: false, oleh: user.nama, kantor: user.kantor, ...n,
    };
    setNotif((l) => [baru, ...l].slice(0, BATAS_NOTIF));
  };
  const notifAdmin = user?.role === "admin" ? notif : [];
  const adminSaja = (fn) => (...args) => { if (user?.role === "admin") fn(...args); };
  const tandaiDibaca = adminSaja((id) => setNotif((l) => l.map((n) => (n.id === id && !n.dibaca ? { ...n, dibaca: true } : n))));
  const tandaiSemuaDibaca = adminSaja(() => setNotif((l) => l.map((n) => (n.dibaca ? n : { ...n, dibaca: true }))));
  const hapusNotif = adminSaja((id) => setNotif((l) => l.filter((n) => n.id !== id)));
  const bersihkanNotif = adminSaja(() => setNotif([]));

  const boleh = (kantor) => user && (user.role === "admin" || user.kantor === kantor);
  const arsip = semua.filter((a) => boleh(a.kantor));

  const daftar = urutDaftar((referensi.daftar || []).filter((r) => !r.kantor || boleh(r.kantor)));
  const daftarDok = daftar.map((r) => daftarKeDokumen(r, arsip, referensi));

  const norm = (e) => String(e || "").trim().toLowerCase();

  const digit = (v) => String(v || "").replace(/\D/g, "");
  const cekNip = (nip, kecuali) => {
    const d = digit(nip);
    if (d.length < 8) return "NIP wajib diisi (minimal 8 angka)";
    if (users.some((x) => x.email !== kecuali && digit(x.nip) === d)) return "NIP sudah terdaftar";
    return null;
  };

  const login = async (id, password, ingat = true) => {
    try {
      const { r, j } = await kirimJson("/api/auth/login", { id, password, ingat });
      if (r.status === 403 && j.error === "nonaktif") return "nonaktif";
      if (r.status === 429) return "terkunci";
      if (r.status === 401) return false;
      if (!r.ok) return "jaringan";
      try { localStorage.setItem("ak_ingat", ingat ? "1" : "0"); } catch {}
      setUser(migrasiUser(j.user));
      return true;
    } catch { return "jaringan"; }
  };

  const cekAkun = async (id, nama, kantor) => {
    try {
      const { r, j } = await kirimJson("/api/auth/cek", { id, nama, kantor });
      if (r.ok) return { ok: true };
      return { ok: false, msg: r.status === 429 ? j.error : r.status === 400 ? "Nama lengkap, NIP, atau kantor tidak cocok" : GAGAL_JARINGAN };
    } catch { return { ok: false, msg: GAGAL_JARINGAN }; }
  };

  const resetPassword = async ({ email, nama, kantor, password, konfirm }) => {
    try {
      const { r, j } = await kirimJson("/api/auth/reset", { id: email, nama, kantor, password, konfirm });
      return r.ok ? { ok: true, email: j.email } : { ok: false, msg: j.error || GAGAL_JARINGAN };
    } catch { return { ok: false, msg: GAGAL_JARINGAN }; }
  };

  const logout = async () => {
    try { await kirimJson("/api/auth/logout", {}); } catch {}
    keluarPaksa();
  };

  const ubahFoto = (foto) => {
    if (!user) return { ok: false, msg: "Belum masuk" };
    setUsers((us) => (us.some((x) => x.email === user.email) ? us.map((x) => (x.email === user.email ? { ...x, foto } : x)) : [...us, { ...user, foto }]));
    setUser((u) => ({ ...u, foto }));
    return { ok: true };
  };

  const ubahPassword = async ({ lama, baru, konfirm }) => {
    try {
      const { r, j } = await kirimJson("/api/auth/ganti-password", { lama, baru, konfirm });
      if (!r.ok) return { ok: false, msg: r.status === 429 ? j.error : j.error || GAGAL_JARINGAN };
      setUser((s) => ({ ...s, wajibGanti: false }));
      return { ok: true };
    } catch { return { ok: false, msg: GAGAL_JARINGAN }; }
  };

  useEffect(() => {
    if (!user) return;
    const u = users.find((x) => x.email === user.email);
    if (!u) return;
    if (u.aktif === false) { setUser(null); return; }
    const { password: _p, ...aman } = u;
    if (JSON.stringify(aman) !== JSON.stringify(user)) setUser(aman);
  }, [users]);

  const semuaUser = useMemo(() => (user?.role === "admin" ? users.map(({ password: _p, ...u }) => u) : []), [users, user]);
  const bukanAdmin = () => (user?.role === "admin" ? null : { ok: false, msg: "Hanya admin yang dapat mengelola user" });
  const adminAktifLain = (email) => users.filter((x) => x.role === "admin" && x.aktif !== false && x.email !== email).length;

  const buatUser = ({ nama, nip, email, role, kantor, password }) => {
    const g = bukanAdmin(); if (g) return g;
    const em = norm(email);
    if (!String(nama).trim()) return { ok: false, msg: "Nama lengkap wajib diisi" };
    const gn = cekNip(nip); if (gn) return { ok: false, msg: gn };
    if (!/^\S+@\S+\.\S+$/.test(em)) return { ok: false, msg: "Format email tidak valid" };
    if (users.some((x) => x.email === em)) return { ok: false, msg: "Email sudah terdaftar" };
    if (role !== "admin" && role !== "staff") return { ok: false, msg: "Pilih role" };
    const k = role === "admin" ? "Semua" : kantor;
    if (role === "staff" && !KANTOR.includes(k)) return { ok: false, msg: "User biasa harus dipilih satu kantor" };
    if (String(password).length < 6) return { ok: false, msg: "Password minimal 8 karakter" };
    setUsers((us) => [...us, { email: em, password, nama: String(nama).trim(), nip: String(nip || "").trim(), role, kantor: k, aktif: true, wajibGanti: true }]);
    return { ok: true, email: em };
  };

  const ubahUser = (email, { nama, nip, role, kantor }) => {
    const g = bukanAdmin(); if (g) return g;
    const u = users.find((x) => x.email === email); if (!u) return { ok: false, msg: "User tidak ditemukan" };
    if (!String(nama).trim()) return { ok: false, msg: "Nama lengkap wajib diisi" };
    const gn = cekNip(nip, email); if (gn) return { ok: false, msg: gn };
    if (role !== u.role) {
      if (email === user.email) return { ok: false, msg: "Role akun sendiri tidak bisa diubah" };
      if (u.role === "admin" && !adminAktifLain(email)) return { ok: false, msg: "Harus tersisa minimal satu admin aktif" };
    }
    const k = role === "admin" ? "Semua" : kantor;
    if (role === "staff" && !KANTOR.includes(k)) return { ok: false, msg: "User biasa harus dipilih satu kantor" };
    setUsers((us) => us.map((x) => (x.email === email ? { ...x, nama: String(nama).trim(), nip: String(nip || "").trim(), role, kantor: k } : x)));
    return { ok: true };
  };

  const resetPasswordUser = (email, password) => {
    const g = bukanAdmin(); if (g) return g;
    if (!users.some((x) => x.email === email)) return { ok: false, msg: "User tidak ditemukan" };
    if (String(password).length < 6) return { ok: false, msg: "Password minimal 8 karakter" };
    setUsers((us) => us.map((x) => (x.email === email ? { ...x, password, wajibGanti: true } : x)));
    return { ok: true };
  };

  const setAktifUser = (email, aktif) => {
    const g = bukanAdmin(); if (g) return g;
    const u = users.find((x) => x.email === email); if (!u) return { ok: false, msg: "User tidak ditemukan" };
    if (!aktif) {
      if (email === user.email) return { ok: false, msg: "Akun sendiri tidak bisa dinonaktifkan" };
      if (u.role === "admin" && !adminAktifLain(email)) return { ok: false, msg: "Harus tersisa minimal satu admin aktif" };
    }
    setUsers((us) => us.map((x) => (x.email === email ? { ...x, aktif } : x)));
    return { ok: true };
  };

  const hapusUser = (email) => {
    const g = bukanAdmin(); if (g) return g;
    const u = users.find((x) => x.email === email); if (!u) return { ok: false, msg: "User tidak ditemukan" };
    if (email === user.email) return { ok: false, msg: "Akun sendiri tidak bisa dihapus" };
    if (u.role === "admin" && !adminAktifLain(email)) return { ok: false, msg: "Harus tersisa minimal satu admin aktif" };
    setUsers((us) => us.filter((x) => x.email !== email));
    return { ok: true };
  };

  const ubahRef = (next) => {
    if (user?.role !== "admin") return { ok: false, msg: "Hanya admin yang dapat mengubah referensi" };
    const { daftar, ...lain } = next;
    setRefDaftar(daftar || []);
    if (JSON.stringify(lain) !== JSON.stringify(refLain)) setRefLain(lain);
    return { ok: true };
  };

  const tambahRefKontrak = (row, jenisDok = "Kontrak") => { 
    if (!boleh(row.kantor)) return { ok: false, msg: "Tidak punya akses ke kantor ini" };
    const baris = { ...row, jenisDok };
    setRefDaftar((d) => [...d.filter((r) => kunciRow(r) !== kunciRow(baris)), baris]);
    return { ok: true };
  };

  const simpan = (data, editId, { tanpaNotif = false } = {}) => {
    if (!boleh(data.kantor)) return { ok: false, msg: "Tidak punya akses ke kantor ini" };
    const lama = editId ? semua.find((a) => a.id === editId) : null;
    const id = editId || "A" + Date.now();
    const next = editId ? semua.map((a) => (a.id === editId ? { ...a, ...data } : a)) : [{ ...data, id }, ...semua];
    if (!server.aktif && !save("ak_arsip", next)) return { ok: false, msg: "Penyimpanan browser penuh, berkas tidak tersimpan. Hapus berkas lama atau unggah file yang lebih kecil." };
    setSemua(next);
    if (!tanpaNotif && data.file && data.file.data !== lama?.file?.data) {
      catat({ judul: lama ? "Dokumen diganti dengan versi terbaru" : "Dokumen baru diunggah", pesan: `${data.judul || data.nomor} · ${data.file.name}`, arsipId: id });
    }
    return { ok: true };
  };

  const hapus = (a) => {
    if (user.role !== "admin") return;
    setSemua((s) => s.filter((x) => x.id !== a.id));
  };

  const hapusDokumen = (d) => {
    if (user.role !== "admin") return { ok: false, msg: "Hanya admin yang dapat menghapus dokumen" };
    const baris = (refDaftar || []).find((r) => "SPM-" + kunciRow(r) === d.id);
    if (!baris || !dokKhusus(baris)) return { ok: false, msg: "Hanya data kontrak dan pengadaan yang bisa dihapus dari sini" };
    if (d.arsipId) setSemua((s) => s.filter((x) => x.id !== d.arsipId));
    setRefDaftar((l) => l.filter((r) => kunciRow(r) !== kunciRow(baris)));
    return { ok: true };
  };

  return (
    <Ctx.Provider value={{ user, arsip, daftar, daftarDok, referensi, ubahRef, tambahRefKontrak, semuaUser, buatUser, ubahUser, resetPasswordUser, setAktifUser, hapusUser, login, cekAkun, resetPassword, logout, ubahFoto, ubahPassword, simpan, hapus, hapusDokumen, notif: notifAdmin, tandaiDibaca, tandaiSemuaDibaca, hapusNotif, bersihkanNotif }}>
      {children}
    </Ctx.Provider>
  );
}