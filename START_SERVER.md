# 서버 실행 방법

## 문제 해결

PowerShell 실행 정책 문제로 npm 명령이 실행되지 않는 경우:

### 방법 1: 명령 프롬프트(cmd) 사용
1. Windows 키 + R
2. `cmd` 입력 후 Enter
3. 프로젝트 폴더로 이동:
   ```
   cd C:\workspace\stock_blog
   ```
4. 개발 서버 실행:
   ```
   npm run dev
   ```

### 방법 2: PowerShell 실행 정책 변경
1. PowerShell을 **관리자 권한**으로 실행
2. 다음 명령 실행:
   ```
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. 프로젝트 폴더로 이동 후:
   ```
   npm run dev
   ```

### 방법 3: 직접 실행
1. 프로젝트 폴더(`C:\workspace\stock_blog`)를 탐색기에서 열기
2. 주소창에 `cmd` 입력 후 Enter
3. 명령 프롬프트에서:
   ```
   npm run dev
   ```

## 서버 시작 확인

서버가 정상적으로 시작되면 다음과 같은 메시지가 표시됩니다:

```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000

 ✓ Ready in 2.5s
```

그 후 브라우저에서 `http://localhost:3000`으로 접속하세요.

## 포트가 이미 사용 중인 경우

다른 포트로 실행하려면:
```
npm run dev -- -p 3001
```

또는 `package.json`의 dev 스크립트를 수정:
```json
"dev": "next dev -p 3001"
```






