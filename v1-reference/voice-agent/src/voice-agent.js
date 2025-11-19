const OpenAI = require('openai');
const WebSocket = require('ws');
const config = require('../config/agent-config');

class BusinessVoiceAgent {
  constructor(workerId) {
    this.workerId = workerId;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.analytics = [];
    this.currentSession = {
      startTime: Date.now(),
      tasksCompleted: 0,
      issuesReported: 0,
      suppliesRequested: 0
    };
  }

  async startConversation() {
    console.log('\n🎤 Starting voice conversation...\n');
    console.log('Agent:', config.agent.name);
    console.log('Worker:', config.workers[this.workerId]?.name || this.workerId);
    console.log('\n' + '='.repeat(50) + '\n');

    // Create Realtime API session
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-realtime-preview-2024-10-01',
      modalities: ['text', 'audio'],
      audio: { voice: config.agent.voice, format: 'pcm16' },
      messages: [
        {
          role: 'system',
          content: config.agent.systemPrompt
        },
        {
          role: 'system',
          content: `Current worker: ${config.workers[this.workerId]?.name || this.workerId}
Current shift: ${config.workers[this.workerId]?.shift || 'N/A'}
Current time: ${new Date().toLocaleTimeString()}`
        }
      ]
    });

    return response;
  }

  // Analyze conversation for business insights
  analyzeConversation(text, isWorker = false) {
    if (!isWorker) return; // Only analyze worker messages

    const timestamp = new Date().toISOString();
    const analysis = {
      workerId: this.workerId,
      timestamp,
      text,
      intents: [],
      keywords: [],
      sentiment: this.detectSentiment(text),
      actions: []
    };

    // Detect task completion
    if (this.matchesKeywords(text, config.analytics.taskCompletion.keywords)) {
      analysis.intents.push('task_completion');
      analysis.actions.push(config.analytics.taskCompletion.action);
      this.currentSession.tasksCompleted++;
      console.log('\n📊 [ANALYTICS] Task completion detected');
    }

    // Detect issues
    if (this.matchesKeywords(text, config.analytics.issueReport.keywords)) {
      analysis.intents.push('issue_report');
      analysis.actions.push(config.analytics.issueReport.action);
      this.currentSession.issuesReported++;
      console.log('\n📊 [ANALYTICS] Issue reported');

      // Check for critical issues
      if (this.matchesKeywords(text, config.businessRules.criticalKeywords)) {
        console.log('\n🚨 [ALERT] Critical issue detected!');
        analysis.actions.push('CRITICAL_ALERT');
      }
    }

    // Detect supply requests
    if (this.matchesKeywords(text, config.analytics.supplyRequest.keywords)) {
      analysis.intents.push('supply_request');
      analysis.actions.push(config.analytics.supplyRequest.action);
      this.currentSession.suppliesRequested++;
      console.log('\n📊 [ANALYTICS] Supply request logged');
    }

    // Detect help requests
    if (this.matchesKeywords(text, config.analytics.helpRequest.keywords)) {
      analysis.intents.push('help_request');
      analysis.actions.push(config.analytics.helpRequest.action);
      console.log('\n📊 [ANALYTICS] Help request tracked');
    }

    this.analytics.push(analysis);
    return analysis;
  }

  matchesKeywords(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  }

  detectSentiment(text) {
    const lowerText = text.toLowerCase();

    // Simple sentiment analysis
    const positive = ['great', 'good', 'thanks', 'excellent', 'perfect', 'awesome'];
    const negative = ['problem', 'issue', 'broken', 'bad', 'wrong', 'frustrated'];

    const positiveCount = positive.filter(word => lowerText.includes(word)).length;
    const negativeCount = negative.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  getSessionSummary() {
    const duration = (Date.now() - this.currentSession.startTime) / 1000 / 60; // minutes

    return {
      workerId: this.workerId,
      workerName: config.workers[this.workerId]?.name,
      duration: `${duration.toFixed(1)} minutes`,
      tasksCompleted: this.currentSession.tasksCompleted,
      issuesReported: this.currentSession.issuesReported,
      suppliesRequested: this.currentSession.suppliesRequested,
      interactions: this.analytics.length,
      averageSentiment: this.calculateAverageSentiment()
    };
  }

  calculateAverageSentiment() {
    if (this.analytics.length === 0) return 'N/A';

    const sentiments = this.analytics.map(a => a.sentiment);
    const positive = sentiments.filter(s => s === 'positive').length;
    const negative = sentiments.filter(s => s === 'negative').length;

    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  getAnalytics() {
    return {
      session: this.currentSession,
      summary: this.getSessionSummary(),
      detailedAnalytics: this.analytics
    };
  }
}

module.exports = BusinessVoiceAgent;
