/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    config.externals.push({
      canvas: 'canvas',
      'canvas-prebuilt': 'canvas-prebuilt'
    })
    return config
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-e9b1a6051b664ae2b86aed8c6461cd5c.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig 