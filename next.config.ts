import type { NextConfig } from "next";
import { BLOG_SLUG_REDIRECTS } from "./lib/blog-slug-redirects";

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
  // OVH Docker 이미지 빌드(Dockerfile)에서만 standalone 출력. Vercel·CI 빌드는 영향 없음.
  output: process.env.NEXT_STANDALONE === "true" ? "standalone" : undefined,
  experimental: { cpus: 2 },
  poweredByHeader: false,
  async redirects() {
    return BLOG_SLUG_REDIRECTS;
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
