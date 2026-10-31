@echo off
chcp 65001 >nul
title Dung he thong PM2

echo ========================================
echo   DUNG DENTAL CARE SYSTEM (PM2)
echo ========================================
echo.

pm2 stop ecosystem.config.cjs
echo.
pm2 list
echo.
echo Da dung he thong.
pause

