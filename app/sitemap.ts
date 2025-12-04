import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://freerahn.github.io/stock_blog'
  const today = new Date()

  // 기본 페이지들
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: today,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/admin/write`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // localStorage에 저장된 게시글들은 서버에서 접근할 수 없으므로
  // 클라이언트 사이드에서 동적으로 사이트맵을 생성하거나
  // 정기적으로 sitemap.xml 파일을 업데이트해야 합니다.
  
  // 게시글 URL 형식: ${baseUrl}/posts/{postId}
  // 예시:
  // routes.push({
  //   url: `${baseUrl}/posts/1234567890`,
  //   lastModified: new Date('2025-01-27'),
  //   changeFrequency: 'weekly',
  //   priority: 0.8,
  // })

  return routes
}
