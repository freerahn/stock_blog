'use client'

import { useState, useEffect } from 'react'
import { getLatestPosts, syncPostsFromGitHub } from '@/lib/posts-client'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import { BlogPost } from '@/types/blog'

export default function Home() {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    // GitHub에서 자동 동기화 후 게시글 로드
    const loadPosts = async () => {
      // GitHub에서 동기화
      await syncPostsFromGitHub()
      
      // 동기화 후 게시글 로드
      setPosts(await getLatestPosts(12))
    }
    
    loadPosts()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          investa의 투자 정보
        </h1>
        <p className="text-lg text-gray-600">
          전문적인 주식 종목 분석과 주가 전망을 제공합니다
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">아직 작성된 글이 없습니다.</p>
          <Link 
            href="/admin/write" 
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
          >
            첫 글 작성하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
