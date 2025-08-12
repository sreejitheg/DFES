# Multi-User AI Chat Web Application

A real-time multi-user AI chat web application with voice recording capabilities, built with modern web technologies.

## Features

- **Real-time Text Chat**: Server-Sent Events (SSE) for instant message delivery
- **Voice Recording**: Push-to-talk voice messages with WebM/WAV support
- **Webhook Integration**: Connects to n8n workflows for external automation
- **Message Alignment**: Configurable message positioning based on event types
- **Mobile-Friendly**: Responsive design with touch optimization
- **Light Theme**: Clean, minimal interface with white/gray color scheme

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, Tailwind CSS
- **Backend**: Node.js, Express.js, TypeScript
- **Real-time**: Server-Sent Events (SSE)
- **Audio**: MediaRecorder API with WebM/WAV support
- **Build**: Vite for development and production builds

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Configure your webhook URLs and assistant event type.

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5000`

## Environment Variables

- `ASSISTANT_EVENT`: Event type for assistant messages (default: "Control")
- `TEXT_WEBHOOK_URL`: Webhook URL for text messages
- `VOICE_WEBHOOK_URL`: Webhook URL for voice messages
- `INCOMING_WEBHOOK_SECRET`: Optional secret for webhook authentication
- `PORT`: Server port (default: 5000)

## Voice Recording

The app supports push-to-talk voice recording:

- **Hold** the microphone button to start recording
- **Release** anywhere to stop and send
- Supports WebM (opus), WAV, and MP4 formats
- Mobile-friendly with haptic feedback

## Webhook Integration

### Outbound Webhooks

**Text Messages** (`TEXT_WEBHOOK_URL`):
```json
{
  "text": "User message content",
  "clientId": "local-user",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Voice Messages** (`VOICE_WEBHOOK_URL`):
```json
{
  "audioData": "base64-encoded-audio",
  "mimeType": "audio/webm",
  "clientId": "local-user",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "audioSize": 1234
}
```

### Incoming Webhook

Endpoint: `POST /api/incoming`

```json
{
  "event": "Control|user_echo",
  "var1": "Speaker Name",
  "var2": "Message text (optional)",
  "audioUrl": "https://example.com/audio.mp3 (optional)",
  "sessionId": "session-identifier"
}
```

## Message Alignment

- **Assistant messages** (event = `ASSISTANT_EVENT`): Right-aligned
- **User messages** (other events): Left-aligned
- **Audio-only messages**: Play automatically without chat display
- **Mixed messages**: Display text with audio player

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## License

MIT License - see LICENSE file for details.