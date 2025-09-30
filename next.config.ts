import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info'] // Retain error, warn, and info logs in production
    } : false
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL
  },

  output: 'standalone',
  reactStrictMode: true,

  typescript: {
    ignoreBuildErrors: true, // ❌ ignora errores TS en build
  },
  eslint: {
    ignoreDuringBuilds: true, // ❌ desactiva ESLint en build
  },
};

export default nextConfig;
