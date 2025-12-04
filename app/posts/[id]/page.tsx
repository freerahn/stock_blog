'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPostById, getLatestPosts } from '@/lib/posts-client'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import RecentPosts from '@/components/RecentPosts'
import StockChart from '@/components/StockChart'
import { BlogPost } from '@/types/blog'

// 주의: localStorage는 서버에서 접근할 수 없으므로 클라이언트 사이드 렌더링을 사용합니다
// 검색 엔진(구글 등)은 JavaScript를 실행하므로 동적으로 추가된 메타 태그와 구조화된 데이터를 인식할 수 있습니다

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [post, setPost] = useState<BlogPost | null>(null)
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    const foundPost = getPostById(id)
    if (!foundPost) {
      router.push('/')
      return
    }
    setPost(foundPost)
    setRecentPosts(getLatestPosts(6))
    
    // 조회수 기록
    if (typeof window !== 'undefined') {
      const STATS_KEY = 'stock_blog_stats'
      try {
        const stored = localStorage.getItem(STATS_KEY)
        const stats = stored ? JSON.parse(stored) : { visitors: {}, views: {} }
        
        if (!stats.views) stats.views = {}
        if (!stats.views[id]) stats.views[id] = 0
        stats.views[id]++
        
        localStorage.setItem(STATS_KEY, JSON.stringify(stats))
      } catch (error) {
        console.error('Error recording view:', error)
      }
    }
  }, [id, router])

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    )
  }

  const description = post.tags.length > 0 
    ? `${post.excerpt} | 태그: ${post.tags.join(', ')}`
    : post.excerpt

  // 구조화된 데이터 (JSON-LD)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.images.length > 0 ? post.images : undefined,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'investa의 투자 정보',
    },
    keywords: post.tags.join(', '),
    articleSection: '주식 분석',
    ...(post.stockSymbol && {
      about: {
        '@type': 'FinancialProduct',
        name: post.stockName,
        tickerSymbol: post.stockSymbol,
      },
    }),
  }

  useEffect(() => {
    if (!post) return
    
    document.title = `${post.title} | investa의 투자 정보`
    
    // 메타 태그 동적 업데이트 (검색 엔진이 JavaScript를 실행하면 인식됨)
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attribute}="${name}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, name)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', content)
    }

    updateMetaTag('description', description)
    updateMetaTag('keywords', post.tags.join(', '))
    updateMetaTag('og:title', post.title, true)
    updateMetaTag('og:description', description, true)
    updateMetaTag('og:type', 'article', true)
    if (post.images.length > 0) {
      updateMetaTag('og:image', post.images[0], true)
    }
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', post.title)
    updateMetaTag('twitter:description', description)
    if (post.images.length > 0) {
      updateMetaTag('twitter:image', post.images[0])
    }
  }, [post, description])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 메인 콘텐츠 */}
          <article className="flex-1 bg-white rounded-lg shadow-md p-8">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>
              {post.stockName && (
                <div className="mb-4">
                  <span className="text-lg font-semibold text-primary-600">
                    {post.stockName}
                  </span>
                  {post.stockSymbol && (
                    <span className="text-lg text-gray-600 ml-2">
                      ({post.stockSymbol})
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <span>작성자: {post.author}</span>
                <span>•</span>
                <time dateTime={post.createdAt}>
                  {format(new Date(post.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                </time>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </header>

            {/* 주가 그래프 */}
            {post.stockSymbol && post.stockName && (
              <StockChart stockSymbol={post.stockSymbol} stockName={post.stockName} />
            )}

            {/* 이미지 갤러리 */}
            {post.images && post.images.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.images.map((image, index) => (
                    <div key={index} className="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${post.title} 이미지 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 본문 */}
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div>
          </article>

          {/* PC: 오른쪽 사이드바, 모바일: 하단 */}
          <aside className="lg:w-80 lg:sticky lg:top-8 lg:h-fit">
            <div className="lg:block hidden">
              <RecentPosts posts={recentPosts} currentPostId={post.id} />
            </div>
          </aside>
        </div>

        {/* 모바일: 하단 최신글 */}
        <div className="lg:hidden mt-8">
          <RecentPosts posts={recentPosts} currentPostId={post.id} />
        </div>
      </div>
    </>
  )
}
