/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // @react-pdf/renderer pulls in an optional `canvas` dependency that only
    // exists in Node. Aliasing it away keeps the browser bundle from breaking.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
