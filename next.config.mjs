/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Skip API routes that require environment variables during build if they're not needed
  experimental: {
    // This helps with build issues when API routes have optional dependencies
  },
};

export default nextConfig;
