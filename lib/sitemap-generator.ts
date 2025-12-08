import { BlogPost } from '@/types/blog'

const SITEMAP_STORAGE_KEY = 'stock_blog_sitemap'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://freerahn.github.io/stock_blog'

export interface SitemapUrl {
  loc: string
  lastmod: string
  changefreq: string
  priority: number
}

// 사이트맵 생성 함수
export function generateSitemap(posts: BlogPost[]): string {
  const today = new Date().toISOString().split('T')[0]
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  
  // 홈페이지
  xml += '  <url>\n'
  xml += `    <loc>${BASE_URL}/</loc>\n`
  xml += `    <lastmod>${today}</lastmod>\n`
  xml += '    <changefreq>daily</changefreq>\n'
  xml += '    <priority>1.0</priority>\n'
  xml += '  </url>\n'
  
  // 게시글 작성 페이지
  xml += '  <url>\n'
  xml += `    <loc>${BASE_URL}/admin/write</loc>\n`
  xml += `    <lastmod>${today}</lastmod>\n`
  xml += '    <changefreq>monthly</changefreq>\n'
  xml += '    <priority>0.5</priority>\n'
  xml += '  </url>\n'
  
  // 각 게시글 추가
  posts.forEach(post => {
    const lastModified = post.updatedAt 
      ? new Date(post.updatedAt).toISOString().split('T')[0]
      : new Date(post.createdAt).toISOString().split('T')[0]
    
    xml += '  <url>\n'
    xml += `    <loc>${BASE_URL}/posts/${post.id}</loc>\n`
    xml += `    <lastmod>${lastModified}</lastmod>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>0.8</priority>\n'
    xml += '  </url>\n'
  })
  
  xml += '</urlset>'
  
  return xml
}

// 사이트맵 업데이트 (localStorage에 저장)
export function updateSitemap(posts: BlogPost[]): void {
  if (typeof window === 'undefined') return
  
  try {
    const sitemapXml = generateSitemap(posts)
    localStorage.setItem(SITEMAP_STORAGE_KEY, sitemapXml)
    console.log('사이트맵이 자동으로 업데이트되었습니다.')
  } catch (error) {
    console.error('사이트맵 업데이트 실패:', error)
  }
}

// 저장된 사이트맵 가져오기
export function getStoredSitemap(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    return localStorage.getItem(SITEMAP_STORAGE_KEY)
  } catch (error) {
    console.error('사이트맵 로드 실패:', error)
    return null
  }
}






