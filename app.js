// 데이터 저장소 (localStorage + Firebase)
const STORAGE_KEY = 'stock_blog_posts';
const GITHUB_POSTS_URL = 'https://raw.githubusercontent.com/freerahn/stock_blog/main/public/posts.json';
const SYNC_KEY = 'stock_blog_last_sync';
const FIREBASE_COLLECTION = 'posts';

// GitHub에서 게시글 데이터 동기화
async function syncPostsFromGitHub() {
    try {
        // 캐시 무시하고 항상 최신 데이터 가져오기
        const response = await fetch(GITHUB_POSTS_URL + '?t=' + Date.now(), {
            cache: 'no-store',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
            }
        });
        
        if (response.ok) {
            const githubPosts = await response.json();
            
            if (Array.isArray(githubPosts) && githubPosts.length > 0) {
                const localPosts = getAllPosts();
                
                // GitHub 데이터를 우선 사용 (다른 브라우저에서 작성한 글이 있으면 보이도록)
                const mergedPosts = [...githubPosts];
                
                // 로컬에만 있는 최신 데이터가 있으면 추가 (병합)
                localPosts.forEach(localPost => {
                    const existingIndex = mergedPosts.findIndex(p => p.id === localPost.id);
                    if (existingIndex < 0) {
                        // GitHub에 없고 로컬에만 있으면 추가
                        mergedPosts.push(localPost);
                    } else {
                        // 둘 다 있으면 더 최신 데이터 사용
                        const localDate = new Date(localPost.updatedAt || localPost.createdAt);
                        const githubDate = new Date(mergedPosts[existingIndex].updatedAt || mergedPosts[existingIndex].createdAt);
                        if (localDate > githubDate) {
                            mergedPosts[existingIndex] = localPost;
                        }
                    }
                });
                
                // 병합된 데이터 저장
                localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPosts));
                localStorage.setItem(SYNC_KEY, Date.now().toString());
                console.log(`✅ GitHub에서 ${githubPosts.length}개의 게시글을 동기화했습니다. (총 ${mergedPosts.length}개)`);
                
                // 사이트맵 업데이트
                updateSitemap(mergedPosts);
                
                return true;
            } else {
                // GitHub에 데이터가 없으면 로컬 데이터만 사용
                console.log('ℹ️ GitHub에 게시글이 없습니다. 로컬 데이터를 사용합니다.');
            }
        } else {
            console.warn('GitHub에서 데이터를 가져올 수 없습니다:', response.status);
        }
    } catch (error) {
        console.warn('GitHub 동기화 실패:', error.message);
    }
    
    return false;
}

// 페이지 로드 시 자동 동기화
function autoSyncPosts() {
    // 마지막 동기화 시간 확인 (5분마다 한 번만 동기화)
    const lastSync = localStorage.getItem(SYNC_KEY);
    const now = Date.now();
    
    if (!lastSync || (now - parseInt(lastSync)) > 5 * 60 * 1000) {
        syncPostsFromGitHub().then(synced => {
            if (synced) {
                localStorage.setItem(SYNC_KEY, now.toString());
                // 동기화 후 페이지 새로고침 (선택사항)
                // window.location.reload();
            }
        });
    }
}

function getAllPosts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('Error loading posts:', error);
        return [];
    }
}

function getPostById(id) {
    const posts = getAllPosts();
    return posts.find(post => post.id === id) || null;
}

function getLatestPosts(limit = 10) {
    const posts = getAllPosts();
    return posts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
}

async function savePost(post) {
    const posts = getAllPosts();
    const existingIndex = posts.findIndex(p => p.id === post.id);
    
    if (existingIndex >= 0) {
        posts[existingIndex] = post;
    } else {
        posts.push(post);
    }
    
    try {
        // localStorage에 저장 (즉시 반영)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        
        // Firebase에 저장 (실시간 동기화) - 우선 사용
        if (window.firebaseInitialized && window.firebaseDb) {
            try {
                await savePostToFirebase(post);
                console.log('✅ Firebase에 저장 완료 - 다른 브라우저에서 즉시 볼 수 있습니다!');
            } catch (firebaseError) {
                console.error('Firebase 저장 실패:', firebaseError);
                // Firebase 실패해도 계속 진행
            }
        } else {
            console.log('💡 Firebase가 설정되지 않았습니다. GitHub 동기화를 사용합니다.');
        }
        
        // 사이트맵 자동 업데이트
        updateSitemap(posts);
        
        // GitHub에 자동 업로드 (Firebase가 없을 때 대안)
        autoUploadToGitHub(posts);
    } catch (error) {
        console.error('Error saving post:', error);
        throw new Error('포스트 저장에 실패했습니다.');
    }
}

