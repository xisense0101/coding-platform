/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    domains: [
      'localhost',
      'supabase.co',
      'github.com',
      'avatars.githubusercontent.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minifier for better performance
  swcMinify: true,
  
  // Optimize bundle size
  experimental: {
    optimizeCss: true,
  },
  
  // Configure webpack for better performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Important: return the modified config
    return config
  },
}

module.exports = nextConfig
