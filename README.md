# Stock Blog

마크다운 파일 기반 개인 블로그입니다.

## 기능

- 마크다운 파일로 게시글 저장
- 웹 에디터를 통한 게시글 작성/수정/삭제
- 반응형 디자인 (PC: 우측 사이드바, 모바일: 하단)
- 최근 글 목록 표시
- 콘텐츠와 코드 분리 (content/posts 디렉토리)

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
npm run build
npm start
```

## 배포

### GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repository-url>
git push -u origin main
```

### Cloudflare Pages 연동

1. Cloudflare Dashboard에서 Pages 프로젝트 생성
2. GitHub 저장소 연결
3. 빌드 설정:
   - Build command: `CF_PAGES=1 npm run build`
   - Build output directory: `out`
   - Node version: 18 이상
   - Environment variables: `GITHUB_TOKEN` 추가 (GitHub Personal Access Token)
4. Functions 설정:
   - `functions/api/posts.ts` 파일이 자동으로 인식됩니다
   - `/api/posts` 경로로 API가 자동 라우팅됩니다

## 환경변수 설정

프로덕션 환경에서 웹에서 글을 작성/수정/삭제하려면 GitHub Personal Access Token이 필요합니다.

### GitHub Personal Access Token 생성

1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. "Generate new token" 클릭
3. 권한 선택: `repo` (전체 저장소 액세스)
4. 토큰 생성 후 복사

### 환경변수 설정

**개발 환경**:
`.env.local` 파일 생성:
```
GITHUB_TOKEN=your_github_token_here
```

**Cloudflare Pages**:
1. Cloudflare Dashboard > Pages > 프로젝트 선택
2. Settings > Environment variables
3. `GITHUB_TOKEN` 추가

## 작동 방식

- **개발 환경**: 로컬 파일 시스템을 사용하여 즉시 저장
- **프로덕션 환경**: GitHub API를 통해 저장소에 직접 파일 생성/수정/삭제
  - 글 작성/수정/삭제 시 GitHub 저장소에 자동으로 커밋됩니다
  - 변경사항이 반영되는데 약간의 시간이 걸릴 수 있습니다

## 디렉토리 구조

```
stock_blog/
├── content/
│   └── posts/          # 게시글 마크다운 파일 저장 (Git에 포함)
├── functions/
│   └── api/
│       └── posts.ts    # Cloudflare Pages Functions (프로덕션 API)
├── pages/
│   ├── index.tsx       # 메인 페이지 (게시글 목록)
│   ├── posts/
│   │   └── [slug].tsx  # 게시글 상세 페이지
│   ├── admin/
│   │   └── index.tsx   # 관리자 페이지
│   └── api/
│       └── posts.ts    # Next.js API Routes (개발 환경)
├── lib/
│   ├── utils.ts        # 마크다운 파일 유틸리티
│   └── github.ts       # GitHub API 유틸리티
└── styles/
    └── globals.css     # 전역 스타일
```

## 중요 사항

- `content/posts/` 디렉토리의 게시글 파일은 Git에 포함되어야 합니다.
- 소스코드를 업데이트해도 `content/posts/`의 파일은 그대로 유지됩니다.
- `.gitignore`에 `content/`가 포함되어 있지 않은지 확인하세요.