// Firebase에 포스트 저장
async function savePostToFirebase(post) {
    if (!window.firebaseInitialized || !window.firebaseDb) {
        console.log('💡 Firebase가 설정되지 않았습니다. localStorage만 사용합니다.');
        return;
    }
    
    try {
        const { doc, setDoc } = window.firebaseFunctions;
        const postRef = doc(window.firebaseDb, FIREBASE_COLLECTION, post.id);
        await setDoc(postRef, post, { merge: true });
        console.log('✅ Firebase에 저장되었습니다:', post.id);
    } catch (error) {
        console.error('Firebase 저장 실패:', error);
        throw error;
    }
}

// Firebase에서 포스트 삭제
async function deletePostFromFirebase(postId) {
    if (!window.firebaseInitialized || !window.firebaseDb) {
        return;
    }
    
    try {
        const { doc, deleteDoc } = window.firebaseFunctions;
        const postRef = doc(window.firebaseDb, FIREBASE_COLLECTION, postId);
        await deleteDoc(postRef);
        console.log('✅ Firebase에서 삭제되었습니다:', postId);
    } catch (error) {
        console.error('Firebase 삭제 실패:', error);
    }
}

// Firebase에서 모든 포스트 가져오기
async function getPostsFromFirebase() {
    if (!window.firebaseInitialized || !window.firebaseDb) {
        return [];
    }
    
    try {
        const { collection, getDocs } = window.firebaseFunctions;
        const postsRef = collection(window.firebaseDb, FIREBASE_COLLECTION);
        const snapshot = await getDocs(postsRef);
        const posts = [];
        snapshot.forEach((doc) => {
            posts.push(doc.data());
        });
        return posts;
    } catch (error) {
        console.error('Firebase 조회 실패:', error);
        return [];
    }
}

// 기존 로컬 글들을 Firebase로 업로드
async function syncLocalPostsToFirebase() {
    if (!window.firebaseInitialized || !window.firebaseDb) {
        console.log('💡 Firebase가 설정되지 않았습니다.');
        return;
    }
    
    const localPosts = getAllPosts();
    if (localPosts.length === 0) {
        console.log('📝 업로드할 로컬 글이 없습니다.');
        return;
    }
    
    const firebasePosts = await getPostsFromFirebase();
    const firebasePostIds = new Set(firebasePosts.map(p => p.id));
    
    // Firebase에 없는 로컬 글들만 업로드
    const postsToUpload = localPosts.filter(post => !firebasePostIds.has(post.id));
    
    if (postsToUpload.length === 0) {
        console.log('✅ 모든 로컬 글이 이미 Firebase에 있습니다.');
        return;
    }
    
    console.log(`📤 ${postsToUpload.length}개의 기존 글을 Firebase에 업로드하는 중...`);
    
    let successCount = 0;
    for (const post of postsToUpload) {
        try {
            await savePostToFirebase(post);
            successCount++;
            console.log(`✅ [${successCount}/${postsToUpload.length}] 업로드 완료: ${post.title}`);
        } catch (error) {
            console.error(`❌ 업로드 실패: ${post.title}`, error);
        }
    }
    
    console.log(`✅ 기존 글 Firebase 업로드 완료: ${successCount}/${postsToUpload.length}개`);
}

