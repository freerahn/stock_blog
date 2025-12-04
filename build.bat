@echo off
echo 주식 블로그를 빌드합니다...
echo.
cd /d %~dp0
npm run build
echo.
echo 빌드가 완료되었습니다!
echo out 폴더에 정적 파일이 생성되었습니다.
echo.
pause



