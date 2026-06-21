import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "PragAC",
        short_name: "PragAC",
        description: "Is the next Prague tram air-conditioned?",
        theme_color: "#0b3d2e",
        background_color: "#0b3d2e",
        display: "standalone",
        icons: [],
      },
    }),
  ],
});
