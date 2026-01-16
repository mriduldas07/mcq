/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow ngrok and other dev origins for local development
  allowedDevOrigins: [
    "*.ngrok.io",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
  ],
  
  // Disable React Strict Mode to prevent double rendering in development
  // This reduces the "too many renders" issue during dev
  reactStrictMode: false,
  
  // Optimize for production
  poweredByHeader: false,
};

module.exports = nextConfig;
