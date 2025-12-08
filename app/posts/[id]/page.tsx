import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

interface Post {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

async function getPost(id: string): Promise<Post | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/posts/${id}`, {
      cache: 'no-store',
    })
    
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.error('Failed to fetch post:', error)
  }
  
  return null
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await getPost(params.id)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-primary-600">
              investa의 블로그
            </Link>
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900"
            >
              관리자
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <time className="text-gray-500 text-sm block mb-8">
            {format(new Date(post.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
          </time>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-primary-600 hover:text-primary-700"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  )
}
