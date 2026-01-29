import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: Don't use output: "standalone" for Netlify deployment
  // Netlify uses its own Next.js runtime via @netlify/plugin-nextjs

  // PWA configuration
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
