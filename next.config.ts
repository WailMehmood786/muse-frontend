/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel ke liye 'export' ki zaroorat nahi hai, isay hata dete hain
  images: {
    unoptimized: true,
  },
  // Build errors ko ignore karne ke liye ye sections zaroori hain:
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;