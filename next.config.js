/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production'

const nextConfig = {
  // 프로덕션 빌드 시에만 정적 사이트로 내보내기
  ...(isProduction && { output: 'export' }),
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

