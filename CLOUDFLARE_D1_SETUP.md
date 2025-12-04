# Cloudflare D1 데이터베이스 설정 가이드

Cloudflare D1을 사용하면 **글을 쓰면 즉시 다른 브라우저에서도 볼 수 있습니다!** 빠르고 안정적입니다.

## 🚀 빠른 설정 (10분)

### 1. Cloudflare 계정 생성

1. https://dash.cloudflare.com 접속
2. 계정 생성 또는 로그인
3. 무료 플랜으로 시작 가능

### 2. Wrangler CLI 설치

```bash
npm install -g wrangler
```

또는 프로젝트에 설치:

```bash
npm install
```

### 3. Cloudflare 로그인

```bash
wrangler login
```

브라우저에서 Cloudflare 계정으로 로그인

### 4. D1 데이터베이스 생성

```bash
npm run db:create
```

또는 직접:

```bash
wrangler d1 create stock-blog-db
```

출력 예시:
```
✅ Successfully created DB 'stock-blog-db' in region APAC
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.

[[d1_databases]]
binding = "DB"
database_name = "stock-blog-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 5. wrangler.toml 파일 수정

`wrangler.toml` 파일을 열고 위에서 받은 `database_id`를 입력:

```toml
[[d1_databases]]
binding = "DB"
database_name = "stock-blog-db"
database_id = "여기에_받은_database_id_입력"
```

### 6. 데이터베이스 마이그레이션 실행

```bash
npm run db:migrate
```

또는 직접:

```bash
wrangler d1 migrations apply stock-blog-db
```

### 7. Workers 배포

```bash
npm run deploy
```

또는 직접:

```bash
wrangler deploy
```

배포 후 출력 예시:
```
✨ Compiled Worker successfully
✨ Uploaded Worker successfully
✨ Published Worker successfully
  https://stock-blog-api.YOUR_SUBDOMAIN.workers.dev
```

### 8. app.js 파일 수정

배포 후 받은 URL을 `app.js` 파일의 `D1_API_URL`에 입력:

```javascript
const D1_API_URL = 'https://stock-blog-api.YOUR_SUBDOMAIN.workers.dev/api/posts';
```

### 9. 완료!

이제 글을 쓰면 **즉시** 다른 브라우저에서도 볼 수 있습니다! 🎉

## 🔥 Cloudflare D1의 장점

- ✅ **빠른 속도**: 글로벌 CDN으로 전 세계 어디서나 빠름
- ✅ **무료 티어**: 일일 100,000회 읽기, 1,000회 쓰기 무료
- ✅ **자동 백업**: 데이터가 안전하게 저장
- ✅ **서버리스**: 서버 관리 불필요
- ✅ **실시간 동기화**: 글을 쓰면 즉시 반영

## 📊 사용량 확인

Cloudflare Dashboard → Workers & Pages → D1에서 데이터 사용량을 확인할 수 있습니다.

## 🔧 개발 환경

로컬에서 테스트하려면:

```bash
wrangler dev
```

이렇게 하면 로컬에서 Workers를 실행할 수 있습니다.

## 🆘 문제 해결

### D1 API가 작동하지 않아요
- `wrangler.toml`의 `database_id`가 올바른지 확인
- Workers가 배포되었는지 확인 (`wrangler deploy`)
- `app.js`의 `D1_API_URL`이 올바른지 확인

### 데이터가 동기화되지 않아요
- 브라우저 콘솔에서 오류 메시지 확인
- D1 데이터베이스에 데이터가 있는지 확인:
  ```bash
  wrangler d1 execute stock-blog-db --command "SELECT * FROM posts LIMIT 5"
  ```

### 무료 티어를 초과할까 걱정돼요
- Cloudflare Dashboard에서 사용량 모니터링 설정 가능
- 일일 제한 초과 시 알림 받기 가능

## 📝 API 엔드포인트

- `GET /api/posts` - 모든 게시글 가져오기
- `POST /api/posts` - 게시글 저장/수정
- `DELETE /api/posts?id=xxx` - 게시글 삭제

## 🎯 다음 단계

1. Workers 배포 완료
2. `app.js`의 `D1_API_URL` 설정
3. 글 작성 테스트
4. 다른 브라우저에서 확인

완료!


