class ChatApp {
  constructor() {
    this.eventSource = null;
    this.messageCount = 0;
    this.assistantEvent = 'Control'; // Default, will be loaded from config
    
    // Voice recording properties
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.audioContext = null;
    this.currentStream = null;
    
    this.initializeElements();
    this.loadConfig();
    this.setupEventListeners();
    this.connectToMessageStream();
    this.initializeVoiceRecording();
  }

  initializeElements() {
    this.messageForm = document.getElementById('messageForm');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.voiceButton = document.getElementById('voiceButton');
    this.chatContainer = document.getElementById('chatContainer');
    this.messagesEnd = document.getElementById('messagesEnd');
    this.connectionStatus = document.getElementById('connectionStatus');
    this.connectionText = document.getElementById('connectionText');
    this.messageCountEl = document.getElementById('messageCount');
  }

  async loadConfig() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        this.assistantEvent = config.assistantEvent;
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  setupEventListeners() {
    // Form submission
    this.messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Enter key handling
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Enable/disable send button based on input
    this.messageInput.addEventListener('input', () => {
      this.sendButton.disabled = !this.messageInput.value.trim();
    });
  }

  async initializeVoiceRecording() {
    try {
      // Check if browser supports audio recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('Audio recording not supported in this browser');
        this.voiceButton.disabled = true;
        this.voiceButton.title = 'Audio recording not supported';
        return;
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the initial stream (we'll create new ones when recording)
      stream.getTracks().forEach(track => track.stop());
      
      this.setupVoiceEventListeners();
      
    } catch (error) {
      console.error('Failed to initialize voice recording:', error);
      this.voiceButton.disabled = true;
      this.voiceButton.title = 'Microphone access denied';
    }
  }

  setupVoiceEventListeners() {
    // Prevent any default click behavior
    this.voiceButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // Mouse events for desktop
    this.voiceButton.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!this.isRecording && !this.voiceButton.disabled) {
        this.startRecording();
      }
    });

    // Global mouse up to handle release anywhere
    document.addEventListener('mouseup', (e) => {
      if (this.isRecording) {
        this.stopRecording();
      }
    });

    this.voiceButton.addEventListener('mouseleave', (e) => {
      // Don't stop on mouse leave to allow dragging outside button
    });

    // Touch events for mobile with haptic feedback
    this.voiceButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Haptic feedback for mobile devices
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      if (!this.isRecording && !this.voiceButton.disabled) {
        this.startRecording();
      }
    });

    // Global touch end to handle release anywhere
    document.addEventListener('touchend', (e) => {
      if (this.isRecording) {
        this.stopRecording();
      }
    });

    document.addEventListener('touchcancel', (e) => {
      if (this.isRecording) {
        this.stopRecording();
      }
    });
  }

  async startRecording() {
    if (this.isRecording || this.voiceButton.disabled) return;

    try {
      // Clean up any existing stream
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop());
      }

      this.currentStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Prefer WAV format for better compatibility with your requirements
      const options = { mimeType: 'audio/wav' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
      }

      this.mediaRecorder = new MediaRecorder(this.currentStream, options);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
        if (this.currentStream) {
          this.currentStream.getTracks().forEach(track => track.stop());
          this.currentStream = null;
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      
      // Update UI to show recording state
      this.voiceButton.classList.remove('bg-gray-600', 'hover:bg-gray-700', 'active:bg-gray-800');
      this.voiceButton.classList.add('bg-red-600', 'hover:bg-red-700', 'active:bg-red-800', 'ring-2', 'ring-red-300');

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.resetRecordingState();
      alert('Failed to start recording. Please check microphone permissions.');
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;

    try {
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
    
    this.resetRecordingState();
  }

  resetRecordingState() {
    this.isRecording = false;
    
    // Update UI back to normal state
    this.voiceButton.classList.remove('bg-red-600', 'hover:bg-red-700', 'active:bg-red-800', 'ring-2', 'ring-red-300');
    this.voiceButton.classList.add('bg-gray-600', 'hover:bg-gray-700', 'active:bg-gray-800');
    
    // Clean up stream
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
  }

  async processRecording() {
    if (this.audioChunks.length === 0) return;

    try {
      // Create blob from audio chunks
      const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
      
      // Send raw audio blob instead of base64
      this.sendVoiceMessage(audioBlob, this.mediaRecorder.mimeType);

    } catch (error) {
      console.error('Failed to process recording:', error);
      alert('Failed to process voice recording');
    }
  }

  async sendVoiceMessage(audioBlob, mimeType) {
    try {
      // Create FormData to send raw audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('clientId', 'local-user');
      formData.append('mimeType', mimeType);

      const response = await fetch('/api/send-voice', {
        method: 'POST',
        body: formData, // Send multipart form data instead of JSON
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send voice message');
      }

      const result = await response.json();
      console.log('Voice message sent successfully:', result);
      
    } catch (error) {
      console.error('Error sending voice message:', error);
      alert('Failed to send voice message: ' + error.message);
    }
  }

  connectToMessageStream() {
    this.updateConnectionStatus('connecting');
    
    this.eventSource = new EventSource('/api/stream');

    this.eventSource.onopen = () => {
      this.updateConnectionStatus('connected');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.addMessageToChat(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.updateConnectionStatus('error');
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (this.eventSource.readyState === EventSource.CLOSED) {
          this.connectToMessageStream();
        }
      }, 3000);
    };
  }

  updateConnectionStatus(status) {
    const statusEl = this.connectionStatus;
    const textEl = this.connectionText;
    
    statusEl.className = 'w-2 h-2 rounded-full transition-colors';
    
    switch (status) {
      case 'connecting':
        statusEl.classList.add('bg-yellow-400');
        textEl.textContent = 'Connecting...';
        break;
      case 'connected':
        statusEl.classList.add('bg-status-connected');
        textEl.textContent = 'Connected';
        break;
      case 'error':
        statusEl.classList.add('bg-red-500');
        textEl.textContent = 'Disconnected';
        break;
    }
  }

  async sendMessage() {
    const text = this.messageInput.value.trim();
    if (!text) return;

    // Disable send button temporarily
    this.sendButton.disabled = true;
    const originalText = this.sendButton.textContent;
    this.sendButton.textContent = 'Sending...';

    try {
      const response = await fetch('/api/send-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          clientId: 'local-user',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      // Clear input after successful send
      this.messageInput.value = '';
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user (in a real app, you might want a toast notification)
      alert('Failed to send message: ' + error.message);
    } finally {
      // Re-enable send button
      this.sendButton.textContent = originalText;
      this.sendButton.disabled = !this.messageInput.value.trim();
    }
  }

  addMessageToChat(message) {
    // Check if message has audio - if it's audio-only, just play it without displaying in chat
    const hasAudio = message.audioUrl && message.audioUrl.trim();
    const hasText = message.var2 && message.var2.trim();
    
    // If message has audio but no text, just play the audio without showing in chat
    if (hasAudio && !hasText) {
      this.playAudioMessage(message.audioUrl);
      return;
    }

    // Determine alignment based on event type
    const isAssistant = message.event === this.assistantEvent;
    const alignment = isAssistant ? 'justify-end' : 'justify-start';
    const bubbleClass = isAssistant ? 'bg-control-bubble' : 'bg-user-bubble';
    const headerAlignment = isAssistant ? 'text-right' : '';

    // Format timestamp
    const timestamp = new Date(message.ts).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-bubble mb-4 flex ${alignment}`;
    messageDiv.setAttribute('data-testid', `message-${message.id}`);

    // Only show audio player if there's also text content
    let audioContent = '';
    if (hasAudio && hasText) {
      audioContent = `
        <div class="mt-2">
          <audio controls class="w-full max-w-xs" data-testid="audio-player">
            <source src="${message.audioUrl}" type="audio/wav">
            <source src="${message.audioUrl}" type="audio/mpeg">
            <source src="${message.audioUrl}" type="audio/webm">
            Your browser does not support the audio element.
          </audio>
        </div>
      `;
    }

    messageDiv.innerHTML = `
      <div class="max-w-sm lg:max-w-md ${bubbleClass} rounded-lg px-4 py-3 shadow-sm">
        <div class="text-xs text-text-secondary mb-1 font-medium ${headerAlignment}">
          ${isAssistant ? 
            `<span data-testid="text-speaker">${message.var1}</span> • <span data-testid="text-timestamp">${timestamp}</span>` :
            `<span data-testid="text-timestamp">${timestamp}</span> • <span data-testid="text-speaker">${message.var1}</span>`
          }
        </div>
        ${hasText ? `<div class="text-sm text-text-primary" data-testid="text-message-content">${this.escapeHtml(message.var2)}</div>` : ''}
        ${audioContent}
      </div>
    `;

    // Add to chat
    this.chatContainer.insertBefore(messageDiv, this.messagesEnd);

    // Auto-play audio if present and there's text
    if (hasAudio && hasText) {
      const audioElement = messageDiv.querySelector('audio');
      if (audioElement) {
        // Auto-play with user interaction requirement handling
        audioElement.play().catch(error => {
          console.log('Auto-play prevented, user must interact first:', error);
        });
      }
    }

    // Update message count
    this.messageCount++;
    this.messageCountEl.textContent = this.messageCount;

    // Scroll to bottom with smooth animation
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
  }

  playAudioMessage(audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.log('Auto-play prevented for audio-only message:', error);
      });
    } catch (error) {
      console.error('Failed to play audio message:', error);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  destroy() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    // Clean up audio recording
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Initialize the chat app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
  });
} else {
  window.chatApp = new ChatApp();
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (window.chatApp) {
    window.chatApp.destroy();
  }
});
