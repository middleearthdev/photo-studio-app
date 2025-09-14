import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'res.cloudinary.com',
      'your-supabase-project.supabase.co',
      'images.unsplash.com'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    // serverActions: true,
  },
  // Skip static generation for pages that use useSearchParams
  async generateBuildId() {
    return 'studio-foto-app-build'
  },
  // Force dynamic rendering for problematic routes
  async rewrites() {
    return []
  }
};

export default nextConfig;
