/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Ye line zaroori hai cPanel ke liye
  images: {
    unoptimized: true, // Static export mein images ko unoptimized karna parta hai
  },
};

module.exports = nextConfig;