@echo off
chcp 65001 >nul
cd /d "%~dp0"
title BIMAKU Server

if not exist ".env" goto TANPA_ENV
where node >nul 2>nul
if errorlevel 1 goto TANPA_NODE
if not exist "node_modules" call npm install
if errorlevel 1 goto GAGAL

echo Membangun aplikasi, tunggu sebentar...
call npm run build
if errorlevel 1 goto GAGAL

echo.
echo Server dijalankan. Biarkan jendela ini tetap terbuka. Tutup jendela ini untuk menghentikan server.
echo.
call npm start
echo.
echo Server berhenti.
pause
exit /b 0

:TANPA_ENV
echo [GAGAL] File .env belum ada.
echo Salin .env.example menjadi .env, lalu isi DATABASE_URL dan SESSION_SECRET.
pause
exit /b 1

:TANPA_NODE
echo [GAGAL] Node.js belum terpasang. Pasang Node.js 22 LTS dari https://nodejs.org lalu jalankan ulang.
pause
exit /b 1

:GAGAL
echo [GAGAL] Ada kesalahan, lihat pesan di atas.
pause
exit /b 1
