import type { NextConfig } from 'next';
const config: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  trailingSlash: true,
  productionBrowserSourceMaps: false,
  turbopack: { root: process.cwd() },
};
export default config;
