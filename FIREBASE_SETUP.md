# Firebase 설정 가이드

Firebase를 사용하면 **글을 쓰면 즉시 다른 브라우저에서도 볼 수 있습니다!**

## 🚀 빠른 설정 (5분)

### 1. Firebase 프로젝트 생성

1. https://console.firebase.google.com 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `stock-blog`)
4. Google Analytics 설정은 선택사항 (건너뛰어도 됨)
5. "프로젝트 만들기" 클릭

### 2. Firestore 데이터베이스 생성

1. Firebase Console에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. **"테스트 모드로 시작"** 선택 (개발용)
4. 위치 선택 (가장 가까운 지역, 예: `asia-northeast3`)
5. "사용 설정" 클릭

### 3. 웹 앱 등록

1. Firebase Console에서 ⚙️ 아이콘 → "프로젝트 설정" 클릭
2. 아래로 스크롤하여 "내 앱" 섹션에서 `</>` (웹) 아이콘 클릭
3. 앱 닉네임 입력 (예: `stock-blog-web`)
4. "앱 등록" 클릭

### 4. 설정 정보 복사

Firebase Console에서 다음 정보를 복사합니다:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // 여기 복사
  authDomain: "...",            // 여기 복사
  projectId: "...",             // 여기 복사
  storageBucket: "...",         // 여기 복사
  messagingSenderId: "...",     // 여기 복사
  appId: "1:..."                // 여기 복사
};
```

### 5. firebase-config.js 파일 수정

프로젝트 루트의 `firebase-config.js` 파일을 열고 위에서 복사한 정보를 붙여넣습니다:

```javascript
window.firebaseConfig = {
    apiKey: "여기에_복사한_apiKey",
    authDomain: "여기에_복사한_authDomain",
    projectId: "여기에_복사한_projectId",
    storageBucket: "여기에_복사한_storageBucket",
    messagingSenderId: "여기에_복사한_messagingSenderId",
    appId: "여기에_복사한_appId"
};
```

### 6. Firestore 보안 규칙 설정 (중요!)

Firebase Console → Firestore Database → "규칙" 탭에서:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;  // 모든 사용자가 읽기 가능
      allow write: if true; // 모든 사용자가 쓰기 가능 (개발용)
    }
  }
}
```

⚠️ **주의**: 위 규칙은 개발용입니다. 프로덕션에서는 인증을 추가해야 합니다.

### 7. 완료!

이제 글을 쓰면 **즉시** 다른 브라우저에서도 볼 수 있습니다! 🎉

## 🔥 Firebase의 장점

- ✅ **실시간 동기화**: 글을 쓰면 즉시 반영 (1초 이내)
- ✅ **무료 티어**: 일일 50,000회 읽기, 20,000회 쓰기 무료
- ✅ **자동 백업**: 데이터가 클라우드에 안전하게 저장
- ✅ **빠른 속도**: GitHub보다 훨씬 빠름

## 📊 사용량 확인

Firebase Console → 사용량 탭에서 데이터 사용량을 확인할 수 있습니다.

## 🔒 보안 강화 (선택사항)

프로덕션 환경에서는 Firestore 보안 규칙에 인증을 추가하세요:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null; // 로그인한 사용자만 쓰기 가능
    }
  }
}
```

## 🆘 문제 해결

### Firebase가 초기화되지 않아요
- `firebase-config.js` 파일이 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 데이터가 동기화되지 않아요
- Firestore 보안 규칙이 올바른지 확인
- 브라우저 콘솔에서 Firebase 연결 상태 확인

### 무료 티어를 초과할까 걱정돼요
- Firebase Console에서 사용량 모니터링 설정 가능
- 일일 제한 초과 시 알림 받기 가능





