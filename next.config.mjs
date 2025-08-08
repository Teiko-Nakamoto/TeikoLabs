/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow network access for mobile testing
  serverExternalPackages: ['@stacks/transactions', '@stacks/network'],
  // Ensure server can be accessed from network
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
    }
    return config;
  },
};

export default nextConfig;
