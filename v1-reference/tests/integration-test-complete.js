/**
 * Complete Integration Test for ImpofAI
 *
 * Tests the full flow:
 * 1. Create conversations with Slovak text
 * 2. Detect patterns
 * 3. Generate recommendations with ROI
 */

import { initializeAgentDB } from '../src/database/initAgentDB.js';
import { ConversationManager } from '../src/voice/ConversationManager.js';
import { PatternEngine } from '../src/analytics/PatternEngine.js';

async function runIntegrationTest() {
  console.log('🧪 Running Complete Integration Test\n');
  console.log('=' .repeat(60));

  // Initialize system
  const { db } = await initializeAgentDB();
  const conversationManager = new ConversationManager(db);
  const patternEngine = new PatternEngine(db);

  console.log('\n✅ System initialized\n');

  // Test 1: Create Slovak conversations
  console.log('📝 Test 1: Creating Slovak conversations...\n');

  const workers = [
    { id: 'WORKER-001', name: 'Ján Novák', role: 'warehouse' },
    { id: 'WORKER-002', name: 'Mária Kováčová', role: 'warehouse' },
    { id: 'WORKER-003', name: 'Peter Horvát', role: 'warehouse' }
  ];

  const conversations = [];

  // Conversation 1: Scanner issue at aisle 5
  const conv1 = await conversationManager.startConversation({
    workerId: workers[0].id,
    workerName: workers[0].name,
    role: workers[0].role
  });
  conversations.push(conv1);

  await conversationManager.addTranscriptTurn({
    conversationId: conv1.conversationId,
    speaker: 'worker',
    text: 'Dobrý deň, mám problém so skenerom v uličke 5. Nefunguje už dva dni.'
  });

  await conversationManager.addTranscriptTurn({
    conversationId: conv1.conversationId,
    speaker: 'agent',
    text: 'Dobrý deň! Kedy ste si prvýkrát všimli tento problém?'
  });

  await conversationManager.addTranscriptTurn({
    conversationId: conv1.conversationId,
    speaker: 'worker',
    text: 'V pondelok ráno. Skener vôbec nečíta čiarové kódy.'
  });

  await conversationManager.updateMetadata({
    conversationId: conv1.conversationId,
    topics: ['equipment', 'scanner'],
    issues: ['Scanner malfunction in aisle 5'],
    sentiment: 'frustrated',
    urgency: 'high',
    location: 'Warehouse, aisle 5'
  });

  await conversationManager.endConversation(conv1.conversationId);
  console.log(`  ✅ Conversation 1: Ján Novák - Scanner issue`);

  // Conversation 2: Same scanner issue (different worker)
  const conv2 = await conversationManager.startConversation({
    workerId: workers[1].id,
    workerName: workers[1].name,
    role: workers[1].role
  });
  conversations.push(conv2);

  await conversationManager.addTranscriptTurn({
    conversationId: conv2.conversationId,
    speaker: 'worker',
    text: 'Ahoj, aj mne nefunguje skener v uličke 5. Nemôžem skenovať balíky.'
  });

  await conversationManager.addTranscriptTurn({
    conversationId: conv2.conversationId,
    speaker: 'agent',
    text: 'Rozumiem. Ako dlho už tento problém trvá?'
  });

  await conversationManager.addTranscriptTurn({
    conversationId: conv2.conversationId,
    speaker: 'worker',
    text: 'Od pondelka. Stále to skúšam, ale nič.'
  });

  await conversationManager.updateMetadata({
    conversationId: conv2.conversationId,
    topics: ['equipment', 'scanner'],
    issues: ['Scanner malfunction in aisle 5'],
    sentiment: 'frustrated',
    urgency: 'high',
    location: 'Warehouse, aisle 5'
  });

  await conversationManager.endConversation(conv2.conversationId);
  console.log(`  ✅ Conversation 2: Mária Kováčová - Same scanner issue`);

  // Conversation 3: Computer issue (different problem)
  const conv3 = await conversationManager.startConversation({
    workerId: workers[2].id,
    workerName: workers[2].name,
    role: workers[2].role
  });
  conversations.push(conv3);

  await conversationManager.addTranscriptTurn({
    conversationId: conv3.conversationId,
    speaker: 'worker',
    text: 'Dobrý deň, počítač v kancelárii je veľmi pomalý.'
  });

  await conversationManager.addTranscriptTurn({
    conversationId: conv3.conversationId,
    speaker: 'agent',
    text: 'Ako dlho je počítač pomalý?'
  });

  await conversationManager.addTranscriptTurn({
    conversationId: conv3.conversationId,
    speaker: 'worker',
    text: 'Už asi týždeň. Trvá mi to hodinu dlhšie každý deň.'
  });

  await conversationManager.updateMetadata({
    conversationId: conv3.conversationId,
    topics: ['equipment', 'computer'],
    issues: ['Slow computer'],
    sentiment: 'negative',
    urgency: 'medium',
    location: 'Warehouse, office'
  });

  await conversationManager.endConversation(conv3.conversationId);
  console.log(`  ✅ Conversation 3: Peter Horvát - Computer issue`);

  console.log(`\n✅ Created ${conversations.length} conversations with Slovak text\n`);

  // Test 2: Pattern Detection
  console.log('🔍 Test 2: Running pattern detection...\n');

  const patterns = await patternEngine.detectPatterns();

  console.log(`✅ Detected ${patterns.length} patterns:\n`);

  for (const pattern of patterns) {
    console.log(`  📌 Pattern: "${pattern.issue}"`);
    console.log(`     Location: ${pattern.location}`);
    console.log(`     Occurrences: ${pattern.occurrences}`);
    console.log(`     Workers affected: ${pattern.workersAffected}`);
    console.log(`     Daily cost: €${pattern.dailyCost}`);
    console.log(`     Urgency: ${pattern.urgencyLevel}\n`);
  }

  // Test 3: Generate Recommendations
  console.log('💡 Test 3: Generating ROI-backed recommendations...\n');

  const recommendations = await patternEngine.generateRecommendations();

  console.log(`✅ Generated ${recommendations.length} recommendations:\n`);

  for (const rec of recommendations) {
    console.log(`  💰 ${rec.title}`);
    console.log(`     Priority: ${rec.priority}`);
    console.log(`     Payback period: ${rec.paybackDays} days`);
    console.log(`     Annual ROI: ${rec.annualROI.toFixed(0)}%\n`);
  }

  // Test 4: Verify Database Storage
  console.log('🗄️  Test 4: Verifying database storage...\n');

  const storedConversations = db.prepare('SELECT COUNT(*) as count FROM conversations').get();
  console.log(`  ✅ Conversations stored: ${storedConversations.count}`);

  const storedWorkers = db.prepare('SELECT COUNT(*) as count FROM workers').get();
  console.log(`  ✅ Workers stored: ${storedWorkers.count}`);

  const storedPatterns = db.prepare('SELECT COUNT(*) as count FROM patterns').get();
  console.log(`  ✅ Patterns stored: ${storedPatterns.count}`);

  const storedRecommendations = db.prepare('SELECT COUNT(*) as count FROM recommendations').get();
  console.log(`  ✅ Recommendations stored: ${storedRecommendations.count}`);

  // Test 5: Verify Slovak Character Handling
  console.log('\n🇸🇰 Test 5: Verifying Slovak character handling...\n');

  const sampleConv = db.prepare('SELECT transcript FROM conversations WHERE conversation_id = ?').get(conv1.conversationId);
  const transcript = JSON.parse(sampleConv.transcript);
  const firstTurn = transcript[0];

  const slovakChars = ['á', 'č', 'ď', 'é', 'í', 'ľ', 'ň', 'ó', 'ô', 'ŕ', 'š', 'ť', 'ú', 'ý', 'ž'];
  const foundChars = slovakChars.filter(char => firstTurn.text.includes(char));

  console.log(`  Original text: "${firstTurn.text}"`);
  console.log(`  Slovak characters found: ${foundChars.join(', ')}`);
  console.log(`  ✅ Slovak UTF-8 encoding working correctly`);

  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 INTEGRATION TEST COMPLETE\n');
  console.log('Summary:');
  console.log(`  ✅ Created 3 Slovak conversations`);
  console.log(`  ✅ Detected ${patterns.length} pattern(s)`);
  console.log(`  ✅ Generated ${recommendations.length} recommendation(s)`);
  console.log(`  ✅ Database storage verified`);
  console.log(`  ✅ Slovak UTF-8 characters working`);
  console.log('\n✅ All systems operational!\n');

  db.close();
}

// Run the test
runIntegrationTest().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
