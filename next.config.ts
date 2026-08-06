import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["qrcode", "pdf-lib", "imagescript", "jszip"],
  // Large media uploads go through /api/tools/upload (videos can be hundreds of MB).
  experimental: {
    proxyClientMaxBodySize: "512mb",
    serverActions: {
      bodySizeLimit: "512mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
