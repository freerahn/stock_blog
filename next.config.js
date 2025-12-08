/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages는 Next.js를 네이티브 지원하므로 output: 'export' 제거
  // 동적 라우팅이 필요한 경우 정적 export를 사용하지 않음
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  trailingSlash: true,
}

module.exports = nextConfig
