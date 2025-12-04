import { BlogPost } from '@/types/blog';

const STORAGE_KEY = 'stock_blog_posts';

// GitHub에서 게시글 데이터 동기화
async function syncPostsFromGitHub(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const GITHUB_POSTS_URL = 'https://raw.githubusercontent.com/freerahn/stock_blog/main/public/posts.json';
    const SYNC_KEY = 'stock_blog_last_sync';
    
    // 마지막 동기화 시간 확인 (5분마다 한 번만 동기화)
    const lastSync = localStorage.getItem(SYNC_KEY);
    const now = Date.now();
    
    if (lastSync && (now - parseInt(lastSync)) < 5 * 60 * 1000) {
      return false; // 최근에 동기화했으면 스킵
    }
    
    const response = await fetch(GITHUB_POSTS_URL, {
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (response.ok) {
      const githubPosts = await response.json();
      
      if (Array.isArray(githubPosts) && githubPosts.length > 0) {
        const localPosts = getAllPosts();
        
        // GitHub 데이터와 로컬 데이터 병합
        const mergedPosts = [...localPosts];
        githubPosts.forEach((githubPost: BlogPost) => {
          const existingIndex = mergedPosts.findIndex(p => p.id === githubPost.id);
          if (existingIndex >= 0) {
            // 로컬에 있으면 더 최신 데이터 사용 (updatedAt 비교)
            const localPost = mergedPosts[existingIndex];
            const localDate = new Date(localPost.updatedAt || localPost.createdAt);
            const githubDate = new Date(githubPost.updatedAt || githubPost.createdAt);
            
            if (githubDate > localDate) {
              mergedPosts[existingIndex] = githubPost;
            }
          } else {
            // 로컬에 없으면 GitHub 데이터 추가
            mergedPosts.push(githubPost);
          }
        });
        
        // 병합된 데이터 저장
        if (mergedPosts.length !== localPosts.length || 
            JSON.stringify(mergedPosts) !== JSON.stringify(localPosts)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedPosts));
          localStorage.setItem(SYNC_KEY, now.toString());
          console.log('✅ GitHub에서 게시글 데이터를 동기화했습니다.');
          
          // 사이트맵 업데이트
          const { updateSitemap } = await import('./sitemap-generator');
          updateSitemap(mergedPosts);
          
          return true;
        }
      }
    }
  } catch (error) {
    console.warn('GitHub 동기화 실패 (정상일 수 있음):', error);
  }
  
  return false;
}

// Cloudflare D1 API 엔드포인트
// 배포 후: window.D1_API_URL = 'https://stock-blog-api.YOUR_SUBDOMAIN.workers.dev/api/posts';
const D1_API_URL = (typeof window !== 'undefined' && (window as any).D1_API_URL) 
  ? (window as any).D1_API_URL 
  : 'https://stock-blog-api.YOUR_SUBDOMAIN.workers.dev/api/posts';

export async function getAllPosts(): Promise<BlogPost[]> {
  if (typeof window === 'undefined') {
    return [];
  }
  
  // Cloudflare D1에서 최신 데이터 가져오기
  try {
    const response = await fetch(D1_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      const posts = await response.json();
      // D1에서 가져온 데이터를 localStorage에 캐시
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
      console.log(`✅ D1에서 ${posts.length}개의 게시글을 가져왔습니다.`);
      return posts;
    }
  } catch (error) {
    console.warn('D1 조회 실패, localStorage 사용:', error);
  }

  // D1 실패 시 localStorage에서 가져오기
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

// 동기 함수 버전 (기존 코드 호환성)
export function getAllPostsSync(): BlogPost[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

// 페이지 로드 시 자동 동기화 (Next.js용) - 항상 실행
if (typeof window !== 'undefined') {
  // 즉시 실행
  syncPostsFromGitHub();
  
  // 1초 후에도 다시 실행 (GitHub 업로드 후 반영 시간 고려)
  setTimeout(() => {
    syncPostsFromGitHub();
  }, 1000);
}

// ID로 포스트 가져오기
export function getPostById(id: string): BlogPost | null {
  const posts = getAllPosts();
  return posts.find(post => post.id === id) || null;
}

// 최신 포스트 가져오기
export function getLatestPosts(limit: number = 10): BlogPost[] {
  const posts = getAllPosts();
  return posts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// 포스트 저장
export async function savePost(post: BlogPost): Promise<void> {
  // Cloudflare D1에 저장 (우선 사용)
  try {
    await savePostToD1(post);
    console.log('✅ Cloudflare D1에 저장 완료 - 다른 브라우저에서 즉시 볼 수 있습니다!');
  } catch (d1Error) {
    console.error('D1 저장 실패:', d1Error);
    // D1 실패 시 localStorage에 저장 (백업)
    const posts = getAllPostsSync();
    const existingIndex = posts.findIndex(p => p.id === post.id);
    if (existingIndex >= 0) {
      posts[existingIndex] = post;
    } else {
      posts.push(post);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    console.warn('⚠️ D1 저장 실패, localStorage에 백업 저장했습니다.');
  }
  
  // localStorage에도 저장 (오프라인 지원)
  const posts = getAllPostsSync();
  const existingIndex = posts.findIndex(p => p.id === post.id);
  if (existingIndex >= 0) {
    posts[existingIndex] = post;
  } else {
    posts.push(post);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  
  // 사이트맵 자동 업데이트
  if (typeof window !== 'undefined') {
    import('./sitemap-generator').then(({ updateSitemap }) => {
      updateSitemap(posts);
    }).catch(error => {
      console.warn('사이트맵 업데이트 실패:', error);
    });
  }
}

// Cloudflare D1에 포스트 저장
async function savePostToD1(post: BlogPost): Promise<void> {
  if (typeof window === 'undefined') return;
  
  const apiUrl = typeof window !== 'undefined' 
    ? (window.D1_API_URL || 'https://stock-blog-api.YOUR_SUBDOMAIN.workers.dev/api/posts')
    : '';
  
  if (!apiUrl || apiUrl.includes('YOUR_SUBDOMAIN')) {
    throw new Error('D1 API URL이 설정되지 않았습니다. CLOUDFLARE_D1_SETUP.md를 참고하세요.');
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'D1 저장 실패');
    }

    const result = await response.json();
    return;
  } catch (error) {
    console.error('D1 저장 오류:', error);
    throw error;
  }
}

// GitHub 자동 업로드 (Next.js용)
async function autoUploadToGitHubHelper(posts: BlogPost[]) {
  const GITHUB_TOKEN_KEY = 'github_personal_access_token';
  const GITHUB_REPO = 'freerahn/stock_blog';
  const GITHUB_FILE_PATH = 'public/posts.json';
  
  const token = localStorage.getItem(GITHUB_TOKEN_KEY);
  
  if (!token) {
    // 토큰이 없으면 조용히 실패
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

// 포스트 삭제
export function deletePost(id: string): boolean {
  const posts = getAllPosts();
  const filteredPosts = posts.filter(post => post.id !== id);
  
  if (filteredPosts.length < posts.length) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredPosts));
      
      // 사이트맵 자동 업데이트
      if (typeof window !== 'undefined') {
        import('./sitemap-generator').then(({ updateSitemap }) => {
          updateSitemap(filteredPosts);
        }).catch(error => {
          console.warn('사이트맵 업데이트 실패:', error);
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }
  
  return false;
}


