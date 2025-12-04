// 통계 추적 스크립트
// 게시글 상세 페이지와 홈페이지에 포함하여 사용

(function() {
    const STATS_KEY = 'stock_blog_stats';
    
    // 통계 데이터 가져오기
    function getStats() {
        try {
            const stored = localStorage.getItem(STATS_KEY);
            if (!stored) return { visitors: {}, views: {} };
            return JSON.parse(stored);
        } catch (error) {
            console.error('Error loading stats:', error);
            return { visitors: {}, views: {} };
        }
    }
    
    // 통계 데이터 저장
    function saveStats(stats) {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
            return true;
        } catch (error) {
            console.error('Error saving stats:', error);
            return false;
        }
    }
    
    // 방문자 기록
    function recordVisitor() {
        const today = new Date().toISOString().split('T')[0];
        const stats = getStats();
        
        if (!stats.visitors[today]) {
            stats.visitors[today] = 0;
        }
        stats.visitors[today]++;
        
        saveStats(stats);
    }
    
    // 조회수 기록
    function recordView(postId) {
        if (!postId) return;
        
        const stats = getStats();
        
        if (!stats.views[postId]) {
            stats.views[postId] = 0;
        }
        stats.views[postId]++;
        
        saveStats(stats);
    }
    
    // 페이지 로드 시 실행
    function init() {
        // 홈페이지 방문 기록
        if (window.location.pathname === '/' || 
            window.location.pathname === '/index.html' ||
            window.location.pathname.endsWith('index.html')) {
            recordVisitor();
        }
        
        // 게시글 상세 페이지 조회수 기록
        // Next.js 라우팅: /posts/[id]
        const nextjsPostMatch = window.location.pathname.match(/\/posts\/(.+)/);
        if (nextjsPostMatch && nextjsPostMatch[1]) {
            recordView(nextjsPostMatch[1]);
            return;
        }
        
        // 해시 라우팅: #/posts/[id]
        const hashMatch = window.location.hash.match(/\/posts\/(.+)/);
        if (hashMatch && hashMatch[1]) {
            recordView(hashMatch[1]);
            return;
        }
    }
    
    // DOM 로드 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 해시 변경 감지 (SPA 라우팅용)
    window.addEventListener('hashchange', function() {
        const hashMatch = window.location.hash.match(/\/posts\/(.+)/);
        if (hashMatch && hashMatch[1]) {
            recordView(hashMatch[1]);
        }
    });
    
    // 전역 함수로 내보내기 (필요시 직접 호출 가능)
    window.statsTracker = {
        recordVisitor: recordVisitor,
        recordView: recordView,
        getStats: getStats
    };
})();


