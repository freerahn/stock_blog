'use client'

import { useState, useEffect } from 'react'
import { getLatestPosts, syncPostsFromGitHub } from '@/lib/posts-client'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import { BlogPost } from '@/types/blog'

export default function PostsList() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    
    // GitHub에서 자동 동기화 후 게시글 로드
    const loadPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // GitHub에서 동기화
        await syncPostsFromGitHub()
        
        // 동기화 후 게시글 로드
        const loadedPosts = await getLatestPosts(12)
        setPosts(loadedPosts || [])
      } catch (err) {
        console.error('Failed to load posts:', err)
        setError('게시글을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    
    loadPosts()
  }, [mounted])

  if (!mounted) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">초기화 중...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500 text-lg">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setLoading(true)
            window.location.reload()
          }}
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">아직 작성된 글이 없습니다.</p>
        <Link 
          href="/admin/write" 
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          첫 글 작성하기
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}


