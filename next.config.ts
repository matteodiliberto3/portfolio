import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.matteodiliberto.it" }],
        destination: "https://matteodiliberto.it/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
