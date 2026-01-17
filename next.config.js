/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow ngrok and other dev origins for local development
  allowedDevOrigins: [
    "*.ngrok.io",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
  ],
  
  // Enable React Strict Mode; fix components to avoid side effects during render
  reactStrictMode: true,
  
  // Optimize for production
  poweredByHeader: false,
};

module.exports = nextConfig;
