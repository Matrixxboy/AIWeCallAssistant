from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import time
from gtts import gTTS
import requests
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Ollama Configuration ---
# Using the modern /api/chat endpoint. Ensure your Ollama is up to date.
OLLAMA_API_URL = "http://localhost:11434/api/chat"
# Using the specific model confirmed to be on your system.
OLLAMA_MODEL = "guru-english:latest"

# Create static directory for audio files
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'audio')
os.makedirs(STATIC_DIR, exist_ok=True)


def get_ollama_response(text, conversation_history=None):
    """
    Sends text to the Ollama API's chat endpoint and returns the model's response.
    """
    messages = []
    if conversation_history:
        for msg in conversation_history:
            role = 'assistant' if msg['role'] == 'assistant' else 'user'
            messages.append({'role': role, 'content': msg['content']})
    
    # Add the current user's message
    messages.append({'role': 'user', 'content': text})

    try:
        # Payload for the /api/chat endpoint
        payload = {
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False
        }
        
        response = requests.post(OLLAMA_API_URL, json=payload)
        response.raise_for_status()
        
        response_data = response.json()
        return response_data['message']['content']

    except requests.exceptions.RequestException as e:
        print(f"Error getting response from Ollama: {str(e)}")
        return "Sorry, I couldn't connect to the local AI model. Is Ollama running or is the endpoint correct?"
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        return "Sorry, I encountered an error trying to generate a response."


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_text = data.get('text', '')
        conversation_history = data.get('conversationHistory', [])

        if not user_text:
            return jsonify({'error': 'No text provided'}), 400

        ai_response = get_ollama_response(user_text, conversation_history)
        
        tts = gTTS(text=ai_response, lang='en', slow=False)
        
        timestamp = int(time.time() * 1000)
        filename = f"response_{timestamp}.mp3"
        filepath = os.path.join(STATIC_DIR, filename)
        
        tts.save(filepath)
        
        audio_url = f"http://localhost:5000/static/audio/{filename}"
        
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
    ollama_status = "error"
    try:
        response = requests.get("http://localhost:11434")
        if response.status_code == 200:
            ollama_status = "ok"
    except requests.exceptions.ConnectionError:
        ollama_status = "unreachable"
        
    return jsonify({
        'status': 'healthy', 
        'message': 'AI Chat Backend is running',
        'ollama_status': ollama_status
    })

@app.route('/')
def index():
    return jsonify({
        'message': f'AI Chat Backend API with Ollama (Model: {OLLAMA_MODEL})',
        'endpoints': {
            '/api/chat': 'POST - Send chat message',
            '/health': 'GET - Health check'
        }
    })

if __name__ == '__main__':
    print("Starting AI Chat Backend for Ollama...")
    print(f"Using Ollama model: {OLLAMA_MODEL}")
    app.run(debug=True, host='0.0.0.0', port=5000)
