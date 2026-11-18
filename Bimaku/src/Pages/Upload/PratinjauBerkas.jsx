import { useEffect, useState } from "react";

const MAKS_TEKS = 20000; 
const jenisDari = (f) => {
  const n = f.asli || f.name || "", t = f.type || "";
  if (/\.pdf$/i.test(n) || t === "application/pdf") return "pdf";
  if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(n) || t.startsWith("image/")) return "gambar";
  if (/\.(txt|csv|tsv|log)$/i.test(n) || t === "text/plain" || t === "text/csv") return "teks";
  return "lain";
};
const ukuran = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB");
const ekst = (n) => (/\.([A-Za-z0-9]{1,8})$/.exec(n || "")?.[1] || "FILE").toUpperCase();

export default function PratinjauBerkas({ file, nama }) {
  const jenis = file ? jenisDari(file) : "";
  const [url, setUrl] = useState("");
  const [teks, setTeks] = useState("");

  useEffect(() => {
    setUrl(""); setTeks("");
    if (!file || (jenis !== "pdf" && jenis !== "teks")) return;
    let u = "", batal = false;
    fetch(file.data).then((r) => r.blob()).then(async (b) => {
      if (batal) return;
      if (jenis === "pdf") { u = URL.createObjectURL(new Blob([b], { type: "application/pdf" })); setUrl(u); }
      else { const t = await b.text(); if (!batal) setTeks(t.length > MAKS_TEKS ? t.slice(0, MAKS_TEKS) + "\n… (dipotong)" : t); }
    }).catch(() => {});
    return () => { batal = true; if (u) URL.revokeObjectURL(u); };
  }, [file?.data]); 

  return (
    <>
      <div className="up-pvh">
        <h3>Pratinjau berkas</h3>
        {file && <span>{ukuran(file.size)} · {ekst(file.asli)}</span>}
      </div>

      {!file && <div className="up-pv-kosong"><b>📄</b>Pilih file di kolom Upload file untuk melihat isinya di sini sebelum disimpan.</div>}

      {file && (
        <>
          <div className="up-pv-nama" title={file.asli}>
            <small>Disimpan sebagai</small>
            <b>{nama}</b>
          </div>

          {jenis === "pdf" && (url
            ? <><iframe className="up-pv-frame" src={url} title={"Pratinjau " + file.asli} /><a className="up-pv-link" href={url} target="_blank" rel="noreferrer">Buka di tab baru</a></>
            : <div className="up-pv-kosong">Memuat pratinjau…</div>)}
          {jenis === "gambar" && <div className="up-pv-img"><img src={file.data} alt={"Pratinjau " + file.asli} /></div>}
          {jenis === "teks" && <pre className="up-pv-teks">{teks || "Memuat pratinjau…"}</pre>}
          {jenis === "lain" && (
            <div className="up-pv-kosong">
              <span className="up-pv-ext">{ekst(file.asli)}</span>
              Pratinjau isi tidak tersedia untuk format ini karena browser tidak bisa membukanya. Berkas tetap bisa disimpan. Gunakan PDF agar isinya bisa dilihat di sini.
            </div>
          )}
        </>
      )}
    </>
  );
}
