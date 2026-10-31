@echo off
chcp 65001 >nul
title Khoi dong he thong voi PM2

echo ========================================
echo   KHOI DONG DENTAL CARE SYSTEM (PM2)
echo ========================================
echo.

pm2 start ecosystem.config.cjs
echo.
pm2 list
echo.
echo ========================================
echo He thong dang chay ngam bang PM2.
echo - Xem log: pm2 logs
echo - Dung he thong: pm2-stop.bat
echo ========================================
pause

