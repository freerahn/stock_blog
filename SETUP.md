# 설치 및 실행 가이드

## Node.js가 필요한 이유

이 블로그는 **Next.js**로 만들어졌기 때문에:
- **개발 모드 실행**: Node.js 필요
- **빌드 (정적 파일 생성)**: Node.js 필요
- **빌드된 파일 실행**: Node.js 불필요 (웹 브라우저만 있으면 됨)

## 두 가지 방법

### 방법 1: Node.js 설치 후 빌드 (권장)

1. **Node.js 설치**
   - https://nodejs.org 에서 LTS 버전 다운로드
   - 설치 후 터미널에서 `node --version` 확인

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **정적 파일 빌드**
   ```bash
   npm run build
   ```

4. **빌드 결과물 사용**
   - `out/` 폴더의 모든 파일을 웹 서버에 업로드
   - 또는 `out/index.html`을 브라우저로 직접 열기 (일부 기능 제한)

### 방법 2: 이미 빌드된 파일 사용

빌드가 완료되면 `out/` 폴더에 정적 파일이 생성됩니다.
이 파일들은 Node.js 없이도 웹 브라우저에서 바로 실행 가능합니다.

## Node.js 설치 방법

1. **공식 사이트 방문**: https://nodejs.org
2. **LTS 버전 다운로드** (안정적인 버전)
3. **설치 프로그램 실행**
4. **설치 확인**:
   - 명령 프롬프트(cmd) 열기
   - `node --version` 입력
   - 버전 번호가 표시되면 설치 완료

## 빠른 시작

Node.js 설치 후:

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행 (테스트용)
npm run dev
# 브라우저에서 http://localhost:3000 접속

# 3. 정적 파일 빌드 (배포용)
npm run build
# out/ 폴더에 정적 파일 생성됨
```

## 빌드된 파일 배포

`npm run build` 후 생성된 `out/` 폴더의 파일들을:
- GitHub Pages
- Netlify
- Vercel
- 일반 웹 호스팅
- 로컬 웹 서버

어디에든 업로드하면 Node.js 없이 실행됩니다!


