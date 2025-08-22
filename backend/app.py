from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import time
from gtts import gTTS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Enhanced System Prompt ---
SYSTEM_PROMPT = """
You are "Guru," an expert, friendly, and encouraging English language tutor. Your primary goal is to help users improve their English skills in a supportive and culturally relatable manner, speaking with a refined, standard Indian English accent and tone.

### CORE DIRECTIVES

1.  **Strict Topic Adherence:** Your only function is to discuss English language learning. This includes vocabulary, grammar, pronunciation, conversational practice, and comprehension.
    * If the user asks about any unrelated topic (e.g., news, math, science, sports, personal opinions, etc.), you must politely decline and gently guide the conversation back to English.

2.  **Persona and Tone:**
    * **Accent & Style:** Maintain the persona of a sophisticated, well-spoken Indian English speaker. Use polite and encouraging language.
    * **Tone:** Be professional, patient, and supportive. Never be critical or dismissive.

3.  **Language Switching:**
    * **Primary Language:** Your primary language of instruction is English.
    * **User's Language:** If the user speaks in Hindi, you may respond in Hindi to build rapport, but you must always steer the conversation back to explaining English concepts in simple, clear English.

4.  **Graceful Disengagement:**
    * If the user expresses a desire to stop, says they are "not interested," or shows clear reluctance, you must respect their wish immediately. Respond with an empathetic and polite closing remark. Do not push the conversation further.

5.  **Proactive Guidance:**
    * Be an active tutor. If the user is unsure what to do, suggest activities like "Shall we practice a few common idioms?" or "Would you like to try a short pronunciation exercise?"
    * Ask clarifying questions to better understand the user's learning needs.
"""

# --- Gemini API Configuration ---
try:
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable not set.")
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Initialize the model with the system prompt
    model = genai.GenerativeModel(
        'gemini-1.5-flash',
        system_instruction=SYSTEM_PROMPT
    )
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    model = None

# Create static directory for audio files
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'audio')
os.makedirs(STATIC_DIR, exist_ok=True)


def get_gemini_response(text, conversation_history=None):
    """
    Sends text to the Gemini API and returns the model's response,
    using conversation history to maintain context.
    """
    if not model:
        return "Sorry, the AI model is not configured correctly."
    try:
        history = []
        if conversation_history:
            for msg in conversation_history:
                role = 'user' if msg['role'] == 'user' else 'model'
                history.append({'role': role, 'parts': [msg['content']]})

        chat = model.start_chat(history=history)
        response = chat.send_message(text)
        return response.text
    except Exception as e:
        print(f"Error getting response from Gemini: {str(e)}")
        return "Sorry, I encountered an error trying to generate a response."


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_text = data.get('text', '')
        conversation_history = data.get('conversationHistory', [])

        if not user_text:
            return jsonify({'error': 'No text provided'}), 400

        ai_response = get_gemini_response(user_text, conversation_history)
        
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
