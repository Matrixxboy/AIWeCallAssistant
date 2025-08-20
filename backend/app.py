from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import time
import random
from gtts import gTTS
import tempfile

app = Flask(__name__)
CORS(app)  # Enable CORS for all domains on all routes

# Create static directory for audio files
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'audio')
os.makedirs(STATIC_DIR, exist_ok=True)

# Sample AI responses for demo
AI_RESPONSES = [
    "Hello! I'm your AI voice assistant. How can I help you today?",
    "That's an interesting question! Let me think about that for you.",
    "I understand what you're asking. Here's what I think about that topic.",
    "Great question! I'd be happy to help you with that.",
    "Thanks for sharing that with me. I find that quite fascinating.",
    "I'm here to assist you. What would you like to know more about?",
    "That's a good point. Let me provide you with some helpful information.",
    "I appreciate you asking. Here's my perspective on that matter.",
    "Excellent! I enjoy discussing topics like this with you.",
    "Thank you for the conversation. Is there anything else I can help with?"
]

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        # Get the text from the request
        data = request.get_json()
        user_text = data.get('text', '')
        
        if not user_text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Generate AI response (for demo, we'll use a random response)
        ai_response = random.choice(AI_RESPONSES)
        
        # Add some variety based on user input
        if 'hello' in user_text.lower() or 'hi' in user_text.lower():
            ai_response = "Hello! I'm your AI voice assistant. How can I help you today?"
        elif 'how are you' in user_text.lower():
            ai_response = "I'm doing great, thank you for asking! I'm here and ready to help you with anything you need."
        elif 'bye' in user_text.lower() or 'goodbye' in user_text.lower():
            ai_response = "Goodbye! It was great talking with you. Feel free to come back anytime!"
        elif '?' in user_text:
            ai_response = f"That's a great question about '{user_text[:50]}...' Let me help you with that!"
        
        # Generate audio using gTTS
        tts = gTTS(text=ai_response, lang='en', slow=False)
        
        # Create unique filename
        timestamp = int(time.time() * 1000)
        filename = f"response_{timestamp}.mp3"
        filepath = os.path.join(STATIC_DIR, filename)
        
        # Save the audio file
        tts.save(filepath)
        
        # Create URL for the audio file
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
    return jsonify({'status': 'healthy', 'message': 'AI Chat Backend is running'})

@app.route('/')
def index():
    return jsonify({
        'message': 'AI Chat Backend API',
        'endpoints': {
            '/api/chat': 'POST - Send chat message',
            '/health': 'GET - Health check',
            '/static/audio/<filename>': 'GET - Serve audio files'
        }
    })

if __name__ == '__main__':
    print("Starting AI Chat Backend...")
    print(f"Audio files will be saved to: {STATIC_DIR}")
    app.run(debug=True, host='0.0.0.0', port=5000)
