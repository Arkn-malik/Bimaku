import { sql } from "../server/lib/db.js";
import { hashPassword } from "../server/lib/auth.js";

const s = sql();
const rows = await s`select id, item from store_item where key = 'users'`;
let n = 0;
for (const r of rows) {
  const it = r.item;
  if (typeof it.password === "string" && it.password) {
    it.hash = await hashPassword(it.password);
    delete it.password;
    await s`update store_item set item = ${JSON.stringify(it)}::jsonb, updated_at = now() where key = 'users' and id = ${r.id}`;
    n++;
  } else if (!it.hash) console.log("PERHATIAN: akun tanpa password:", r.id);
}
if (n) await s`update store set ver = ver + 1, updated_at = now() where key = 'users'`;
console.log(`${n} akun diamankan, ${rows.length - n} sudah aman atau tanpa password.`);
