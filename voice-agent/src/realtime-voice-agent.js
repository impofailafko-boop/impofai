const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const workerRoles = require('../config/worker-roles');

class RealtimeVoiceAgent {
  constructor(workerId, role = 'general', sessionId) {
    this.workerId = workerId;
    this.role = role;
    this.sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.conversationHistory = [];
    this.transcript = [];
    this.startTime = new Date();
    this.questionCount = 0;
    this.currentTopic = null;

    // Get role-specific configuration
    this.roleConfig = workerRoles.roles[role] || workerRoles.roles.general;
    this.initialQuestions = [...this.roleConfig.initialQuestions];
    this.askedQuestions = [];
  }

  /**
   * Initialize OpenAI Realtime API connection
   */
  async initializeRealtimeConnection(apiKey) {
    return new Promise((resolve, reject) => {
      try {
        // OpenAI Realtime API endpoint
        const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

        this.ws = new WebSocket(url, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'realtime=v1'
          }
        });

        this.ws.on('open', () => {
          console.log('[RealTime] WebSocket connected');

          // Send session configuration
          this.ws.send(JSON.stringify({
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              instructions: this.roleConfig.systemPrompt,
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1'
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500
              },
              temperature: 0.8,
              max_response_output_tokens: 4096
            }
          }));

          resolve(this.ws);
        });

