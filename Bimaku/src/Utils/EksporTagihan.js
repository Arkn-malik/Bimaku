import { tglDariWaktu } from "./Tanggal";
import { ambilByte } from "./Berkas";

const enc = new TextEncoder();
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

export function buatZip(files, tipe) {
  const bagian = [], pusat = [];
  let offset = 0;
  files.forEach(([nama, isi]) => {
    const n = enc.encode(nama), d = typeof isi === "string" ? enc.encode(isi) : isi, c = crc32(d);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
    lh.setUint32(14, c, true); lh.setUint32(18, d.length, true); lh.setUint32(22, d.length, true); lh.setUint16(26, n.length, true);
    bagian.push(new Uint8Array(lh.buffer), n, d);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint32(16, c, true); ch.setUint32(20, d.length, true); ch.setUint32(24, d.length, true); ch.setUint16(28, n.length, true);
    ch.setUint32(42, offset, true);
    pusat.push(new Uint8Array(ch.buffer), n);
    offset += 30 + n.length + d.length;
  });
  const ukuranPusat = pusat.reduce((s, x) => s + x.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, ukuranPusat, true); end.setUint32(16, offset, true);
  return new Blob([...bagian, ...pusat, new Uint8Array(end.buffer)], { type: tipe });
}

const kolomHuruf = (i) => { let s = ""; for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };
const serial = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000) : null;
};
const bersih = (s) => String(s).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_").trim() || "dokumen";

const STYLES = `${XML}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;Rp&quot;\\ #,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><u/><sz val="11"/><color rgb="FF0563C1"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B4D4D"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

const KANTOR_KOL = ["Kantor", 14, "tengah", (r) => r.kantor || "—"], DOK_KOL = ["Dokumen", 34, "dok"], NO_KOL = ["No", 6, "no"];
const LAPORAN = {
  tagihan: {
    judul: "Daftar Referensi Tagihan", sheet: "Daftar Tagihan", dasar: "Daftar-Referensi-Tagihan", satuan: "tagihan",
    kolom: [NO_KOL, ["No. SPM", 12, "tengah", (r) => r.noSpm], ["Jenis SPM", 26, "teks", (r) => r.jenisSpm], ["Tanggal SPM", 14, "tanggal", (r) => r.tanggal],
      ["Nilai Tagihan", 20, "rupiah", (r) => r.nilai], ["Uraian Tagihan", 70, "uraian", (r) => r.uraian], KANTOR_KOL, DOK_KOL],
  },
  kontrak: {
    judul: "Daftar Kontrak", sheet: "Daftar Kontrak", dasar: "Laporan-Kontrak", satuan: "kontrak",
    kolom: [NO_KOL, ["No. Kontrak", 26, "teks", (r) => r.noSpm], ["Nama Penyedia", 32, "teks", (r) => r.penyedia || "—"], ["Tanggal Kontrak", 14, "tanggal", (r) => r.tanggal],
      ["Nilai Kontrak", 20, "rupiah", (r) => r.nilai], ["Uraian Kontrak", 60, "uraian", (r) => r.uraian], KANTOR_KOL, DOK_KOL],
  },
  pengadaan: {
    judul: "Daftar Dokumen Pengadaan", sheet: "Daftar Pengadaan", dasar: "Laporan-Pengadaan", satuan: "dokumen pengadaan",
    kolom: [NO_KOL, ["No. Dokumen", 24, "teks", (r) => r.noSpm], ["Jenis Dokumen", 20, "teks", (r) => r.jenisPengadaan || "—"], ["Metode Pengadaan", 20, "teks", (r) => r.metode || "—"],
      ["Tanggal Dokumen", 14, "tanggal", (r) => r.tanggal], ["Nama Paket", 50, "uraian", (r) => r.uraian], ["Nama Penyedia", 28, "teks", (r) => r.penyedia || "—"],
      ["Nilai HPS / Pagu", 20, "rupiah", (r) => r.nilai], ["Termin", 30, "uraian", (r) => r.termin || "—"], KANTOR_KOL, DOK_KOL],
  },
};

export const buatLaporanTagihan = (daftar, opsi = {}) => buatLaporan(daftar, { ...opsi, jenis: "tagihan" });
export async function buatLaporan(daftar, { jenis = "tagihan", judul, waktu = new Date(), dokumenDari = (r) => r.lampiran } = {}) {
  const L = LAPORAN[jenis] || LAPORAN.tagihan, KOLOM = L.kolom, AKHIR = kolomHuruf(KOLOM.length - 1);
  judul = judul || L.judul;
  const dipakai = new Set(), berkas = [];
  const lampiran = [];
  if (daftar.reduce((n, r) => n + (dokumenDari(r)?.size || 0), 0) > 1024 ** 3) throw new Error("Total ukuran dokumen lebih dari 1 GB, terlalu besar untuk satu ZIP. Persempit laporan (kantor/periode) lalu coba lagi.");
  for (const r of daftar) {
    const lamp = dokumenDari(r);
    if (!lamp?.data) { lampiran.push(null); continue; }
    let nama = bersih(lamp.name);
    if (dipakai.has(nama.toLowerCase())) nama = bersih(r.noSpm) + "_" + nama;
    for (let i = 2; dipakai.has(nama.toLowerCase()); i++) nama = nama.replace(/(\.[^.]*)?$/, `_${i}$1`);
    dipakai.add(nama.toLowerCase());
    berkas.push(["dokumen/" + nama, await ambilByte(lamp.data)]); 
    lampiran.push(nama);
  }
  const adaDok = berkas.length > 0;

  const tgl = tglDariWaktu(waktu);
  const iso = `${waktu.getFullYear()}-${String(waktu.getMonth() + 1).padStart(2, "0")}-${String(waktu.getDate()).padStart(2, "0")}`;
  const BARIS_HEADER = 4;
  const teks = (ref, v, s) => `<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${esc(v ?? "")}</t></is></c>`;
  const angka = (ref, v, s) => `<c r="${ref}" s="${s}"><v>${v}</v></c>`;

  const rows = [];
  rows.push(`<row r="1" ht="22" customHeight="1">${teks("A1", judul, 1)}</row>`);
  rows.push(`<row r="2">${teks("A2", `Dicetak ${tgl} · ${daftar.length} ${L.satuan}${adaDok ? " · klik nama berkas di kolom Dokumen (buka dari folder hasil ekstrak ZIP, bukan dari dalam ZIP)" : ""}`, 2)}</row>`);
  rows.push(`<row r="${BARIS_HEADER}" ht="26" customHeight="1">${KOLOM.map(([k], c) => teks(kolomHuruf(c) + BARIS_HEADER, k, 3)).join("")}</row>`);

  const tautan = [], rels = [];
  daftar.forEach((r, i) => {
    const n = BARIS_HEADER + 1 + i, A = (c) => kolomHuruf(c) + n;
    const dok = lampiran[i];
    if (dok) {
      rels.push(`<Relationship Id="rId${rels.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${esc(encodeURI("dokumen/" + dok))}" TargetMode="External"/>`);
      tautan.push(`<hyperlink ref="${A(KOLOM.length - 1)}" r:id="rId${rels.length}" display="${esc(dok)}"/>`);
    }
    rows.push(`<row r="${n}">${KOLOM.map(([, , tipe, ambil], c) => {
      if (tipe === "no") return angka(A(c), i + 1, 4);
      if (tipe === "dok") return dok ? teks(A(c), dok, 9) : teks(A(c), "—", 4);
      const v = ambil(r);
      if (tipe === "tanggal") { const tg = serial(v); return tg ? angka(A(c), tg, 6) : teks(A(c), v || "", 4); }
      if (tipe === "rupiah") return angka(A(c), Number(v) || 0, 7);
      return teks(A(c), v, { tengah: 4, teks: 5, uraian: 8 }[tipe]);
    }).join("")}</row>`);
  });

  const akhir = BARIS_HEADER + daftar.length;
  const sheet = `${XML}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="${BARIS_HEADER}" topLeftCell="A${BARIS_HEADER + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${KOLOM.map(([, w], c) => `<col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>
