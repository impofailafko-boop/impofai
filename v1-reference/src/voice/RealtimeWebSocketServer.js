/**
 * Realtime WebSocket Server for ImpofAI
 *
 * Bridges worker UI (browser) with OpenAI Realtime API:
 * - Accepts WebSocket connections from worker interface
 * - Connects to OpenAI Realtime API
 * - Streams audio bidirectionally
 * - Manages conversation state
 * - Stores transcripts in real-time
 */

import { WebSocketServer } from 'ws';
import { OpenAIRealtimeClient } from './OpenAIRealtimeClient.js';

export class RealtimeWebSocketServer {
  constructor({ server, conversationManager, apiKey }) {
    this.conversationManager = conversationManager;
    this.apiKey = apiKey;
    this.activeSessions = new Map(); // sessionId -> { ws, realtimeClient, conversationId }

    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path: '/api/v1/realtime'
    });

    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection from worker UI');
      this.handleConnection(ws, req);
    });

    console.log('✅ Realtime WebSocket Server initialized at /api/v1/realtime');
  }

  /**
   * Handle new WebSocket connection from worker UI
   */
  async handleConnection(ws, req) {
    let sessionId = null;
    let realtimeClient = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);

        switch (message.type) {
          case 'session.create':
            // Create new conversation and connect to OpenAI
            await this.handleSessionCreate(ws, message);
            sessionId = message.sessionId;
            break;

          case 'input_audio_buffer.append':
            // Forward audio to OpenAI Realtime API
            if (sessionId && this.activeSessions.has(sessionId)) {
              const session = this.activeSessions.get(sessionId);
              await session.realtimeClient.sendAudio(message.audio);
            }
            break;

          case 'input_audio_buffer.commit':
            // Commit audio buffer (end of speech)
            if (sessionId && this.activeSessions.has(sessionId)) {
              const session = this.activeSessions.get(sessionId);
              await session.realtimeClient.commitAudio();
            }
            break;

          case 'conversation.item.create':
            // Create conversation item (text message)
            if (sessionId && this.activeSessions.has(sessionId)) {
              const session = this.activeSessions.get(sessionId);
              await session.realtimeClient.sendTextMessage(message.item);
            }
            break;

          case 'response.create':
            // Request AI response
            if (sessionId && this.activeSessions.has(sessionId)) {
              const session = this.activeSessions.get(sessionId);
              await session.realtimeClient.requestResponse(message.response);
            }
            break;

          case 'session.update':
            // Update session configuration
            if (sessionId && this.activeSessions.has(sessionId)) {
              const session = this.activeSessions.get(sessionId);
              await session.realtimeClient.updateSession(message.session);
            }
            break;

          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          error: {
            message: error.message,
            code: 'internal_error'
          }
        }));
      }
    });

    ws.on('close', async () => {
      console.log('🔌 WebSocket connection closed');
      if (sessionId && this.activeSessions.has(sessionId)) {
        await this.handleSessionEnd(sessionId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Handle session.create message
   */
  async handleSessionCreate(ws, message) {
    try {
      const { sessionId, workerId, workerName, role } = message;

      // Start conversation in database
      const conversation = await this.conversationManager.startConversation({
        workerId,
        workerName,
        role: role || 'warehouse',
        sessionId
      });

      // Create OpenAI Realtime API client
      const realtimeClient = new OpenAIRealtimeClient(this.apiKey, {
        onTranscriptDelta: (delta) => this.handleTranscriptDelta(sessionId, delta),
        onAudioDelta: (audio) => this.handleAudioDelta(sessionId, audio),
        onError: (error) => this.handleError(sessionId, error),
        onFunctionCall: (call) => this.handleFunctionCall(sessionId, call)
      });

      // Connect to OpenAI with Slovak configuration
      await realtimeClient.connect({
        language: 'sk-SK',
        voice: 'alloy',
        model: process.env.VOICE_MODEL || 'gpt-4o-realtime-preview-2024-10-01',
        instructions: this.generateSystemPrompt(workerName, role),
        temperature: 0.7,
        max_response_output_tokens: 4096
      });

      // Store active session
      this.activeSessions.set(sessionId, {
        ws,
        realtimeClient,
        conversationId: conversation.conversationId,
        workerId,
        workerName,
        role
      });

      // Send success response to worker UI
      ws.send(JSON.stringify({
        type: 'session.created',
        session: {
          id: sessionId,
          conversationId: conversation.conversationId,
          status: 'connected'
        }
      }));

      console.log(`✅ Session created: ${sessionId}, conversation: ${conversation.conversationId}`);
    } catch (error) {
      console.error('Error creating session:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: {
          message: 'Failed to create session: ' + error.message,
          code: 'session_creation_failed'
        }
      }));
    }
  }

  /**
   * Handle session end
   */
  async handleSessionEnd(sessionId) {
    try {
      if (!this.activeSessions.has(sessionId)) return;

      const session = this.activeSessions.get(sessionId);

      // Disconnect from OpenAI
      if (session.realtimeClient) {
        await session.realtimeClient.disconnect();
      }

      // End conversation in database
      await this.conversationManager.endConversation(session.conversationId);

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      console.log(`✅ Session ended: ${sessionId}`);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  /**
   * Handle transcript delta from OpenAI
   */
  async handleTranscriptDelta(sessionId, delta) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;

      // Forward to worker UI
      session.ws.send(JSON.stringify({
        type: 'transcript.delta',
        delta
      }));

      // If this is a complete transcript turn, save to database
      if (delta.type === 'transcript.complete') {
        await this.conversationManager.addTranscriptTurn({
          conversationId: session.conversationId,
          speaker: delta.role === 'user' ? 'worker' : 'agent',
          text: delta.text,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error handling transcript delta:', error);
    }
  }

  /**
   * Handle audio delta from OpenAI (AI speech)
   */
  handleAudioDelta(sessionId, audio) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Forward audio to worker UI for playback
    session.ws.send(JSON.stringify({
      type: 'audio.delta',
      audio: audio.toString('base64') // Convert Buffer to base64
    }));
  }

  /**
   * Handle error from OpenAI
   */
  handleError(sessionId, error) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    console.error(`Error in session ${sessionId}:`, error);

    // Forward error to worker UI
    session.ws.send(JSON.stringify({
      type: 'error',
      error: {
        message: error.message,
        code: error.code || 'realtime_api_error'
      }
    }));
  }

  /**
   * Handle function call from OpenAI (if using function calling)
   */
  async handleFunctionCall(sessionId, call) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    console.log(`🔧 Function call in session ${sessionId}:`, call.name);

    // Implement function calling logic here if needed
    // For now, just acknowledge
    session.ws.send(JSON.stringify({
      type: 'function_call',
      call
    }));
  }

  /**
   * Generate system prompt for Slovak conversations
   */
  generateSystemPrompt(workerName, role) {
    const roleNames = {
      warehouse: 'skladník',
      driver: 'vodič',
      forklift: 'operátor vysokozdvižného vozíka',
      packing: 'pracovník balenia',
      receiving: 'pracovník príjmu',
      shipping: 'pracovník expedície',
      other: 'zamestnanec'
    };

    const roleName = roleNames[role] || 'zamestnanec';

    return `Si AI asistent pre firemnú inteligenciu ImpofAI. Rozprávaj sa so zamestnancom po slovensky.

Zamestnanec: ${workerName} (${roleName})

Tvoja úloha:
1. Pozdrav zamestnanca priateľsky
2. Opýtaj sa, aký problém chce nahlásiť
3. Získaj dôležité informácie:
   - Čo presne nefunguje alebo čo je problém?
   - Kde sa to stalo? (ulička, sklad, kancelária, atď.)
   - Kedy sa to stalo?
   - Koľko ľudí to ovplyvňuje?
   - Je to bezpečnostný problém?
4. Buď trpezlivý a empatický
5. Ak zamestnanec hovorí nejasne, opýtaj sa na detaily
6. Potvrď, že problém je zaznamenaný
7. Poďakuj za čas

Štýl komunikácie:
- Používaj bežný slovenský jazyk (nie formálny)
- Buď stručný (2-3 vety na odpoveď)
- Používaj empatické výrazy ("rozumiem", "je mi to ľúto", "ďakujem")
- Nehľadaj technické riešenia - len zbieraj informácie

Dôležité:
- Vždy hovor po slovensky
- Nepoužívaj anglické slová (okrem technických termínov ako "skener")
- Buď priateľský, nie robotický`;
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Get active session count
   */
  getActiveSessionCount() {
    return this.activeSessions.size;
  }

  /**
   * Close all connections
   */
  async close() {
    console.log('🛑 Closing Realtime WebSocket Server...');

    // End all active sessions
    for (const [sessionId, session] of this.activeSessions.entries()) {
      await this.handleSessionEnd(sessionId);
    }

    // Close WebSocket server
    this.wss.close();

    console.log('✅ Realtime WebSocket Server closed');
  }
}
