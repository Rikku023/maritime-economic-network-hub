/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@deck.gl/react',
    '@deck.gl/layers',
    '@deck.gl/core',
    'react-map-gl',
    'maplibre-gl',
  ],
};

module.exports = nextConfig;
