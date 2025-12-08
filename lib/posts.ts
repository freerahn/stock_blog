import { BlogPost } from '@/types/blog';
import fs from 'fs';
import path from 'path';

const postsDirectory = path.join(process.cwd(), 'data');
const postsFilePath = path.join(postsDirectory, 'posts.json');

// 데이터 디렉토리 초기화
if (!fs.existsSync(postsDirectory)) {
  fs.mkdirSync(postsDirectory, { recursive: true });
}

// 초기 데이터 파일 생성
if (!fs.existsSync(postsFilePath)) {
  fs.writeFileSync(postsFilePath, JSON.stringify([], null, 2));
}

export function getAllPosts(): BlogPost[] {
  try {
    const fileContents = fs.readFileSync(postsFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    return [];
  }
}

export function getPostById(id: string): BlogPost | null {
  const posts = getAllPosts();
  return posts.find(post => post.id === id) || null;
}

export function getLatestPosts(limit: number = 10): BlogPost[] {
  const posts = getAllPosts();
  return posts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function savePost(post: BlogPost): void {
  const posts = getAllPosts();
  const existingIndex = posts.findIndex(p => p.id === post.id);
  
  if (existingIndex >= 0) {
    posts[existingIndex] = post;
  } else {
    posts.push(post);
  }
  
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
}

export function deletePost(id: string): boolean {
  const posts = getAllPosts();
  const filteredPosts = posts.filter(post => post.id !== id);
  
  if (filteredPosts.length < posts.length) {
    fs.writeFileSync(postsFilePath, JSON.stringify(filteredPosts, null, 2));
    return true;
  }
  
  return false;
}







