import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://6r063drr-9000.usw3.devtunnels.ms/api/:path*",
      },
    ];
  },
};

export default nextConfig;
