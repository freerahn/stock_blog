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

// localStorage에서 모든 포스트 가져오기
export function getAllPosts(): BlogPost[] {
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
export function savePost(post: BlogPost): void {
  const posts = getAllPosts();
  const existingIndex = posts.findIndex(p => p.id === post.id);
  
  if (existingIndex >= 0) {
    posts[existingIndex] = post;
  } else {
    posts.push(post);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    
    // 사이트맵 자동 업데이트
    if (typeof window !== 'undefined') {
      import('./sitemap-generator').then(({ updateSitemap }) => {
        updateSitemap(posts);
      }).catch(error => {
        console.warn('사이트맵 업데이트 실패:', error);
      });
      
      // GitHub 업로드 안내
      uploadToGitHubHelper(posts);
    }
  } catch (error) {
    console.error('Error saving post:', error);
    throw new Error('포스트 저장에 실패했습니다.');
  }
}

// GitHub 업로드 안내 (Next.js용)
function uploadToGitHubHelper(posts: BlogPost[]) {
  const dataStr = JSON.stringify(posts, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'posts.json';
  link.style.display = 'none';
  document.body.appendChild(link);
  
  const shouldUpload = confirm(
    '✅ 게시글이 저장되었습니다!\n\n' +
    '다른 브라우저에서도 보려면 GitHub에 업로드해야 합니다.\n\n' +
    '[확인] = posts.json 파일 다운로드 (GitHub의 public/posts.json에 업로드)\n' +
    '[취소] = 나중에 관리자 페이지에서 백업'
  );
  
  if (shouldUpload) {
    link.click();
    alert(
      '📥 posts.json 파일이 다운로드되었습니다.\n\n' +
      '다음 단계:\n' +
      '1. GitHub 저장소로 이동: https://github.com/freerahn/stock_blog\n' +
      '2. public/posts.json 파일 클릭\n' +
      '3. 연필 아이콘(편집) 클릭\n' +
      '4. 다운로드한 posts.json 내용을 붙여넣기\n' +
      '5. "Commit changes" 클릭\n\n' +
      '업로드 후 다른 브라우저에서 페이지를 새로고침하면 게시글이 보입니다!'
    );
  }
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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


