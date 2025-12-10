// Cloudflare Pages Functions
// GitHub API를 사용하여 게시글 관리

const GITHUB_OWNER = 'freerahn';
const GITHUB_REPO = 'stock_blog';
const GITHUB_BRANCH = 'main';
const CONTENT_PATH = 'content/posts';

interface Env {
  GITHUB_TOKEN: string;
}

// Base64 인코딩/디코딩
function encodeBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeBase64(base64: string): string {
  return decodeURIComponent(escape(atob(base64)));
}

// GitHub API 호출
async function githubApi(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `GitHub API 오류: ${response.status}`);
  }

  return response.json();
}

async function getFileSha(path: string, token: string): Promise<string | null> {
  try {
    const file = await githubApi(`/contents/${path}?ref=${GITHUB_BRANCH}`, token);
    return file.sha;
  } catch (error: any) {
    if (error.message?.includes('404')) {
      return null;
    }
    throw error;
  }
}

// @ts-ignore - Cloudflare Pages Functions 타입
export const onRequest: any = async (context: any) => {
  const { request, env } = context;
  const token = env.GITHUB_TOKEN;

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'GitHub 토큰이 설정되지 않았습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONS 요청 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'GET') {
      // 게시글 목록 가져오기
      try {
        const files = await githubApi(`/contents/${CONTENT_PATH}?ref=${GITHUB_BRANCH}`, token);
        const slugs = files
          .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
          .map((file: any) => file.name.replace(/\.md$/, ''));
        
        return new Response(JSON.stringify({ posts: slugs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        return new Response(
          JSON.stringify({ posts: [], error: error.message }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (method === 'POST' || method === 'PUT') {
      // 게시글 생성 또는 수정
      const body = await request.json();
      const { title, content, date, excerpt, slug } = body;

      if (!title || !content) {
        return new Response(
          JSON.stringify({ error: '제목과 내용은 필수입니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // slug 생성
      const postSlug = slug || title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      const postDate = date || new Date().toISOString();
      const filePath = `${CONTENT_PATH}/${postSlug}.md`;

      // gray-matter로 마크다운 생성
      const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${postDate}"
${excerpt ? `excerpt: "${excerpt.replace(/"/g, '\\"')}"` : ''}
---

${content}`;

      const sha = await getFileSha(filePath, token);
      
      if (sha) {
        // 수정
        await githubApi(`/contents/${filePath}`, token, {
          method: 'PUT',
          body: JSON.stringify({
            message: `Update post: ${title}`,
            content: encodeBase64(frontmatter),
            branch: GITHUB_BRANCH,
            sha,
          }),
        });
      } else {
        // 생성
        await githubApi(`/contents/${filePath}`, token, {
          method: 'PUT',
          body: JSON.stringify({
            message: `Add post: ${title}`,
            content: encodeBase64(frontmatter),
            branch: GITHUB_BRANCH,
          }),
        });
      }

      return new Response(
        JSON.stringify({ success: true, slug: postSlug }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (method === 'DELETE') {
      // 게시글 삭제
      const body = await request.json();
      const { slug } = body;

      if (!slug) {
        return new Response(
          JSON.stringify({ error: '슬러그는 필수입니다.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const filePath = `${CONTENT_PATH}/${slug}.md`;
      const sha = await getFileSha(filePath, token);

      if (!sha) {
        return new Response(
          JSON.stringify({ error: '게시글을 찾을 수 없습니다.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await githubApi(`/contents/${filePath}`, token, {
        method: 'DELETE',
        body: JSON.stringify({
          message: `Delete post: ${slug}`,
          branch: GITHUB_BRANCH,
          sha,
        }),
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

