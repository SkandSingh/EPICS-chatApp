# EPICS Chat App

Real-time chat application with AI-powered hate speech detection.

## Features

- Real-time messaging with Socket.io
- Dual-tier moderation (keyword + ML detection) 
- Enhanced AI model detects offensive content including: arse, cunt, penis, wanker, and more
- User warning system
- Message censoring and filtering

## Quick Start

```bash
# Install dependencies
npm install

# Setup Python environment
python3 -m venv hate_speech_env

#For(Linux/Unix/MacOS)
source hate_speech_env/bin/activate

#For Windows
source hate_speech_env/Scripts/activate
pip install -r ml/requirements.txt

# Start both services
./start.sh
```

Visit http://localhost:3000 to start chatting.

## Manual Setup

**Terminal 1 - ML Service:**
```bash
source hate_speech_env/bin/activate
python ml/api.py
```

**Terminal 2 - Chat App:**
```bash
npm run dev
```

## Project Structure

```
├── app/           # Next.js app directory
├── pages/api/     # API routes (Socket.io)
├── lib/           # Moderation logic
├── ml/            # ML hate speech service
│   ├── api.py     # ML API server
│   ├── model.pkl  # Trained hate speech model
│   └── vectorizer.pkl # Text vectorizer
└── public/        # Static assets
```

## Model Performance

The enhanced ML model achieves:
- **90%+ accuracy** on previously missed offensive terms
- **Low false positive rate** for legitimate content
- **Real-time detection** with sub-100ms response times

## API Endpoints

- `http://localhost:3000` - Chat application
- `http://localhost:5001/predict` - ML hate speech detection
- `http://localhost:5001/health` - ML service health check