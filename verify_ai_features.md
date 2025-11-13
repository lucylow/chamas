# AI Features Verification Guide

This document explains how to verify that AI features are working in the Chamas application.

## Backend Services Status

The backend AI services are designed with graceful fallbacks:

1. **ASR (Speech Recognition)**: Uses Whisper model (optional)
   - If not loaded, falls back to browser Web Speech API
   
2. **LLM (Language Model)**: Uses LLaMA 3.1 or OpenAI-compatible endpoint (optional)
   - If not configured, uses fallback text responses
   
3. **TTS (Text-to-Speech)**: Uses Google Cloud TTS or Coqui (optional)
   - If not configured, uses browser Web Speech API
   
4. **Memory**: Uses Redis (optional)
   - If not configured, uses session-based memory
   
5. **Security**: Uses Fernet encryption (optional)
   - If not configured, sessions are unencrypted

## Quick Start

### 1. Start Backend Server

```bash
cd backend
# Install dependencies if needed
pip install -r requirements.txt

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Verify Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "asr": false,
  "llm": false,
  "tts": false,
  "chama": false
}
```

Even if services show `false`, the backend will still work with fallbacks!

### 3. Test Voice Endpoint

```bash
# This will fail but show what's needed
curl -X POST http://localhost:8000/voice/process \
  -F "file=@test_audio.wav" \
  -F "language=sw"
```

### 4. Frontend Configuration

Make sure the frontend knows where the backend is:

```bash
# In your terminal or .env.local
export VITE_API_URL=http://localhost:8000
```

Or create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:8000
```

## Features That Work Without Models

Even without AI models loaded, these features work:

1. **Text Chat**: Uses fallback responses from `swahiliAI.ts`
2. **Voice Input**: Browser Web Speech API (if supported)
3. **Text-to-Speech**: Browser Speech Synthesis API
4. **Chat History**: Session-based (no Redis needed)

## Full AI Setup (Optional)

For full AI capabilities, configure:

1. **Whisper ASR**: Install `openai-whisper` (auto-loads on first use)
2. **LLM**: Set `OPENAI_API_KEY` and `OPENAI_BASE_URL` environment variables
3. **TTS**: Set `GOOGLE_APPLICATION_CREDENTIALS` or install Coqui TTS
4. **Redis**: Set `REDIS_URL` for persistent memory
5. **Encryption**: Set `ENCRYPTION_KEY` (32-byte base64 Fernet key)

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] `/health` endpoint returns JSON
- [ ] Frontend can connect to backend
- [ ] Chat bubble appears in bottom-right
- [ ] Text chat works (fallback responses)
- [ ] Voice recording button appears (if browser supports it)
- [ ] Voice input works (browser Web Speech API)
- [ ] Text-to-speech works (browser Speech Synthesis)

## Troubleshooting

### Backend won't start
- Check Python version (needs 3.9+)
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 is not in use

### Frontend can't connect
- Verify `VITE_API_URL` is set to `http://localhost:8000`
- Check CORS settings in backend (should allow `localhost:5173`)
- Check browser console for errors

### Voice features not working
- Check browser supports Web Speech API
- Grant microphone permissions
- Test in Chrome/Edge (best support)

### No AI responses
- Backend services may not be ready (this is OK)
- Check fallback responses are working
- Verify text chat is functioning

