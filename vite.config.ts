import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: "./",
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: "http://10.229.40.83:8080",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    // 👇 'test' must be at the root level here, NOT inside 'server'
    test: {
      globals: true,
      exclude: ['**/node_modules/**', '**/tests/**/*.spec.ts'], 
    },
    esbuild: {
      drop: mode === "production" ? ["console", "debugger"] : [],
    },
  } as any; 
});