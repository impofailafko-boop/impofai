#!/usr/bin/env node

require('dotenv').config();
const BusinessVoiceAgent = require('./voice-agent');
const config = require('../config/agent-config');

// Simulated conversation demo (text-based for easy testing)
class VoiceDemo {
  constructor() {
    this.workerId = process.env.WORKER_ID || 'W001';
    this.agent = new BusinessVoiceAgent(this.workerId);
    this.conversationHistory = [];
  }

  async runDemo() {
    console.clear();
    console.log('\n' + '='.repeat(70));
    console.log('  🎤 BUSINESS VOICE AGENT - INTERACTIVE DEMO');
    console.log('='.repeat(70) + '\n');

    console.log('This demo simulates a worker conversation with the voice agent.');
    console.log('Watch how it tracks tasks, issues, and supplies in real-time!\n');
    console.log('Worker:', config.workers[this.workerId]?.name || this.workerId);
    console.log('Role:', config.workers[this.workerId]?.role || 'Unknown');
    console.log('\n' + '='.repeat(70) + '\n');

    // Simulate conversation scenarios
    const scenarios = [
      {
        worker: "Hey assistant, I just finished loading truck number 5",
        agent: "Great work! I've logged truck 5 as loaded. That's your 3rd truck today. Keep it up! Next is truck 6."
      },
      {
        worker: "I need to report that the forklift in bay 3 is making a weird noise",
        agent: "Thanks for letting me know. I've created a maintenance ticket for the forklift in bay 3. Maintenance will be notified. Is it still safe to use?"
      },
      {
        worker: "We're running low on packing tape in the shipping area",
        agent: "Got it. I've added packing tape to the supply order. It should arrive tomorrow morning. Anything else you need?"
      },
      {
        worker: "How many packages have I processed today?",
        agent: "You've completed 3 trucks so far today. You're doing great! Your average is on track for the shift goal."
      },
      {
        worker: "Thanks! I'll take my break now",
        agent: "You've earned it! Have a good break. I'll be here when you get back."
      }
    ];

    for (let i = 0; i < scenarios.length; i++) {
      await this.simulateExchange(scenarios[i], i + 1);
      await this.sleep(2000); // Pause between exchanges
    }

    // Show final analytics
    this.showAnalytics();
  }

  async simulateExchange(scenario, exchangeNum) {
    console.log(`\n📍 Exchange ${exchangeNum}:`);
    console.log('-'.repeat(70));

    // Worker speaks
    console.log(`\n👷 Worker: "${scenario.worker}"`);

    // Analyze what worker said
    const analysis = this.agent.analyzeConversation(scenario.worker, true);

    await this.sleep(500);

    // Agent responds
    console.log(`\n🤖 ${config.agent.name}: "${scenario.agent}"`);

    if (analysis && analysis.intents.length > 0) {
      console.log('\n   └─ Detected:', analysis.intents.join(', '));
      console.log('   └─ Sentiment:', analysis.sentiment);
      if (analysis.actions.length > 0) {
        console.log('   └─ Actions:', analysis.actions.join(', '));
      }
    }

    console.log('\n' + '-'.repeat(70));
  }

  showAnalytics() {
    console.log('\n\n' + '='.repeat(70));
    console.log('  📊 SESSION ANALYTICS SUMMARY');
    console.log('='.repeat(70) + '\n');

    const summary = this.agent.getSessionSummary();

    console.log('Worker Information:');
    console.log(`  • Worker ID: ${summary.workerId}`);
    console.log(`  • Name: ${summary.workerName}`);
    console.log(`  • Session Duration: ${summary.duration}`);
    console.log();

    console.log('Activity Metrics:');
    console.log(`  • Tasks Completed: ${summary.tasksCompleted}`);
    console.log(`  • Issues Reported: ${summary.issuesReported}`);
    console.log(`  • Supplies Requested: ${summary.suppliesRequested}`);
    console.log(`  • Total Interactions: ${summary.interactions}`);
    console.log();

    console.log('Sentiment Analysis:');
    console.log(`  • Overall Sentiment: ${summary.averageSentiment}`);
    console.log();

    const analytics = this.agent.getAnalytics();

    if (analytics.detailedAnalytics.length > 0) {
      console.log('Detailed Activity Log:');
      analytics.detailedAnalytics.forEach((log, idx) => {
        console.log(`\n  ${idx + 1}. [${new Date(log.timestamp).toLocaleTimeString()}]`);
        console.log(`     Text: "${log.text}"`);
        console.log(`     Intents: ${log.intents.join(', ') || 'none'}`);
        console.log(`     Sentiment: ${log.sentiment}`);
        if (log.actions.length > 0) {
          console.log(`     Actions Triggered: ${log.actions.join(', ')}`);
        }
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('  ✅ Demo Complete!');
    console.log('='.repeat(70) + '\n');

    console.log('What happened:');
    console.log('  1. Voice agent had a natural conversation with the worker');
    console.log('  2. Real-time analytics tracked all activities');
    console.log('  3. Business data was collected automatically');
    console.log('  4. Issues were logged and routed appropriately\n');

    console.log('Next Steps:');
    console.log('  • Try: npm start (for actual voice with OpenAI)');
    console.log('  • Try: npm run dashboard (see real-time analytics)');
    console.log('  • Edit: config/agent-config.js (customize behavior)\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the demo
if (require.main === module) {
  const demo = new VoiceDemo();
  demo.runDemo().catch(console.error);
}

module.exports = VoiceDemo;
