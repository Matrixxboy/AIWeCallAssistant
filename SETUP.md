# Quick Setup Guide

## Current Status ✅
- **Frontend**: React app is running on http://localhost:3000
- **Backend**: Ready to start (requires manual startup)
- **Dependencies**: All installed and configured

## Next Steps

### 1. Start the Backend (Required)
The React frontend is running, but you need to start the Python backend to enable chat functionality:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will start on http://localhost:5000

### 2. Test the Application
Once both servers are running:
1. Open http://localhost:3000 in your browser
2. Grant microphone permissions when prompted
3. Try the voice input or type a message
4. The AI should respond with both text and audio

### 3. Features to Test
- **Chat**: Voice and text input with AI responses
- **History**: Browse previous conversations (stored locally)
- **Call**: WebRTC voice calling (demo implementation)

## File Structure
```
├── code/                   # React frontend (RUNNING ✅)
├── backend/               # Flask backend (needs startup)
├── README.md             # Full documentation
└── SETUP.md              # This file
```

## Troubleshooting

### If the frontend shows errors:
1. Check that both servers are running
2. Ensure the backend is on port 5000
3. Check browser console for specific errors

### If voice input doesn't work:
1. Grant microphone permissions
2. Try using Chrome browser
3. Check browser console for speech recognition errors

### If audio playback fails:
1. Enable autoplay in browser settings
2. Check that audio files are being generated in `backend/static/audio/`

## Production Deployment
For production deployment, you would need to:
1. Build the React app: `npm run build`
2. Configure a proper web server (nginx, Apache)
3. Set up a WSGI server for Flask (gunicorn, uWSGI)
4. Configure environment variables and security settings
