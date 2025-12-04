// 데이터 저장소 (localStorage)
const STORAGE_KEY = 'stock_blog_posts';

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

function savePost(post) {
    const posts = getAllPosts();
    const existingIndex = posts.findIndex(p => p.id === post.id);
    
    if (existingIndex >= 0) {
        posts[existingIndex] = post;
    } else {
        posts.push(post);
    }
    
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
        console.error('Error saving post:', error);
        throw new Error('포스트 저장에 실패했습니다.');
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 라우터 초기화
const router = new Router();
