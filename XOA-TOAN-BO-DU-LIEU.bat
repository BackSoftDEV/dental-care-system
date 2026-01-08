@echo off
chcp 65001 >nul
echo ========================================
echo   XOA TOAN BO DU LIEU
echo ========================================
echo.
echo [CANH BAO] Hanh dong nay se XOA VINH VIEN tat ca du lieu!
echo.
echo Ban co chac chan muon xoa toan bo du lieu khong?
echo.
set /p confirm="Nhap 'YES' (viet hoa) de xac nhan: "

if not "%confirm%"=="YES" (
    echo.
    echo Da huy thao tac.
    pause
    exit /b 0
)

echo.
echo Dang dung ung dung (neu dang chay)...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo Da dung backend server.
) else (
    echo Backend server khong dang chay hoac da dung.
)

echo.
echo Doi 3 giay de database dong file...
timeout /t 3 /nobreak >nul

echo.
echo Dang xoa du lieu...

REM Xoa file .wal va .shm truoc (file tam)
if exist "backend\data\clinic.db-wal" (
    del /F /Q "backend\data\clinic.db-wal" 2>nul
    if %errorlevel% equ 0 (
        echo [THANH CONG] Da xoa file clinic.db-wal
    ) else (
        echo [CANH BAO] Khong the xoa clinic.db-wal, co the file dang bi khoa
    )
)

if exist "backend\data\clinic.db-shm" (
    del /F /Q "backend\data\clinic.db-shm" 2>nul
    if %errorlevel% equ 0 (
        echo [THANH CONG] Da xoa file clinic.db-shm
    ) else (
        echo [CANH BAO] Khong the xoa clinic.db-shm, co the file dang bi khoa
    )
)

REM Xoa file database chinh
if exist "backend\data\clinic.db" (
    del /F /Q "backend\data\clinic.db" 2>nul
    if %errorlevel% equ 0 (
        echo [THANH CONG] Da xoa file clinic.db
    ) else (
        echo [LOI] Khong the xoa clinic.db!
        echo.
        echo Vui long:
        echo 1. Dong tat ca cua so Backend Server
        echo 2. Kiem tra Task Manager xem co process node.exe nao khong
        echo 3. Chay lai file nay
        echo.
        pause
        exit /b 1
    )
) else (
    echo [THONG BAO] File clinic.db khong ton tai
)

echo.
echo ========================================
echo   [THANH CONG] DA XOA TOAN BO DU LIEU!
echo ========================================
echo.
echo Database se duoc tao lai tu dong khi ban khoi dong ung dung lan sau.
echo.
pause
