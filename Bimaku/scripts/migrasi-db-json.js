import fs from "node:fs";
import { sql } from "../server/lib/db.js";
import { terapkanOps, KUNCI } from "../server/lib/store.js";

const berkas = process.argv[2] || "data/db.json";
const db = JSON.parse(fs.readFileSync(berkas, "utf8"));
const s = sql();
for (const [k, e] of Object.entries(db)) {
  if (!KUNCI.test(k)) { console.log("lewati", k); continue; }
  const b = e.kind === "obj"
    ? { kind: "obj", obj: e.obj }
    : { kind: "list", replace: true, upsert: e.ids.map((id) => ({ id, item: e.items[id] })), remove: [] };
  const r = await terapkanOps(s, k, b);
  console.log(k.padEnd(12), e.kind === "obj" ? "objek" : e.ids.length + " item", "-> versi", r.ver);
}
console.log("Selesai.");