// Firebase 실시간 동기화 설정
function setupFirebaseRealtimeSync() {
    if (!window.firebaseInitialized || !window.firebaseDb) {
        console.log('💡 Firebase가 설정되지 않았습니다. 실시간 동기화를 사용할 수 없습니다.');
        return;
    }
    
    try {
        const { collection, onSnapshot } = window.firebaseFunctions;
        const postsRef = collection(window.firebaseDb, FIREBASE_COLLECTION);
        
        // 실시간 리스너 설정
        const unsubscribe = onSnapshot(postsRef, (snapshot) => {
            const posts = [];
            snapshot.forEach((doc) => {
                posts.push(doc.data());
            });
            
            // Firebase 데이터를 localStorage에 동기화
            const currentPosts = getAllPosts();
            const mergedPosts = [...posts];
            
            // 로컬에만 있는 최신 데이터 병합
            currentPosts.forEach(localPost => {
                const existingIndex = mergedPosts.findIndex(p => p.id === localPost.id);
                if (existingIndex < 0) {
                    mergedPosts.push(localPost);
                } else {
                    const localDate = new Date(localPost.updatedAt || localPost.createdAt);
                    const firebaseDate = new Date(mergedPosts[existingIndex].updatedAt || mergedPosts[existingIndex].createdAt);
                    if (localDate > firebaseDate) {
                        mergedPosts[existingIndex] = localPost;
                    }
                }
            });
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPosts));
            localStorage.setItem(SYNC_KEY, Date.now().toString());
            
            console.log('🔄 Firebase 실시간 동기화:', mergedPosts.length, '개 게시글');
            
            // 페이지 재렌더링 (데이터 변경 반영)
            if (window.router) {
                const currentHash = window.location.hash;
                if (currentHash && currentHash.startsWith('#/posts/')) {
                    const postId = currentHash.split('/posts/')[1];
                    window.router.renderPost(postId);
                } else if (!currentHash || currentHash === '#/' || currentHash === '#') {
                    window.router.renderHome();
                } else {
                    window.router.render();
                }
            }
        }, (error) => {
            console.error('❌ Firebase 실시간 동기화 오류:', error);
        });
        
        // 전역에 저장하여 나중에 해제할 수 있도록
        window.firebaseUnsubscribe = unsubscribe;
        console.log('✅ Firebase 실시간 동기화 시작 - 글을 쓰면 즉시 다른 브라우저에서 볼 수 있습니다!');
    } catch (error) {
        console.error('❌ Firebase 실시간 동기화 설정 실패:', error);
    }
}

// GitHub에 자동 업로드
async function autoUploadToGitHub(posts) {
    const GITHUB_TOKEN_KEY = 'github_personal_access_token';
    const GITHUB_REPO = 'freerahn/stock_blog';
    const GITHUB_FILE_PATH = 'public/posts.json';
    
    const token = localStorage.getItem(GITHUB_TOKEN_KEY);
    
    if (!token) {
        // 토큰이 없으면 안내만 표시 (조용히 실패)
        console.log('💡 GitHub 토큰이 설정되지 않았습니다. 관리자 페이지에서 설정하세요.');
        return;
    }
    
    try {
        const content = JSON.stringify(posts, null, 2);
        const contentBase64 = btoa(unescape(encodeURIComponent(content)));
        
        // 먼저 파일이 존재하는지 확인 (SHA 필요)
        let sha = null;
        try {
            const getFileResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                    }
                }
            );
            
            if (getFileResponse.ok) {
                const fileData = await getFileResponse.json();
                sha = fileData.sha;
            }
        } catch (error) {
            // 파일이 없을 수 있음 (정상)
            console.log('파일이 없거나 확인 실패:', error);
        }
        
        // 파일 업로드/업데이트
        const uploadResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Update posts.json - ${new Date().toISOString()}`,
                    content: contentBase64,
                    ...(sha && { sha: sha })
                })
            }
        );
        
        if (uploadResponse.ok) {
            console.log('✅ GitHub에 자동 업로드되었습니다!');
        } else {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || '업로드 실패');
        }
    } catch (error) {
        console.error('GitHub 자동 업로드 실패:', error);
        // 실패해도 게시글은 저장되었으므로 조용히 실패
    }
}

// 사이트맵 생성 및 업데이트 함수
function generateSitemap(posts) {
    const baseUrl = 'https://freerahn.github.io/stock_blog';
    const today = new Date().toISOString().split('T')[0];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // 홈페이지
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    // 게시글 작성 페이지
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/admin/write</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.5</priority>\n';
    xml += '  </url>\n';
    
    // 각 게시글 추가
    posts.forEach(post => {
        const lastModified = post.updatedAt 
            ? new Date(post.updatedAt).toISOString().split('T')[0]
            : new Date(post.createdAt).toISOString().split('T')[0];
        
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

function updateSitemap(posts) {
    try {
        const sitemapXml = generateSitemap(posts);
        localStorage.setItem('stock_blog_sitemap', sitemapXml);
        console.log('✅ 사이트맵이 자동으로 업데이트되었습니다.');
    } catch (error) {
        console.error('사이트맵 업데이트 실패:', error);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`;
}

