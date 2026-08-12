import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type PluginOption } from "vite";

const SRC_DIR = fileURLToPath(new URL("./src", import.meta.url));

/**
 * Plugin order matters and mirrors what TanStack Start expects:
 * tailwind -> tanstackStart -> nitro (build only) -> react.
 */
export default defineConfig(async ({ command, mode }) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    tanstackStart({
      // Routes the bundled server entry to src/server.ts, our SSR error
      // wrapper. nitro builds from this — do not remove.
      server: { entry: "server" },
      // Fail the build if server-only code is pulled into a client bundle.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
  ];

  // nitro only participates in builds, and is imported lazily so `vite dev`
  // never pays for loading it.
  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    plugins.push(nitro({ defaultPreset: "cloudflare-module" }));
  }

  plugins.push(viteReact());

  // Inline VITE_* vars so they resolve inside the server bundle too, where the
  // worker runtime has no process.env to read from at runtime.
  const clientEnv = loadEnv(mode, process.cwd(), "VITE_");
  const define = Object.fromEntries(
    Object.entries(clientEnv).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  return {
    define,
    plugins,
    resolve: {
      // Vite 8 reads `paths` from tsconfig.json natively, which covers "@/*".
      // The explicit alias is kept as a belt-and-braces fallback for tools that
      // resolve through Vite without reading tsconfig.
      tsconfigPaths: true,
      alias: { "@": SRC_DIR },
      // A second copy of React or the query client breaks hooks and cache
      // identity across the SSR/client boundary.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "::",
      port: 8080,
      watch: {
        ignored: ["**/.output/**", "**/.wrangler/**", "**/.tanstack/**", "**/.nitro/**"],
        awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 },
      },
    },
  };
});
