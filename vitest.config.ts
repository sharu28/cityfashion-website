import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src"),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["tests/**/*.test.mjs", "node_modules/**"],
    setupFiles: ["./tests/setup.ts"],
  },
});
