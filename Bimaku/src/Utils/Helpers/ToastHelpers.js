import Swal from "sweetalert2";
const Toast = Swal.mixin({ toast: true, position: "top-end", showConfirmButton: false, timer: 2200, timerProgressBar: true });
export const toast = (icon, title) => Toast.fire({ icon, title });
