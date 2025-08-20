# AI Voice Chat Application

A full-stack AI chat application with voice interaction capabilities, built with React frontend and Python Flask backend.

## Features

### Frontend (React + Tailwind CSS)
- 🎙️ **Voice Input**: Speech-to-text using Web Speech API
- 🔊 **Audio Playback**: Text-to-speech responses from AI
- 💬 **Chat Interface**: Modern dark-mode UI with chat bubbles
- 📚 **Chat History**: Browse and manage previous conversations
- 📞 **Voice Calling**: P2P voice calls using WebRTC
- 📱 **Responsive Design**: Works on desktop and mobile

### Backend (Python Flask)
- 🤖 **AI Chat API**: REST endpoint for chat interactions
- 🗣️ **Text-to-Speech**: Audio generation using gTTS
- 🌐 **CORS Support**: Cross-origin requests enabled
- 📁 **Static File Serving**: Audio file delivery

## Technology Stack

- **Frontend**: React 18, Tailwind CSS, Web Speech API, Web Audio API, WebRTC
- **Backend**: Python Flask, gTTS (Google Text-to-Speech), Flask-CORS
- **Routing**: Client-side routing with conditional rendering

## Project Structure

```
├── code/                   # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── ChatBubble.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── ChatHistoryItem.jsx
│   │   ├── pages/          # Main application pages
│   │   │   ├── ChatPage.jsx
│   │   │   ├── ChatHistoryPage.jsx
│   │   │   └── CallingPage.jsx
│   │   ├── App.jsx         # Main app component
│   │   └── index.js        # Entry point
│   └── package.json
├── backend/                # Python Flask backend
│   ├── app.py             # Flask application
│   ├── requirements.txt   # Python dependencies
│   ├── start.sh          # Startup script
│   └── static/audio/     # Generated audio files
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Python 3.7+
- Modern web browser with microphone support

### Frontend Setup
1. Navigate to the code directory:
```bash
cd code
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### Backend Setup
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask server:
```bash
python app.py
```

Or use the startup script:
```bash
chmod +x start.sh
./start.sh
```

The backend will be available at `http://localhost:5000`

## Usage

### Chat Interface
1. Navigate to the Chat page (default)
2. Click the microphone button to record voice input
3. Or type a message in the text input
4. The AI will respond with both text and audio
5. Click the play button in AI messages to hear the audio response

### Chat History
- View previous conversations on the History page
- Expand conversations to see full message threads
- Delete individual chat sessions

### Voice Calling
- Start a new voice call or join an existing room
- Generate a room ID or use a custom one
- Uses WebRTC for peer-to-peer audio communication

## API Endpoints

### POST /api/chat
Send a chat message and receive AI response with audio.

**Request:**
```json
{
  "text": "Hello, how are you?"
}
```

**Response:**
```json
{
  "responseText": "Hello! I'm doing great, thank you for asking!",
  "audioUrl": "http://localhost:5000/static/audio/response_123.mp3"
}
```

### GET /health
Health check endpoint.

### GET /static/audio/{filename}
Serve generated audio files.

## Browser Permissions

The application requires the following browser permissions:
- **Microphone**: For voice input and voice calling
- **Autoplay**: For playing AI audio responses

## Development Notes

- The React app uses a proxy configuration to route API calls to the Flask backend
- Audio files are temporarily stored in `backend/static/audio/`
- Speech recognition works best in Chrome and Edge browsers
- WebRTC calling uses STUN servers for NAT traversal

## Troubleshooting

1. **Microphone not working**: Check browser permissions
2. **Audio not playing**: Ensure autoplay is enabled
3. **API errors**: Make sure the Flask backend is running on port 5000
4. **Speech recognition issues**: Try using Chrome browser

## Future Enhancements

- Real-time signaling server for WebRTC
- User authentication and persistence
- Advanced AI model integration
- Multi-language support
- File upload and sharing
- Group voice calls

## License

This project is open source and available under the MIT License.
