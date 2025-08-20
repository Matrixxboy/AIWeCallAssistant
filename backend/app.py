from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import time
from gtts import gTTS
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains on all routes

# --- Gemini API Configuration ---
# Get the API key from environment variables for security
try:
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set.")
    genai.configure(api_key=GEMINI_API_KEY)
    # Using gemini-1.5-flash as it's fast and capable for chat.
    model = genai.GenerativeModel('gemini-1.5-flash') 
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    # You might want to handle this more gracefully, 
    # maybe by disabling the AI features or exiting.
    model = None

# Create static directory for audio files
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'audio')
os.makedirs(STATIC_DIR, exist_ok=True)


def get_gemini_response(text):
    """
    Sends text to the Gemini API and returns the model's response.
    """
    if not model:
        return "Sorry, the AI model is not configured correctly."
    try:
        # Start a chat session to maintain context (optional but good practice)
        chat = model.start_chat(history=[])
        response = chat.send_message(text)
        return response.text
    except Exception as e:
        print(f"Error getting response from Gemini: {str(e)}")
        return "Sorry, I encountered an error trying to generate a response."


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Get the text from the request
        data = request.get_json()
        user_text = data.get('text', '')
        
        if not user_text:
            return jsonify({'error': 'No text provided'}), 400
        
        # --- Generate AI response using Gemini API ---
        ai_response = get_gemini_response(user_text)
        
        # Generate audio using gTTS
        tts = gTTS(text=ai_response, lang='en', slow=False)
        
        # Create unique filename
        timestamp = int(time.time() * 1000)
        filename = f"response_{timestamp}.mp3"
        filepath = os.path.join(STATIC_DIR, filename)
        
        # Save the audio file
        tts.save(filepath)
        
        # Create URL for the audio file (adjust if your domain/port changes)
        audio_url = f"http://localhost:5000/static/audio/{filename}"
        
        # Return response
        return jsonify({
            'responseText': ai_response,
            'audioUrl': audio_url
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/static/audio/<filename>')
def serve_audio(filename):
    return send_from_directory(STATIC_DIR, filename)

@app.route('/health')
def health():
    gemini_status = "ok" if model else "error"
    return jsonify({
        'status': 'healthy', 
        'message': 'AI Chat Backend is running',
        'gemini_status': gemini_status
    })

@app.route('/')
def index():
    return jsonify({
        'message': 'AI Chat Backend API with Gemini',
        'endpoints': {
            '/api/chat': 'POST - Send chat message',
            '/health': 'GET - Health check',
            '/static/audio/<filename>': 'GET - Serve audio files'
        }
    })

if __name__ == '__main__':
    print("Starting AI Chat Backend...")
    print(f"Audio files will be saved to: {STATIC_DIR}")
    if not model:
        print("WARNING: Gemini model not initialized. Check API key and configuration.")
    app.run(debug=True, host='0.0.0.0', port=5000)
