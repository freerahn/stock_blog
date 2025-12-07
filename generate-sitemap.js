// 사이트맵 생성 스크립트
// 브라우저 콘솔에서 실행하거나 Node.js 환경에서 실행할 수 있습니다.

// 사용법:
// 1. 브라우저에서 블로그 페이지를 열고
// 2. 개발자 도구 콘솔에서 이 스크립트를 실행하거나
// 3. localStorage에서 게시글 데이터를 읽어서 사이트맵을 생성

function generateSitemap() {
    const baseUrl = 'https://freerahn.github.io/stock_blog';
    const STORAGE_KEY = 'stock_blog_posts';
    
    // localStorage에서 게시글 가져오기
    let posts = [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            posts = JSON.parse(stored);
        }
    } catch (error) {
        console.error('게시글 로드 실패:', error);
        return null;
    }
    
    // 사이트맵 XML 생성
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // 홈페이지
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    // 게시글 작성 페이지
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/admin/write</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.5</priority>\n';
    xml += '  </url>\n';
    
    // 각 게시글 추가
    posts.forEach(post => {
        const lastModified = post.updatedAt 
            ? new Date(post.updatedAt).toISOString().split('T')[0]
            : new Date(post.createdAt).toISOString().split('T')[0];
        
        // Next.js 버전 URL
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/posts/${post.id}</loc>\n`;
        xml += `    <lastmod>${lastModified}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    return xml;
}

// 브라우저 환경에서 실행
if (typeof window !== 'undefined') {
    window.generateSitemap = generateSitemap;
    console.log('사이트맵 생성 함수가 준비되었습니다.');
    console.log('사용법: const sitemap = generateSitemap(); console.log(sitemap);');
    console.log('또는: copy(generateSitemap()); // 클립보드에 복사');
}

// Node.js 환경에서 실행
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateSitemap };
}





