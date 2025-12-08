import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Post {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

async function getPosts(): Promise<Post[]> {
  try {
    // Cloudflare Pages 환경에서는 API 라우트 사용
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/posts`, {
      cache: 'no-store',
    })
    
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch posts:', error)
  }
  
  return []
}

export default async function Home() {
  const posts = await getPosts()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">investa의 블로그</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">아직 작성된 글이 없습니다.</p>
            <Link
              href="/admin"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              관리자 페이지로 이동
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <Link href={`/posts/${post.id}`}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 hover:text-primary-600">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <time>
                    {format(new Date(post.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
                  </time>
                  <Link
                    href={`/posts/${post.id}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    더보기 →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
