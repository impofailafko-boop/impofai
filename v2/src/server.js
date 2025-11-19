/**
 * ImpofAI V2 - Express Server
 *
 * Clean architecture with ElevenLabs Conversational AI integration
 * - Webhook receiver for call transcripts
 * - Tool endpoints for real-time context & issue logging
 * - AgentDB for memory and learning
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeAgentDB } from './database/initAgentDB.js';
import { getWorkerContext } from './tools/context.js';
import { logIssue } from './tools/issues.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Global database instance
let db;

/**
 * Initialize server and database
 */
async function initServer() {
  try {
    console.log('🚀 Starting ImpofAI V2...');

    // Initialize AgentDB
    const agentDB = await initializeAgentDB();
    db = agentDB.db;

    console.log('✅ Database initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhook/elevenlabs`);
      console.log(`🔧 Tool endpoints:`);
      console.log(`   - GET  /api/tools/context/:workerId`);
      console.log(`   - POST /api/tools/issue`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'ImpofAI V2',
    description: 'Business Intelligence through ElevenLabs Conversational AI',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      webhook: '/api/webhook/elevenlabs',
      tools: {
        context: '/api/tools/context/:workerId',
        issue: '/api/tools/issue'
      }
    }
  });
});

// ============================================================================
// ELEVENLABS WEBHOOK
// ============================================================================

/**
 * Webhook endpoint to receive completed call transcripts from ElevenLabs
 * POST /api/webhook/elevenlabs
 *
 * Expected payload from ElevenLabs:
 * {
 *   "call_id": "string",
 *   "agent_id": "string",
 *   "phone_number": "string",
 *   "started_at": "ISO timestamp",
 *   "ended_at": "ISO timestamp",
 *   "transcript": [...],
 *   "duration_seconds": number,
 *   "metadata": {...}
 * }
 */
app.post('/api/webhook/elevenlabs', async (req, res) => {
  try {
    console.log('📞 Received ElevenLabs webhook');
    const payload = req.body;

    // TODO: Verify webhook signature (add WEBHOOK_SECRET validation)

    // Extract data from payload
    const {
      call_id,
      phone_number,
      started_at,
      ended_at,
      transcript,
      duration_seconds,
      metadata = {}
    } = payload;

    // Find or create worker by phone number
    const workerId = metadata.worker_id || phone_number;

    // Store conversation in database
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const stmt = db.prepare(`
      INSERT INTO conversations (
        conversation_id,
        worker_id,
        session_id,
        started_at,
        ended_at,
        duration_seconds,
        transcript,
        call_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      conversationId,
      workerId,
      call_id,
      started_at,
      ended_at,
      duration_seconds,
      JSON.stringify(transcript),
      call_id
    );

    console.log(`✅ Stored conversation: ${conversationId}`);

    // TODO: Trigger async analysis (patterns, sentiment, knowledge graph)

    res.json({
      success: true,
      conversation_id: conversationId,
      message: 'Conversation stored successfully'
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      message: error.message
    });
  }
});

// ============================================================================
// TOOL ENDPOINTS (Called by ElevenLabs Agent during conversation)
// ============================================================================

/**
 * Get worker context
 * GET /api/tools/context/:workerId
 *
 * Returns relevant context about the worker for the AI agent
 */
app.get('/api/tools/context/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;
    console.log(`🔍 Getting context for worker: ${workerId}`);

    const context = await getWorkerContext(db, workerId);

    res.json({
      success: true,
      worker_id: workerId,
      context
    });

  } catch (error) {
    console.error('❌ Context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve context',
      message: error.message
    });
  }
});

/**
 * Log an issue
 * POST /api/tools/issue
 *
 * Body:
 * {
 *   "worker_id": "string",
 *   "issue_description": "string",
 *   "urgency": "low|medium|high",
 *   "location": "string (optional)",
 *   "equipment": "string (optional)"
 * }
 */
app.post('/api/tools/issue', async (req, res) => {
  try {
    console.log('📝 Logging issue');
    const issueData = req.body;

    const issueId = await logIssue(db, issueData);

    res.json({
      success: true,
      issue_id: issueId,
      message: 'Issue logged successfully'
    });

  } catch (error) {
    console.error('❌ Issue logging error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log issue',
      message: error.message
    });
  }
});

// ============================================================================
// ADMIN ENDPOINTS (for dashboard/debugging)
// ============================================================================

/**
 * Get all workers
 * GET /api/workers
 */
app.get('/api/workers', async (req, res) => {
  try {
    const workers = db.prepare('SELECT * FROM workers ORDER BY created_at DESC').all();
    res.json({ success: true, workers });
  } catch (error) {
    console.error('❌ Error fetching workers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all conversations
 * GET /api/conversations
 */
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = db.prepare(`
      SELECT * FROM conversations
      ORDER BY started_at DESC
      LIMIT 50
    `).all();
    res.json({ success: true, conversations });
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all patterns
 * GET /api/patterns
 */
app.get('/api/patterns', async (req, res) => {
  try {
    const patterns = db.prepare('SELECT * FROM patterns ORDER BY created_at DESC').all();
    res.json({ success: true, patterns });
  } catch (error) {
    console.error('❌ Error fetching patterns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================================================
// START SERVER
// ============================================================================

initServer();
