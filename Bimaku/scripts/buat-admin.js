import readline from "node:readline";
import { sql } from "../server/lib/db.js";
import { hashPassword, digit } from "../server/lib/auth.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
let sembunyi = false;
const asli = rl._writeToOutput.bind(rl);
rl._writeToOutput = (t) => { if (!sembunyi || t.includes("\n") || t.includes("\r")) asli(t); };
const tanya = (q, rahasia = false) => new Promise((ok) => { sembunyi = false; asli(q); sembunyi = rahasia; rl.question("", (a) => { sembunyi = false; if (rahasia) asli("\n"); ok(a.trim()); }); });

const nama = await tanya("Nama lengkap: ");
const email = (await tanya("Email: ")).toLowerCase();
const nip = await tanya("NIP (min. 8 angka): ");
const pw = await tanya("Password (min. 6 karakter): ", true);
rl.close();
if (!nama || !/^\S+@\S+\.\S+$/.test(email) || digit(nip).length < 8 || pw.length < 6) { console.error("Data tidak valid, dibatalkan."); process.exit(1); }

const s = sql();
const [lama] = await s`select item from store_item where key = 'users' and id = ${email}`;
const item = { ...(lama?.item || {}), email, nama, nip, role: "admin", kantor: "Semua", aktif: true, wajibGanti: false, hash: await hashPassword(pw) };
delete item.password;
await s.transaction([
  s`insert into store (key, kind, ver) values ('users', 'list', 0) on conflict (key) do nothing`,
  s`insert into store_item (key, id, pos, item) values ('users', ${email}, ${-Date.now() * 1000}, ${JSON.stringify(item)}::jsonb)
    on conflict (key, id) do update set item = excluded.item, updated_at = now()`,
  s`update store set ver = ver + 1, updated_at = now() where key = 'users'`,
]);
console.log(lama ? "Akun admin diperbarui:" : "Akun admin dibuat:", email);
