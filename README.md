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
   - Build command: `npm run build`
   - Build output directory: `.next`
   - Node version: 18 이상

**중요**: Cloudflare Pages는 정적 사이트 호스팅만 지원하므로, API routes (`/api/posts`)는 개발 환경에서만 작동합니다. 프로덕션 환경에서도 웹에서 글을 작성하려면 다음 중 하나를 선택해야 합니다:

1. **로컬 개발 환경 사용** (권장): 로컬에서 `npm run dev`로 개발 서버를 실행하고, 글을 작성한 후 Git으로 푸시
2. **Cloudflare Workers Functions**: API routes를 Cloudflare Workers Functions로 마이그레이션 (functions 디렉토리 사용)
3. **GitHub API 통합**: 클라이언트에서 GitHub API를 사용하여 직접 파일 수정 (인증 필요)

현재 구조는 로컬 개발 환경에서 완전히 작동하며, 글 작성/수정/삭제가 모두 가능합니다.

**중요**: Cloudflare Pages는 정적 사이트 호스팅만 지원하므로, API routes (`/api/posts`)는 개발 환경에서만 작동합니다. 프로덕션 환경에서는 다음 중 하나를 선택해야 합니다:

1. **Cloudflare Workers Functions 사용**: API routes를 Cloudflare Workers Functions로 마이그레이션
2. **GitHub API 사용**: 클라이언트에서 GitHub API를 사용하여 직접 파일 수정 (인증 필요)
3. **로컬에서만 글 작성**: 로컬에서 글을 작성한 후 Git으로 푸시

현재 구조는 로컬 개발 환경에서 완전히 작동합니다.

## 디렉토리 구조

```
stock_blog/
├── content/
│   └── posts/          # 게시글 마크다운 파일 저장 (Git에 포함)
├── pages/
│   ├── index.tsx       # 메인 페이지 (게시글 목록)
│   ├── posts/
│   │   └── [slug].tsx  # 게시글 상세 페이지
│   ├── admin/
│   │   └── index.tsx   # 관리자 페이지
│   └── api/
│       └── posts.ts    # 게시글 API
├── lib/
│   └── utils.ts        # 마크다운 파일 유틸리티
└── styles/
    └── globals.css     # 전역 스타일
```

## 중요 사항

- `content/posts/` 디렉토리의 게시글 파일은 Git에 포함되어야 합니다.
- 소스코드를 업데이트해도 `content/posts/`의 파일은 그대로 유지됩니다.
- `.gitignore`에 `content/`가 포함되어 있지 않은지 확인하세요.

