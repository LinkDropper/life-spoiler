import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/insights",
          destination: "https://test.local.qshop.ai/blog",
        },
        {
          source: "/insights/:path*",
          destination: "https://test.local.qshop.ai/blog/:path*",
        },
      ],
    };
  },
};

export default withNextIntl(nextConfig);
