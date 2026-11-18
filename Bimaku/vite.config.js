import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { apiLokal } from "./server/rute.js";

// `npm run dev` / `npm run preview` menjalankan API yang sama dengan produksi (server/rute.js) memakai pengaturan dari .env
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const k of ["DATABASE_URL", "SESSION_SECRET", "BERKAS_DIR", "BERKAS_MAKS_MB", "PERCAYA_PROXY"]) if (!process.env[k] && env[k]) process.env[k] = env[k];
  const api = () => ({
    name: "bimaku-api",
    configureServer: (s) => { s.middlewares.use(apiLokal()); },
    configurePreviewServer: (s) => { s.middlewares.use(apiLokal()); },
  });
  return {
    plugins: [react(), api()],
    server: { host: true, watch: { ignored: ["**/data/**"] } }, // host: true = bisa dibuka dari HP/laptop lain di jaringan yang sama
    preview: { host: true },
  };
});
