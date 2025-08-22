import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have TypeScript definitions
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  // Environment variable configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization for container deployment
  images: {
    unoptimized: false,
  },
  
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  }
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);
