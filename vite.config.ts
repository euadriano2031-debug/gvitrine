// The Lovable wrapper supplies TanStack Start, React, Tailwind, path aliases and Nitro.
// In Lovable's sandbox the wrapper keeps its Cloudflare target. On Vercel, explicitly
// select Nitro's Vercel preset so the deployment contains .vercel/output instead of a
// Cloudflare Worker bundle (otherwise a green build can still deploy a 404 site).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercelBuild =
  Boolean(process.env.VERCEL && process.env.VERCEL !== "0") ||
  Boolean(process.env.VERCEL_URL) ||
  process.env.npm_lifecycle_event === "build:vercel";

export default defineConfig({
  tanstackStart: {
    // Keep the custom SSR error wrapper as the TanStack Start server entry.
    server: { entry: "server" },
  },
  nitro: isVercelBuild
    ? {
        preset: "vercel",
        output: {
          dir: ".vercel/output",
          serverDir: ".vercel/output/functions/__server.func",
          publicDir: ".vercel/output/static",
        },
      }
    : true,
});
