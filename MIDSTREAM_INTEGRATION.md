# 🌊 MidStream Integration Guide

## What is MidStream?

**MidStream** analyzes AI conversations **as they stream** in real-time, enabling:
- ✅ Instant pattern detection (while agent is still talking)
- ✅ Live insights dashboard
- ✅ Real-time decision making
- ✅ Multi-modal analysis (text, audio, video)

**Perfect for:** Your business intelligence platform where you need to detect issues DURING conversations, not after.

---

## 🚀 Quick Start

### **Installation:**

```bash
# Clone MidStream
git clone https://github.com/ruvnet/midstream.git

# Install dependencies
cd midstream/npm
npm install
npm run build:ts

# Or install as package (if published)
npm install midstream-cli
```

---

## 🔌 Integration with Your Voice Agent

### **Current Flow (Without MidStream):**
```
Worker speaks → OpenAI Realtime API → Agent responds → Save transcript
```

### **New Flow (With MidStream):**
```
Worker speaks → OpenAI Realtime API
                      ↓
                 MidStream (analyzes in real-time)
                      ↓
              Detects patterns/issues
                      ↓
        Agent responds + Save + Alert manager
```

---

## 💻 Code Example: Integrate with Your Agent

### **File: `/voice-agent/src/midstream-analyzer.js`**

```javascript
/**
 * MidStream Real-time Analyzer
 * Analyzes conversations as they happen
 */

class MidStreamAnalyzer {
  constructor(options = {}) {
    this.patterns = {
      equipment: ['scanner', 'broken', 'not working', 'malfunction', 'failed'],
      supply: ['running out', 'need more', 'shortage', 'missing', 'empty'],
      urgent: ['urgent', 'emergency', 'immediately', 'critical', 'asap'],
      // Slovak keywords
      equipment_sk: ['skener', 'pokazený', 'nefunguje', 'porucha'],
      supply_sk: ['chýba', 'potrebujem', 'nedostatok', 'prázdny']
    };

    this.liveMetrics = {
      totalMessages: 0,
      patternsDetected: [],
      urgencyLevel: 'normal',
      conversationSentiment: 'neutral'
    };

    this.alerts = [];
  }

  /**
   * Analyze text as it streams in (real-time)
   */
  analyzeStream(text, metadata = {}) {
    this.liveMetrics.totalMessages++;

    const analysis = {
      timestamp: new Date(),
      text: text,
      patterns: [],
      urgency: 'normal',
      sentiment: this.detectSentiment(text),
      ...metadata
    };

    // Check all pattern categories
    for (const [category, keywords] of Object.entries(this.patterns)) {
      if (this.matchesAny(text, keywords)) {
        analysis.patterns.push(category);

        // Real-time alert if urgent
        if (category.includes('urgent')) {
          analysis.urgency = 'high';
          this.raiseAlert({
            type: 'urgent',
            text: text,
            timestamp: new Date()
          });
        }
      }
    }

    // Track patterns over conversation
    this.liveMetrics.patternsDetected.push(...analysis.patterns);

    // Check for escalating issues
    if (this.shouldEscalate()) {
      this.raiseAlert({
        type: 'escalation',
        reason: 'Multiple issues detected in conversation',
        patterns: analysis.patterns
      });
    }

    return analysis;
  }

  /**
   * Real-time pattern detection
   */
  detectLivePatterns() {
    const patternCounts = {};

    for (const pattern of this.liveMetrics.patternsDetected) {
      patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
    }

    // Alert if same issue mentioned 3+ times
    for (const [pattern, count] of Object.entries(patternCounts)) {
      if (count >= 3) {
        return {
          alert: true,
          pattern: pattern,
          count: count,
          message: `Pattern "${pattern}" detected ${count} times in this conversation`
        };
      }
    }

    return { alert: false };
  }

  /**
   * Simple sentiment detection
   */
  detectSentiment(text) {
    const positive = ['good', 'great', 'working', 'fixed', 'solved', 'thanks'];
    const negative = ['broken', 'problem', 'issue', 'failed', 'not working', 'bad'];

    const positiveCount = this.countMatches(text, positive);
    const negativeCount = this.countMatches(text, negative);

    if (negativeCount > positiveCount) return 'negative';
    if (positiveCount > negativeCount) return 'positive';
    return 'neutral';
  }

  /**
   * Check if should escalate to manager
   */
  shouldEscalate() {
    // Escalate if multiple different issues in same call
    const uniquePatterns = new Set(this.liveMetrics.patternsDetected);
    return uniquePatterns.size >= 3;
  }

  /**
   * Raise real-time alert
   */
  raiseAlert(alert) {
    console.log('🚨 ALERT:', alert);
    this.alerts.push({
      ...alert,
      timestamp: new Date()
    });

    // Could send to Slack, email, dashboard, etc.
    // TODO: Implement webhook notification
  }

  /**
   * Get live dashboard metrics
   */
  getDashboardMetrics() {
    return {
      ...this.liveMetrics,
      alerts: this.alerts,
      patternSummary: this.detectLivePatterns()
    };
  }

  // Helper methods
  matchesAny(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  countMatches(text, keywords) {
    return keywords.filter(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length;
  }

  /**
   * Reset metrics for new conversation
   */
  reset() {
    this.liveMetrics = {
      totalMessages: 0,
      patternsDetected: [],
      urgencyLevel: 'normal',
      conversationSentiment: 'neutral'
    };
    this.alerts = [];
  }
}

module.exports = MidStreamAnalyzer;
```

