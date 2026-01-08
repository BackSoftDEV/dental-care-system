@echo off
chcp 65001 >nul
echo ========================================
echo   DANG BUILD UNG DUNG CHO PRODUCTION
echo ========================================
echo.

echo [1/3] Dang build Backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Loi khi build Backend!
    pause
    exit /b 1
)
cd ..
echo [THANH CONG] Backend build thanh cong!
echo.

echo [2/3] Dang build Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Loi khi build Frontend!
    pause
    exit /b 1
)
cd ..
echo [THANH CONG] Frontend build thanh cong!
echo.

echo [3/3] Dang cai dat dependencies cho Backend...
cd backend
call npm install --production
cd ..
echo [THANH CONG] Cai dat hoan tat!
echo.

echo ========================================
echo   BUILD THANH CONG!
echo ========================================
echo.
echo Ung dung da san sang de chay.
echo Hay chay file "KHOI-DONG-UNG-DUNG.bat" de khoi dong ung dung.
echo.
pause
