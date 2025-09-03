import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'your-supabase-project.supabase.co'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    // serverActions: true,
  },
};

export default nextConfig;
