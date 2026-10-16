import type { NextConfig } from "next";
import { BLOG_SLUG_REDIRECTS } from "./lib/blog-slug-redirects";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return BLOG_SLUG_REDIRECTS;
  },
  images: {
    formats: ["image/avif", "image/webp"]
  }
};

export default nextConfig;
