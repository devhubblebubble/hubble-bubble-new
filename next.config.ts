import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plain static HTML in ./out, served by Cloudflare Workers static assets.
  output: "export",
  // Static hosts have no image optimiser, so serve images as they are.
  // Sanity's image CDN resizes and compresses the content images instead.
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  // /recruitment/ -> recruitment/index.html, which static hosts serve cleanly.
  trailingSlash: true,
  reactCompiler: true,
};

export default nextConfig;
