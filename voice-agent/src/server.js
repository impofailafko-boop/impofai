#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const BusinessVoiceAgent = require('./voice-agent');
const RealtimeVoiceAgent = require('./realtime-voice-agent');
const workerRoles = require('../config/worker-roles');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = process.env.PORT || 3000;

// Store active sessions
const activeSessions = new Map();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// CORS for mobile access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory storage (in production, use a real database)
let globalConfig = require('../config/agent-config');
let globalAnalytics = {
  activeWorkers: new Map(),
  sessionsToday: 0,
  totalTasks: 0,
  totalIssues: 0,
  totalSupplies: 0,
  recentActivities: [],
  workerMetrics: {}
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// ============================================================================
// CONFIGURATION MANAGEMENT API
// ============================================================================

// Get current configuration
app.get('/api/config', (req, res) => {
  res.json(globalConfig);
});

// Update agent configuration
app.post('/api/config/agent', (req, res) => {
  try {
    const { name, voice, systemPrompt } = req.body;

    if (name) globalConfig.agent.name = name;
    if (voice) globalConfig.agent.voice = voice;
    if (systemPrompt) globalConfig.agent.systemPrompt = systemPrompt;

    // Save to file
    saveConfig();

    res.json({ success: true, config: globalConfig.agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update analytics keywords
app.post('/api/config/analytics', (req, res) => {
  try {
    const { taskCompletion, issueReport, supplyRequest, helpRequest } = req.body;

    if (taskCompletion) globalConfig.analytics.taskCompletion = taskCompletion;
    if (issueReport) globalConfig.analytics.issueReport = issueReport;
    if (supplyRequest) globalConfig.analytics.supplyRequest = supplyRequest;
    if (helpRequest) globalConfig.analytics.helpRequest = helpRequest;

    saveConfig();

    res.json({ success: true, config: globalConfig.analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add/update worker
app.post('/api/config/workers', (req, res) => {
  try {
    const { workerId, name, role, shift } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, error: 'Worker ID required' });
    }

    globalConfig.workers[workerId] = { name, role, shift };
    saveConfig();

    res.json({ success: true, worker: globalConfig.workers[workerId] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete worker
app.delete('/api/config/workers/:workerId', (req, res) => {
  try {
    const { workerId } = req.params;

    if (globalConfig.workers[workerId]) {
      delete globalConfig.workers[workerId];
      saveConfig();
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Worker not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get list of available voices
app.get('/api/voices', (req, res) => {
  res.json({
    voices: [
      { id: 'alloy', name: 'Alloy', description: 'Neutral, professional' },
      { id: 'echo', name: 'Echo', description: 'Warm, friendly' },
      { id: 'fable', name: 'Fable', description: 'Expressive, energetic' },
      { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative' },
      { id: 'nova', name: 'Nova', description: 'Bright, enthusiastic' },
      { id: 'shimmer', name: 'Shimmer', description: 'Soft, gentle' }
    ]
  });
});

// Save configuration to file
function saveConfig() {
  const configPath = path.join(__dirname, '../config/agent-config.js');
  const configContent = `// Business Voice Agent Configuration
module.exports = ${JSON.stringify(globalConfig, null, 2)};
`;
  fs.writeFileSync(configPath, configContent, 'utf8');
}

// ============================================================================
// ANALYTICS API
// ============================================================================

// Get analytics data
app.get('/api/analytics', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    metrics: {
      activeWorkers: globalAnalytics.activeWorkers.size,
      sessionsToday: globalAnalytics.sessionsToday,
      tasksCompleted: globalAnalytics.totalTasks,
      issuesReported: globalAnalytics.totalIssues,
      suppliesNeeded: globalAnalytics.totalSupplies
    },
    recentActivities: globalAnalytics.recentActivities.slice(-20),
    workerMetrics: Object.fromEntries(globalAnalytics.activeWorkers)
  });
});

// Log activity from voice agent
app.post('/api/activity', (req, res) => {
  const activity = req.body;

  globalAnalytics.recentActivities.push({
    ...activity,
    timestamp: new Date().toISOString()
  });

  // Update metrics
  if (activity.type === 'task_completion') globalAnalytics.totalTasks++;
  if (activity.type === 'issue_report') globalAnalytics.totalIssues++;
  if (activity.type === 'supply_request') globalAnalytics.totalSupplies++;

  // Update worker metrics
  if (activity.workerId) {
    const workerData = globalAnalytics.activeWorkers.get(activity.workerId) || {
      lastActive: new Date().toISOString(),
      tasksToday: 0,
      issuesReported: 0
    };

    if (activity.type === 'task_completion') workerData.tasksToday++;
    if (activity.type === 'issue_report') workerData.issuesReported++;
    workerData.lastActive = new Date().toISOString();

    globalAnalytics.activeWorkers.set(activity.workerId, workerData);
  }

  res.json({ success: true });
});

// Start voice session
app.post('/api/voice/start', async (req, res) => {
  try {
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, error: 'Worker ID required' });
    }

    const agent = new BusinessVoiceAgent(workerId);
    // Store agent in session (in production, use Redis or similar)

    globalAnalytics.sessionsToday++;
    globalAnalytics.activeWorkers.set(workerId, {
      lastActive: new Date().toISOString(),
      tasksToday: 0,
      issuesReported: 0
    });

    res.json({
      success: true,
      workerId,
      worker: globalConfig.workers[workerId],
      sessionStarted: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test API key
app.post('/api/test/openai', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API key required' });
    }

    // Test the API key by making a simple request
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    await openai.models.list();

    res.json({ success: true, message: 'API key is valid' });
  } catch (error) {
    res.json({
      success: false,
      error: 'Invalid API key or OpenAI service unavailable',
      details: error.message
    });
  }
});

// ============================================================================
// MAIN WEB INTERFACE
// ============================================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/setup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/setup.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/voice', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/voice.html'));
});

app.get('/voice-realtime', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/voice-realtime.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// ============================================================================
// WORKER ROLES API
// ============================================================================

// Get all worker roles
app.get('/api/roles', (req, res) => {
  res.json({
    success: true,
    roles: workerRoles.getAllRoles()
  });
});

// ============================================================================
// TRANSCRIPT API
// ============================================================================

// Get all transcripts
app.get('/api/transcripts', (req, res) => {
  try {
    const transcriptsDir = path.join(__dirname, '../transcripts');

    if (!fs.existsSync(transcriptsDir)) {
      return res.json({ success: true, transcripts: [] });
    }

    const files = fs.readdirSync(transcriptsDir);
    const transcripts = files
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const content = fs.readFileSync(path.join(transcriptsDir, f), 'utf8');
          return JSON.parse(content);
        } catch (err) {
          console.error(`Error reading ${f}:`, err);
          return null;
        }
      })
      .filter(t => t !== null)
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // newest first

    res.json({ success: true, transcripts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific transcript
app.get('/api/transcripts/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const transcriptsDir = path.join(__dirname, '../transcripts');
    const filepath = path.join(transcriptsDir, `${sessionId}.json`);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'Transcript not found' });
    }

    const content = fs.readFileSync(filepath, 'utf8');
    const transcript = JSON.parse(content);

    res.json({ success: true, transcript });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete transcript
app.delete('/api/transcripts/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const transcriptsDir = path.join(__dirname, '../transcripts');
    const filepath = path.join(transcriptsDir, `${sessionId}.json`);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, error: 'Transcript not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// WEBSOCKET FOR REALTIME VOICE
// ============================================================================

wss.on('connection', (ws, req) => {
  console.log('[WebSocket] Client connected');

  let voiceAgent = null;
  let openaiWs = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'start_session':
          // Initialize voice agent session
          const { workerId, role } = data;
          const sessionId = data.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          console.log(`[Session] Starting: ${sessionId} (${role})`);

          voiceAgent = new RealtimeVoiceAgent(workerId, role, sessionId);
          activeSessions.set(sessionId, voiceAgent);

          // Initialize OpenAI connection
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'OpenAI API key not configured'
            }));
            return;
          }

          try {
            openaiWs = await voiceAgent.initializeRealtimeConnection(apiKey);

            // Forward OpenAI events to client
            openaiWs.on('message', (openaiData) => {
              const event = JSON.parse(openaiData.toString());

              // Send relevant events to client
              if (event.type === 'response.audio.delta' ||
                  event.type === 'response.audio_transcript.delta' ||
                  event.type === 'response.audio_transcript.done' ||
                  event.type === 'conversation.item.input_audio_transcription.completed') {
                ws.send(JSON.stringify(event));
              }
            });

            ws.send(JSON.stringify({
              type: 'session_started',
              sessionId: sessionId,
              role: role
            }));

          } catch (error) {
            console.error('[Session] Failed to initialize:', error);
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Failed to connect to OpenAI Realtime API'
            }));
          }
          break;

        case 'audio_data':
          // Forward audio to OpenAI
          if (voiceAgent && openaiWs) {
            voiceAgent.sendAudio(data.audio);
          }
          break;

        case 'audio_commit':
          // Commit audio buffer
          if (voiceAgent) {
            voiceAgent.commitAudio();
          }
          break;

        case 'send_text':
          // For testing - send text instead of audio
          if (voiceAgent) {
            voiceAgent.sendText(data.text);
          }
          break;

        case 'end_session':
          // End session and save transcript
          if (voiceAgent) {
            const transcript = voiceAgent.getTranscript();
            voiceAgent.close();
            activeSessions.delete(voiceAgent.sessionId);

            ws.send(JSON.stringify({
              type: 'session_ended',
              transcript: transcript
            }));
          }
          break;

        default:
          console.log('[WebSocket] Unknown message type:', data.type);
      }

    } catch (error) {
      console.error('[WebSocket] Message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
    if (voiceAgent) {
      voiceAgent.close();
      activeSessions.delete(voiceAgent.sessionId);
    }
  });

  ws.on('error', (error) => {
    console.error('[WebSocket] Error:', error);
  });
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(port, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(70));
  console.log('  🎤 BUSINESS VOICE AGENT - PRODUCTION SERVER');
  console.log('='.repeat(70) + '\n');
  console.log(`  🌐 Server running at:`);
  console.log(`     Local:    http://localhost:${port}`);
  console.log(`     Network:  http://0.0.0.0:${port}`);
  console.log();
  console.log(`  📱 Mobile-friendly UI available`);
  console.log(`  ⚙️  Setup:     http://localhost:${port}/setup`);
  console.log(`  📊 Dashboard: http://localhost:${port}/dashboard`);
  console.log(`  🎙️  Voice:     http://localhost:${port}/voice`);
  console.log();
  console.log(`  🐳 Running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log();
  console.log('='.repeat(70) + '\n');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
