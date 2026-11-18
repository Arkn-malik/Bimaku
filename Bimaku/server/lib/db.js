import { neon } from "@neondatabase/serverless";

let _sql;
export const sql = () => {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diatur");
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
};
