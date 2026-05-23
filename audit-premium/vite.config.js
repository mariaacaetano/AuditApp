import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Redireciona /api/* para o backend Django em desenvolvimento
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});