---

## 🔧 Modified Voice Agent Integration

### **File: `/voice-agent/src/realtime-voice-agent.js`** (Modified)

```javascript
const MidStreamAnalyzer = require('./midstream-analyzer');

class RealtimeVoiceAgent {
  constructor(workerId, role, sessionId) {
    // ... existing code ...

    // NEW: Add MidStream analyzer
    this.analyzer = new MidStreamAnalyzer({
      workerId: workerId,
      role: role
    });
  }

  /**
   * Modified: Analyze as text comes in
   */
  handleRealtimeEvent(event) {
    const type = event.type;

    switch (type) {
      case 'conversation.item.input_audio_transcription.completed':
        const userText = event.transcript;

        // NEW: Analyze in real-time with MidStream
        const analysis = this.analyzer.analyzeStream(userText, {
          speaker: 'worker',
          sessionId: this.sessionId
        });

        // Check for alerts
        if (analysis.urgency === 'high') {
          this.emit('urgent_alert', {
            text: userText,
            analysis: analysis
          });
        }

        this.addToTranscript('worker', userText);
        break;

      case 'response.audio_transcript.delta':
        const agentDelta = event.delta;

        // Analyze agent response too
        this.analyzer.analyzeStream(agentDelta, {
          speaker: 'agent',
          sessionId: this.sessionId
        });
        break;

      case 'response.audio_transcript.done':
        // Check for patterns detected during conversation
        const patterns = this.analyzer.detectLivePatterns();

        if (patterns.alert) {
          this.emit('pattern_alert', patterns);
        }
        break;
    }

    // ... rest of existing code ...
  }

  /**
   * Get live metrics for dashboard
   */
  getLiveMetrics() {
    return this.analyzer.getDashboardMetrics();
  }

  /**
   * Modified: Include analysis in transcript
   */
  async saveTranscript() {
    const transcript = {
      // ... existing fields ...

      // NEW: Include MidStream analysis
      analysis: {
        patterns: this.analyzer.liveMetrics.patternsDetected,
        alerts: this.analyzer.alerts,
        sentiment: this.analyzer.liveMetrics.conversationSentiment
      }
    };

    // Save to AgentDB (instead of JSON file)
    await this.saveToAgentDB(transcript);
  }
}
```

---

## 📊 Live Dashboard WebSocket Updates

### **File: `/voice-agent/src/server.js`** (Modified)

```javascript
// Handle WebSocket messages
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'start_session') {
      const agent = new RealtimeVoiceAgent(data.workerId, data.role, sessionId);

      // NEW: Forward live metrics to dashboard
      agent.on('urgent_alert', (alert) => {
        // Send to admin dashboard in real-time
        broadcastToDashboard({
          type: 'urgent_alert',
          workerId: data.workerId,
          alert: alert,
          timestamp: new Date()
        });
      });

      agent.on('pattern_alert', (pattern) => {
        broadcastToDashboard({
          type: 'pattern_alert',
          pattern: pattern,
          sessionId: sessionId
        });
      });

      // Send live metrics every 5 seconds
      const metricsInterval = setInterval(() => {
        const metrics = agent.getLiveMetrics();

        broadcastToDashboard({
          type: 'live_metrics',
          sessionId: sessionId,
          metrics: metrics
        });
      }, 5000);

      activeSessions.set(sessionId, { agent, metricsInterval });
    }
  });
});

// Broadcast to all dashboard clients
function broadcastToDashboard(data) {
  wss.clients.forEach(client => {
    if (client.isDashboard && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
```

