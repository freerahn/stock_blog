// Cloudflare Workers API - 게시글 CRUD
export interface Env {
  DB: D1Database;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string | string[];
  images: string | string[];
  author: string;
  stockSymbol?: string;
  stockName?: string;
  createdAt: string;
  updatedAt: string;
}

// 모든 게시글 가져오기
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await env.DB.prepare(
      `SELECT * FROM posts ORDER BY createdAt DESC LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all();

    const posts = result.results.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : row.tags,
      images: typeof row.images === 'string' ? JSON.parse(row.images || '[]') : row.images,
      author: row.author,
      stockSymbol: row.stockSymbol || undefined,
      stockName: row.stockName || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return new Response(JSON.stringify(posts), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10, s-maxage=10', // 10초 캐시 (빠른 로딩)
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// 게시글 저장 (생성/수정)
export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  try {
    const { env, request } = context;
    const post: BlogPost = await request.json();

    // 필수 필드 검증
    if (!post.id || !post.title || !post.content) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const now = new Date().toISOString();
    const tags = typeof post.tags === 'string' ? post.tags : JSON.stringify(post.tags || []);
    const images = typeof post.images === 'string' ? post.images : JSON.stringify(post.images || []);

    // 기존 게시글 확인
    const existing = await env.DB.prepare('SELECT id FROM posts WHERE id = ?')
      .bind(post.id)
      .first();

    if (existing) {
      // 업데이트
      await env.DB.prepare(
        `UPDATE posts SET 
          title = ?, content = ?, excerpt = ?, tags = ?, images = ?, 
          author = ?, stockSymbol = ?, stockName = ?, updatedAt = ?
        WHERE id = ?`
      )
        .bind(
          post.title,
          post.content,
          post.excerpt || '',
          tags,
          images,
          post.author || 'investa',
          post.stockSymbol || null,
          post.stockName || null,
          now,
          post.id
        )
        .run();
    } else {
      // 생성
      await env.DB.prepare(
        `INSERT INTO posts (id, title, content, excerpt, tags, images, author, stockSymbol, stockName, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          post.id,
          post.title,
          post.content,
          post.excerpt || '',
          tags,
          images,
          post.author || 'investa',
          post.stockSymbol || null,
          post.stockName || null,
          post.createdAt || now,
          now
        )
        .run();
    }

    return new Response(JSON.stringify({ success: true, id: post.id }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// 게시글 삭제
export async function onRequestDelete(context: { env: Env; request: Request }): Promise<Response> {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// OPTIONS 요청 처리 (CORS)
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
