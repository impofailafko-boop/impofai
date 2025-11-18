/**
 * OpenAI Realtime API Client for ImpofAI
 * 
 * Handles WebSocket connection to OpenAI's Realtime API for Slovak voice conversations
 * Features:
 * - Slovak language support (sk-SK)
 * - Error handling with exponential backoff reconnection
 * - Configurable system prompts
 * - Audio streaming (PCM16 format)
 */

import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

export class OpenAIRealtimeClient {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.ws = null;
    this.sessionConfig = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 2000; // Start with 2 seconds
    this.onConnectionFailed = options.onConnectionFailed || null;
    this.messageHandlers = new Map();
  }

  /**
   * Connect to OpenAI Realtime API
   * @param {Object} sessionConfig - Session configuration
   */
  async connect(sessionConfig) {
    this.sessionConfig = sessionConfig;
    const model = process.env.VOICE_MODEL || 'gpt-4o-realtime-preview-2024-10-01';
    const url = `wss://api.openai.com/v1/realtime?model=${model}`;

    this.ws = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    this.ws.on('open', () => {
      console.log('✅ Connected to OpenAI Realtime API');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 2000;

      // Configure session
      this.send({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: this.generateSystemPrompt(sessionConfig),
          voice: process.env.VOICE_NAME || 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
            language: 'sk' // Slovak language
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        }
      });
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      // Error will trigger 'close' event, handled below
    });

    this.ws.on('close', (code, reason) => {
      console.warn(`⚠️  WebSocket closed (code: ${code}, reason: ${reason})`);

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
          this.connect(this.sessionConfig);
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached. Giving up.');
        if (this.onConnectionFailed) {
          this.onConnectionFailed();
        }
      }
    });

    return new Promise((resolve, reject) => {
      this.ws.once('open', () => resolve());
      this.ws.once('error', reject);
    });
  }

  /**
   * Generate Slovak system prompt based on configuration
   */
  generateSystemPrompt(config) {
    const basePrompt = `Si AI asistent, ktorý pomáha zamestnancom nahlásiť problémy v práci.
Odpovedaj vždy po slovensky. Buď priateľský a profesionálny.`;

    const plannerPrompt = config.plannerEnabled 
      ? '\n\nTvoja úloha je zistiť: KTO má problém, ČO sa stalo, KDE sa to stalo, KEDY sa to stalo, a AKO sa to prejavuje.'
      : '';

    const styleHint = `\n\nŠtýl otázok: ${config.questionStyle || 'balanced'}
Úroveň formálnosti: ${config.formalityLevel || 'balanced'}`;

    return basePrompt + plannerPrompt + styleHint;
  }

  /**
   * Send message to OpenAI Realtime API
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('❌ Cannot send message: WebSocket not open');
    }
  }

  /**
   * Handle incoming messages from OpenAI
   */
  handleMessage(message) {
    // Emit message to registered handlers
    if (this.messageHandlers.has(message.type)) {
      const handler = this.messageHandlers.get(message.type);
      handler(message);
    }

    // Default handling
    switch (message.type) {
      case 'error':
        console.error('❌ OpenAI error:', message.error);
        break;
      case 'session.created':
        console.log('✅ Session created:', message.session.id);
        break;
      case 'session.updated':
        console.log('✅ Session updated');
        break;
      case 'conversation.item.created':
        // New conversation item
        break;
      case 'response.audio.delta':
        // Audio chunk from AI (handle in voice manager)
        break;
      case 'response.text.delta':
        // Text chunk from AI
        break;
      case 'input_audio_buffer.speech_started':
        console.log('🎤 Worker started speaking');
        break;
      case 'input_audio_buffer.speech_stopped':
        console.log('🎤 Worker stopped speaking');
        break;
      default:
        // console.log('📨 Received message:', message.type);
        break;
    }
  }

  /**
   * Register custom message handler
   */
  on(messageType, handler) {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Send audio data to OpenAI
   */
  sendAudio(audioData) {
    this.send({
      type: 'input_audio_buffer.append',
      audio: audioData // base64-encoded PCM16 audio
    });
  }

  /**
   * Commit audio buffer (trigger AI response)
   */
  commitAudio() {
    this.send({
      type: 'input_audio_buffer.commit'
    });
  }

  /**
   * Create a response (trigger AI to speak)
   */
  createResponse() {
    this.send({
      type: 'response.create'
    });
  }

  /**
   * Disconnect from OpenAI Realtime API
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default OpenAIRealtimeClient;
