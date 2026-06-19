import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(here, "..", "..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Pin the Turbopack root to the monorepo root so it (a) silences the
  // multi-root inference warning and (b) keeps the pnpm `.pnpm` store inside
  // the root so workspace packages and `next` resolve correctly.
  turbopack: { root: monorepoRoot },
};

export default nextConfig;
