import fs from "node:fs/promises";
import path from "node:path";
import { sql } from "../server/lib/db.js";
import { terapkanOps } from "../server/lib/store.js";

const jalan = process.argv.includes("--jalan");
const AKAR = path.resolve(process.env.BERKAS_DIR || "berkas");
const KANTOR = ["Yogyakarta", "Semarang", "Bandung"];
const bersih = (s) => String(s || "").trim().replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-+|-+$/g, "").replace(/[^A-Za-z0-9._() -]/g, "_");
const dariData = (d) => {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(String(d || ""));
  return m ? (m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]))) : null;
};
const ada = (p) => fs.access(p).then(() => true, () => false);

const s = sql();
let nFile = 0, byte = 0;
for (const key of ["arsip", "ref_daftar"]) {
  const rows = await s`select id, item from store_item where key = ${key}`;
  const naik = [];
  for (const r of rows) {
    const it = r.item;
    let ubah = false;
    for (const f of ["file", "lampiran"]) {
      const b = it[f];
      if (!b?.data || !String(b.data).startsWith("data:")) continue;
      const buf = dariData(b.data);
      if (!buf?.length) continue;
      nFile++; byte += buf.length;
      if (!jalan) continue;
      const kantor = KANTOR.includes(it.kantor) ? it.kantor : "Umum";
      const tahun = (/^\d{4}/.exec(it.tanggal || "") || [String(new Date().getFullYear())])[0];
      // arsip: nama file sudah dibuat aplikasi; lampiran referensi: awali dengan No. SPM seperti unggahan baru
      let nama = (key === "ref_daftar" ? bersih(it.noSpm) + "_" : "") + bersih(b.name || "berkas");
      if (!/^[A-Za-z0-9]/.test(nama)) nama = "berkas_" + nama;
      nama = nama.slice(0, 150);
      let tujuan = path.join(AKAR, kantor, tahun, nama);
      for (let i = 2; await ada(tujuan); i++) tujuan = path.join(AKAR, kantor, tahun, nama.replace(/(\.[^.]*)?$/, `_${i}$1`)); // jangan menimpa berkas lain
      await fs.mkdir(path.dirname(tujuan), { recursive: true });
      await fs.writeFile(tujuan, buf, { flag: "wx" });
      const namaAkhir = path.basename(tujuan);
      it[f] = { ...b, size: buf.length, data: `/api/berkas/${encodeURIComponent(kantor)}/${tahun}/${encodeURIComponent(namaAkhir)}?v=${Date.now()}` };
      ubah = true;
    }
    if (ubah) naik.push({ id: r.id, item: it });
  }
  if (jalan && naik.length) { await terapkanOps(s, key, { kind: "list", replace: false, upsert: naik, remove: [] }); console.log(`${key}: ${naik.length} item diperbarui`); }
}
console.log(`${nFile} berkas lama (${(byte / 1048576).toFixed(1)} MB)${jalan ? " dipindahkan ke " + AKAR : " ditemukan. Jalankan dengan --jalan untuk memindahkannya."}`);
