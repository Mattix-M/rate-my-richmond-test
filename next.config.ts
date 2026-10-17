import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  productionBrowserSourceMaps: false,
  turbopack: { root: process.cwd() },
};
export default config;
