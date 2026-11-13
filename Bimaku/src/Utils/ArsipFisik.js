export const statusArsip = (a) => {
  if (a.retensi && Number(a.retensi) < new Date().getFullYear()) return "Siap dimusnahkan";
  return a.statusArsip || (a.status === "Selesai" ? "Inaktif" : "Aktif");
};
export const WARNA_ARSIP = { Aktif: "md-ok", Inaktif: "md-info", "Siap dimusnahkan": "md-warn" };
