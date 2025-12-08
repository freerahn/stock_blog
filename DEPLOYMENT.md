# Cloudflare Pages 배포 가이드

이 문서는 stock_blog를 Cloudflare Pages에 배포하는 방법을 설명합니다.

## 1. 사전 준비

### 필요한 것들
- Cloudflare 계정
- GitHub 계정 (레포지토리 연동용)
- Node.js 18 이상

## 2. 프로젝트 빌드

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build
```

빌드가 완료되면 `out` 폴더에 정적 파일들이 생성됩니다.

## 3. Cloudflare D1 데이터베이스 생성

### 3.1 D1 데이터베이스 생성

```bash
# Wrangler 로그인
npx wrangler login

# D1 데이터베이스 생성
npx wrangler d1 create stock-blog-db
```

명령어 실행 후, 다음과 같은 출력이 나옵니다:

```
✅ Successfully created DB 'stock-blog-db'

[[d1_databases]]
binding = "DB"
database_name = "stock-blog-db"
database_id = "xxxx-xxxx-xxxx-xxxx"
```

### 3.2 wrangler.toml 업데이트

출력된 `database_id`를 복사하여 `wrangler.toml` 파일의 `database_id` 부분에 붙여넣습니다:

```toml
[[d1_databases]]
binding = "DB"
database_name = "stock-blog-db"
database_id = "여기에-database-id-붙여넣기"
```

### 3.3 데이터베이스 마이그레이션

```bash
# 테이블 생성
npx wrangler d1 migrations apply stock-blog-db
```

### 3.4 샘플 데이터 추가 (선택사항)

```bash
# 샘플 데이터 삽입
npx wrangler d1 execute stock-blog-db --file=./insert-sample-data.sql
```

또는 직접 D1 콘솔에서 데이터를 추가할 수 있습니다.

## 4. Cloudflare Pages 배포

### 방법 1: GitHub 연동 (권장)

1. GitHub에 프로젝트를 푸시합니다:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. [Cloudflare Dashboard](https://dash.cloudflare.com)에 로그인합니다.

3. **Workers & Pages** > **Create application** > **Pages** > **Connect to Git** 선택

4. GitHub 레포지토리 선택

5. 빌드 설정:
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `out`

6. **Environment variables** (환경변수) 설정:
   - `NODE_VERSION`: `18` 또는 `20`

7. **Save and Deploy** 클릭

### 방법 2: Wrangler CLI로 직접 배포

```bash
# 빌드
npm run build

# Pages 배포
npx wrangler pages deploy out --project-name=stock-blog
```

## 5. D1 바인딩 설정

배포 후, Cloudflare Dashboard에서 D1 데이터베이스를 연결해야 합니다:

1. Cloudflare Dashboard > **Workers & Pages** > 프로젝트 선택
2. **Settings** > **Functions** > **D1 database bindings**
3. **Add binding** 클릭:
   - **Variable name**: `DB`
   - **D1 database**: `stock-blog-db` 선택
4. **Save** 클릭

## 6. 배포 확인

배포가 완료되면 Cloudflare가 제공하는 URL로 접속하여 확인합니다:

```
https://your-project.pages.dev
```

- 메인 화면에 샘플 포스트들이 표시되어야 합니다
- D1 연동이 안 되어도 `public/posts.json`의 데이터가 fallback으로 표시됩니다

## 7. 커스텀 도메인 설정 (선택사항)

1. Cloudflare Dashboard > 프로젝트 > **Custom domains**
2. **Set up a custom domain** 클릭
3. 도메인 입력 및 DNS 설정

## 8. 문제 해결

### 메인 화면이 비어있을 때

1. **public/posts.json 확인**:
```bash
cat public/posts.json
```
빈 배열 `[]`이면 샘플 데이터가 없는 것입니다.

2. **빌드 다시 실행**:
```bash
npm run build
```

3. **D1 데이터 확인**:
```bash
npx wrangler d1 execute stock-blog-db --command="SELECT * FROM posts"
```

### D1 바인딩 오류

- Cloudflare Dashboard에서 D1 바인딩이 제대로 설정되었는지 확인
- `wrangler.toml`의 `database_id`가 올바른지 확인

### 빌드 오류

```bash
# 캐시 삭제 후 재빌드
rm -rf .next node_modules
npm install
npm run build
```

## 9. 추가 팁

### 자동 재배포 설정

GitHub 연동을 사용하면, `main` 브랜치에 푸시할 때마다 자동으로 재배포됩니다.

### 로컬 테스트

```bash
# 개발 서버 실행
npm run dev

# Wrangler로 프로덕션 환경 테스트
npx wrangler pages dev out
```

### 환경별 설정

- **개발**: `npm run dev` - localhost에서 실행
- **프로덕션**: Cloudflare Pages - D1 API 사용, fallback으로 posts.json 사용

## 참고 자료

- [Cloudflare Pages 공식 문서](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
