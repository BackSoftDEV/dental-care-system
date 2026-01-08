@echo off
chcp 65001 >nul
title He Thong Quan Ly Khach Hang

echo ========================================
echo   DANG KHOI DONG UNG DUNG
echo ========================================
echo.

REM Kiem tra xem da build chua
if not exist "backend\dist\server.js" (
    echo [LOI] Chua build ung dung!
    echo.
    echo Vui long chay file "CAI-DAT-LAN-DAU.bat" truoc de build ung dung.
    echo.
    pause
    exit /b 1
)

if not exist "frontend\dist\index.html" (
    echo [LOI] Chua build Frontend!
    echo.
    echo Vui long chay file "CAI-DAT-LAN-DAU.bat" truoc de build ung dung.
    echo.
    pause
    exit /b 1
)

REM Thiet lap bien moi truong
set NODE_ENV=production
set PORT=4000

echo Dang khoi dong Backend...
echo.
echo Thu muc lam viec: %CD%
echo.

REM Chay tu thu muc backend de dam bao duong dan dung
REM %~dp0 la duong dan cua file batch (thu muc root)
cd /d "%~dp0backend"
set NODE_ENV=production
set PORT=4000

start "Backend Server" cmd /k "node dist\server.js"

REM Doi mot chut de backend khoi dong
timeout /t 3 /nobreak >nul

cd /d "%~dp0"
echo.
echo ========================================
echo   [THANH CONG] UNG DUNG DA KHOI DONG!
echo ========================================
echo.
echo Mo trinh duyet tai: http://localhost:4000
echo.
echo Nhan phim bat ky de mo trinh duyet...
pause >nul

REM Mo trinh duyet
start http://localhost:4000

echo.
echo ========================================
echo.
echo Ung dung dang chay!
echo De dung ung dung, hay dong cua so "Backend Server".
echo.
pause
