# Starting the Backend Server

The "body stream already read" error occurs because the Flask backend server is not running. To fix this:

## Quick Start

1. **Install Python dependencies:**
   ```bash
   pip install -r AIWeCallAssistant/backend/requirements.txt
   ```

2. **Start the backend server:**
   ```bash
   cd AIWeCallAssistant/backend
   python app.py
   ```

   Or from the project root:
   ```bash
   python AIWeCallAssistant/backend/app.py
   ```

## Dependencies Required

The backend requires these Python packages:
- Flask==2.3.3
- Flask-CORS==4.0.0
- gTTS==2.3.2
- requests==2.31.0

## Expected Output

When the backend starts successfully, you should see:
```
Starting AI Chat Backend...
Audio files will be saved to: /path/to/project/AIWeCallAssistant/backend/static/audio
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://[your-ip]:5000
```

## Verification

Test the backend is working by visiting: http://localhost:5000/health

You should see:
```json
{"status": "healthy", "message": "AI Chat Backend is running"}
```

## Fixed Issues

The frontend code has been updated to:
1. Check for response.ok before reading JSON
2. Provide better error messages when backend is unavailable
3. Handle fetch failures gracefully without "body stream already read" errors
