import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 콘텐츠 디렉토리 경로 (코드와 분리되어 있어야 함)
const postsDirectory = path.join(process.cwd(), 'content', 'posts');

// posts 디렉토리가 없으면 생성
export function ensurePostsDirectory() {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
  }
}

// 모든 게시글의 슬러그 가져오기
export function getAllPostSlugs(): string[] {
  ensurePostsDirectory();
  
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter(name => name.endsWith('.md'))
    .map(name => name.replace(/\.md$/, ''));
}

// 게시글 메타데이터 타입
export interface PostMetaData {
  title: string;
  date: string;
  excerpt?: string;
  [key: string]: any;
}

// 게시글 타입
export interface Post {
  slug: string;
  metaData: PostMetaData;
  content: string;
}

// 특정 게시글 가져오기
export function getPostBySlug(slug: string): Post | null {
  ensurePostsDirectory();
  
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  return {
    slug,
    metaData: data as PostMetaData,
    content,
  };
}

// 모든 게시글 가져오기 (최신순)
export function getAllPosts(): Post[] {
  const slugs = getAllPostSlugs();
  const posts = slugs
    .map(slug => getPostBySlug(slug))
    .filter((post): post is Post => post !== null);
  
  // 날짜순 정렬 (최신순)
  return posts.sort((a, b) => {
    const dateA = new Date(a.metaData.date).getTime();
    const dateB = new Date(b.metaData.date).getTime();
    return dateB - dateA;
  });
}

// 게시글 저장하기
export function savePost(slug: string, metaData: PostMetaData, content: string): void {
  ensurePostsDirectory();
  
  const matterString = matter.stringify(content, metaData);
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  
  fs.writeFileSync(fullPath, matterString, 'utf8');
}

// 게시글 삭제하기
export function deletePost(slug: string): boolean {
  ensurePostsDirectory();
  
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  
  return false;
}

// 슬러그 생성 (제목에서)
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

