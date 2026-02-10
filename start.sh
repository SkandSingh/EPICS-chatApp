#!/bin/bash

# 🚀 EPICS Chat App Startup Script
# This script starts both the ML service and the Next.js chat app

echo "🚀 Starting EPICS Chat App with ML Hate Speech Detection"
echo "=================================================="

# Check if virtual environment exists
if [ ! -d "hate_speech_env" ]; then
    echo "❌ Virtual environment not found. Please run setup first:"
    echo "   python3 -m venv hate_speech_env"
    echo "   source hate_speech_env/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

# Check if model files exist in ml directory
if [ ! -f "ml/model.pkl" ] || [ ! -f "ml/vectorizer.pkl" ]; then
    echo "❌ ML model files not found in ml/ directory."
    echo "   Please ensure the trained model files are present:"
    echo "   - ml/model.pkl"
    echo "   - ml/vectorizer.pkl"
    echo "   Contact the development team if files are missing."
    exit 1
fi

echo "🔧 Starting ML Hate Speech Detection Service..."
# Start ML service in background
source hate_speech_env/bin/activate && python ml/api.py &
ML_PID=$!

# Give ML service time to start
sleep 3

# Test if ML service is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ ML Service running on http://localhost:5001"
else
    echo "❌ ML Service failed to start"
    kill $ML_PID 2>/dev/null
    exit 1
fi

echo "🌐 Starting Next.js Chat Application..."
echo "📱 Chat will be available at: http://localhost:3000"
echo "🤖 ML API available at: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both services"
echo "=================================================="

# Start ML service in background
source hate_speech_env/bin/activate && python ml/api.py &
ML_PID=$!

# Give ML service time to start
sleep 3

# Test if ML service is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo "✅ ML Service running on http://localhost:5001"
else
    echo "❌ ML Service failed to start"
    kill $ML_PID 2>/dev/null
    exit 1
fi

npm run dev

# Start Next.js (this will run in foreground)
npm run dev

# Clean up ML service when Next.js stops
echo "🛑 Stopping services..."
kill $ML_PID 2>/dev/null
echo "✅ All services stopped"