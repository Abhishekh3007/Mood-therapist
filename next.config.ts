import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack properly transpiles Supabase packages that reference source files
  transpilePackages: [
    '@supabase/supabase-js',
  '@supabase/auth-ui-react',
  '@supabase/auth-ui-shared',
    '@supabase/postgrest-js',
    '@supabase/gotrue-js',
    '@supabase/realtime-js',
    '@supabase/storage-js'
  ],
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image-cdn-fa.spotifycdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'seed-mix-image.spotifycdn.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  // Fix workspace root warning
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
