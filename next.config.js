/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages에서는 정적 내보내기 사용
  output: process.env.CF_PAGES ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

