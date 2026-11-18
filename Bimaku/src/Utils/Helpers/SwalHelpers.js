import Swal from "sweetalert2";
export const konfirmasi = (title, text, icon = "warning") =>
  Swal.fire({ title, text, icon, showCancelButton: true, confirmButtonText: "Ya", cancelButtonText: "Batal" }).then((r) => r.isConfirmed);
export const info = (title, html) => Swal.fire({ title, html, confirmButtonText: "Tutup" });

