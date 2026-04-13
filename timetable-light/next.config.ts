import type { NextConfig } from "next";

// Server-side proxy target only — do not point this at the Next dev server (3000).
const API_BACKEND_URL =
  process.env.API_BACKEND_URL?.replace(/\/$/, "") || "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["*.trycloudflare.com"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
