import { useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useApp } from "../../Context/AppContext";
import { KANTOR } from "../../Data/Dummy";
import { toast } from "../../Utils/Helpers/ToastHelpers";
import { konfirmasi } from "../../Utils/Helpers/SwalHelpers";
import "../mockup.css";
import "../Upload/upload.css";
import "./user.css";

const PER_HAL = 6;
const HURUF = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; 
const acak = (n = 10) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => HURUF[x % HURUF.length]).join("");
const awal = () => ({ nama: "", nip: "", email: "", role: "staff", kantor: "", password: acak() });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const WARNA = ["#0f766e", "#0284c7", "#d97706", "#7c3aed", "#be185d", "#475569"];
const warna = (s) => WARNA[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % WARNA.length];
const inisial = (n) => String(n).split(" ").filter(Boolean).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

const Ic = ({ children, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IcEdit = () => <Ic><path d="M11 4H5a2 2 0 00-2 2v13a2 2 0 002 2h13a2 2 0 002-2v-6" /><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></Ic>;
const IcKey = () => <Ic><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L21 2M16 7l3 3M14 9l2 2" /></Ic>;
const IcNonaktif = () => <Ic><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M17 8l5 5M22 8l-5 5" /></Ic>;
const IcHapus = () => <Ic><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6" /></Ic>;
const IcAktif = () => <Ic><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16.5 11l2 2 4-4" /></Ic>;
const IcCari = () => <Ic s={17}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Ic>;
const IcPin = () => <Ic s={14}><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Ic>;
const IcMata = ({ buka }) => buka
  ? <Ic s={17}><path d="M17.9 17.9A10.8 10.8 0 0112 20C5 20 1 12 1 12a18.5 18.5 0 015.1-5.9M9.9 4.2A10 10 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.2M1 1l22 22" /></Ic>
  : <Ic s={17}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></Ic>;
const IcAcak = () => <Ic s={15}><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></Ic>;
const IcTambah = () => <Ic s={17}><path d="M12 5v14M5 12h14" /></Ic>;
const IcPerisai = () => <Ic s={22}><path d="M12 3l8 3v6c0 4.4-3.1 8-8 9-4.9-1-8-4.6-8-9V6l8-3z" /></Ic>;
const IcUserTambah = () => <Ic s={17}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M19 8v6M16 11h6" /></Ic>;

export default function UserPage() {
  const { user, semuaUser, buatUser, ubahUser, resetPasswordUser, setAktifUser, hapusUser } = useApp();
  const [f, setF] = useState(awal);
  const [edit, setEdit] = useState(null); 
  const [lihat, setLihat] = useState(false);
  const [q, setQ] = useState("");
  const [kf, setKf] = useState("");
  const [hal, setHal] = useState(1);
  const form = useRef(null);
  const nama = useRef(null);
  const set = (patch) => setF((p) => ({ ...p, ...patch }));

  const daftar = useMemo(() => [...semuaUser].sort((a, b) => (a.role === b.role ? 0 : a.role === "admin" ? -1 : 1) || a.nama.localeCompare(b.nama)), [semuaUser]);
  const cocok = daftar.filter((u) => (!kf || u.kantor === kf)
    && (!q.trim() || `${u.nama} ${u.email} ${u.nip || ""}`.toLowerCase().includes(q.trim().toLowerCase())));
  const jumlahHal = Math.max(1, Math.ceil(cocok.length / PER_HAL));
  const halIni = Math.min(hal, jumlahHal);
  const baris = cocok.slice((halIni - 1) * PER_HAL, halIni * PER_HAL);

  const fokusForm = () => { form.current?.scrollIntoView({ behavior: "smooth", block: "start" }); setTimeout(() => nama.current?.focus(), 250); };
  const mulaiBaru = () => { setEdit(null); setF(awal()); setLihat(false); fokusForm(); };
  const mulaiEdit = (u) => {
    setEdit(u.email);
    setF({ nama: u.nama, nip: u.nip || "", email: u.email, role: u.role, kantor: u.kantor === "Semua" ? "" : u.kantor, password: "" });
    fokusForm();
  };
  const batal = () => { setEdit(null); setF(awal()); setLihat(false); };

  const tampilKredensial = async (judul, email, pw) => {
    const r = await Swal.fire({
      title: judul, icon: "success", showCancelButton: true, confirmButtonText: "Salin kredensial", cancelButtonText: "Tutup",
      html: `<div class="ku-cred"><div><small>Email</small><b>${esc(email)}</b></div><div><small>Password sementara</small><code>${esc(pw)}</code></div></div>
             <p class="ku-cred-note">Berikan kepada pengguna. Saat pertama kali masuk, ia wajib menggantinya di halaman Profil saya.</p>`,
    });
    if (r.isConfirmed) {
      try { await navigator.clipboard.writeText(`Email: ${email}\nPassword sementara: ${pw}`); toast("success", "Kredensial disalin"); }
      catch { toast("error", "Tidak bisa menyalin otomatis, salin manual dari kotak tadi"); }
    }
  };

  const kirim = (e) => {
    e.preventDefault();
    if (edit) {
      const r = ubahUser(edit, f);
      if (!r.ok) return toast("error", r.msg);
      toast("success", "Perubahan user disimpan");
      return batal();
    }
    const r = buatUser(f);
    if (!r.ok) return toast("error", r.msg);
    tampilKredensial("Akun berhasil dibuat", r.email, f.password);
    setF(awal()); setLihat(false);
  };

  const reset = async (u) => {
    if (!await konfirmasi(`Reset password ${u.nama}?`, "Password sementara baru akan dibuat. Password lama tidak berlaku lagi dan user wajib menggantinya saat masuk.")) return;
    const pw = acak();
    const r = resetPasswordUser(u.email, pw);
    if (!r.ok) return toast("error", r.msg);
    tampilKredensial("Password berhasil direset", u.email, pw);
  };

  const ubahStatus = async (u) => {
    const aktifkan = u.aktif === false;
    const ok = await konfirmasi(aktifkan ? `Aktifkan kembali ${u.nama}?` : `Nonaktifkan ${u.nama}?`,
      aktifkan ? "User bisa masuk lagi ke BIMAKU." : "User tidak akan bisa masuk (dan langsung keluar bila sedang masuk) sampai diaktifkan kembali.");
    if (!ok) return;
    const r = setAktifUser(u.email, aktifkan);
    if (!r.ok) return toast("error", r.msg);
    toast("success", aktifkan ? "User diaktifkan" : "User dinonaktifkan");
  };

  const hapus = async (u) => {
    if (!await konfirmasi(`Hapus akun ${u.nama}?`, "Akun akan dihapus permanen dan tidak bisa dikembalikan. User langsung tidak bisa masuk lagi. Arsip yang pernah ia unggah tetap tersimpan. Bila hanya ingin menutup akses sementara, gunakan Nonaktifkan.")) return;
    const r = hapusUser(u.email);
    if (!r.ok) return toast("error", r.msg);
    if (edit === u.email) batal();
    toast("success", "Akun dihapus");
  };

  return (
    <>
      <section className="ku-hero">
        <span className="ku-hero-ic" aria-hidden="true"><IcUserTambah /></span>
        <div className="ku-hero-tx">
          <h1>Pengurusan Akun User <em>Admin only</em></h1>
          <p>Pendaftaran akun pengguna hanya dapat dilakukan oleh <b>Administrator</b>. Pengguna biasa tidak dapat mendaftar sendiri demi menjaga keamanan data arsip &amp; kontrak kerja.</p>
        </div>
        <button type="button" className="ku-hero-btn" onClick={mulaiBaru}><IcTambah /> Buat akun baru</button>
      </section>

      <div className="ku-grid">
        <form className="ku-card ku-form" ref={form} onSubmit={kirim} autoComplete="off">
          <div className="ku-card-h">
            <h2><IcUserTambah /> {edit ? "Ubah data user" : "Tambah user baru"}</h2>
            <span className="ku-chip">Form admin</span>
          </div>

          <label className="up-f"><span>Nama lengkap <i>*</i></span>
            <input ref={nama} value={f.nama} onChange={(e) => set({ nama: e.target.value })} placeholder="Masukkan Nama Lengkap" required /></label>

          <label className="up-f"><span>NIP / ID pegawai <i>*</i></span>
            <input value={f.nip} onChange={(e) => set({ nip: e.target.value })} placeholder="Masukkan NIP Anda" inputMode="numeric" required />
            <small className="ku-hint">NIP dipakai user untuk masuk (login).</small></label>

          <label className="up-f"><span>Email  <i>*</i></span>
            <input type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="Masukkan Email" disabled={!!edit} required /></label>

          <label className="up-f"><span>Role / hak akses <i>*</i></span>
            <select value={f.role} onChange={(e) => set({ role: e.target.value })}>
              <option value="staff">User (hanya akses standar arsip)</option>
              <option value="admin">Admin (kendali akses penuh)</option>
            </select></label>

          <label className="up-f"><span>Akses unit kantor <i>*</i></span>
            {f.role === "admin" ? (
              <select value="Semua" disabled><option value="Semua">Semua kantor (khusus HQ/admin)</option></select>
            ) : (
              <select value={f.kantor} onChange={(e) => set({ kantor: e.target.value })} required>
                <option value="">Pilih kantor…</option>
                {KANTOR.map((k) => <option key={k} value={k}>Kantor {k}</option>)}
              </select>
            )}</label>

          {!edit && (
            <div className="up-f">
              <span className="ku-pw-h"><span>Password sementara <i>*</i></span>
                <button type="button" className="ku-acak" onClick={() => { set({ password: acak() }); setLihat(true); }}><IcAcak /> Acak password</button></span>
              <div className="ku-pw">
                <input value={f.password} onChange={(e) => set({ password: e.target.value })} type={lihat ? "text" : "password"} className="ku-mono" autoComplete="new-password" required minLength={6} aria-label="Password sementara" />
                <button type="button" className="ku-mata" onClick={() => setLihat((v) => !v)} aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}><IcMata buka={lihat} /></button>
              </div>
              <small className="ku-hint">User wajib mengganti password saat pertama kali login.</small>
            </div>
          )}

          <button type="submit" className="ku-kirim">{edit ? "Simpan perubahan" : "Buat akun sekarang"}</button>
          {edit && <button type="button" className="ku-batal" onClick={batal}>Batal ubah</button>}
        </form>

        <div className="ku-kanan">
          <div className="ku-card ku-filter">
            <label className="ku-cari"><IcCari />
              <input value={q} onChange={(e) => { setQ(e.target.value); setHal(1); }} placeholder="Cari nama, email, NIP…" aria-label="Cari user" /></label>
            <select value={kf} onChange={(e) => { setKf(e.target.value); setHal(1); }} aria-label="Filter kantor">
              <option value="">Semua kantor</option>
              {KANTOR.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <span className="ku-total">Total user: <b>{daftar.length}</b></span>
          </div>

          <div className="ku-card ku-tabel">
            <div className="ku-scroll">
              <table>
                <thead><tr><th>Pengguna</th><th>Role</th><th>Akses kantor</th><th>Status</th><th className="ku-ctr">Aksi admin</th></tr></thead>
                <tbody>
                  {baris.map((u) => {
                    const nonaktif = u.aktif === false;
                    const saya = u.email === user.email;
                    return (
                      <tr key={u.email} className={nonaktif ? "mati" : ""}>
                        <td>
                          <div className="ku-orang">
                            <span className="ku-av" style={{ background: warna(u.email) }}>{u.foto ? <img src={u.foto} alt="" /> : inisial(u.nama)}</span>
                            <div>
                              <b>{u.nama}{saya && <em className="ku-saya">Anda</em>}</b>
                              <code>{u.email}</code>
                              {u.nip && <small>NIP: {u.nip}</small>}
                              {u.wajibGanti && <small className="ku-sem">Belum ganti password sementara</small>}
                            </div>
                          </div>
                        </td>
                        <td><span className={"ku-role " + (u.role === "admin" ? "admin" : "user")}>{u.role === "admin" ? "Admin" : "User"}</span></td>
                        <td><span className="ku-kantor"><IcPin /> {u.kantor === "Semua" ? "Semua kantor" : "Kantor " + u.kantor}</span></td>
                        <td><span className={"ku-pill " + (nonaktif ? "off" : "on")}><i />{nonaktif ? "Nonaktif" : "Aktif"}</span></td>
                        <td>
                          <div className="ku-aksi">
                            <button type="button" className="ku-a edit" title="Ubah data" aria-label={"Ubah " + u.nama} onClick={() => mulaiEdit(u)}><IcEdit /></button>
                            <button type="button" className="ku-a key" title="Reset password" aria-label={"Reset password " + u.nama} onClick={() => reset(u)}><IcKey /></button>
                            <button type="button" className={"ku-a " + (nonaktif ? "aktif" : "nonaktif")} title={nonaktif ? "Aktifkan" : "Nonaktifkan"} aria-label={(nonaktif ? "Aktifkan " : "Nonaktifkan ") + u.nama}
                              disabled={saya} onClick={() => ubahStatus(u)}>{nonaktif ? <IcAktif /> : <IcNonaktif />}</button>
                            <button type="button" className="ku-a hapus" title="Hapus akun" aria-label={"Hapus " + u.nama}
                              disabled={saya} onClick={() => hapus(u)}><IcHapus /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!baris.length && <tr><td colSpan={5} className="ku-kosong">Tidak ada user yang cocok.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="ku-kaki">
              <span>{cocok.length ? `Menampilkan ${(halIni - 1) * PER_HAL + 1}–${Math.min(halIni * PER_HAL, cocok.length)} dari ${cocok.length} pengguna terdaftar` : "Tidak ada data"}</span>
              {jumlahHal > 1 && (
                <div className="ku-hal">
                  <button type="button" disabled={halIni === 1} onClick={() => setHal(halIni - 1)} aria-label="Halaman sebelumnya">‹</button>
                  {Array.from({ length: jumlahHal }, (_, i) => i + 1).map((n) => (
                    <button key={n} type="button" className={n === halIni ? "on" : ""} onClick={() => setHal(n)}>{n}</button>
                  ))}
                  <button type="button" disabled={halIni === jumlahHal} onClick={() => setHal(halIni + 1)} aria-label="Halaman berikutnya">›</button>
                </div>
              )}
            </div>
          </div>

          <div className="ku-kebijakan">
            <IcPerisai />
            <div>
              <b>Kebijakan pembuatan akun BIMAKU</b>
              <p>Setiap akun pengguna yang baru dibuat mendapat <b>password sementara</b>. Saat pengguna pertama kali login, sistem otomatis memaksanya memperbarui kata sandi di halaman <b>Profil saya</b> demi privasi dan keamanan berkas arsip. Akun yang <b>dinonaktifkan</b> tidak bisa masuk, dan reset password oleh admin juga mewajibkan penggantian saat login berikutnya.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
