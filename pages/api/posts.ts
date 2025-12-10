import type { NextApiRequest, NextApiResponse } from 'next';
import {
  savePost,
  deletePost,
  getPostBySlug,
  generateSlug,
  getAllPosts,
} from '@/lib/utils';

interface PostData {
  title: string;
  content: string;
  date?: string;
  excerpt?: string;
  slug?: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    // 모든 게시글 목록 반환
    const posts = getAllPosts();
    return res.status(200).json({ posts });
  }

  if (req.method === 'POST') {
    // 새 게시글 생성
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
    // 게시글 수정
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
    // 게시글 삭제
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

