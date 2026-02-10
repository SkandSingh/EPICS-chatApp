@echo off
REM EPICS Chat App Startup Script for Windows
REM This script starts both the ML service and the Next.js chat app

echo 🚀 Starting EPICS Chat App with ML Hate Speech Detection
echo ==================================================

REM Check if virtual environment exists
if not exist "hate_speech_env" (
    echo ❌ Virtual environment not found. Please run setup first:
    echo    python -m venv hate_speech_env
    exit /b 1
)

REM Check if model files exist in ml directory
if not exist "ml\model.pkl" (
    echo ❌ ML model files not found in ml\ directory.
    exit /b 1
)

REM Activate venv and start ML service in a new window
echo 🔧 Starting ML Hate Speech Detection Service...
start "ML Service" cmd /k "hate_speech_env\Scripts\activate && python ml/api.py"

REM Give ML service time to start
timeout /t 4 /nobreak

REM Test if ML service is running
powershell -Command "try { $response = Invoke-WebRequest -Uri http://localhost:5001/health -ErrorAction Stop; Write-Host '✅ ML Service running on http://localhost:5001' } catch { Write-Host '⚠️  ML Service health check failed, continuing anyway...' }"

echo 🌐 Starting Next.js Chat Application...
echo 📱 Chat will be available at: http://localhost:3000
echo 🤖 ML API available at: http://localhost:5001
echo.
echo Press Ctrl+C to stop services
echo ==================================================

npm run dev

