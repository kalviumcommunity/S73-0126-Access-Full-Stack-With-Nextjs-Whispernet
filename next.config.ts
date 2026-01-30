import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Use standalone output for Docker builds, but not for Netlify
  // Netlify uses its own Next.js runtime via @netlify/plugin-nextjs
  // Set STANDALONE_BUILD=true in Dockerfile to enable standalone output
  ...(process.env.STANDALONE_BUILD === "true" && { output: "standalone" }),

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
