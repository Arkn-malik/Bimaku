import { useRef, useState } from "react";
import { useApp } from "../../Context/AppContext";
import { toast } from "../../Utils/Helpers/ToastHelpers";
import { konfirmasi } from "../../Utils/Helpers/SwalHelpers";
import FotoEditor from "./FotoEditor";
import "../mockup.css";
import "../Upload/upload.css";
import "./profil.css";

const MAKS = 2 * 1024 * 1024;
const BOLEH = /\.(jpe?g|png)$/i;
const TIPE = ["image/jpeg", "image/png"];

export default function ProfilPage() {
  const { user, ubahFoto, ubahPassword } = useApp();
  const input = useRef(null);
  const [calon, setCalon] = useState(null); 
  const [editor, setEditor] = useState(null); 
  const [f, setF] = useState({ lama: "", baru: "", konfirm: "" });
  const [pesan, setPesan] = useState(null);
  const ini = user.nama.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const pilih = (b) => {
    if (!b) return;
    if (!BOLEH.test(b.name) || !TIPE.includes(b.type)) return toast("error", "Format foto harus JPG, JPEG, atau PNG");
    if (b.size > MAKS) return toast("error", "Ukuran foto maksimal 2 MB");
    const r = new FileReader();
    r.onload = () => setEditor(r.result); 
    r.readAsDataURL(b);
  };
  const hapusFoto = async () => {
    if (!await konfirmasi("Hapus foto profil?", "Foto akan dihapus dan diganti inisial nama Anda.")) return;
    const r = ubahFoto(null);
    if (!r.ok) return toast("error", r.msg);
    setCalon(null); toast("success", "Foto profil dihapus");
  };
  const simpanFoto = () => {
    const r = ubahFoto(calon);
    if (!r.ok) return toast("error", r.msg);
    setCalon(null); toast("success", user.foto ? "Foto profil diganti" : "Foto profil disimpan");
  };

  const kirim = async (e) => {
    e.preventDefault();
    if (!f.lama || !f.baru || !f.konfirm) return setPesan({ t: "Semua kolom wajib diisi." });
    if (f.baru !== f.konfirm) return setPesan({ t: "Konfirmasi password baru tidak cocok." });
    const r = await ubahPassword(f);
    if (!r.ok) return setPesan({ t: r.msg });
    setF({ lama: "", baru: "", konfirm: "" });
    setPesan({ t: "Password berhasil diubah. Gunakan password baru saat masuk berikutnya.", ok: true });
  };
  const cocok = f.konfirm && f.baru === f.konfirm;

  const kuat = (() => {
    const v = f.baru; if (!v) return 0;
    let n = 0; if (v.length >= 6) n++; if (v.length >= 10) n++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) n++; if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) n++;
    return Math.max(1, n);
  })();
  const NAMA_KUAT = ["", "Lemah", "Cukup", "Baik", "Kuat"];
  const tipe = "password";

  return (
    <>
      {user.wajibGanti && (
        <div className="pf-wajib" role="alert">
          <b>Ganti password dulu.</b> Anda masuk memakai password sementara dari admin. Demi keamanan arsip, buat password baru di bawah ini sebelum memakai menu lain.
        </div>
      )}
      <section className="pf-banner">
        <div className="pf-av pf-av-lg">{(calon || user.foto) ? <img src={calon || user.foto} alt="Foto profil" /> : <span>{ini}</span>}</div>
        <div className="pf-id">
          <h1>{user.nama}</h1>
          <p>{user.email}</p>
          <div className="pf-tags">
            <span className="pf-tag gold">{user.role === "admin" ? "Admin" : "Staff"}</span>
            <span className="pf-tag">{user.role === "admin" ? "Semua kantor" : "Kantor " + user.kantor}</span>
          </div>
        </div>
      </section>

      <div className="pf-layout">
        <section className="mk-card pf-card">
          <div className="mk-head"><div><h3>Foto profil</h3><p>JPG, JPEG, atau PNG · maks. 2 MB</p></div></div>
          <div className="pf-foto">
            <div className="pf-av">{(calon || user.foto) ? <img src={calon || user.foto} alt="" /> : <span>{ini}</span>}</div>
            <input ref={input} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" hidden onChange={(e) => { pilih(e.target.files[0]); e.target.value = ""; }} />
            {calon ? (
              <div className="pf-act2">
                <button type="button" className="up-simpan pf-btn" onClick={simpanFoto}>SIMPAN FOTO</button>
                <div className="pf-row">
                  <button type="button" className="up-simpan pf-btn ghost" onClick={() => setEditor(calon)}>POTONG LAGI</button>
                  <button type="button" className="mk-link" onClick={() => setCalon(null)}>Batal</button>
                </div>
              </div>
            ) : (
              <div className="pf-act2">
                <button type="button" className="up-simpan pf-btn" onClick={() => input.current.click()}>{user.foto ? "GANTI FOTO" : "UPLOAD FOTO"}</button>
                {user.foto && (
                  <div className="pf-row">
                    <button type="button" className="up-simpan pf-btn ghost" onClick={() => setEditor(user.foto)}>POTONG FOTO</button>
                    <button type="button" className="up-simpan pf-btn bahaya" onClick={hapusFoto}>HAPUS FOTO</button>
                  </div>
                )}
              </div>
            )}
            <small className="up-hint pf-hint">{calon ? "Pratinjau. Tekan Simpan foto untuk menggantikan foto lama." : "Foto baru otomatis menggantikan foto lama. Bisa dipotong (crop) sebelum disimpan."}</small>
          </div>
        </section>

        <form className="mk-card pf-card" onSubmit={kirim}>
          <div className="mk-head">
            <div><h3>Ubah password</h3><p>Masukkan password lama untuk konfirmasi, lalu password baru (minimal 8 karakter).</p></div>
          </div>
          <div className="up-grid pf-grid">
            <label className="up-f up-full"><span>Password lama</span>
              <input type={tipe} autoComplete="current-password" value={f.lama} onChange={(e) => setF({ ...f, lama: e.target.value })} placeholder="Password yang dipakai saat ini" /></label>
            <label className="up-f"><span>Password baru</span>
              <input type={tipe} autoComplete="new-password" value={f.baru} onChange={(e) => setF({ ...f, baru: e.target.value })} placeholder="Minimal 8 karakter" />
              {f.baru && <span className="pf-kuat" data-k={kuat}><i /><i /><i /><i /><em>{NAMA_KUAT[kuat]}</em></span>}</label>
            <label className="up-f"><span>Konfirmasi password baru</span>
              <input type={tipe} autoComplete="new-password" value={f.konfirm} onChange={(e) => setF({ ...f, konfirm: e.target.value })} placeholder="Ulangi password baru" />
              {f.konfirm && <small className={"pf-cek " + (cocok ? "ok" : "bad")}>{cocok ? "✓ Cocok dengan password baru" : "✗ Belum sama dengan password baru"}</small>}</label>
          </div>
          {pesan && <p className={"rf-msg" + (pesan.ok ? " ok" : "")} role="status">{pesan.t}</p>}
          <div><button type="submit" className="up-simpan pf-btn">SIMPAN PASSWORD</button></div>
        </form>
      </div>

      {editor && <FotoEditor sumber={editor} onTerapkan={(d) => { setCalon(d); setEditor(null); }} onBatal={() => setEditor(null)} />}
    </>
  );
}