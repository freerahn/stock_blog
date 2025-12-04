import { BlogPost } from '@/types/blog';

const STORAGE_KEY = 'stock_blog_posts';

// localStorage에서 모든 포스트 가져오기
export function getAllPosts(): BlogPost[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

// ID로 포스트 가져오기
export function getPostById(id: string): BlogPost | null {
  const posts = getAllPosts();
  return posts.find(post => post.id === id) || null;
}

// 최신 포스트 가져오기
export function getLatestPosts(limit: number = 10): BlogPost[] {
  const posts = getAllPosts();
  return posts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// 포스트 저장
export function savePost(post: BlogPost): void {
  const posts = getAllPosts();
  const existingIndex = posts.findIndex(p => p.id === post.id);
  
  if (existingIndex >= 0) {
    posts[existingIndex] = post;
  } else {
    posts.push(post);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (error) {
    console.error('Error saving post:', error);
    throw new Error('포스트 저장에 실패했습니다.');
  }
}

// 포스트 삭제
export function deletePost(id: string): boolean {
  const posts = getAllPosts();
  const filteredPosts = posts.filter(post => post.id !== id);
  
  if (filteredPosts.length < posts.length) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPosts));
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }
  
  return false;
}


