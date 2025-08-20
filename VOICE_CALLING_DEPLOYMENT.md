# Voice Calling Deployment Guide

## Issue Fixed: Socket.IO Connection Error

### Problem
The voice calling feature was experiencing "xhr poll error" in hosted environments because it was trying to connect to `http://localhost:5001`, which is not accessible from external domains.

### Root Cause
- The CallingPage was hardcoded to connect to `localhost:5001`
- In hosted environments (like fly.dev), localhost connections don't work
- The signaling server needs to be accessible through the same host/domain

### Solution Implemented

#### 1. Dynamic Socket.IO Connection
```javascript
const getSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const host = window.location.hostname;
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001'; // Local development
  } else {
    return `${protocol}//${host}:5001`; // Hosted environment
  }
};
```

#### 2. Graceful Degradation
- Added `isSignalingAvailable` state
- Displays informational message when signaling server is unavailable
- Disables call buttons with clear messaging
- 5-second timeout to detect connection issues

#### 3. Better Error Handling
- Specific error messages for different failure scenarios
- Connection timeout detection
- Automatic fallback to disabled state

### Deployment Requirements

#### For Local Development ✅
- Signaling server runs on port 5001
- Frontend connects to `http://localhost:5001`
- Full voice calling functionality available

#### For Hosted Environments
The voice calling feature requires additional infrastructure:

**Option 1: Deploy Signaling Server**
- Deploy `signaling-server.js` to the same domain
- Configure port 5001 to be accessible
- Update firewall/proxy settings

**Option 2: Integrate with Existing Backend**
- Add Socket.IO to the main backend (port 5000)
- Serve signaling through the same proxy
- Modify connection URL to use `/socket.io`

**Option 3: Use Third-party Service**
- Integrate with services like Twilio, Agora, or PeerJS
- Replace custom signaling with hosted solution

### Current Behavior

#### ✅ Working Features
- AI Chat functionality (works in all environments)
- Voice recognition and text-to-speech (browser APIs)
- UI and navigation (fully functional)

#### ⚠️ Environment Dependent
- **Local Development**: Full voice calling with WebRTC
- **Hosted Environment**: Voice calling gracefully disabled with informative message

### Testing the Fix

#### Local Development
1. Start both servers: `node mock-backend.js & node signaling-server.js`
2. Navigate to `/call`
3. Should connect to signaling server successfully

#### Hosted Environment
1. Navigate to `/call`
2. Should show "Service Unavailable" with informational banner
3. No console errors, graceful degradation

### Next Steps for Production

1. **Deploy Signaling Server**: Add `signaling-server.js` to production deployment
2. **Configure Networking**: Ensure port 5001 is accessible or use reverse proxy
3. **Environment Variables**: Add configuration for signaling server URL
4. **Monitoring**: Add health checks for signaling server availability

### Alternative Implementations

For simpler deployment, consider:
- Using WebRTC libraries like PeerJS that provide hosted signaling
- Integrating with video calling services (Twilio, Agora)
- Moving signaling logic to the main backend server
