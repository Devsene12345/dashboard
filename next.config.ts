import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Map data changes rarely: let browsers and the CDN keep it for a day, and serve a stale copy for a week while refreshing.
        source: "/Hulu%20Ganga/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
