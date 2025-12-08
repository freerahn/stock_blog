import { BlogPost } from '@/types/blog'

const POSTS_STORAGE_KEY = 'blog_posts'
const POSTS_JSON_PATH = '/posts.json'
const D1_API_PATH = '/api/posts'

// localStorage에서 게시글 가져오기
function getPostsFromStorage(): BlogPost[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(POSTS_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load posts from localStorage:', error)
  }

  return []
}

// localStorage에 게시글 저장하기
function savePostsToStorage(posts: BlogPost[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts))
  } catch (error) {
    console.error('Failed to save posts to localStorage:', error)
  }
}

// D1 API에서 게시글 가져오기 (Cloudflare Pages)
async function fetchPostsFromD1(): Promise<BlogPost[]> {
  try {
    const response = await fetch(D1_API_PATH, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (response.ok) {
      const posts = await response.json()
      if (Array.isArray(posts) && posts.length > 0) {
        // D1 데이터를 BlogPost 형식으로 변환
        const formattedPosts = posts.map(post => ({
          id: post.id?.toString() || '',
          title: post.title || '',
          content: post.content || '',
          excerpt: post.excerpt || '',
          tags: post.tags ? (typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags) : [],
          images: post.images ? (typeof post.images === 'string' ? JSON.parse(post.images) : post.images) : [],
          createdAt: post.created_at || post.createdAt || new Date().toISOString(),
          updatedAt: post.updated_at || post.updatedAt || new Date().toISOString(),
          author: post.author || 'Anonymous',
          stockSymbol: post.stock_symbol || post.stockSymbol,
          stockName: post.stock_name || post.stockName,
        }))

        savePostsToStorage(formattedPosts)
        return formattedPosts
      }
    }
  } catch (error) {
    console.error('Failed to fetch posts from D1:', error)
  }

  return []
}

// public/posts.json에서 게시글 가져오기 (fallback)
async function fetchPostsFromJSON(): Promise<BlogPost[]> {
  try {
    const response = await fetch(POSTS_JSON_PATH)
    if (response.ok) {
      const posts = await response.json()
      if (Array.isArray(posts) && posts.length > 0) {
        // localStorage에도 저장
        savePostsToStorage(posts)
        return posts
      }
    }
  } catch (error) {
    console.error('Failed to fetch posts from JSON:', error)
  }

  return []
}

// 데이터 동기화 - JSON 우선 (개발), D1 fallback (프로덕션)
export async function syncPostsFromGitHub(): Promise<void> {
  try {
    // 먼저 JSON 파일에서 가져오기 (개발 환경용)
    let posts = await fetchPostsFromJSON()

    // JSON에 데이터가 없으면 D1 API 시도 (프로덕션 환경용)
    if (posts.length === 0) {
      console.log('JSON에 데이터가 없습니다. D1 API를 시도합니다...')
      posts = await fetchPostsFromD1()
    }

    if (posts.length > 0) {
      savePostsToStorage(posts)
      console.log(`✅ ${posts.length}개의 게시글을 로드했습니다.`)
    } else {
      console.warn('⚠️ 게시글이 없습니다.')
    }
  } catch (error) {
    console.error('Failed to sync posts:', error)
  }
}

// 최신 게시글 가져오기
export async function getLatestPosts(limit: number = 10): Promise<BlogPost[]> {
  // 먼저 localStorage 확인
  let posts = getPostsFromStorage()
  
  // localStorage가 비어있으면 public/posts.json에서 가져오기
  if (posts.length === 0) {
    posts = await fetchPostsFromJSON()
  }
  
  // 날짜순으로 정렬하고 limit만큼 반환
  if (posts.length === 0) {
    return []
  }
  
  return posts
    .filter(post => post && post.createdAt) // 유효한 게시글만 필터링
    .sort((a, b) => {
      try {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA
      } catch {
        return 0
      }
    })
    .slice(0, limit)
}

// ID로 게시글 가져오기
export async function getPostById(id: string): Promise<BlogPost | null> {
  let posts = getPostsFromStorage()
  
  if (posts.length === 0) {
    posts = await fetchPostsFromJSON()
  }
  
  return posts.find(post => post.id === id) || null
}

// 게시글 저장하기
export function savePost(post: BlogPost): void {
  const posts = getPostsFromStorage()
  const existingIndex = posts.findIndex(p => p.id === post.id)
  
  if (existingIndex >= 0) {
    posts[existingIndex] = post
  } else {
    posts.push(post)
  }
  
  savePostsToStorage(posts)
}

// 게시글 삭제하기
export function deletePost(id: string): boolean {
  const posts = getPostsFromStorage()
  const filteredPosts = posts.filter(post => post.id !== id)
  
  if (filteredPosts.length < posts.length) {
    savePostsToStorage(filteredPosts)
    return true
  }
  
  return false
}
