/**
 * Conversation Manager for ImpofAI
 *
 * Orchestrates voice conversations:
 * - Manages conversation sessions
 * - Stores transcripts to database
 * - Tracks conversation metadata
 * - Coordinates with Conversation Planner
 */

import { randomUUID } from 'crypto';

export class ConversationManager {
  constructor(db) {
    this.db = db;
    this.activeSessions = new Map(); // sessionId -> session data
  }

  /**
   * Start a new conversation
   */
  async startConversation({ workerId, workerName, role, sessionId }) {
    const conversationId = randomUUID();
    const sid = sessionId || randomUUID();

    console.log(`🎙️  Starting conversation: ${conversationId} for worker: ${workerId}`);

    // Ensure worker exists in database
    await this.ensureWorkerExists({ workerId, workerName, role });

    // Create conversation record
    const stmt = this.db.prepare(`
      INSERT INTO conversations (
        conversation_id, worker_id, session_id, started_at,
        transcript, worker_turns, agent_turns
      ) VALUES (?, ?, ?, datetime('now'), '[]', 0, 0)
    `);

    stmt.run(conversationId, workerId, sid);

    // Store active session
    this.activeSessions.set(sid, {
      conversationId,
      workerId,
      startedAt: new Date(),
      transcript: [],
      metadata: {
        topics: [],
        issues: [],
        sentiment: 'neutral',
        urgency: 'low'
      }
    });

    return {
      conversationId,
      sessionId: sid,
      status: 'active'
    };
  }

  /**
   * Add transcript turn to conversation
   */
  async addTranscriptTurn({ conversationId, speaker, text, timestamp }) {
    const session = Array.from(this.activeSessions.values()).find(
      s => s.conversationId === conversationId
    );

    if (!session) {
      throw new Error(`Session not found for conversation: ${conversationId}`);
    }

    // Add to in-memory transcript
    session.transcript.push({
      speaker, // 'worker' or 'agent'
      text,
      timestamp: timestamp || new Date().toISOString()
    });

    // Update database
    const turnColumn = speaker === 'worker' ? 'worker_turns' : 'agent_turns';
    const stmt = this.db.prepare(`
      UPDATE conversations
      SET transcript = ?,
          ${turnColumn} = ${turnColumn} + 1,
          updated_at = datetime('now')
      WHERE conversation_id = ?
    `);

    stmt.run(
      JSON.stringify(session.transcript),
      conversationId
    );

    const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
    console.log(`💬 [${speaker}]: ${preview}`);
  }

  /**
   * Update conversation metadata (topics, issues, sentiment)
   */
  async updateMetadata({ conversationId, topics, issues, sentiment, urgency, location }) {
    const session = Array.from(this.activeSessions.values()).find(
      s => s.conversationId === conversationId
    );

    if (session) {
      if (topics) session.metadata.topics = topics;
      if (issues) session.metadata.issues = issues;
      if (sentiment) session.metadata.sentiment = sentiment;
      if (urgency) session.metadata.urgency = urgency;
    }

    const stmt = this.db.prepare(`
      UPDATE conversations
      SET topics = ?,
          issues = ?,
          sentiment = ?,
          urgency = ?,
          location = ?,
          updated_at = datetime('now')
      WHERE conversation_id = ?
    `);

    stmt.run(
      topics ? JSON.stringify(topics) : null,
      issues ? JSON.stringify(issues) : null,
      sentiment,
      urgency,
      location,
      conversationId
    );
  }

  /**
   * End conversation
   */
  async endConversation(conversationId) {
    console.log(`🏁 Ending conversation: ${conversationId}`);

    const session = Array.from(this.activeSessions.values()).find(
      s => s.conversationId === conversationId
    );

    if (!session) {
      console.warn(`Session not found for conversation: ${conversationId}`);
      return;
    }

    const duration = Math.floor((new Date() - session.startedAt) / 1000);

    const stmt = this.db.prepare(`
      UPDATE conversations
      SET ended_at = datetime('now'),
          duration_seconds = ?,
          updated_at = datetime('now')
      WHERE conversation_id = ?
    `);

    stmt.run(duration, conversationId);

    // Update worker's last conversation
    const updateWorker = this.db.prepare(`
      UPDATE workers
      SET total_conversations = total_conversations + 1,
          last_conversation_at = datetime('now'),
          updated_at = datetime('now')
      WHERE worker_id = ?
    `);

    updateWorker.run(session.workerId);

    // Remove from active sessions
    for (const [sid, s] of this.activeSessions.entries()) {
      if (s.conversationId === conversationId) {
        this.activeSessions.delete(sid);
        break;
      }
    }

    console.log(`✅ Conversation ended. Duration: ${duration}s`);

    return {
      conversationId,
      duration,
      turns: session.transcript.length
    };
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId) {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations WHERE conversation_id = ?
    `);

    return stmt.get(conversationId);
  }

  /**
   * Get active session
   */
  getActiveSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Ensure worker exists in database
   */
  async ensureWorkerExists({ workerId, workerName, role }) {
    const existing = this.db.prepare('SELECT worker_id FROM workers WHERE worker_id = ?').get(workerId);

    if (!existing) {
      console.log(`👤 Creating new worker: ${workerId} (${workerName})`);

      const stmt = this.db.prepare(`
        INSERT INTO workers (worker_id, name, role, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `);

      stmt.run(workerId, workerName, role);
    }
  }

  /**
   * Get all conversations for a worker
   */
  getWorkerConversations(workerId) {
    const stmt = this.db.prepare(`
      SELECT * FROM conversations
      WHERE worker_id = ?
      ORDER BY started_at DESC
    `);

    return stmt.all(workerId);
  }
}

export default ConversationManager;
