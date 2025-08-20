# Audio Call Testing Guide

## How to Test the Audio Call Functionality

### Prerequisites
✅ Both servers are running:
- Mock Backend (port 5000) - for AI chat
- Signaling Server (port 5001) - for WebRTC calls  
- Frontend (port 3000) - main application

### Testing Steps

1. **Open the Application**
   - Navigate to http://localhost:3000
   - Click on "Call" in the navigation

2. **Test with Two Browser Windows/Tabs**

   **Window 1 (Host):**
   - Click "Generate" to create a room ID (e.g., "ABC123")
   - Click "Start Call"
   - Allow microphone access when prompted
   - You should see "Call Active" with "Waiting for others to join..."

   **Window 2 (Joiner):**
   - Enter the room ID from Window 1 (e.g., "ABC123")
   - Click "Join Call"  
   - Allow microphone access when prompted
   - You should see "Call Active" with "2 participants connected"

3. **Expected Behavior**
   - Both windows show "🎤 Microphone: Active"
   - You should see "🔊 Remote Audio: Connected" in both windows
   - You can speak in one window and hear it in the other
   - Both show the same Room ID

4. **Console Logs to Check**
   ```
   ✅ Joined room: ABC123 Participants: 1 Initiator: true
   👥 User joined: [socket-id] Total participants: 2
   📤 Sending offer to: [socket-id]
   📨 Received offer from: [socket-id]
   📤 Sending answer to: [socket-id]
   🧊 Sending ICE candidate
   🎵 Received remote stream
   ```

### Testing Different Scenarios

1. **Room Creation**
   - Generate random room ID
   - Use custom room ID  
   - Join non-existent room

2. **Connection States**
   - Start call without microphone permission
   - End call and rejoin
   - Multiple people joining same room

3. **Error Handling**
   - No microphone detected
   - Permission denied
   - Network connection issues

### Technical Features Implemented

✅ **WebRTC Features:**
- Peer-to-peer audio streaming
- STUN servers for NAT traversal
- ICE candidate exchange
- Audio optimizations (echo cancellation, noise suppression)

✅ **Signaling Server:**
- Room-based connections
- Socket.IO real-time messaging
- Automatic cleanup on disconnect
- Multi-participant support

✅ **UI/UX:**
- Real-time participant counter
- Connection state indicators
- Error messaging
- Responsive design

### Troubleshooting

**No Audio Heard:**
- Check browser microphone permissions
- Ensure both users allowed microphone access
- Check console for WebRTC errors

**Connection Failed:**
- Verify signaling server is running (port 5001)
- Check network connectivity
- Try generating a new room ID

**Performance Issues:**
- Use headphones to prevent echo
- Ensure stable internet connection
- Close unnecessary browser tabs
