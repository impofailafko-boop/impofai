/**
 * ImpofAI - Main Application Entry Point
 *
 * Business Intelligence Through Conversational AI
 * Slovak voice conversations powered by AgentDB
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeAgentDB } from './database/initAgentDB.js';
import { ConversationManager } from './voice/ConversationManager.js';
import { OpenAIRealtimeClient } from './voice/OpenAIRealtimeClient.js';
import { PatternEngine } from './analytics/PatternEngine.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global state
let db = null;
let conversationManager = null;
let patternEngine = null;

/**
 * Initialize application
 */
async function initialize() {
  console.log('🚀 Initializing ImpofAI...\n');

  // Initialize database
  const dbResult = await initializeAgentDB();
  db = dbResult.db;

  // Initialize conversation manager
  conversationManager = new ConversationManager(db);

  // Initialize pattern engine
  patternEngine = new PatternEngine(db);

  console.log('\n✅ ImpofAI initialized successfully!\n');
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ImpofAI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes

/**
 * POST /api/v1/conversations/start
 * Start a new voice conversation
 */
app.post('/api/v1/conversations/start', async (req, res) => {
  try {
    const { workerId, workerName, role } = req.body;

    if (!workerId || !workerName) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'workerId and workerName are required'
      });
    }

    const result = await conversationManager.startConversation({
      workerId,
      workerName,
      role: role || 'worker'
    });

    res.json({
      ...result,
      message: 'Conversation started successfully'
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to start conversation'
    });
  }
});

/**
 * POST /api/v1/conversations/:id/end
 * End a conversation
 */
app.post('/api/v1/conversations/:id/end', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await conversationManager.endConversation(id);

    if (!result) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Conversation not found or already ended'
      });
    }

    res.json({
      ...result,
      message: 'Conversation ended successfully'
    });
  } catch (error) {
    console.error('Error ending conversation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to end conversation'
    });
  }
});

/**
 * GET /api/v1/conversations/:id
 * Get conversation details
 */
app.get('/api/v1/conversations/:id', (req, res) => {
  try {
    const { id } = req.params;

    const conversation = conversationManager.getConversation(id);

    if (!conversation) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Conversation not found'
      });
    }

    // Parse JSON fields
    conversation.transcript = JSON.parse(conversation.transcript || '[]');
    if (conversation.topics) conversation.topics = JSON.parse(conversation.topics);
    if (conversation.issues) conversation.issues = JSON.parse(conversation.issues);

    res.json(conversation);
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get conversation'
    });
  }
});

/**
 * GET /api/v1/workers/:id/conversations
 * Get all conversations for a worker
 */
app.get('/api/v1/workers/:id/conversations', (req, res) => {
  try {
    const { id } = req.params;

    const conversations = conversationManager.getWorkerConversations(id);

    // Parse JSON fields
    conversations.forEach(conv => {
      conv.transcript = JSON.parse(conv.transcript || '[]');
      if (conv.topics) conv.topics = JSON.parse(conv.topics);
      if (conv.issues) conv.issues = JSON.parse(conv.issues);
    });

    res.json({
      workerId: id,
      conversations,
      total: conversations.length
    });
  } catch (error) {
    console.error('Error getting worker conversations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get worker conversations'
    });
  }
});

/**
 * GET /api/v1/workers
 * Get all workers
 */
app.get('/api/v1/workers', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM workers
      WHERE active = TRUE
      ORDER BY last_conversation_at DESC NULLS LAST
    `);

    const workers = stmt.all();

    res.json({
      workers,
      total: workers.length
    });
  } catch (error) {
    console.error('Error getting workers:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get workers'
    });
  }
});

/**
 * POST /api/v1/conversations/:id/transcript
 * Add transcript turn
 */
app.post('/api/v1/conversations/:id/transcript', async (req, res) => {
  try {
    const { id } = req.params;
    const { speaker, text } = req.body;

    if (!speaker || !text) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'speaker and text are required'
      });
    }

    await conversationManager.addTranscriptTurn({
      conversationId: id,
      speaker,
      text
    });

    res.json({
      message: 'Transcript turn added successfully'
    });
  } catch (error) {
    console.error('Error adding transcript:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/analytics/detect-patterns
 * Run pattern detection
 */
app.post('/api/v1/analytics/detect-patterns', async (req, res) => {
  try {
    const patterns = await patternEngine.detectPatterns();

    res.json({
      message: 'Pattern detection completed',
      patterns,
      total: patterns.length
    });
  } catch (error) {
    console.error('Error detecting patterns:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to detect patterns'
    });
  }
});

/**
 * POST /api/v1/analytics/generate-recommendations
 * Generate recommendations from patterns
 */
app.post('/api/v1/analytics/generate-recommendations', async (req, res) => {
  try {
    const recommendations = await patternEngine.generateRecommendations();

    res.json({
      message: 'Recommendations generated',
      recommendations,
      total: recommendations.length
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate recommendations'
    });
  }
});

/**
 * GET /api/v1/patterns
 * Get all patterns
 */
app.get('/api/v1/patterns', (req, res) => {
  try {
    const patterns = patternEngine.getActivePatterns();

    res.json({
      patterns,
      total: patterns.length
    });
  } catch (error) {
    console.error('Error getting patterns:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get patterns'
    });
  }
});

/**
 * GET /api/v1/recommendations
 * Get all recommendations
 */
app.get('/api/v1/recommendations', (req, res) => {
  try {
    const { status } = req.query;
    const recommendations = patternEngine.getRecommendations(status);

    res.json({
      recommendations,
      total: recommendations.length
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get recommendations'
    });
  }
});

/**
 * GET /api/v1/stats/conversations
 * Get conversation statistics
 */
app.get('/api/v1/stats/conversations', (req, res) => {
  try {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM conversations');
    const result = stmt.get();

    res.json({
      total: result.total
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get statistics'
    });
  }
});

// Serve dashboard static files
app.use(express.static(path.join(__dirname, 'dashboard/public')));

// Serve dashboard at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/public/index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start server
async function start() {
  try {
    await initialize();

    app.listen(PORT, () => {
      console.log(`╔══════════════════════════════════════════════════════════╗`);
      console.log(`║              ImpofAI Server Running                      ║`);
      console.log(`╚══════════════════════════════════════════════════════════╝`);
      console.log(``);
      console.log(`🌐 Server:     http://localhost:${PORT}`);
      console.log(`🏥 Health:     http://localhost:${PORT}/health`);
      console.log(`📚 API Docs:   http://localhost:${PORT}/api/v1/`);
      console.log(``);
      console.log(`🗄️  Database:   ${process.env.AGENTDB_PATH || './data/agentdb.sqlite'}`);
      console.log(`🇸🇰 Language:   Slovak (sk-SK)`);
      console.log(``);
      console.log(`✅ Ready to accept connections!`);
      console.log(``);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

// Start the application
start();
