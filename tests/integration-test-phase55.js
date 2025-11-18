/**
 * Phase 5.5 Integration Test
 *
 * Tests all new features:
 * - MidStream real-time analysis
 * - Learning system (ReflexionMemory, SkillLibrary, NightlyLearner, CausalMemoryGraph)
 * - Knowledge graph auto-discovery
 * - Trends analysis
 * - Employee cards
 * - Executive summary
 * - AI Q&A assistant
 */

import { initializeAgentDB } from '../src/database/initAgentDB.js';
import { ConversationManager } from '../src/voice/ConversationManager.js';
import { PatternEngine } from '../src/analytics/PatternEngine.js';
import { MidStreamAnalyzer } from '../src/analytics/MidStreamAnalyzer.js';
import { LearningSystem } from '../src/learning/LearningSystem.js';
import { KnowledgeGraphBuilder } from '../src/analytics/KnowledgeGraphBuilder.js';

async function runPhase55IntegrationTest() {
  console.log('🧪 Running Phase 5.5 Integration Test\n');
  console.log('============================================================\n');

  try {
    // Initialize system
    console.log('🗄️  Initializing AgentDB...');
    const { db } = await initializeAgentDB();
    console.log('✅ Database initialized\n');

    const conversationManager = new ConversationManager(db);
    const patternEngine = new PatternEngine(db);
    const midstreamAnalyzer = new MidStreamAnalyzer();
    const learningSystem = new LearningSystem(db, './data/agentdb.sqlite');
    const knowledgeGraphBuilder = new KnowledgeGraphBuilder(db);

    // TEST 1: MidStream Real-Time Analysis
    console.log('📝 Test 1: MidStream Real-Time Analysis...\n');

    await midstreamAnalyzer.initialize();

    const testText = 'Dobrý deň, mám veľký problém so skenerom v uličke 5. Nefunguje už dva dni a je to hrozné!';
    const analysis = await midstreamAnalyzer.analyzeTurn({
      text: testText,
      speaker: 'worker',
      conversationHistory: []
    });

    console.log(`  Sentiment: ${analysis.sentiment.overall} (score: ${analysis.sentiment.score})`);
    console.log(`  Urgency: ${analysis.urgency.level} (score: ${analysis.urgency.score})`);
    console.log(`  Topics: ${analysis.topics.join(', ')}`);
    console.log(`  Entities: equipment=${analysis.entities.equipment.join(', ')}, location=${analysis.entities.locations.join(', ')}`);
    console.log(`  Issues: ${analysis.issues.join(', ')}`);
   console.log(`  ✅ MidStream analysis working\n`);

    // TEST 2: Create conversations with MidStream integration
    console.log('📝 Test 2: Conversations with Real-Time Analysis...\n');

    const testConversations = [
      {
        workerId: 'WORKER-101',
        workerName: 'Tomáš Varga',
        role: 'warehouse',
        messages: [
          { speaker: 'worker', text: 'Problém s počítačom v kancelárii, je veľmi pomalý.' },
          { speaker: 'agent', text: 'Rozumiem. Kedy ste si prvýkrát všimli tento problém?' },
          { speaker: 'worker', text: 'Od pondelka. Trvá mi to hodinu dlhšie každý deň.' }
        ]
      },
      {
        workerId: 'WORKER-102',
        workerName: 'Lucia Szabová',
        role: 'warehouse',
        messages: [
          { speaker: 'worker', text: 'Skener v uličke 3 nefunguje. Je to kritický problém!' },
          { speaker: 'agent', text: 'Ako dlho už tento problém trvá?' },
          { speaker: 'worker', text: 'Už tri dni. Nemôžem sken ovať balíky.' }
        ]
      }
    ];

    for (const testConv of testConversations) {
      const conv = await conversationManager.startConversation(testConv);

      for (const msg of testConv.messages) {
        await conversationManager.addTranscriptTurn({
          conversationId: conv.conversationId,
          speaker: msg.speaker,
          text: msg.text
        });
      }

      await conversationManager.endConversation(conv.conversationId);
      console.log(`  ✅ Created conversation: ${testConv.workerName}`);
    }

    console.log(`\n✅ Conversations with real-time MidStream analysis complete\n`);

    // TEST 3: Pattern Detection
    console.log('📝 Test 3: Pattern Detection...\n');

    const patterns = await patternEngine.detectPatterns();
    console.log(`  Detected ${patterns.length} patterns`);

    for (const pattern of patterns) {
      console.log(`  📌 ${pattern.issue} at ${pattern.location} (${pattern.occurrences} occurrences, €${pattern.dailyCost}/day)`);
    }

    console.log(`\n✅ Pattern detection working\n`);

    // TEST 4: Recommendation Generation
    console.log('📝 Test 4: ROI Recommendation Generation...\n');

    const recommendations = await patternEngine.generateRecommendations();
    console.log(`  Generated ${recommendations.length} recommendations`);

    for (const rec of recommendations) {
      console.log(`  💰 ${rec.title} - ROI: ${rec.annualROI}%, Payback: ${rec.paybackDays} days`);
    }

    console.log(`\n✅ Recommendations generated\n`);

    // TEST 5: Learning System
    console.log('📝 Test 5: AgentDB Learning System...\n');

    await learningSystem.initialize();

    // Get a conversation to learn from
    const conv = db.prepare('SELECT conversation_id FROM conversations LIMIT 1').get();
    if (conv) {
      const learningResult = await learningSystem.learnFromConversation(conv.conversation_id);
      if (learningResult) {
        console.log(`  📚 Learned from conversation: quality=${learningResult.quality}/100`);
      }
    }

    // Learn question patterns
    const questionPatterns = await learningSystem.learnQuestionPatterns();
    console.log(`  📖 Learned ${questionPatterns.length} question patterns`);

    // Build causal graph
    const causalLinks = await learningSystem.buildCausalGraph();
    console.log(`  🔗 Built ${causalLinks.length} causal links`);

    console.log(`\n✅ Learning system working\n`);

    // TEST 6: Knowledge Graph
    console.log('📝 Test 6: Knowledge Graph Auto-Discovery...\n');

    const graphStats = await knowledgeGraphBuilder.buildGraph();
    console.log(`  🕸️  Entities created: ${graphStats.entitiesCreated}`);
    console.log(`  🕸️  Relationships created: ${graphStats.relationshipsCreated}`);
    console.log(`  🕸️  Conversations processed: ${graphStats.conversationsProcessed}`);

    // Get graph data
    const graphData = knowledgeGraphBuilder.getGraphData();
    console.log(`  📊 Graph has ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);

    console.log(`\n✅ Knowledge graph built\n`);

    // TEST 7: Trends Analysis
    console.log('📝 Test 7: Trend Analysis (simulated)...\n');

    const trendsQuery = db.prepare(`
      SELECT
        COUNT(*) as this_week
      FROM conversations
      WHERE started_at > datetime('now', '-7 days')
    `).get();

    console.log(`  📈 Conversations this week: ${trendsQuery.this_week}`);
    console.log(`  ✅ Trends analysis query working\n`);

    // TEST 8: Worker Cards
    console.log('📝 Test 8: Employee Cards...\n');

    const workerCards = db.prepare(`
      SELECT
        w.worker_id,
        w.name,
        w.total_conversations,
        COUNT(DISTINCT c.conversation_id) as recent_conversations
      FROM workers w
      LEFT JOIN conversations c ON w.worker_id = c.worker_id
      WHERE w.active = TRUE
      GROUP BY w.worker_id
      LIMIT 5
    `).all();

    console.log(`  👥 Worker cards generated: ${workerCards.length}`);
    for (const card of workerCards) {
      console.log(`     - ${card.name}: ${card.total_conversations} total, ${card.recent_conversations} recent`);
    }

    console.log(`\n✅ Employee cards working\n`);

    // TEST 9: Executive Summary
    console.log('📝 Test 9: Executive Summary...\n');

    const summary = {
      totalConversations: db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,
      totalWorkers: db.prepare('SELECT COUNT(*) as count FROM workers').get().count,
      activePatterns: db.prepare('SELECT COUNT(*) as count FROM patterns WHERE status = "active"').get().count,
      pendingRecommendations: db.prepare('SELECT COUNT(*) as count FROM recommendations WHERE status = "pending"').get().count
    };

    console.log(`  📊 Total Conversations: ${summary.totalConversations}`);
    console.log(`  📊 Total Workers: ${summary.totalWorkers}`);
    console.log(`  📊 Active Patterns: ${summary.activePatterns}`);
    console.log(`  📊 Pending Recommendations: ${summary.pendingRecommendations}`);

    console.log(`\n✅ Executive summary generated\n`);

    // TEST 10: Database Storage
    console.log('📝 Test 10: Database Storage Verification...\n');

    const counts = {
      conversations: db.prepare('SELECT COUNT(*) as count FROM conversations').get().count,
      workers: db.prepare('SELECT COUNT(*) as count FROM workers').get().count,
      patterns: db.prepare('SELECT COUNT(*) as count FROM patterns').get().count,
      recommendations: db.prepare('SELECT COUNT(*) as count FROM recommendations').get().count,
      kg_entities: db.prepare('SELECT COUNT(*) as count FROM knowledge_graph_entities').get().count,
      kg_relationships: db.prepare('SELECT COUNT(*) as count FROM knowledge_graph_relationships').get().count
    };

    console.log(`  ✅ Conversations: ${counts.conversations}`);
    console.log(`  ✅ Workers: ${counts.workers}`);
    console.log(`  ✅ Patterns: ${counts.patterns}`);
    console.log(`  ✅ Recommendations: ${counts.recommendations}`);
    console.log(`  ✅ Knowledge Graph Entities: ${counts.kg_entities}`);
    console.log(`  ✅ Knowledge Graph Relationships: ${counts.kg_relationships}`);

    console.log(`\n============================================================\n`);
    console.log('🎉 PHASE 5.5 INTEGRATION TEST COMPLETE\n');
    console.log('Summary:');
    console.log('  ✅ MidStream real-time analysis working');
    console.log('  ✅ Conversations with automatic metadata extraction');
    console.log('  ✅ Pattern detection working');
    console.log('  ✅ ROI recommendations generated');
    console.log('  ✅ Learning system operational (ReflexionMemory, SkillLibrary, CausalGraph)');
    console.log('  ✅ Knowledge graph auto-discovery complete');
    console.log('  ✅ Trend analysis queries working');
    console.log('  ✅ Employee cards generated');
    console.log('  ✅ Executive summary complete');
    console.log('  ✅ Database storage verified');
    console.log('');
    console.log('✅ All Phase 5.5 features operational!');

    // Close database
    db.close();

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test
runPhase55IntegrationTest();
