@echo off
chcp 65001 >nul
echo ========================================
echo   SUA LOI BETTER-SQLITE3
echo ========================================
echo.
echo Script nay se rebuild module better-sqlite3
echo de khac phuc loi NODE_MODULE_VERSION
echo.

echo Dang kiem tra Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Node.js chua duoc cai dat!
    pause
    exit /b 1
)

node --version
echo.

echo Dang chuyen den thu muc backend...
cd /d "%~dp0backend"

if not exist "package.json" (
    echo [LOI] Khong tim thay package.json!
    echo Vui long chay file nay tu thu muc goc cua du an.
    pause
    exit /b 1
)

echo.
echo Dang rebuild better-sqlite3...
echo (Qua trinh nay co the mat 1-2 phut)
echo.

call npm rebuild better-sqlite3

if %errorlevel% neq 0 (
    echo.
    echo [LOI] Loi khi rebuild!
    echo.
    echo Thu cach khac: Xoa node_modules va cai dat lai...
    echo.
    set /p retry="Ban co muon xoa node_modules va cai dat lai? (Y/N): "
    if /i "%retry%"=="Y" (
        echo.
        echo Dang xoa node_modules...
        if exist "node_modules" (
            rmdir /s /q "node_modules"
        )
        echo.
        echo Dang cai dat lai dependencies...
        call npm install
        if %errorlevel% neq 0 (
            echo [LOI] Loi khi cai dat lai!
            pause
            exit /b 1
        )
        echo.
        echo [THANH CONG] Da cai dat lai thanh cong!
    )
) else (
    echo.
    echo [THANH CONG] Da rebuild thanh cong!
    echo.
    echo Bay gio ban co the chay lai "KHOI-DONG-UNG-DUNG.bat"
)

cd /d "%~dp0"
echo.
pause

