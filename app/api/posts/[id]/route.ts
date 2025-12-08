import { NextRequest, NextResponse } from 'next/server'

interface Post {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

// 로컬 개발용 메모리 저장소
let posts: Post[] = []

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = posts.find(p => p.id === params.id)
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const index = posts.findIndex(p => p.id === params.id)
    
    if (index === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    posts[index] = {
      ...posts[index],
      title,
      content,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(posts[index])
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const index = posts.findIndex(p => p.id === params.id)
    
    if (index === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    posts.splice(index, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

