# AI Chat Backend

This is the Flask backend for the AI Voice Chat application.

## Features

- `/api/chat` endpoint for processing chat messages
- Text-to-Speech conversion using gTTS
- CORS enabled for frontend communication
- Static file serving for audio files

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

- `POST /api/chat` - Send a chat message and receive AI response with audio
- `GET /health` - Health check endpoint
- `GET /static/audio/<filename>` - Serve generated audio files

## Request Format

```json
{
  "text": "Your message here"
}
```

## Response Format

```json
{
  "responseText": "AI response text",
  "audioUrl": "http://localhost:5000/static/audio/response_123.mp3"
}
```
