import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const localApiProxy = {
  "/v1": {
    target: "http://localhost:8788",
    changeOrigin: false,
  },
};

export default defineConfig({
  base: "/games/palworld/breeding/app/",
  plugins: [react()],
  build: {
    license: { fileName: "THIRD_PARTY_LICENSES.md" },
    modulePreload: false,
  },
  worker: { format: "es" },
  server: { proxy: localApiProxy },
  preview: { proxy: localApiProxy },
});
