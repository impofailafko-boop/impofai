/**
 * ImpofAI - Main Application Entry Point
 *
 * Business Intelligence Through Conversational AI
 * Slovak voice conversations powered by AgentDB
 */

import express from 'express';
import { createServer } from 'http';
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
import { RealtimeWebSocketServer } from './voice/RealtimeWebSocketServer.js';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global state
let db = null;
let conversationManager = null;
let patternEngine = null;
let realtimeWss = null;

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

  // Initialize Realtime WebSocket Server
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-proj-your-key-here') {
    realtimeWss = new RealtimeWebSocketServer({
      server: httpServer,
      conversationManager,
      apiKey: process.env.OPENAI_API_KEY
    });
  } else {
    console.warn('⚠️  OpenAI API key not configured. Voice features will be limited.');
    console.warn('   Add OPENAI_API_KEY to .env to enable voice conversations.');
  }

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
 * Get patterns with pagination
 * Query params: limit (default: 20), offset (default: 0)
 */
app.get('/api/v1/patterns', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Get all patterns first to calculate total
    const allPatterns = patternEngine.getActivePatterns();
    const total = allPatterns.length;

    // Apply pagination
    const patterns = allPatterns.slice(offset, offset + limit);

    res.json({
      patterns,
      total,
      limit,
      offset,
      hasMore: offset + patterns.length < total
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
 * Get recommendations with pagination
 * Query params: status, limit (default: 20), offset (default: 0)
 */
app.get('/api/v1/recommendations', (req, res) => {
  try {
    const { status } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Get all recommendations first to calculate total
    const allRecommendations = patternEngine.getRecommendations(status);
    const total = allRecommendations.length;

    // Apply pagination
    const recommendations = allRecommendations.slice(offset, offset + limit);

    res.json({
      recommendations,
      total,
      limit,
      offset,
      hasMore: offset + recommendations.length < total
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

/**
 * GET /api/v1/analytics/trends
 * Get trend analysis (week-over-week, month-over-month)
 */
app.get('/api/v1/analytics/trends', (req, res) => {
  try {
    // Conversations trend
    const thisWeek = db.prepare(`SELECT COUNT(*) as count FROM conversations WHERE started_at > datetime('now', '-7 days')`).get();
    const lastWeek = db.prepare(`SELECT COUNT(*) as count FROM conversations WHERE started_at BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days')`).get();
    const thisMonth = db.prepare(`SELECT COUNT(*) as count FROM conversations WHERE started_at > datetime('now', '-30 days')`).get();
    const lastMonth = db.prepare(`SELECT COUNT(*) as count FROM conversations WHERE started_at BETWEEN datetime('now', '-60 days') AND datetime('now', '-30 days')`).get();

    // Patterns trend
    const newPatternsThisWeek = db.prepare(`SELECT COUNT(*) as count FROM patterns WHERE created_at > datetime('now', '-7 days')`).get();
    const newPatternsLastWeek = db.prepare(`SELECT COUNT(*) as count FROM patterns WHERE created_at BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days')`).get();

    // Worker engagement trend
    const activeWorkersThisWeek = db.prepare(`SELECT COUNT(DISTINCT worker_id) as count FROM conversations WHERE started_at > datetime('now', '-7 days')`).get();
    const activeWorkersLastWeek = db.prepare(`SELECT COUNT(DISTINCT worker_id) as count FROM conversations WHERE started_at BETWEEN datetime('now', '-14 days') AND datetime('now', '-7 days')`).get();

    res.json({
      conversations: {
        thisWeek: thisWeek.count,
        lastWeek: lastWeek.count,
        weekOverWeekChange: lastWeek.count > 0 ? ((thisWeek.count - lastWeek.count) / lastWeek.count * 100).toFixed(1) : 0,
        thisMonth: thisMonth.count,
        lastMonth: lastMonth.count,
        monthOverMonthChange: lastMonth.count > 0 ? ((thisMonth.count - lastMonth.count) / lastMonth.count * 100).toFixed(1) : 0
      },
      patterns: {
        thisWeek: newPatternsThisWeek.count,
        lastWeek: newPatternsLastWeek.count,
        weekOverWeekChange: newPatternsLastWeek.count > 0 ? ((newPatternsThisWeek.count - newPatternsLastWeek.count) / newPatternsLastWeek.count * 100).toFixed(1) : 0
      },
      engagement: {
        activeWorkersThisWeek: activeWorkersThisWeek.count,
        activeWorkersLastWeek: activeWorkersLastWeek.count,
        weekOverWeekChange: activeWorkersLastWeek.count > 0 ? ((activeWorkersThisWeek.count - activeWorkersLastWeek.count) / activeWorkersLastWeek.count * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get trend analysis'
    });
  }
});

/**
 * GET /api/v1/workers/cards
 * Get employee cards with engagement metrics
 */
app.get('/api/v1/workers/cards', (req, res) => {
  try {
    const workers = db.prepare(`
      SELECT
        w.worker_id,
        w.name,
        w.role,
        w.total_conversations,
        w.last_conversation_at,
        w.average_sentiment,
        COUNT(DISTINCT c.conversation_id) as recent_conversations,
        AVG(c.duration_seconds) as avg_duration,
        SUM(CASE WHEN c.urgency = 'high' OR c.urgency = 'critical' THEN 1 ELSE 0 END) as urgent_reports
      FROM workers w
      LEFT JOIN conversations c ON w.worker_id = c.worker_id
        AND c.started_at > datetime('now', '-30 days')
      WHERE w.active = TRUE
      GROUP BY w.worker_id
      ORDER BY w.last_conversation_at DESC
      LIMIT 50
    `).all();

    const cards = workers.map(w => ({
      workerId: w.worker_id,
      name: w.name,
      role: w.role,
      engagement: {
        totalConversations: w.total_conversations,
        recentConversations: w.recent_conversations,
        lastActive: w.last_conversation_at,
        avgDuration: w.avg_duration ? Math.round(w.avg_duration) : 0
      },
      metrics: {
        sentiment: w.average_sentiment || 'neutral',
        urgentReports: w.urgent_reports || 0
      },
      status: w.recent_conversations > 0 ? 'active' : 'inactive'
    }));

    res.json({
      workers: cards,
      total: cards.length
    });
  } catch (error) {
    console.error('Error getting worker cards:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get worker cards'
    });
  }
});

/**
 * GET /api/v1/analytics/executive-summary
 * Generate executive summary report
 */
app.get('/api/v1/analytics/executive-summary', (req, res) => {
  try {
    // Overall stats
    const totalConversations = db.prepare('SELECT COUNT(*) as count FROM conversations').get().count;
    const totalWorkers = db.prepare('SELECT COUNT(*) as count FROM workers WHERE active = TRUE').get().count;
    const activePatterns = db.prepare('SELECT COUNT(*) as count FROM patterns WHERE status = "active"').get().count;
    const pendingRecommendations = db.prepare('SELECT COUNT(*) as count FROM recommendations WHERE status = "pending"').get().count;

    // Top issues
    const topIssues = db.prepare(`
      SELECT issue_description, location, occurrence_count, estimated_daily_cost, urgency_level
      FROM patterns
      WHERE status = 'active'
      ORDER BY estimated_daily_cost DESC
      LIMIT 5
    `).all();

    // High ROI opportunities
    const highROI = db.prepare(`
      SELECT title, investment_required, payback_period_days, annual_roi_percentage, priority
      FROM recommendations
      WHERE status = 'pending' AND payback_period_days < 30
      ORDER BY annual_roi_percentage DESC
      LIMIT 5
    `).all();

    // Recent activity
    const recentConversations = db.prepare(`
      SELECT COUNT(*) as count
      FROM conversations
      WHERE started_at > datetime('now', '-7 days')
    `).get().count;

    // Cost impact
    const totalDailyCost = db.prepare(`
      SELECT SUM(estimated_daily_cost) as total
      FROM patterns
      WHERE status = 'active'
    `).get().total || 0;

    const totalPotentialSavings = db.prepare(`
      SELECT SUM(estimated_savings_per_day) as total
      FROM recommendations
      WHERE status = 'pending'
    `).get().total || 0;

    res.json({
      summary: {
        totalConversations,
        totalWorkers,
        activePatterns,
        pendingRecommendations,
        recentConversations
      },
      costImpact: {
        dailyCostOfIssues: totalDailyCost,
        potentialDailySavings: totalPotentialSavings,
        annualImpact: (totalPotentialSavings * 365) - totalDailyCost * 365
      },
      topIssues,
      highROI,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate executive summary'
    });
  }
});

/**
 * POST /api/v1/analytics/qa
 * AI Q&A assistant for admin queries
 */
app.post('/api/v1/analytics/qa', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Question is required'
      });
    }

    // Simple keyword-based Q&A (can be enhanced with OpenAI later)
    const answer = await generateAnswer(question.toLowerCase(), db);

    res.json({
      question,
      answer,
      sources: answer.sources || [],
      confidence: answer.confidence || 0.7,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in Q&A:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to answer question'
    });
  }
});

// Simple Q&A answer generator
async function generateAnswer(question, db) {
  // Most urgent issues
  if (question.includes('urgent') || question.includes('critical') || question.includes('naliehavé')) {
    const issues = db.prepare(`
      SELECT issue_description, location, occurrence_count
      FROM patterns
      WHERE status = 'active' AND urgency_level IN ('critical', 'high')
      ORDER BY estimated_daily_cost DESC
      LIMIT 3
    `).all();

    return {
      text: `Máme ${issues.length} naliehavých problémov: ${issues.map(i => `${i.issue_description} (${i.location})`).join(', ')}`,
      sources: issues.map(i => ({ type: 'pattern', id: i.pattern_id })),
      confidence: 0.9
    };
  }

  // Worker engagement
  if (question.includes('worker') || question.includes('employee') || question.includes('pracovník')) {
    const stats = db.prepare(`
      SELECT COUNT(*) as total, COUNT(DISTINCT worker_id) as active
      FROM conversations
      WHERE started_at > datetime('now', '-7 days')
    `).get();

    return {
      text: `V posledných 7 dňoch: ${stats.active} aktívnych pracovníkov, ${stats.total} konverzácií.`,
      sources: [{ type: 'stat', metric: 'worker_engagement' }],
      confidence: 0.95
    };
  }

  // ROI
  if (question.includes('roi') || question.includes('saving') || question.includes('úspora')) {
    const savings = db.prepare(`
      SELECT SUM(estimated_savings_per_day) as total
      FROM recommendations
      WHERE status = 'pending'
    `).get().total || 0;

    return {
      text: `Potenciálne denné úspory: €${savings.toFixed(2)}. Ročné úspory: €${(savings * 365).toFixed(2)}.`,
      sources: [{ type: 'recommendation', metric: 'total_savings' }],
      confidence: 0.85
    };
  }

  // Default fallback
  return {
    text: 'Prepáčte, na túto otázku neviem odpovedať. Skúste sa opýtať na naliehavé problémy, pracovníkov alebo ROI.',
    sources: [],
    confidence: 0.3
  };
}

// Serve worker interface
app.use('/worker', express.static(path.join(__dirname, 'dashboard/worker')));
app.get('/worker', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard/worker/index.html'));
});

// Serve admin dashboard static files
app.use(express.static(path.join(__dirname, 'dashboard/public')));

// Serve admin dashboard at root
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

    httpServer.listen(PORT, () => {
      console.log(`╔══════════════════════════════════════════════════════════╗`);
      console.log(`║              ImpofAI Server Running                      ║`);
      console.log(`╚══════════════════════════════════════════════════════════╝`);
      console.log(``);
      console.log(`🌐 Server:       http://localhost:${PORT}`);
      console.log(`🏥 Health:       http://localhost:${PORT}/health`);
      console.log(`📚 API Docs:     http://localhost:${PORT}/api/v1/`);
      console.log(`👤 Worker UI:    http://localhost:${PORT}/worker`);
      console.log(`📊 Admin UI:     http://localhost:${PORT}`);
      console.log(``);
      console.log(`🗄️  Database:    ${process.env.AGENTDB_PATH || './data/agentdb.sqlite'}`);
      console.log(`🇸🇰 Language:    Slovak (sk-SK)`);
      console.log(`🎙️  Voice API:   ${realtimeWss ? '✅ Enabled' : '⚠️  Not configured'}`);
      console.log(`🔌 WebSocket:   ${realtimeWss ? 'ws://localhost:' + PORT + '/api/v1/realtime' : 'N/A'}`);
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
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  if (realtimeWss) {
    await realtimeWss.close();
  }
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  if (realtimeWss) {
    await realtimeWss.close();
  }
  if (db) {
    db.close();
  }
  process.exit(0);
});

// Start the application
start();
