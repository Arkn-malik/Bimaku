export const KANTOR = ["Yogyakarta", "Semarang", "Bandung"];

const ganti = (v) => (v === "Jogja" ? "Yogyakarta" : v);
const gantiNomor = (n) => (typeof n === "string" ? n.replace("/JGJ/", "/YGY/") : n);
export const migrasiUser = (u) => {
  if (!u) return u;
  const email = u.email || `${(u.username || "pengguna").toLowerCase().replace("jogja", "yogyakarta")}@siparker.id`;
  const { username: _x, ...sisa } = u;
  return { ...sisa, email, kantor: ganti(u.kantor), nama: typeof u.nama === "string" ? u.nama.replace("Jogja", "Yogyakarta") : u.nama };
};
const KLAS_LAMA = { KTR: "KU.01.01", TGH: "KU.02.03", SRT: "UM.01.01" };
export const migrasiArsip = (a) => ({ ...a, kantor: ganti(a.kantor), nomor: gantiNomor(a.nomor), klasifikasi: KLAS_LAMA[a.klasifikasi] || a.klasifikasi });

export const DAFTAR_AWAL = [];