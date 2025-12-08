# investa의 블로그

Next.js와 Cloudflare D1을 사용한 개인 블로그입니다.

## 기능

- 웹에서 글 작성, 수정, 삭제
- WYSIWYG 에디터 (Quill)
- 관리자 인증 (비밀번호: lucky)
- Cloudflare Pages 배포
- Cloudflare D1 데이터베이스

## 개발 환경 설정

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

3. 브라우저에서 http://localhost:3000 접속

## Cloudflare D1 데이터베이스 설정

1. D1 데이터베이스 생성
```bash
wrangler d1 create investa-blog-db
```

2. 생성된 database_id를 `wrangler.toml`에 입력

3. 마이그레이션 실행
```bash
wrangler d1 migrations apply investa-blog-db
```

## 배포

1. GitHub에 푸시
2. Cloudflare Pages에서 GitHub 저장소 연결
3. 빌드 설정:
   - Build command: `npm run build`
   - Build output directory: `out`

## 관리자 접근

- URL: `/admin`
- 비밀번호: `lucky`
