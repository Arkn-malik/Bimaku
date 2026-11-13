@echo off
chcp 65001 >nul
cd /d "%~dp0"
title BIMAKU - buka port firewall

net session >nul 2>&1
if errorlevel 1 goto BUKAN_ADMIN

set PORT=3000
if exist ".env" for /f "usebackq tokens=1,* delims==" %%a in (".env") do if /i "%%a"=="PORT" set PORT=%%b

netsh advfirewall firewall delete rule name="BIMAKU" >nul 2>&1
netsh advfirewall firewall add rule name="BIMAKU" dir=in action=allow protocol=TCP localport=%PORT% profile=any
if errorlevel 1 goto GAGAL

echo.
echo Selesai. Port %PORT% dibuka untuk komputer lain di jaringan.
echo Alamat komputer ini di jaringan:
ipconfig | findstr /i "IPv4"
pause
exit /b 0

:BUKAN_ADMIN
echo Skrip ini harus dijalankan sebagai Administrator.
echo Klik kanan buka-firewall.bat, lalu pilih "Run as administrator".
pause
exit /b 1

:GAGAL
echo [GAGAL] Aturan firewall tidak dapat dibuat.
pause
exit /b 1
