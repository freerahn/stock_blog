// GitHub API 유틸리티

const GITHUB_OWNER = 'freerahn';
const GITHUB_REPO = 'stock_blog';
const GITHUB_BRANCH = 'main';
const CONTENT_PATH = 'content/posts';

interface GitHubFile {
  path: string;
  content: string;
  sha?: string; // 수정 시 필요
}

// Base64 인코딩
function encodeBase64(text: string): string {
  if (typeof window !== 'undefined') {
    // 브라우저 환경
    return btoa(unescape(encodeURIComponent(text)));
  } else {
    // Node.js 환경
    return Buffer.from(text, 'utf8').toString('base64');
  }
}

// Base64 디코딩
function decodeBase64(base64: string): string {
  if (typeof window !== 'undefined') {
    // 브라우저 환경
    return decodeURIComponent(escape(atob(base64)));
  } else {
    // Node.js 환경
    return Buffer.from(base64, 'base64').toString('utf8');
  }
}

// GitHub API 호출 (서버 사이드에서만 사용)
async function githubApi(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // 서버 사이드에서만 실행
  if (typeof window !== 'undefined') {
    throw new Error('GitHub API는 서버 사이드에서만 호출할 수 있습니다.');
  }

  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    throw new Error('GitHub 토큰이 설정되지 않았습니다. GITHUB_TOKEN 환경변수를 설정해주세요.');
  }

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

// 파일 가져오기
export async function getFile(path: string): Promise<string | null> {
  try {
    const file = await githubApi(`/contents/${path}?ref=${GITHUB_BRANCH}`);
    return decodeBase64(file.content.replace(/\n/g, ''));
  } catch (error: any) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

// 파일의 SHA 가져오기 (수정/삭제 시 필요)
export async function getFileSha(path: string): Promise<string | null> {
  try {
    const file = await githubApi(`/contents/${path}?ref=${GITHUB_BRANCH}`);
    return file.sha;
  } catch (error: any) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

// 파일 생성
export async function createFile(path: string, content: string, message: string): Promise<void> {
  await githubApi(`/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      branch: GITHUB_BRANCH,
    }),
  });
}

// 파일 수정
export async function updateFile(path: string, content: string, message: string): Promise<void> {
  const sha = await getFileSha(path);
  if (!sha) {
    throw new Error('파일을 찾을 수 없습니다.');
  }

  await githubApi(`/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      branch: GITHUB_BRANCH,
      sha,
    }),
  });
}

// 파일 삭제
export async function deleteFile(path: string, message: string): Promise<void> {
  const sha = await getFileSha(path);
  if (!sha) {
    throw new Error('파일을 찾을 수 없습니다.');
  }

  await githubApi(`/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({
      message,
      branch: GITHUB_BRANCH,
      sha,
    }),
  });
}

// 디렉토리의 모든 파일 목록 가져오기
export async function getDirectoryFiles(path: string): Promise<string[]> {
  try {
    const files = await githubApi(`/contents/${path}?ref=${GITHUB_BRANCH}`);
    return files
      .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
      .map((file: any) => file.name.replace(/\.md$/, ''));
  } catch (error: any) {
    if (error.message.includes('404')) {
      return [];
    }
    throw error;
  }
}

// 게시글 저장 (생성 또는 수정)
export async function savePostToGitHub(
  slug: string,
  title: string,
  content: string,
  date: string,
  excerpt?: string
): Promise<void> {
  const matter = await import('gray-matter');
  const metaData = { title, date, excerpt };
  const matterString = matter.stringify(content, metaData);
  const filePath = `${CONTENT_PATH}/${slug}.md`;

  try {
    // 기존 파일이 있는지 확인
    const sha = await getFileSha(filePath);
    if (sha) {
      // 수정
      await updateFile(filePath, matterString, `Update post: ${title}`);
    } else {
      // 생성
      await createFile(filePath, matterString, `Add post: ${title}`);
    }
  } catch (error) {
    console.error('GitHub에 저장 실패:', error);
    throw error;
  }
}

// 게시글 삭제
export async function deletePostFromGitHub(slug: string, title: string): Promise<void> {
  const filePath = `${CONTENT_PATH}/${slug}.md`;
  await deleteFile(filePath, `Delete post: ${title}`);
}

