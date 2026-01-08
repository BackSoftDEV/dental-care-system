@echo off
chcp 65001 >nul
echo ========================================
echo   CAI DAT UNG DUNG LAN DAU
echo ========================================
echo.

echo Dang kiem tra Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Node.js chua duoc cai dat!
    echo.
    echo Vui long cai dat Node.js tu: https://nodejs.org/
    echo Sau do chay lai file nay.
    echo.
    pause
    exit /b 1
)

node --version
echo [THANH CONG] Node.js da duoc cai dat!
echo.

echo ========================================
echo   DANG CAI DAT DEPENDENCIES
echo ========================================
echo.

echo [1/2] Dang cai dat Backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [LOI] Loi khi cai dat Backend dependencies!
    pause
    exit /b 1
)
echo.
echo Dang rebuild native modules (better-sqlite3)...
call npm rebuild better-sqlite3
if %errorlevel% neq 0 (
    echo [CANH BAO] Loi khi rebuild better-sqlite3, nhung co the van chay duoc.
    echo Neu gap loi khi khoi dong, hay chay lai: npm rebuild better-sqlite3
)
cd ..
echo [THANH CONG] Backend dependencies da cai dat!
echo.

echo [2/2] Dang cai dat Frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [LOI] Loi khi cai dat Frontend dependencies!
    pause
    exit /b 1
)
cd ..
echo [THANH CONG] Frontend dependencies da cai dat!
echo.

echo ========================================
echo   DANG BUILD UNG DUNG
echo ========================================
echo.

echo [1/2] Dang build Backend...
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

echo [2/2] Dang build Frontend...
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

echo ========================================
echo   [THANH CONG] CAI DAT HOAN TAT!
echo ========================================
echo.
echo Bay gio ban co the chay file "KHOI-DONG-UNG-DUNG.bat"
echo de khoi dong ung dung.
echo.
pause
