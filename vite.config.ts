import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Allows network access (mobile testing, local network)
    port: 5173,
    proxy: {
      "/api": {
        target: "http://10.229.40.83:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
/*

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api": {
        target: "http://10.229.40.83:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

*/
