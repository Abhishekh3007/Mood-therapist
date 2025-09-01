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
      // Add any required external image domains here
    ],
  },
  // Fix workspace root warning
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
