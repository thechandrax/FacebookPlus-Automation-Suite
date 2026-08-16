@echo off
chcp 65001 >nul
TITLE Facebook+ Automation Studio
CLS

REM Enable ANSI color support in Windows CMD
reg add HKCU\Console /v VirtualTerminalLevel /t REG_DWORD /d 1 /f >nul 2>&1

echo ======================================================================
echo   [36m [1m[+] FACEBOOK+ AUTOMATION STUDIO [0m -- Starting Server ^& Dashboard...
echo ======================================================================
echo.

REM Detect Node.js (Local portable or System PATH)
SET "NODE_PATH=C:\nodejs-portable\node-v20.18.3-win-x64"
if exist "%NODE_PATH%\node.exe" (
    SET "PATH=%NODE_PATH%;%PATH%"
    SET "NODE_CMD=%NODE_PATH%\node.exe"
) else (
    SET "NODE_CMD=node"
)

echo  [33m[1/3] Checking Node.js environment... [0m
%NODE_CMD% --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [31m[ERROR] Node.js is not installed or not found. [0m
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo  [32m[OK] Node.js version: [0m
%NODE_CMD% --version

echo.
echo  [33m[2/3] Checking dependencies (node_modules)... [0m
if not exist "node_modules\express" (
    echo Installing packages via npm...
    call npm install
    echo  [32m[OK] Done! [0m
) else (
    echo  [32m[OK] node_modules OK [0m
)

echo.
echo  [33m[3/3] Starting server and opening browser... [0m
timeout /t 2 >nul
start "" "http://localhost:3000"
"%NODE_CMD%" server.js

pause
