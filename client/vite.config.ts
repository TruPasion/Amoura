import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  root: "client",
  plugins: [vue()],
  build: {
    minify: "esbuild",
    target: "es2015",
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
