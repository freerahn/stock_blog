// Firebase 설정 파일
// Firebase Console (https://console.firebase.google.com)에서 프로젝트를 생성하고
// 설정 정보를 아래에 입력하세요.

window.firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 설정이 완료되었는지 확인
window.firebaseConfigured = (
    window.firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    window.firebaseConfig.projectId !== "YOUR_PROJECT_ID"
);


