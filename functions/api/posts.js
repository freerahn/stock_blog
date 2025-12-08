// Cloudflare Pages Functions - D1 API 엔드포인트
export async function onRequestGet({ env }) {
  try {
    // D1이 바인딩되어 있는지 확인
    if (!env.DB) {
      console.warn('D1 database not bound, returning empty array');
      return new Response(JSON.stringify([]), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM posts ORDER BY createdAt DESC'
    ).all();

    return new Response(JSON.stringify(results || []), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error) {
    console.error('D1 query error:', error);
    // 에러 발생 시 빈 배열 반환 (fallback to JSON)
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: 'Database not available' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const post = await request.json();

    const result = await env.DB.prepare(
      `INSERT INTO posts (id, title, content, excerpt, tags, images, author, stockSymbol, stockName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      post.id || Date.now().toString(),
      post.title,
      post.content,
      post.excerpt || '',
      JSON.stringify(post.tags || []),
      JSON.stringify(post.images || []),
      post.author || 'investa',
      post.stockSymbol || null,
      post.stockName || null,
      post.createdAt || new Date().toISOString(),
      post.updatedAt || new Date().toISOString()
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: post.id
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('D1 insert error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
