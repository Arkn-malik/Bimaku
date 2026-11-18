import { useEffect, useState } from "react";
import { useApp } from "../../Context/AppContext";
import { KANTOR } from "../../Data/Dummy";
import { toast } from "../../Utils/Helpers/ToastHelpers";
import { info } from "../../Utils/Helpers/SwalHelpers";
import { Logo, Wordmark } from "../../Components/Logo";
import { useTampilan } from "../../Utils/Tampilan";
import "./login.css";

const Ic = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const User = (p) => <Ic {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Ic>;
const Mail = (p) => <Ic {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Ic>;
const Lock = (p) => <Ic {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></Ic>;
const Eye = (p) => <Ic {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Ic>;
const EyeOff = (p) => <Ic {...p}><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6A17 17 0 002 12s3.6 7 10 7a10 10 0 004.2-.9" /></Ic>;
const Arrow = (p) => <Ic {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Ic>;
const Back = (p) => <Ic {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Ic>;
const Pin = (p) => <Ic {...p}><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Ic>;
const Key = (p) => <Ic {...p}><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2" /></Ic>;
const InfoIc = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Ic>;
const Help = (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-.8.6-1.5 1-1.5 2M12 17h.01" /></Ic>;

const kekuatan = (p) =>
  [p.length >= 6, p.length >= 10, /\d/.test(p) && /[a-zA-Z]/.test(p), /[^a-zA-Z0-9]/.test(p) || (/[A-Z]/.test(p) && /[a-z]/.test(p))].filter(Boolean).length;
const LABEL = ["", "Lemah", "Cukup", "Bagus", "Kuat"];

const FAQ = [
  ["Bagaimana cara mendapatkan akun?", "Akun dibuat oleh admin. Silakan hubungi admin atau helpdesk kantor Anda untuk dibuatkan akun."],
  ["Bagaimana jika saya lupa kata sandi/password akun saya? ?", "Klik tautan “Lupa kata sandi?” di halaman masuk, lalu verifikasi dengan nama lengkap, NIP, dan kantor Anda. Setelah cocok, Anda bisa membuat password baru. Akun admin tidak bisa direset sendiri, silakan hubungi helpdesk."],
  ["Apa yang harus saya lakukan jika mengalami kendala atau error saat menggunakan aplikasi?", "Pastikan koneksi internet Anda stabil dan lakukan refresh pada halaman browser Anda. Jika masalah berlanjut, Anda dapat menghubungi tim dukungan kami."],
  ["Fitur apa saja yang tersedia di Bimaku?", "Bimaku menyediakan berbagai fitur navigasi dan halaman interaktif yang terintegrasi untuk mendukung kenyamanan pengguna dalam mengakses layanan utama aplikasi."],
  ["Ke mana saya meminta bantuan?", "Hubungi helpdesksemarang@kemenkeu.go.id atau WhatsApp 081572192192."],
];

function Field({ label, icon, aside, d = 0, children }) {
  return (
    <div className="sx-in" style={{ "--d": d + "s" }}>
      <div className="sx-lab"><span>{label}</span></div>
      <div className="sx-box"><i>{icon}</i>{children}</div>
      {aside && <div className="sx-aside">{aside}</div>}
    </div>
  );
}

const kosong = { nama: "", email: "", password: "", konfirm: "", kantor: KANTOR[0] };
let introSelesai = false; 
const kurangiGerak = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function Login() {
  const { login, cekAkun, resetPassword } = useApp();
  const tampil = useTampilan();
  const [fase, setFase] = useState(introSelesai || kurangiGerak ? "siap" : "intro");
  const [mode, setMode] = useState("masuk"); 
  const [lihat, setLihat] = useState(false);
  const [ingat, setIngat] = useState(true);
  const [goyang, setGoyang] = useState(false);
  const [f, setF] = useState(kosong);
  const [faq, setFaq] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    if (fase === "intro") { const t = setTimeout(() => setFase("keluar"), 2400); return () => clearTimeout(t); }
    if (fase === "keluar") { const t = setTimeout(() => { introSelesai = true; setFase("siap"); }, 700); return () => clearTimeout(t); }
  }, [fase]);

  useEffect(() => {
    if (!faq) return;
    const esc = (e) => e.key === "Escape" && setFaq(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [faq]);

  const ke = (m, email = "") => { setMode(m); setLihat(false); setF({ ...kosong, email }); };
  const gagal = (msg) => { toast("error", msg); setGoyang(true); setTimeout(() => setGoyang(false), 500); };

  const [proses, setProses] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (proses) return;
    setProses(true);
    try { await kirim(); } finally { setProses(false); }
  };
  const kirim = async () => {
    if (mode === "masuk") {
      const r = await login(f.email, f.password, ingat);
      if (r === "nonaktif") gagal("Akun Anda dinonaktifkan. Hubungi admin.");
      else if (r === "terkunci") gagal("Terlalu banyak percobaan. Coba lagi dalam 15 menit.");
      else if (r === "jaringan") gagal("Server tidak dapat dihubungi. Periksa koneksi internet.");
      else if (!r) gagal("NIP atau password salah");
      return;
    }
    if (mode === "lupa") {
      const c = await cekAkun(f.email, f.nama, f.kantor);
      if (!c.ok) return gagal(c.msg);
      toast("success", "Akun terverifikasi, silakan buat password baru");
      setMode("ubah_password"); setLihat(false); setF({ ...f, password: "", konfirm: "" });
      return;
    }
    const r = await resetPassword(f);
    if (!r.ok) return gagal(r.msg);
    toast("success", "Password diganti, silakan masuk");
    ke("masuk", r.email);
  };

  const judul = {
    masuk: ["Silahkan Masuk", "Basis Informasi Manajemen Arsip Keuangan"],
    lupa: ["Lupa password?", "Masukkan nama lengkap, NIP, dan kantor akun Anda untuk verifikasi."],
    ubah_password: ["Buat password baru", "Akun terverifikasi. Silakan buat password baru Anda."],
  }[mode];
  const level = kekuatan(f.password);
  const tombol = { masuk: "Masuk", lupa: "Verifikasi Akun", ubah_password: "Simpan password baru" }[mode];

  const panel = {
    masuk: ["Selamat Datang", "Selamat datang di " + tampil.judul + ". Silakan masuk untuk mulai mengelola arsip & kontrak Anda."],
    lupa: ["Ingat Password Anda?", "Jika sudah ingat, silakan kembali ke halaman masuk.", "Kembali masuk", "masuk"],
    ubah_password: ["Hampir Selesai!", "Buat password baru yang kuat. Dan silahkan masuk kembali.", "Kembali masuk", "masuk"],
  }[mode];

  return (
    <div className={"sx-page" + (fase === "intro" ? "" : " ready")}>
      {fase !== "siap" && (
        <div className={"sx-splash" + (fase === "keluar" ? " out" : "")} onClick={() => setFase("keluar")}>
          <div className="sx-core">
            <span className="sx-ring" /><span className="sx-ring r2" />
            <Logo size={96} className="sx-pop" />
          </div>
          <h1 className="sx-name">
            {tampil.judul.split("").map((c, i) => <span key={i} className={i < tampil.judul.split("-")[0].length ? "si" : ""} style={{ animationDelay: 0.5 + i * 0.07 + "s" }}>{c}</span>)}
          </h1>
          <p className="sx-stag">Solusi arsip Digital, tanpa kertas, tanpa cemas</p>
          <div className="sx-bar"><i /></div>
          <button className="sx-skip" type="button">Lewati</button>
        </div>
      )}

      <section className="sx-left">
        <div className="sx-bg" /><div className="sx-blob sx-b1" /><div className="sx-blob sx-b2" /><div className="sx-blob sx-b3" />
        <div className="sx-brand sx-in"><Logo size={44} polos /><Wordmark /></div>
        <nav className="sx-links sx-in" style={{ "--d": ".1s" }}>
          <button type="button" onClick={() => info("Tentang " + tampil.judul, tampil.judul + " adalah sistem arsip, penagihan dan kontrak kerja untuk kantor wilayah Yogyakarta, Semarang, dan Bandung.")}><InfoIc size={16} /> Tentang Kami</button>
          <button type="button" onClick={() => info("Bantuan", "Jika butuh bantuan silahkan hubungi layanan Kami atau bisa melalui email: helpdesksemarang@kemenkeu.go.id dan WA: 081572192192.")}><Help size={16} /> Bantuan</button>
        </nav>

        <div className="sx-card">
          <span className="sx-logo"><Logo size={76} polos /></span>
          <h1>{judul[0]}</h1>
          <p className="sx-sub">{judul[1]}</p>

          {(mode === "lupa" || mode === "ubah_password") && (
            <div className="sx-steps"><i className="on" /><i className={mode === "ubah_password" ? "on" : ""} /></div>
          )}

          <form key={mode} className={"sx-form" + (goyang ? " sx-shake" : "")} onSubmit={submit}>
            {mode === "lupa" && (
              <Field label="Nama lengkap" icon={<User size={18} />} d={0.05}>
                <input placeholder="Masukkan Nama lengkap Anda" aria-label="Nama lengkap" value={f.nama} onChange={set("nama")} required autoFocus />
              </Field>
            )}
            {mode !== "ubah_password" && (
              <Field label="NIP" icon={<User size={18} />} d={0.12}>
                <input type="text" placeholder="Masukkan NIP Anda" aria-label="NIP" value={f.email} onChange={set("email")} required autoComplete="username" autoFocus={mode === "masuk"} />
              </Field>
            )}
            {mode === "lupa" && (
              <Field label="Kantor" icon={<Pin size={18} />} d={0.19}>
                <select aria-label="Kantor" value={f.kantor} onChange={set("kantor")}>{KANTOR.map((k) => <option key={k}>{k}</option>)}</select>
              </Field>
            )}
            {mode !== "lupa" && (
              <Field label={mode === "masuk" ? "Password" : "Password baru"} icon={<Lock size={18} />} d={0.26}
                aside={mode === "masuk" && <button type="button" className="sx-link" onClick={() => ke("lupa", f.email)}>Lupa kata sandi?</button>}>
                <input type={lihat ? "text" : "password"} placeholder={mode === "masuk" ? "Kata Sandi" : "Masukkan Password Anda"} aria-label="Password" value={f.password} onChange={set("password")} required
                  minLength={mode !== "masuk" ? 6 : undefined} autoComplete={mode === "masuk" ? "current-password" : "new-password"} autoFocus={mode === "ubah_password"} />
                <button type="button" className="sx-eye" aria-label={lihat ? "Sembunyikan password" : "Lihat password"} onClick={() => setLihat(!lihat)}>
                  {lihat ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </Field>
            )}
            {mode === "ubah_password" && f.password && (
              <div className="sx-meter sx-in" style={{ "--d": "0s" }}>
                {[1, 2, 3, 4].map((n) => <i key={n} className={level >= n ? "l" + level : ""} />)}
                <small>{LABEL[level]}</small>
              </div>
            )}
            {mode === "ubah_password" && (
              <Field label="Konfirmasi password baru" icon={<Key size={18} />} d={0.33}>
                <input type={lihat ? "text" : "password"} placeholder="Ulangi password baru Anda" aria-label="Konfirmasi password baru" value={f.konfirm} onChange={set("konfirm")} required minLength={6} autoComplete="new-password" />
              </Field>
            )}
            {mode === "masuk" && (
              <label className="sx-check sx-in" style={{ "--d": ".26s" }}>
                <input type="checkbox" checked={ingat} onChange={(e) => setIngat(e.target.checked)} /> Ingat Saya
              </label>
            )}
            <div className="sx-in" style={{ "--d": ".33s" }}>
              <button type="submit" className="sx-submit" disabled={proses}>{proses ? "Memproses..." : tombol} {mode !== "masuk" && <Arrow size={16} />}</button>
            </div>
          </form>

          {mode !== "masuk" && (
            <div className="sx-foot">
              <button type="button" className="sx-back" onClick={() => ke("masuk", f.email)}><Back size={14} /> Kembali ke halaman masuk</button>
            </div>
          )}
        </div>
      </section>

            <aside className="sx-right">
        <span className="sx-rdots" aria-hidden="true" />

        {/* FAQ */}
        <button type="button" className="sx-faqbtn sx-faqtop" onClick={() => setFaq(true)}>
          <Help size={15} /> FAQ
        </button>

        <div className="sx-r-in sx-in" style={{ "--d": ".2s" }} key={mode}>
          <span className="sx-eyebrow"><i />Arsip &amp; kontrak digital</span>
          <h2>{panel[0]}</h2>
          <p>{panel[1]}</p>
          {panel[2] && <button type="button" className="sx-top" onClick={() => ke(panel[3])}>{panel[2]} <Arrow size={16} /></button>}
          <div className="sx-offices">
            {KANTOR.map((k) => <span key={k}><Pin size={14} />{k}</span>)}
          </div>
        </div>

        {/* footer: hanya hak cipta */}
        <div className="sx-rfoot">
          <span>© {new Date().getFullYear()} {tampil.judul}. By Arkan Malik Al Saleh & Friends.</span>
        </div>

        {faq && (
          <div className="sx-faq" onClick={() => setFaq(false)}>
            <div className="sx-faq-card" role="dialog" aria-modal="true" aria-label="Pertanyaan yang sering diajukan" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="sx-faq-x" aria-label="Tutup" onClick={() => setFaq(false)}>×</button>
              <h3>Pertanyaan yang sering diajukan</h3>
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <div>{a}</div>
                </details>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}