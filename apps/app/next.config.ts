import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(here, "..", "..");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@repo/ui"],
  // Pin the Turbopack root to the monorepo root so it (a) silences the
  // multi-root inference warning and (b) keeps the pnpm `.pnpm` store inside
  // the root so workspace packages and `next` resolve correctly.
  turbopack: { root: monorepoRoot },
};

export default nextConfig;
