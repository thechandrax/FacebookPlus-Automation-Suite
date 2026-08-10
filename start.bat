@echo off
TITLE Facebook+ Automation Studio
COLOR 0A
CLS

echo ======================================================================
echo FACEBOOK+ AUTOMATION STUDIO - Starting Server ^& Dashboard...
echo ======================================================================
echo.

REM Detect Node.js (Local portable or System PATH)
SET "NODE_PATH=C:\\nodejs-portable\\node-v20.18.3-win-x64"
if exist "%NODE_PATH%\\node.exe" (
    SET "PATH=%NODE_PATH%;%PATH%"
    SET "NODE_CMD=%NODE_PATH%\\node.exe"
) else (
    SET "NODE_CMD=node"
)

echo [1/3] Checking Node.js environment...
%NODE_CMD% --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo Node.js version:
%NODE_CMD% --version

echo.
echo [2/3] Checking dependencies (node_modules)...
if not exist "node_modules\\express" (
    echo Installing packages via npm...
    call npm install
    echo Done!
) else (
    echo node_modules OK
)

echo.
echo [3/3] Starting server and opening browser...
timeout /t 2 >nul
"%NODE_CMD%" server.js
start "" "http://localhost:3000"

echo -----------------------------------------------------------------------
echo  DASHBOARD  : http://localhost:3000
echo  STATUS     : Studio Running
echo -----------------------------------------------------------------------
pause
