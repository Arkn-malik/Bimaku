const ISO = /^(\d{4})-(\d{2})-(\d{2})/;

export const tglUI = (iso) => {
  const m = ISO.exec(String(iso || ""));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso ? String(iso) : "—";
};

export const dariUI = (teks) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(teks || ""));
  if (!m) return "";
  const [d, b, t] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const x = new Date(t, b - 1, d);
  return x.getFullYear() === t && x.getMonth() === b - 1 && x.getDate() === d ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

export const tglDariWaktu = (w) => {
  const d = new Date(w);
  return isNaN(d) ? "—" : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};
