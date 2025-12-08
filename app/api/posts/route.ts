import { NextRequest, NextResponse } from 'next/server'

interface Post {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// D1 데이터베이스는 Cloudflare Pages 환경에서만 사용 가능
// 로컬 개발 환경에서는 메모리 저장소 사용
let posts: Post[] = []

export async function GET() {
  try {
    // Cloudflare Pages 환경에서는 D1 사용
    if (process.env.CF_PAGES === '1' || process.env.CF_PAGES_BRANCH) {
      // D1 사용 (실제 구현은 Cloudflare Pages에서)
      return NextResponse.json([])
    }
    
    // 로컬 개발 환경
    return NextResponse.json(posts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ))
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const newPost: Post = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Cloudflare Pages 환경에서는 D1에 저장
    if (process.env.CF_PAGES === '1' || process.env.CF_PAGES_BRANCH) {
      // D1 저장 로직 (실제 구현은 Cloudflare Pages에서)
    } else {
      // 로컬 개발 환경
      posts.push(newPost)
    }

    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
