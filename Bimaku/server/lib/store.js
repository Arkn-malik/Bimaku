export const KUNCI = /^[a-z_]{1,32}$/;
const MAKS_ID = 200;

export class GalatInput extends Error {}
export class GalatAkses extends Error {}

export async function versiKunci(sql, k) {
  const [r] = await sql`select ver from store where key = ${k}`;
  return r ? Number(r.ver) : 0;
}

export async function semuaVersi(sql) {
  const rows = await sql`select key, ver from store`;
  return Object.fromEntries(rows.map((r) => [r.key, Number(r.ver)]));
}

export async function bacaKunci(sql, k) {
  const [e] = await sql`
    select s.kind, s.ver, s.obj,
           case when s.kind = 'list'
                then (select coalesce(jsonb_agg(i.item order by i.pos, i.id), '[]'::jsonb) from store_item i where i.key = s.key)
           end as items
    from store s where s.key = ${k}`;
  if (!e) return { ver: 0, data: null };
  return { ver: Number(e.ver), data: e.kind === "obj" ? e.obj : e.items };
}

const cekId = (id) => {
  if (typeof id !== "string" || !id || id.length > MAKS_ID) throw new GalatInput("id tidak valid");
  return id;
};

export async function terapkanOps(sql, k, b) {
  if (!b || typeof b !== "object") throw new GalatInput("body tidak valid");
  const q = [];

  if (b.kind === "obj") {
    if (b.obj === undefined) throw new GalatInput("obj kosong");
    q.push(sql`delete from store_item where key = ${k}`);
    q.push(sql`
      insert into store (key, kind, ver, obj) values (${k}, 'obj', 1, ${JSON.stringify(b.obj)}::jsonb)
      on conflict (key) do update set kind = 'obj', obj = excluded.obj, ver = store.ver + 1, updated_at = now()
      returning ver`);
  } else {
    const replace = !!b.replace;
    const naik = new Map();
    for (const x of Array.isArray(b.upsert) ? b.upsert : []) {
      if (!x || typeof x !== "object" || x.item === null || typeof x.item !== "object") throw new GalatInput("item tidak valid");
      naik.set(cekId(x.id), x.item);
    }
    const hapus = (Array.isArray(b.remove) ? b.remove : []).map(cekId);
    const baris = [...naik].map(([id, item], i) => ({ id, item, i }));

    q.push(sql`insert into store (key, kind, ver) values (${k}, 'list', 0) on conflict (key) do nothing`);
    q.push(sql`update store set kind = 'list', obj = null where key = ${k} and kind <> 'list'`);
    if (replace) q.push(sql`delete from store_item where key = ${k}`);
    if (baris.length) {
      const dasar = replace ? 0 : -Date.now() * 1000;
      q.push(sql`
        insert into store_item (key, id, pos, item)
        select ${k}, x.id, ${dasar}::bigint + x.i, x.item
        from jsonb_to_recordset(${JSON.stringify(baris)}::jsonb) as x(id text, item jsonb, i int)
        on conflict (key, id) do update set item = excluded.item, updated_at = now()`);
    }
    if (hapus.length) {
      q.push(sql`delete from store_item where key = ${k} and id in (select jsonb_array_elements_text(${JSON.stringify(hapus)}::jsonb))`);
    }
    q.push(sql`update store set ver = ver + 1, updated_at = now() where key = ${k} returning ver`);
  }

  const hasil = await sql.transaction(q);
  const ver = Number(hasil[hasil.length - 1][0].ver);
  return { ver, prev: ver - 1 };
}
