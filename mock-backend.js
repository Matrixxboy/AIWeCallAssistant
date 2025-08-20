const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Sample AI responses for demo
const AI_RESPONSES = [
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
];

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }
        
        console.log(`Received message: ${text}`);
        
        // Generate AI response based on user input
        let ai_response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
        
        // Add some variety based on user input
        if (text.toLowerCase().includes('hello') || text.toLowerCase().includes('hi')) {
            ai_response = "Hello! I'm your AI voice assistant. How can I help you today?";
        } else if (text.toLowerCase().includes('how are you')) {
            ai_response = "I'm doing great, thank you for asking! I'm here and ready to help you with anything you need.";
        } else if (text.toLowerCase().includes('bye') || text.toLowerCase().includes('goodbye')) {
            ai_response = "Goodbye! It was great talking with you. Feel free to come back anytime!";
        } else if (text.includes('?')) {
            ai_response = `That's a great question about '${text.slice(0, 50)}${text.length > 50 ? '...' : ''}' Let me help you with that!`;
        }
        
        console.log(`Sending response: ${ai_response}`);
        
        // For now, we'll skip audio generation and just return text
        // In production, you could integrate with Google TTS API using the provided key
        const response = {
            responseText: ai_response,
            audioUrl: null // Audio functionality would require Google Cloud TTS integration
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Error in chat endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', message: 'AI Chat Backend is running' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'AI Chat Backend API (Node.js)',
        endpoints: {
            '/api/chat': 'POST - Send chat message',
            '/health': 'GET - Health check'
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mock AI Chat Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});
