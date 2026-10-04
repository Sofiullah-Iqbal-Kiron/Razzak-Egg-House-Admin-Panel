import type { NextConfig } from "next"

/**
 * Set STATIC_EXPORT=1 to build a static site into `out/` (used for GitHub
 * Pages). NEXT_PUBLIC_BASE_PATH is the sub-path the site is served from.
 */
const staticExport = process.env.STATIC_EXPORT === "1"

const nextConfig: NextConfig = {
  ...(staticExport && { output: "export" }),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  // The dev-only badge would cover the phone action bar.
  devIndicators: false,
}

export default nextConfig
