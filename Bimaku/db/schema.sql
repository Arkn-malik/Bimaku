-- BIMAKU · Langkah 1: skema Neon (PostgreSQL)
-- Jalankan sekali di Neon Console > SQL Editor. Aman dijalankan ulang.
--
-- Meniru kontrak API lama (data/db.json) supaya frontend tidak perlu diubah:
--   store      : satu baris per "kunci" data (users, arsip, notif, ref_daftar, ref_lain) + nomor versi
--   store_item : isi tiap kunci bertipe daftar, satu baris per item (JSON), urutan di kolom pos
-- Di Langkah berikutnya data ini dipecah menjadi tabel bernama (users, arsip, tagihan, ...).

create table if not exists store (
  key  text primary key check (key ~ '^[a-z_]{1,32}$'),
  kind text not null check (kind in ('list', 'obj')),
  ver  bigint not null default 0,
  obj  jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists store_item (
  key  text not null references store(key) on delete cascade,
  id   text not null,
  pos  bigint not null,
  item jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (key, id)
);

create index if not exists store_item_urut on store_item (key, pos, id);

-- Langkah 2: pembatas percobaan login (anti tebak password). Aman dijalankan ulang.
create table if not exists percobaan_login (
  kunci  text primary key,
  jumlah int not null default 0,
  mulai  timestamptz not null default now()
);
