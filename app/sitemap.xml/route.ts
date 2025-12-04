import { NextResponse } from 'next/server'
import { generateSitemap } from '@/lib/sitemap-generator'

export async function GET() {
  try {
    // 서버 사이드에서는 localStorage에 접근할 수 없으므로
    // 클라이언트에서 생성한 사이트맵을 사용하거나 기본 사이트맵 반환
    // 실제로는 클라이언트에서 /sitemap 페이지를 통해 사이트맵을 생성하고
    // Google Search Console에 직접 제출하거나, 정적 파일로 저장해야 합니다.
    
    // 기본 사이트맵 반환 (게시글은 클라이언트에서 동적으로 추가됨)
    const today = new Date().toISOString().split('T')[0]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://freerahn.github.io/stock_blog'
    
    const defaultSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/admin/write</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`
    
    return new NextResponse(defaultSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('사이트맵 생성 오류:', error)
    
    // 에러 발생 시 최소한의 사이트맵 반환
    const errorSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://freerahn.github.io/stock_blog/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`
    
    return new NextResponse(errorSitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  }
}

