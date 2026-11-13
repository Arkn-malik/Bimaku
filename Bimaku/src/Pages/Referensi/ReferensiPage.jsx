import { useApp } from "../../Context/AppContext";
import { toast } from "../../Utils/Helpers/ToastHelpers";
import TabTagihan from "./TabTagihan";
import "../mockup.css";

export default function ReferensiPage() {
  const { user, referensi, ubahRef } = useApp();
  const admin = user.role === "admin";
  const simpanRef = (next) => { const r = ubahRef(next); if (!r.ok) toast("error", r.msg); return r.ok; };

  return (
    <>
      <div className="hm-head no-print">
        <div>
          <h1>Update referensi</h1>
          <p className="hm-sub">Daftar tagihan yang dipakai otomatis untuk Cari arsip{admin ? "" : " (hanya admin yang dapat mengubah)"}</p>
        </div>
      </div>
      <TabTagihan admin={admin} kantorBatas={admin ? "" : user.kantor} referensi={referensi} simpanRef={simpanRef} />
    </>
  );
}
