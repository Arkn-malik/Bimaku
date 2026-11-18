export const TAMPILAN = {
  judul: "BIMAKU",
  sub: "Sistem Informasi Arsip Penagihan & Kontrak Kerja",
  deskripsi: "BIMAKU: aplikasi arsip digital, penagihan, dan kontrak kerja untuk kantor Yogyakarta, Semarang, dan Bandung.",
};

export const useTampilan = () => TAMPILAN;

export function terapkanKeHalaman(t = TAMPILAN) {
  document.title = `${t.judul} – Arsip Penagihan & Kontrak Kerja`;
  let m = document.querySelector('meta[name="description"]');
  if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
  m.content = t.deskripsi;
}
