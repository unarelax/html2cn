@echo off
chcp 65001 >nul
cd /d "%~dp0"

title HTML2CN

echo.
echo   HTML2CN - Start Server
echo.

if not exist "node_modules\" (
    echo [1/2] Installing dependencies...
    call npm install --registry=https://registry.npmmirror.com
    if errorlevel 1 (
        echo Install failed!
        pause
        exit /b 1
    )
    echo.
)

echo [2/2] Starting server, browser will open shortly...
echo.

start /b powershell -Command "Start-Sleep 3; Start-Process 'http://localhost:3456'"
node cli.js serve
pause
