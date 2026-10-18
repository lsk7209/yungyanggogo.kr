import type { NextConfig } from "next";
import { BLOG_SLUG_REDIRECTS } from "./lib/blog-slug-redirects";

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
];

const nextConfig: NextConfig = {
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
