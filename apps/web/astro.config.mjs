import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

// Allows sharing root .env variables with Astro build process
loadEnv(process.env.NODE_ENV || "development", "../..", "");

export default defineConfig({
  srcDir: ".",
  publicDir: "./public",
  outDir: "./dist",
  // Enforce SSR. Static Site Generation (SSG) is disabled.
  output: "server",
  adapter: cloudflare({
    // Enable Image Service for optimized asset delivery
    imageService: "cloudflare",
  }),
  integrations: [react()],
  vite: {
    css: {
      postcss: "./postcss.config.js",
    },
  },
});