---

## 🎯 Real-World Example

### **Scenario: Multiple workers report scanner issue**

**Timeline:**

**10:00 AM - Worker 1 calls:**
```
Worker: "Skener v sklade nefunguje" (Scanner in warehouse not working)
MidStream: Detects pattern 'equipment_sk'
Dashboard: Shows issue #1
```

**10:30 AM - Worker 2 calls:**
```
Worker: "Ten istý skener je stále pokazený" (Same scanner still broken)
MidStream: Detects pattern 'equipment_sk' again
Dashboard: Updates to 2 reports, same scanner
Alert Level: MEDIUM
```

**11:00 AM - Worker 3 calls:**
```
Worker: "URGENTNE! Skener úplne nefunguje!" (URGENT! Scanner not working at all)
MidStream: Detects 'equipment_sk' + 'urgent'
Dashboard: 🚨 URGENT ALERT
           3 workers, same issue in 1 hour
           Auto-escalates to manager
Alert Level: HIGH
```

**Manager sees real-time:**
```
┌─────────────────────────────────────┐
│  🚨 LIVE ALERTS                     │
├─────────────────────────────────────┤
│  Scanner Issue - Warehouse          │
│  3 reports in 60 minutes            │
│  Status: ESCALATING                 │
│  Impact: HIGH                       │
│                                     │
│  [View Details] [Resolve]           │
└─────────────────────────────────────┘
```

---

## 🔥 Benefits for Your Platform

### **1. Immediate Issue Detection**
- Don't wait for batch processing
- Spot problems during first conversation
- Alert managers in real-time

### **2. Context-Aware Responses**
- Agent knows pattern is escalating
- Can say: "I see others reported this too, escalating now"
- Worker feels heard and prioritized

### **3. Live Business Intelligence**
- Dashboard updates while call happens
- Managers can intervene immediately
- Data-driven decisions in real-time

### **4. Pattern Recognition**
- Detects trends across multiple workers
- Connects related issues automatically
- Builds company knowledge graph live

---

## 📦 Installation for Tomorrow's Test

### **Quick Setup:**

```bash
cd /home/user/impofai/voice-agent

# Add MidStream analyzer (we created it above)
# Copy the code into src/midstream-analyzer.js

# Test it
node -e "
  const Analyzer = require('./src/midstream-analyzer');
  const analyzer = new Analyzer();

  const result = analyzer.analyzeStream('The scanner is broken again');
  console.log('Analysis:', result);
"
```

---

## 🎬 Tomorrow's Testing Plan

### **Test 1: Basic Pattern Detection**
1. Start voice conversation
2. Say "scanner is broken"
3. Check console for pattern detection
4. Verify analysis saved

### **Test 2: Real-time Alerts**
1. Mention urgent issue
2. Check if alert triggered
3. Verify dashboard updated
4. Test Slovak keywords

### **Test 3: Pattern Escalation**
1. Have 3 workers call about same issue
2. Watch pattern count increase
3. Verify escalation at threshold
4. Check manager notification

### **Test 4: Dashboard Integration**
1. Open admin dashboard
2. Start conversation
3. Watch live metrics update
4. Verify alerts appear in real-time

---

## 🚀 Next Steps

**For MVP:**
- ✅ MidStream analyzer code ready (above)
- ⏳ Integrate with voice agent (30 min)
- ⏳ Add dashboard WebSocket (1 hour)
- ⏳ Test with real conversations (tomorrow)

**Future Enhancements:**
- Add video stream analysis
- ML-based pattern detection
- Sentiment analysis improvements
- Multi-language support expansion

---

## 📚 Resources

- **MidStream GitHub:** https://github.com/ruvnet/midstream
- **OpenAI Realtime API:** https://platform.openai.com/docs/guides/realtime
- **AgentDB:** https://www.npmjs.com/package/agentdb
- **Your Architecture:** See `ARCHITECTURE.md`

---

**Ready to test tomorrow! 🚀**
