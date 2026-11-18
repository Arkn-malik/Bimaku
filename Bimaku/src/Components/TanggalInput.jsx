import { useEffect, useRef, useState } from "react";
import { tglUI, dariUI } from "../Utils/Tanggal";

export default function TanggalInput({ value, onChange, required, label = "Tanggal" }) {
  const [teks, setTeks] = useState(value ? tglUI(value) : "");
  const picker = useRef(null);

  useEffect(() => {
    if ((value || "") !== dariUI(teks)) setTeks(value ? tglUI(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const ketik = (e) => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 8);
    const t = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    setTeks(t);
    onChange(dariUI(t));
  };
  const salah = teks.length === 10 && !dariUI(teks);

  return (
    <div className="up-tgl">
      <input value={teks} onChange={ketik} placeholder="dd/mm/yyyy" inputMode="numeric" autoComplete="off" maxLength={10} required={required}
        aria-label={label} aria-invalid={salah || undefined} className={salah ? "salah" : ""} />
      <button type="button" className="up-tgl-b" aria-label="Pilih dari kalender" onClick={() => { try { picker.current.showPicker(); } catch { picker.current.focus(); } }}>📅</button>
      <input ref={picker} type="date" className="up-tgl-p" tabIndex={-1} aria-hidden="true" value={value || ""}
        onChange={(e) => { setTeks(e.target.value ? tglUI(e.target.value) : ""); onChange(e.target.value); }} />
      {salah && <small className="up-tgl-e">Tanggal tidak valid</small>}
    </div>
  );
}
