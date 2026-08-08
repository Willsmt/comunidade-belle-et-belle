import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    passWithNoTests: true,
    include: ["**/*.integration.test.ts"],
    setupFiles: ["./vitest.integration.setup.ts"],
    testTimeout: 15000,
    fileParallelism: false,
  },
});
