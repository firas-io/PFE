import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the LAN IP to access Next.js dev resources (HMR websocket) from mobile
  allowedDevOrigins: ["192.168.1.41"],
};

export default nextConfig;
