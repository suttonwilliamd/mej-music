import { defineConfig } from "vite";
import { defineConfig as defineTauriConfig } from "@tauri-apps/cli/config";

export default defineConfig({
  plugins: [],
  clearScreen: false,
  server: {
    port: 3000,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});