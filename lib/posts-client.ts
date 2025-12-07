import { BlogPost } from '@/types/blog'

const POSTS_STORAGE_KEY = 'blog_posts'
const POSTS_JSON_PATH = '/posts.json'

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

// public/posts.json에서 게시글 가져오기
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

// GitHub에서 동기화 (현재는 public/posts.json 사용)
export async function syncPostsFromGitHub(): Promise<void> {
  try {
    const posts = await fetchPostsFromJSON()
    if (posts.length > 0) {
      savePostsToStorage(posts)
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
  return posts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