<sheetData>${rows.join("")}</sheetData>
<autoFilter ref="A${BARIS_HEADER}:${AKHIR}${Math.max(akhir, BARIS_HEADER)}"/>
${tautan.length ? `<hyperlinks>${tautan.join("")}</hyperlinks>` : ""}
<pageMargins left="0.4" right="0.4" top="0.6" bottom="0.6" header="0.3" footer="0.3"/>
<pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;

  const xlsxFiles = [
    ["[Content_Types].xml", `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
    ["_rels/.rels", `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ["xl/workbook.xml", `${XML}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${L.sheet}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${L.sheet}'!$A$${BARIS_HEADER}:$${AKHIR}$${Math.max(akhir, BARIS_HEADER)}</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">'${L.sheet}'!$${BARIS_HEADER}:$${BARIS_HEADER}</definedName></definedNames></workbook>`],
    ["xl/_rels/workbook.xml.rels", `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["xl/styles.xml", STYLES],
    ["xl/worksheets/sheet1.xml", sheet],
    ...(rels.length ? [["xl/worksheets/_rels/sheet1.xml.rels", `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join("")}</Relationships>`]] : []),
  ];

  const TIPE_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const dasar = L.dasar + "_" + iso;
  if (!adaDok) return { blob: buatZip(xlsxFiles, TIPE_XLSX), nama: dasar + ".xlsx", jumlah: daftar.length, dokumen: 0 };

  const xlsx = buatZip(xlsxFiles, TIPE_XLSX);
  const buf = await xlsx.arrayBuffer();
  return {
    blob: buatZip([[dasar + ".xlsx", new Uint8Array(buf)], ...berkas], "application/zip"),
    nama: dasar + ".zip", jumlah: daftar.length, dokumen: berkas.length,
  };
}

export function simpanBlob(blob, nama) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nama;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
