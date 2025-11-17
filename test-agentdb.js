/**
 * AgentDB Test Script
 * Tests basic AgentDB functionality for voice agent memory
 */

console.log('🧪 Starting AgentDB Test...\n');

// Test 1: Install and import AgentDB
async function testInstallation() {
  console.log('📦 Test 1: Checking AgentDB installation...');
  try {
    const agentdb = require('agentdb');
    console.log('✅ AgentDB imported successfully');
    return agentdb;
  } catch (error) {
    console.log('❌ AgentDB not installed');
    console.log('   Run: npm install agentdb');
    return null;
  }
}

// Test 2: Initialize database
async function testInitialization(agentdb) {
  console.log('\n🔧 Test 2: Initializing AgentDB...');
  try {
    // Initialize with SQLite backend
    const db = await agentdb.init({
      storage: 'sqlite',
      path: './test-memory.db',
      embedding: 'openai' // or 'local' for offline
    });
    console.log('✅ Database initialized');
    return db;
  } catch (error) {
    console.log('❌ Initialization failed:', error.message);
    return null;
  }
}

// Test 3: Store a conversation transcript
async function testStoreTranscript(db) {
  console.log('\n💾 Test 3: Storing conversation transcript...');
  try {
    const transcript = {
      workerId: 'WORKER-123',
      workerName: 'John Doe',
      role: 'warehouse',
      conversation: [
        { speaker: 'worker', text: 'The scanner in aisle 5 is broken again', timestamp: new Date() },
        { speaker: 'agent', text: 'I understand. When did you first notice the problem?', timestamp: new Date() },
        { speaker: 'worker', text: 'This morning around 8am. Same issue as last week', timestamp: new Date() }
      ],
      metadata: {
        sessionId: 'session-001',
        duration: 180,
        issuesDetected: ['equipment_failure'],
        location: 'Warehouse A'
      }
    };

    const memoryId = await db.store({
      type: 'transcript',
      content: JSON.stringify(transcript),
      tags: ['warehouse', 'equipment', 'scanner', 'issue'],
      metadata: transcript.metadata
    });

    console.log('✅ Transcript stored with ID:', memoryId);
    return memoryId;
  } catch (error) {
    console.log('❌ Storage failed:', error.message);
    return null;
  }
}

// Test 4: Store worker profile
async function testStoreProfile(db) {
  console.log('\n👤 Test 4: Storing worker profile...');
  try {
    const profile = {
      workerId: 'WORKER-123',
      name: 'John Doe',
      role: 'warehouse',
      location: 'Warehouse A',
      shift: 'morning',
      preferences: {
        language: 'slovak',
        voiceSpeed: 'normal'
      },
      history: {
        totalCalls: 5,
        commonIssues: ['scanner problems', 'inventory discrepancies'],
        lastCall: new Date()
      }
    };

    const profileId = await db.store({
      type: 'worker_profile',
      content: JSON.stringify(profile),
      tags: ['profile', 'worker-123', 'warehouse'],
      metadata: { workerId: profile.workerId }
    });

    console.log('✅ Worker profile stored with ID:', profileId);
    return profileId;
  } catch (error) {
    console.log('❌ Profile storage failed:', error.message);
    return null;
  }
}

// Test 5: Semantic search
async function testSemanticSearch(db) {
  console.log('\n🔍 Test 5: Testing semantic search...');
  try {
    // Search for equipment issues
    const results = await db.search({
      query: 'broken equipment problems',
      limit: 5,
      type: 'transcript'
    });

    console.log('✅ Search completed, found', results.length, 'results');
    if (results.length > 0) {
      console.log('   Top result:', results[0].metadata?.sessionId || 'no session id');
    }
    return results;
  } catch (error) {
    console.log('❌ Search failed:', error.message);
    return [];
  }
}

// Test 6: Retrieve worker context
async function testRetrieveContext(db) {
  console.log('\n📥 Test 6: Retrieving worker context...');
  try {
    const context = await db.query({
      filter: {
        'metadata.workerId': 'WORKER-123'
      },
      limit: 10
    });

    console.log('✅ Retrieved', context.length, 'memories for WORKER-123');
    return context;
  } catch (error) {
    console.log('❌ Context retrieval failed:', error.message);
    return [];
  }
}

// Test 7: Pattern detection simulation
async function testPatternDetection(db) {
  console.log('\n📊 Test 7: Simulating pattern detection...');
  try {
    // Store multiple similar issues
    const issues = [
      'Scanner B in warehouse is not working',
      'The scanner at loading dock broken',
      'Scanner malfunction in receiving area'
    ];

    for (const issue of issues) {
      await db.store({
        type: 'issue',
        content: issue,
        tags: ['equipment', 'scanner', 'issue'],
        metadata: { timestamp: new Date(), location: 'Warehouse A' }
      });
    }

    // Search for pattern
    const pattern = await db.search({
      query: 'scanner problems',
      limit: 10,
      type: 'issue'
    });

    console.log('✅ Pattern detected: Scanner issues appearing', pattern.length, 'times');
    return pattern;
  } catch (error) {
    console.log('❌ Pattern detection failed:', error.message);
    return [];
  }
}

// Run all tests
async function runTests() {
  const agentdb = await testInstallation();
  if (!agentdb) {
    console.log('\n❌ Tests aborted: AgentDB not available');
    console.log('\n📝 To install AgentDB:');
    console.log('   npm install agentdb');
    return;
  }

  const db = await testInitialization(agentdb);
  if (!db) {
    console.log('\n❌ Tests aborted: Could not initialize database');
    return;
  }

  await testStoreTranscript(db);
  await testStoreProfile(db);
  await testSemanticSearch(db);
  await testRetrieveContext(db);
  await testPatternDetection(db);

  console.log('\n\n✨ All tests completed!');
  console.log('\n📊 Database location: ./test-memory.db');
  console.log('   You can inspect this file with SQLite browser');
}

// Execute tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