function formatDateShort(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

// 라우터
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = '';
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // 페이지 로드 시 GitHub에서 데이터 동기화 (강제 실행)
        syncPostsFromGitHub().then(synced => {
            if (synced) {
                // 동기화 성공 시 현재 페이지 새로고침
                const currentHash = window.location.hash;
                if (currentHash && currentHash.startsWith('#/posts/')) {
                    // 게시글 페이지인 경우 다시 렌더링
                    const postId = currentHash.split('/posts/')[1];
                    this.renderPost(postId);
                } else if (!currentHash || currentHash === '#/' || currentHash === '#') {
                    // 홈페이지인 경우 다시 렌더링
                    this.renderHome();
                }
            }
        });
        
        this.handleRoute();
    }

    route(path, handler) {
        this.routes[path] = handler;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1);
        this.currentRoute = hash || '/';
        
        if (this.currentRoute === '/' || this.currentRoute === '') {
            this.renderHome();
        } else if (this.currentRoute === '/write3') {
            this.renderWrite();
        } else if (this.currentRoute.startsWith('/posts/')) {
            const postId = this.currentRoute.split('/posts/')[1];
            this.renderPost(postId);
        } else {
            this.renderHome();
        }
    }

    renderHome() {
        const posts = getLatestPosts(12);
        const allPosts = getAllPosts();
        
        // 홈페이지 로드 시 사이트맵 업데이트
        updateSitemap(allPosts);
        
        const app = document.getElementById('app');
        
        app.innerHTML = `
            ${this.renderHeader()}
            <div class="container mx-auto px-4 py-8">
                <div class="mb-8">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">investa의 투자 정보</h1>
                    <p class="text-lg text-gray-600">전문적인 주식 종목 분석과 주가 전망을 제공합니다</p>
                </div>
                ${posts.length === 0 ? `
                    <div class="text-center py-16">
                        <p class="text-gray-500 text-lg mb-4">아직 작성된 글이 없습니다.</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${posts.map(post => this.renderPostCard(post)).join('')}
                    </div>
                `}
            </div>
            ${this.renderFooter()}
        `;
    }

    renderPost(postId) {
        const post = getPostById(postId);
        if (!post) {
            window.location.hash = '#/';
            return;
        }
        
        // 게시글 조회 시 사이트맵도 업데이트 (수정된 경우)
        const allPosts = getAllPosts();
        updateSitemap(allPosts);

        // 조회수 기록
        if (window.statsTracker && window.statsTracker.recordView) {
            window.statsTracker.recordView(postId);
        }

        const recentPosts = getLatestPosts(6);
        const description = post.tags.length > 0 
            ? `${post.excerpt} | 태그: ${post.tags.join(', ')}`
            : post.excerpt;

        // 메타 태그 업데이트
        document.title = `${post.title} | investa의 투자 정보`;
        this.updateMetaTag('description', description);
        this.updateMetaTag('keywords', post.tags.join(', '));
        this.updateMetaTag('og:title', post.title, true);
        this.updateMetaTag('og:description', description, true);
        this.updateMetaTag('og:type', 'article', true);
        if (post.images.length > 0) {
            this.updateMetaTag('og:image', post.images[0], true);
        }
        this.updateMetaTag('twitter:card', 'summary_large_image');
        this.updateMetaTag('twitter:title', post.title);
        this.updateMetaTag('twitter:description', description);
        if (post.images.length > 0) {
            this.updateMetaTag('twitter:image', post.images[0]);
        }

        // 구조화된 데이터 (JSON-LD) 추가
        this.addStructuredData(post, description);

        const app = document.getElementById('app');
        app.innerHTML = `
            ${this.renderHeader()}
            <div class="container mx-auto px-4 py-8">
                <div class="flex flex-col lg:flex-row gap-8">
                    <article class="flex-1 bg-white rounded-lg shadow-md p-8">
                        <header class="mb-8">
                            <h1 class="text-4xl font-bold text-gray-900 mb-4">${this.escapeHtml(post.title)}</h1>
                            ${post.stockName ? `
                                <div class="mb-4">
                                    <span class="text-lg font-semibold text-blue-600">${this.escapeHtml(post.stockName)}</span>
                                    ${post.stockSymbol ? `<span class="text-lg text-gray-600 ml-2">(${this.escapeHtml(post.stockSymbol)})</span>` : ''}
                                </div>
                            ` : ''}
                            <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                <span>작성자: ${this.escapeHtml(post.author)}</span>
                                <span>•</span>
                                <time>${formatDate(post.createdAt)}</time>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${post.tags.map(tag => `<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">#${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        </header>
                        ${post.stockSymbol && post.stockName ? `
                            <div id="stock-chart-container-${post.id}" class="mb-8"></div>
                        ` : ''}
                        ${post.images && post.images.length > 0 ? `
                            <div class="mb-8">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    ${post.images.map((image, idx) => `
                                        <div class="relative w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                                            <img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(post.title)} 이미지 ${idx + 1}" class="w-full h-full object-cover">
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        <div class="prose prose-lg max-w-none ql-editor" style="padding: 0; line-height: 1.6;">${post.content}</div>
                    </article>
                    <aside class="lg:w-80 lg:sticky lg:top-8 lg:h-fit">
                        <div class="lg:block hidden">${this.renderRecentPosts(recentPosts, post.id)}</div>
                    </aside>
                </div>
                <div class="lg:hidden mt-8">${this.renderRecentPosts(recentPosts, post.id)}</div>
            </div>
            ${this.renderFooter()}
        `;
        
        // 주가 그래프 생성 (종목 정보가 있는 경우)
        if (post.stockSymbol && post.stockName && typeof createStockChart === 'function') {
            setTimeout(() => {
                const containerId = `stock-chart-container-${post.id}`;
                createStockChart(containerId, post.stockSymbol, post.stockName);
            }, 100);
        }
    }

    renderWrite() {
        const app = document.getElementById('app');
        app.innerHTML = `
            ${this.renderHeader()}
            <div class="container mx-auto px-4 py-8 max-w-4xl">
                <h1 class="text-3xl font-bold text-gray-900 mb-8">새 글 작성</h1>
                <form id="writeForm" class="space-y-6">
                    <div>
                        <label for="title" class="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                        <input type="text" id="title" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="글 제목을 입력하세요">
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="stockName" class="block text-sm font-medium text-gray-700 mb-2">종목명</label>
                            <input type="text" id="stockName" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 삼성전자">
                        </div>
                        <div>
                            <label for="stockSymbol" class="block text-sm font-medium text-gray-700 mb-2">종목코드</label>
                            <input type="text" id="stockSymbol" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="예: 005930">
                        </div>
                    </div>
                    <div>
                        <label for="excerpt" class="block text-sm font-medium text-gray-700 mb-2">요약 (SEO용)</label>
                        <textarea id="excerpt" rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="글 요약을 입력하세요"></textarea>
                    </div>
                    <div>
                        <label for="content" class="block text-sm font-medium text-gray-700 mb-2">본문 *</label>
                        <div id="contentEditor" style="height: 400px;" class="mb-2"></div>
                        <textarea id="content" required class="hidden"></textarea>
                        <p class="text-xs text-gray-500">서식, 링크, 이미지 등을 사용할 수 있습니다.</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">태그 (SEO용)</label>
                        <div class="flex gap-2 mb-2">
                            <input type="text" id="tagInput" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="태그를 입력하고 Enter를 누르세요">
                            <button type="button" id="addTagBtn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">추가</button>
                        </div>
                        <div id="tagsContainer" class="flex flex-wrap gap-2"></div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이미지</label>
                        <div class="mb-4">
                            <label for="imageUpload" class="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition text-center">
                                <span class="text-gray-600">이미지 파일을 선택하거나 드래그하여 업로드</span>
                                <input type="file" id="imageUpload" accept="image/*" multiple class="hidden">
                            </label>
                            <p class="text-xs text-gray-500 mt-2 text-center">JPG, PNG, GIF 형식 지원 (최대 5MB)</p>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">또는 이미지 URL 입력</label>
                            <div class="flex gap-2">
                                <input type="url" id="imageInput" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="이미지 URL을 입력하고 Enter를 누르세요">
                                <button type="button" id="addImageBtn" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">추가</button>
                            </div>
                        </div>
                        <div id="imagesContainer" class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4"></div>
                    </div>
                    <div>
                        <label for="author" class="block text-sm font-medium text-gray-700 mb-2">작성자</label>
                        <input type="text" id="author" value="investa" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="작성자 이름">
                    </div>
                    <div class="flex gap-4">
                        <button type="submit" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">글 발행하기</button>
                        <button type="button" onclick="window.location.hash='#/'" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">취소</button>
                    </div>
                </form>
            </div>
            ${this.renderFooter()}
        `;

        // 이벤트 리스너 설정
        this.setupWriteForm();
    }

    setupWriteForm() {
        const form = document.getElementById('writeForm');
        const tagInput = document.getElementById('tagInput');
        const addTagBtn = document.getElementById('addTagBtn');
        const tagsContainer = document.getElementById('tagsContainer');
        const imageInput = document.getElementById('imageInput');
        const addImageBtn = document.getElementById('addImageBtn');
        const imageUpload = document.getElementById('imageUpload');
        const imagesContainer = document.getElementById('imagesContainer');
        const contentEditor = document.getElementById('contentEditor');
        const contentTextarea = document.getElementById('content');
        
        let tags = [];
        let images = [];
        let quill = null;

        // Quill 에디터 초기화
        if (contentEditor && typeof Quill !== 'undefined') {
            quill = new Quill('#contentEditor', {
                theme: 'snow',
                modules: {
                    toolbar: {
                        container: [
                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'color': [] }, { 'background': [] }],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'align': [] }],
                            ['link', 'image'],
                            ['blockquote', 'code-block'],
                            ['clean']
                        ],
                        handlers: {
                            'image': function() {
                                const input = document.createElement('input');
                                input.setAttribute('type', 'file');
                                input.setAttribute('accept', 'image/*');
                                input.click();
                                
                                input.onchange = () => {
                                    const file = input.files[0];
                                    if (file) {
                                        if (file.size > 5 * 1024 * 1024) {
                                            alert('이미지 크기는 5MB 이하여야 합니다.');
                                            return;
                                        }
                                        
                                        const reader = new FileReader();
                                        reader.onload = (e) => {
                                            const range = quill.getSelection(true);
                                            quill.insertEmbed(range.index, 'image', e.target.result);
                                            quill.setSelection(range.index + 1);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                };
                            }
                        }
                    }
                },
                placeholder: '글 내용을 입력하세요...'
            });

            // 에디터 내용이 변경될 때마다 textarea에 저장
            quill.on('text-change', () => {
                const html = quill.root.innerHTML;
                contentTextarea.value = html;
            });
        }

        const renderTags = () => {
            tagsContainer.innerHTML = tags.map(tag => `
                <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    #${this.escapeHtml(tag)}
                    <button type="button" class="remove-tag-btn" data-tag="${this.escapeHtml(tag)}" class="text-blue-700 hover:text-blue-900">×</button>
                </span>
            `).join('');
            
            // 이벤트 리스너 재등록
            tagsContainer.querySelectorAll('.remove-tag-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tag = btn.getAttribute('data-tag');
                    tags = tags.filter(t => t !== tag);
                    renderTags();
                });
            });
        };

        const renderImages = () => {
            imagesContainer.innerHTML = images.map((image, idx) => `
                <div class="relative group">
                    <img src="${this.escapeHtml(image)}" alt="이미지 ${idx + 1}" class="w-full h-32 object-cover rounded-lg border border-gray-300">
                    <button type="button" class="remove-image-btn" data-image="${this.escapeHtml(image)}" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">×</button>
                </div>
            `).join('');
            
            // 이벤트 리스너 재등록
            imagesContainer.querySelectorAll('.remove-image-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const image = btn.getAttribute('data-image');
                    images = images.filter(img => img !== image);
                    renderImages();
                });
            });
        };

        const addTag = () => {
            const tag = tagInput.value.trim();
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
                tagInput.value = '';
                renderTags();
            }
        };

        const addImage = (imageUrl) => {
            if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl);
                renderImages();
            }
        };

        const addImageFromUrl = () => {
            const image = imageInput.value.trim();
            if (image) {
                addImage(image);
                imageInput.value = '';
            }
        };

        const handleFileUpload = (file) => {
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 업로드할 수 있습니다.');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('파일 크기는 5MB 이하여야 합니다.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Image = e.target.result;
                addImage(base64Image);
            };
            reader.onerror = () => {
                alert('이미지 읽기 중 오류가 발생했습니다.');
            };
            reader.readAsDataURL(file);
        };

        // 파일 선택 이벤트
        imageUpload.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            files.forEach(handleFileUpload);
            e.target.value = ''; // 같은 파일 다시 선택 가능하도록
        });

        // 드래그 앤 드롭
        const uploadArea = imageUpload.closest('label');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('border-blue-500', 'bg-blue-50');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
            
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
            files.forEach(handleFileUpload);
        });

        addTagBtn.addEventListener('click', addTag);
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });

        addImageBtn.addEventListener('click', addImageFromUrl);
        imageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addImageFromUrl();
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('title').value;
            
            // Quill 에디터에서 HTML 내용 가져오기
            let content = '';
            if (quill) {
                content = quill.root.innerHTML;
            } else {
                content = contentTextarea.value;
            }
            
            // HTML에서 텍스트만 추출하여 요약 생성
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const excerpt = document.getElementById('excerpt').value || textContent.substring(0, 200);
            
            const author = document.getElementById('author').value || 'investa';
            const stockName = document.getElementById('stockName').value || undefined;
            const stockSymbol = document.getElementById('stockSymbol').value || undefined;

            if (!content.trim()) {
                alert('본문을 입력해주세요.');
                return;
            }

            const newPost = {
                id: Date.now().toString(),
                title,
                content,
                excerpt,
                tags: [...tags],
                images: [...images],
                author,
                stockSymbol,
                stockName,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            try {
                savePost(newPost);
                window.location.hash = `#/posts/${newPost.id}`;
            } catch (error) {
                alert('글 저장 중 오류가 발생했습니다.');
            }
        });
    }

    renderPostCard(post) {
        return `
            <a href="#/posts/${post.id}">
                <article class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden h-full flex flex-col">
                    ${post.images && post.images.length > 0 ? `
                        <div class="w-full h-48 bg-gray-200 overflow-hidden">
                            <img src="${this.escapeHtml(post.images[0])}" alt="${this.escapeHtml(post.title)}" class="w-full h-full object-cover">
                        </div>
                    ` : ''}
                    <div class="p-6 flex-1 flex flex-col">
                        <h2 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">${this.escapeHtml(post.title)}</h2>
                        ${post.stockName ? `<p class="text-sm text-blue-600 mb-2">${this.escapeHtml(post.stockName)} ${post.stockSymbol ? `(${this.escapeHtml(post.stockSymbol)})` : ''}</p>` : ''}
                        <p class="text-gray-600 mb-4 line-clamp-3 flex-1">${this.escapeHtml(post.excerpt)}</p>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${post.tags.slice(0, 3).map(tag => `<span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">#${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                        <p class="text-sm text-gray-500">${formatDate(post.createdAt)}</p>
                    </div>
                </article>
            </a>
        `;
    }

    renderRecentPosts(posts, currentPostId) {
        const filteredPosts = posts.filter(post => post.id !== currentPostId);
        if (filteredPosts.length === 0) return '';

        return `
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-4">최신글</h3>
                <ul class="space-y-4">
                    ${filteredPosts.slice(0, 5).map(post => `
                        <li>
                            <a href="#/posts/${post.id}" class="block hover:text-blue-600 transition">
                                <h4 class="font-semibold text-gray-900 mb-1 line-clamp-2">${this.escapeHtml(post.title)}</h4>
                                <p class="text-sm text-gray-500">${formatDateShort(post.createdAt)}</p>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    renderHeader() {
        return `
            <header class="bg-white shadow-sm border-b">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-between h-16">
                        <a href="#/" class="text-2xl font-bold text-blue-600">investa의 투자 정보</a>
                        <nav class="flex items-center gap-6">
                            <a href="#/" class="text-gray-700 hover:text-blue-600 transition">홈</a>
                        </nav>
                    </div>
                </div>
            </header>
        `;
    }

    renderFooter() {
        return `
            <footer class="bg-gray-900 text-white mt-16">
                <div class="container mx-auto px-4 py-8">
                    <div class="text-center">
                        <p class="text-gray-400">© 2024 investa의 투자 정보. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        `;
    }

    updateMetaTag(name, content, isProperty = false) {
        const attribute = isProperty ? 'property' : 'name';
        let meta = document.querySelector(`meta[${attribute}="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, name);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    addStructuredData(post, description) {
        // 기존 구조화된 데이터 제거
        const existingScript = document.querySelector('script[type="application/ld+json"]');
        if (existingScript) {
            existingScript.remove();
        }

        // 새로운 구조화된 데이터 생성
        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt || description,
            image: post.images.length > 0 ? post.images : undefined,
            datePublished: post.createdAt,
            dateModified: post.updatedAt || post.createdAt,
            author: {
                '@type': 'Person',
                name: post.author || 'investa',
            },
            publisher: {
                '@type': 'Organization',
                name: 'investa의 투자 정보',
            },
            keywords: post.tags.join(', '),
            articleSection: '주식 분석',
        };

        // 종목 정보가 있으면 추가
        if (post.stockSymbol && post.stockName) {
            jsonLd.about = {
                '@type': 'FinancialProduct',
                name: post.stockName,
                tickerSymbol: post.stockSymbol,
            };
        }

        // 스크립트 태그로 추가
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 라우터 초기화
const router = new Router();
window.router = router; // 전역으로 노출 (동기화 후 재렌더링용)

// 페이지 로드 시 Firebase 초기화 및 동기화
document.addEventListener('DOMContentLoaded', async () => {
    // Firebase 실시간 동기화 설정 (1초 후)
    setTimeout(() => {
        if (window.firebaseInitialized) {
            setupFirebaseRealtimeSync();
        } else {
            console.log('💡 Firebase가 설정되지 않았습니다. GitHub 동기화를 사용합니다.');
        }
    }, 1000);
    
    // Firebase에서 초기 데이터 로드 및 기존 글 동기화 (2초 후)
    setTimeout(async () => {
        if (window.firebaseInitialized && window.firebaseDb) {
            try {
                const firebasePosts = await getPostsFromFirebase();
                const localPosts = getAllPosts();
                
                if (firebasePosts.length > 0) {
                    // Firebase에 데이터가 있는 경우: 병합
                    const mergedPosts = [...firebasePosts];
                    
                    // 로컬에만 있는 최신 데이터 병합 및 업로드
                    for (const localPost of localPosts) {
                        const existingIndex = mergedPosts.findIndex(p => p.id === localPost.id);
                        if (existingIndex < 0) {
                            // 로컬에만 있으면 Firebase에 업로드
                            mergedPosts.push(localPost);
                            try {
                                await savePostToFirebase(localPost);
                                console.log('✅ 기존 글 Firebase 업로드 완료:', localPost.id);
                            } catch (err) {
                                console.error('기존 글 Firebase 업로드 실패:', err);
                            }
                        } else {
                            // 둘 다 있으면 더 최신 데이터 사용 및 업로드
                            const localDate = new Date(localPost.updatedAt || localPost.createdAt);
                            const firebaseDate = new Date(mergedPosts[existingIndex].updatedAt || mergedPosts[existingIndex].createdAt);
                            if (localDate > firebaseDate) {
                                mergedPosts[existingIndex] = localPost;
                                try {
                                    await savePostToFirebase(localPost);
                                    console.log('✅ 기존 글 Firebase 업데이트 완료:', localPost.id);
                                } catch (err) {
                                    console.error('기존 글 Firebase 업데이트 실패:', err);
                                }
                            }
                        }
                    }
                    
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPosts));
                    console.log('✅ Firebase에서 초기 데이터 로드 완료:', mergedPosts.length, '개');
                    
                    // 페이지 재렌더링
                    if (router.currentRoute) {
                        router.render();
                    }
                } else if (localPosts.length > 0) {
                    // Firebase에 데이터가 없고 로컬에만 있는 경우: 모든 로컬 글을 Firebase에 업로드
                    await syncLocalPostsToFirebase();
                }
            } catch (error) {
                console.error('❌ Firebase 초기화 중 오류:', error);
            }
        }
    }, 2000);
});
