/// <reference types="vitest/config" />
import { ligne } from "@ligne-engine/bundler/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json";

export default defineConfig(({ command }) => ({
  define: {
    // Injected at build/test time from package.json — the single source of
    // truth for the app version shown in the parental Settings panel.
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    ...(command === "build" ? [ligne()] : []),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["audio/bgm.mp3", "fonts/baloo2-latin.woff2"],
      manifest: {
        name: "Aby's Little Lab",
        short_name: "Aby Lab",
        start_url: "./index.html",
        display_override: ["fullscreen", "standalone"],
        display: "standalone",
        orientation: "landscape",
        background_color: "#FAF9F6",
        theme_color: "#2B6CB0",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Isolate the Phaser engine into its own vendor chunk so it is
        // cached once by the service worker and app updates download only
        // the shell delta (enforced by scripts/validate-bundle.js).
        codeSplitting: {
          groups: [
            {
              name: "phaser",
              test: /[\\/]node_modules[\\/]phaser[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["src/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/__tests__/**", "src/main.ts", "src/types/**"],
      thresholds: {
        lines: 95,
        functions: 88,
        branches: 85,
        statements: 90,
      },
    },
  },
}));