        this.ws.on('error', (error) => {
          console.error('[RealTime] WebSocket error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('[RealTime] WebSocket closed');
          this.saveTranscript();
        });

        // Handle incoming messages
        this.ws.on('message', (data) => {
          this.handleRealtimeEvent(JSON.parse(data.toString()));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle events from OpenAI Realtime API
   */
  handleRealtimeEvent(event) {
    switch (event.type) {
      case 'session.created':
        console.log('[RealTime] Session created:', event.session.id);
        break;

      case 'session.updated':
        console.log('[RealTime] Session updated');
        break;

      case 'conversation.item.created':
        // New item in conversation
        this.conversationHistory.push(event.item);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // Worker's speech transcribed
        const userTranscript = event.transcript;
        this.addToTranscript('worker', userTranscript);
        console.log('[Worker]:', userTranscript);

        // Analyze for topics and trigger follow-ups
        this.analyzeForTopics(userTranscript);
        break;

      case 'response.audio_transcript.delta':
        // AI speaking (partial)
        if (!this.currentAIResponse) {
          this.currentAIResponse = '';
        }
        this.currentAIResponse += event.delta;
        break;

      case 'response.audio_transcript.done':
        // AI finished speaking
        if (this.currentAIResponse) {
          this.addToTranscript('agent', this.currentAIResponse);
          console.log('[Agent]:', this.currentAIResponse);
          this.currentAIResponse = null;
          this.questionCount++;
        }
        break;

      case 'response.done':
        // Response completed - maybe ask follow-up
        this.considerFollowUp();
        break;

      case 'error':
        console.error('[RealTime] Error:', event.error);
        break;

      default:
        // Log other events for debugging
        if (event.type.includes('error')) {
          console.error('[RealTime]', event.type, event);
        }
    }
  }

  /**
   * Send audio data to OpenAI
   */
  sendAudio(audioBase64) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: audioBase64
      }));
    }
  }

  /**
   * Commit audio buffer (tells OpenAI to process it)
   */
  commitAudio() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
    }
  }

  /**
   * Send text message (for testing without audio)
   */
  sendText(text) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: text
            }
          ]
        }
      }));

      // Trigger response
      this.ws.send(JSON.stringify({
        type: 'response.create'
      }));
    }
  }

  /**
   * Add entry to transcript
   */
  addToTranscript(speaker, text) {
    const entry = {
      timestamp: new Date().toISOString(),
      speaker: speaker,
      text: text,
      questionNumber: speaker === 'agent' ? this.questionCount : null
    };

    this.transcript.push(entry);

    // Save to file periodically
    if (this.transcript.length % 5 === 0) {
      this.saveTranscript();
    }
  }

  /**
   * Analyze conversation for topics to trigger follow-ups
   */
  analyzeForTopics(text) {
    const lowerText = text.toLowerCase();
    const triggers = this.roleConfig.followUpTriggers;

    // Check each topic area
    for (const [topic, questions] of Object.entries(triggers)) {
      // Simple keyword matching
      const keywords = this.getKeywordsForTopic(topic);
      const mentionsTopic = keywords.some(keyword => lowerText.includes(keyword));

      if (mentionsTopic && this.currentTopic !== topic) {
        this.currentTopic = topic;
        console.log(`[Topic Detected]: ${topic}`);
      }
    }
  }

  /**
   * Get keywords for topic detection
   */
  getKeywordsForTopic(topic) {
    const keywordMap = {
      inventory: ['inventory', 'stock', 'supplies', 'running low', 'out of'],
      equipment: ['equipment', 'broken', 'forklift', 'machine', 'tool', 'vehicle'],
      communication: ['communicate', 'team', 'manager', 'tell', 'notify', 'inform'],
      timing: ['busy', 'rush', 'peak', 'slow', 'hours', 'timing'],
      orders: ['order', 'ticket', 'request', 'customer wants'],
      routing: ['route', 'map', 'navigate', 'traffic', 'directions'],
      customers: ['customer', 'client', 'people', 'guest'],
      tracking: ['track', 'log', 'record', 'system', 'app'],
      tasks: ['task', 'do', 'job', 'work', 'responsibility'],
      tools: ['software', 'system', 'app', 'tool', 'platform'],
      problems: ['problem', 'issue', 'difficult', 'frustrating', 'annoying'],
      waste: ['waste', 'leftover', 'throw away', 'expired'],
      pos: ['pos', 'register', 'checkout', 'payment', 'transaction'],
      stocking: ['stock', 'shelves', 'restock', 'organize', 'arrange'],
      parts: ['part', 'component', 'spare', 'replacement'],
      scheduling: ['schedule', 'dispatch', 'appointment', 'calendar'],
      documentation: ['document', 'report', 'log', 'write down', 'record']
    };

    return keywordMap[topic] || [];
  }

  /**
   * Consider asking a follow-up question
   */
  considerFollowUp() {
    // Don't overwhelm with questions - wait for natural pauses
    if (this.questionCount > 20) {
      // After 20+ questions, slow down
      return;
    }

    // If we detected a topic, ask a follow-up about it
    if (this.currentTopic) {
      const triggers = this.roleConfig.followUpTriggers[this.currentTopic];
      if (triggers && triggers.length > 0) {
        // Pick a random follow-up we haven't asked yet
        const unaskedQuestions = triggers.filter(q => !this.askedQuestions.includes(q));
        if (unaskedQuestions.length > 0) {
          const question = unaskedQuestions[Math.floor(Math.random() * unaskedQuestions.length)];
          this.askedQuestions.push(question);

          // Send follow-up question after a brief pause
          setTimeout(() => {
            this.sendText(question);
          }, 1500);
        }
      }
    }
  }

  /**
   * Save transcript to file
   */
  saveTranscript() {
    try {
      const transcriptsDir = path.join(__dirname, '../transcripts');

      // Create directory if it doesn't exist
      if (!fs.existsSync(transcriptsDir)) {
        fs.mkdirSync(transcriptsDir, { recursive: true });
      }

      const transcriptData = {
        sessionId: this.sessionId,
        workerId: this.workerId,
        role: this.role,
        roleName: this.roleConfig.name,
        startTime: this.startTime,
        endTime: new Date(),
        duration: Math.floor((new Date() - this.startTime) / 1000), // seconds
        questionCount: this.questionCount,
        transcript: this.transcript,
        summary: {
          totalMessages: this.transcript.length,
          workerMessages: this.transcript.filter(t => t.speaker === 'worker').length,
          agentMessages: this.transcript.filter(t => t.speaker === 'agent').length
        }
      };

      const filename = `${this.sessionId}.json`;
      const filepath = path.join(transcriptsDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(transcriptData, null, 2));
      console.log(`[Transcript] Saved to ${filename}`);

      return filepath;
    } catch (error) {
      console.error('[Transcript] Save error:', error);
    }
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return {
      sessionId: this.sessionId,
      workerId: this.workerId,
      role: this.role,
      roleName: this.roleConfig.name,
      startTime: this.startTime,
      currentTime: new Date(),
      duration: Math.floor((new Date() - this.startTime) / 1000),
      questionCount: this.questionCount,
      transcript: this.transcript
    };
  }

  /**
   * Close connection and save transcript
   */
  close() {
    if (this.ws) {
      this.ws.close();
    }
    this.saveTranscript();
  }
}

module.exports = RealtimeVoiceAgent;
