// WebSocket-based Real-Time Voice Client

class RealtimeVoiceClient {
  constructor() {
    this.ws = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.audioQueue = [];
    this.isRecording = false;
    this.sessionId = null;
    this.workerId = null;
    this.role = null;
    this.transcript = [];

    this.onTranscriptUpdate = null;
    this.onAudioReceived = null;
    this.onSessionStarted = null;
    this.onSessionEnded = null;
    this.onError = null;
  }

  /**
   * Connect to WebSocket server
   */
  async connect() {
    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      console.log('[RealTime] Connecting to:', wsUrl);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[RealTime] Connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('[RealTime] Connection error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = () => {
        console.log('[RealTime] Disconnected');
        this.cleanup();
      };
    });
  }

  /**
   * Start voice session
   */
  async startSession(workerId, role) {
    this.workerId = workerId;
    this.role = role;

    // Send start session message
    this.send({
      type: 'start_session',
      workerId: workerId,
      role: role
    });

    // Initialize audio context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
  }

  /**
   * Start recording from microphone
   */
  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.isRecording) {
          // Convert to PCM16 and send to server
          const arrayBuffer = await event.data.arrayBuffer();
          const audioData = await this.convertToPCM16(arrayBuffer);

          // Send audio data
          this.send({
            type: 'audio_data',
            audio: audioData
          });
        }
      };

      this.mediaRecorder.start(100); // Send data every 100ms
      this.isRecording = true;

      console.log('[RealTime] Recording started');

    } catch (error) {
      console.error('[RealTime] Failed to start recording:', error);
      if (this.onError) {
        this.onError('Microphone access denied. Please allow microphone access and try again.');
      }
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;

      // Commit audio buffer
      this.send({
        type: 'audio_commit'
      });

      console.log('[RealTime] Recording stopped');
    }
  }

  /**
   * End session
   */
  endSession() {
    this.send({
      type: 'end_session'
    });

    this.stopRecording();
    this.cleanup();
  }

  /**
   * Send text message (for testing)
   */
  sendText(text) {
    this.send({
      type: 'send_text',
      text: text
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(data) {
    switch (data.type) {
      case 'session_started':
        this.sessionId = data.sessionId;
        console.log('[RealTime] Session started:', this.sessionId);

        if (this.onSessionStarted) {
          this.onSessionStarted(data);
        }
        break;

      case 'response.audio.delta':
        // Received audio from AI
        if (data.delta && this.onAudioReceived) {
          this.playAudio(data.delta);
        }
        break;

      case 'response.audio_transcript.delta':
        // AI speaking (partial)
        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate('agent', data.delta, false);
        }
        break;

      case 'response.audio_transcript.done':
        // AI finished speaking
        const agentText = data.transcript;
        this.transcript.push({
          speaker: 'agent',
          text: agentText,
          timestamp: new Date().toISOString()
        });

        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate('agent', agentText, true);
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // Worker's speech transcribed
        const workerText = data.transcript;
        this.transcript.push({
          speaker: 'worker',
          text: workerText,
          timestamp: new Date().toISOString()
        });

        if (this.onTranscriptUpdate) {
          this.onTranscriptUpdate('worker', workerText, true);
        }
        break;

      case 'session_ended':
        console.log('[RealTime] Session ended');

        if (this.onSessionEnded) {
          this.onSessionEnded(data.transcript);
        }
        break;

      case 'error':
        console.error('[RealTime] Error:', data.error);

        if (this.onError) {
          this.onError(data.error);
        }
        break;

      default:
        // Log unknown messages for debugging
        console.log('[RealTime]', data.type);
    }
  }

  /**
   * Convert audio to PCM16 format
   */
  async convertToPCM16(arrayBuffer) {
    try {
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Get PCM data
      const pcmData = audioBuffer.getChannelData(0);

      // Convert to 16-bit PCM
      const pcm16 = new Int16Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        const s = Math.max(-1, Math.min(1, pcmData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Convert to base64
      return this.arrayBufferToBase64(pcm16.buffer);
    } catch (error) {
      console.error('[RealTime] Audio conversion error:', error);
      return null;
    }
  }

  /**
   * Play audio received from AI
   */
  async playAudio(base64Audio) {
    try {
      // Decode base64 to array buffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to AudioBuffer
      const pcm16 = new Int16Array(bytes.buffer);
      const floatPCM = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        floatPCM[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = this.audioContext.createBuffer(1, floatPCM.length, 24000);
      audioBuffer.getChannelData(0).set(floatPCM);

      // Play audio
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();

    } catch (error) {
      console.error('[RealTime] Audio playback error:', error);
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Send message to server
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    if (this.ws) {
      this.ws.close();
    }

    this.isRecording = false;
    this.sessionId = null;
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return this.transcript;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RealtimeVoiceClient;
}
