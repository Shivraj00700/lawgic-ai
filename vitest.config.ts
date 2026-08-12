import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Kept separate from vite.config.ts on purpose: the app config loads
 * tanstackStart and nitro, which the unit tests neither need nor should pay
 * for. These tests cover pure logic — corpus integrity, the classifier, the
 * retriever, the composer, and the streaming engine.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    reporters: ["default"],
  },
});
