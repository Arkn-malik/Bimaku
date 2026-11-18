import { useApp } from "../../Context/AppContext";
import { konfirmasi } from "../../Utils/Helpers/SwalHelpers";
import { toast } from "../../Utils/Helpers/ToastHelpers";
import CariArsip from "./Components/CariArsip";
import "../modul.css";

export default function ArsipPage() {
  const { arsip, daftarDok, user, hapus, hapusDokumen } = useApp();
  const admin = user.role === "admin";
  const hitung = (j) => daftarDok.filter((d) => d.jenis === j).length;

  const hapusDok = async (a) => { if (a.arsipId && await konfirmasi("Hapus berkas arsip?", a.nomor + " — hanya berkas yang diunggah; data tagihan tetap ada di Update referensi.")) { hapus({ id: a.arsipId }); toast("success", "Berkas arsip dihapus"); } };

  const hapusData = async (a) => {
    const jenis = a.jenis === "Pengadaan" ? "pengadaan" : "kontrak";
    if (!await konfirmasi(`Hapus data ${jenis} ${a.nomor}?`, `Data ${jenis} beserta berkasnya akan dihapus dari daftar dan tidak bisa dikembalikan.`)) return;
    const r = hapusDokumen(a);
    if (!r.ok) return toast("error", r.msg);
    toast("success", `Data ${jenis} dihapus`);
  };

  return (
    <>
      <div className="hm-head">
        <div>
          <h1>Arsip</h1>
          <p className="hm-sub">{admin ? "Semua kantor" : "Kantor " + user.kantor} · {hitung("Penagihan")} tagihan · {hitung("Kontrak Kerja")} kontrak · {hitung("Pengadaan")} pengadaan · {arsip.length} berkas terunggah</p>
        </div>
      </div>

      <CariArsip dokumen={daftarDok} terunggah={arsip} onHapus={admin ? hapusDok : null} onHapusData={admin ? hapusData : null} />
    </>
  );
}
