import type { NextApiRequest, NextApiResponse } from 'next';
import {
  savePost,
  deletePost,
  getPostBySlug,
  generateSlug,
  getAllPosts,
} from '@/lib/utils';
import {
  savePostToGitHub,
  deletePostFromGitHub,
  getDirectoryFiles,
  getFile,
} from '@/lib/github';

interface PostData {
  title: string;
  content: string;
  date?: string;
  excerpt?: string;
  slug?: string;
}

// 환경 확인 (프로덕션에서는 GitHub API 사용)
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.CF_PAGES;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 프로덕션 환경에서는 GitHub API 사용
  if (isProduction) {
    return handleGitHubAPI(req, res);
  }

  // 개발 환경에서는 로컬 파일 시스템 사용
  if (req.method === 'GET') {
    try {
      const posts = getAllPosts();
      return res.status(200).json({ posts });
    } catch (error) {
      return res.status(500).json({ error: '게시글 목록을 가져오는데 실패했습니다.' });
    }
  }

  if (req.method === 'POST') {
    const { title, content, date, excerpt, slug }: PostData = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용은 필수입니다.' });
    }

    const postSlug = slug || generateSlug(title);
    const postDate = date || new Date().toISOString();

    try {
      savePost(postSlug, { title, date: postDate, excerpt }, content);
      return res.status(200).json({ success: true, slug: postSlug });
    } catch (error) {
      return res.status(500).json({ error: '게시글 저장에 실패했습니다.' });
    }
  }

  if (req.method === 'PUT') {
    const { slug, title, content, date, excerpt }: PostData = req.body;

    if (!slug || !title || !content) {
      return res
        .status(400)
        .json({ error: '슬러그, 제목, 내용은 필수입니다.' });
    }

    const existingPost = getPostBySlug(slug);
    if (!existingPost) {
      return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
    }

    try {
      const postDate = date || existingPost.metaData.date;
      savePost(slug, { title, date: postDate, excerpt }, content);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: '게시글 수정에 실패했습니다.' });
    }
  }

  if (req.method === 'DELETE') {
    const { slug } = req.body;

    if (!slug) {
      return res.status(400).json({ error: '슬러그는 필수입니다.' });
    }

    try {
      const deleted = deletePost(slug);
      if (deleted) {
        return res.status(200).json({ success: true });
      } else {
        return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      }
    } catch (error) {
      return res.status(500).json({ error: '게시글 삭제에 실패했습니다.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

// GitHub API를 사용한 처리
async function handleGitHubAPI(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const slugs = await getDirectoryFiles('content/posts');
      // 각 게시글의 메타데이터 가져오기
      const posts = await Promise.all(
        slugs.map(async (slug) => {
          try {
            const content = await getFile(`content/posts/${slug}.md`);
            if (!content) return null;
            const matter = await import('gray-matter');
            const { data } = matter(content);
            return {
              slug,
              metaData: data,
              content: '', // 목록에서는 내용 불필요
            };
          } catch {
            return null;
          }
        })
      );
      const validPosts = posts.filter((p): p is NonNullable<typeof p> => p !== null);
      // 날짜순 정렬
      validPosts.sort((a, b) => {
        const dateA = new Date(a.metaData.date).getTime();
        const dateB = new Date(b.metaData.date).getTime();
        return dateB - dateA;
      });
      return res.status(200).json({ posts: validPosts });
    } catch (error: any) {
      return res.status(200).json({ posts: [], error: error.message });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { title, content, date, excerpt, slug }: PostData = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: '제목과 내용은 필수입니다.' });
    }

    try {
      const postSlug = slug || generateSlug(title);
      const postDate = date || new Date().toISOString();
      
      await savePostToGitHub(postSlug, title, content, postDate, excerpt);
      return res.status(200).json({ success: true, slug: postSlug });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '게시글 저장에 실패했습니다.' });
    }
  }

  if (req.method === 'DELETE') {
    const { slug, title } = req.body;

    if (!slug) {
      return res.status(400).json({ error: '슬러그는 필수입니다.' });
    }

    try {
      await deletePostFromGitHub(slug, title || slug);
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '게시글 삭제에 실패했습니다.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}

