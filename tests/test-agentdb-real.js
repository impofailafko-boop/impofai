/**
 * AgentDB Real API Test
 * Testing actual AgentDB functionality based on real exports
 */

const {
  createDatabase,
  ReflexionMemory,
  SkillLibrary,
  CausalMemoryGraph,
  NightlyLearner,
  MMRDiversityRanker,
  EmbeddingService
} = require('agentdb');

console.log('🧪 AgentDB Real API Test\n');

async function testDatabase() {
  console.log('📦 Test 1: Creating database...');
  try {
    const db = await createDatabase({
      filename: './test-voice-memory.db',
      verbose: console.log
    });
    console.log('✅ Database created successfully');
    return db;
  } catch (error) {
    console.log('❌ Database creation failed:', error.message);
    return null;
  }
}

async function testReflexionMemory() {
  console.log('\n🧠 Test 2: Testing Reflexion Memory (self-critique)...');
  try {
    const reflexion = new ReflexionMemory({
      dbPath: './test-voice-memory.db'
    });

    // Store a conversation with reflection
    await reflexion.store({
      content: 'Worker reported scanner issue in Warehouse A',
      reflection: 'Should follow up about scanner maintenance schedule',
      critique: 'Need more details about scanner model and error code'
    });

    console.log('✅ Reflexion memory stored');
    return reflexion;
  } catch (error) {
    console.log('❌ Reflexion memory failed:', error.message);
    console.log('   Error details:', error);
    return null;
  }
}

async function testSkillLibrary() {
  console.log('\n📚 Test 3: Testing Skill Library (semantic search)...');
  try {
    const skills = new SkillLibrary({
      dbPath: './test-voice-memory.db'
    });

    // Add conversation handling skills
    await skills.addSkill({
      name: 'detect_equipment_issue',
      description: 'Detect when worker mentions equipment problems',
      examples: [
        'scanner is broken',
        'machine not working',
        'equipment malfunction'
      ]
    });

    await skills.addSkill({
      name: 'detect_supply_shortage',
      description: 'Detect when worker mentions supply issues',
      examples: [
        'running out of materials',
        'need more supplies',
        'inventory low'
      ]
    });

    // Search for relevant skill
    const matches = await skills.search('the printer is broken');
    console.log('✅ Skill library working, found', matches?.length || 0, 'matches');

    return skills;
  } catch (error) {
    console.log('❌ Skill library failed:', error.message);
    console.log('   Error details:', error);
    return null;
  }
}

async function testCausalMemory() {
  console.log('\n🔗 Test 4: Testing Causal Memory Graph...');
  try {
    const causal = new CausalMemoryGraph({
      dbPath: './test-voice-memory.db'
    });

    // Store causal relationships
    await causal.addCausalLink({
      cause: 'Scanner malfunction reported',
      effect: 'Productivity decreased in warehouse',
      strength: 0.85,
      context: 'Warehouse A, Morning shift'
    });

    console.log('✅ Causal memory graph created');
    return causal;
  } catch (error) {
    console.log('❌ Causal memory failed:', error.message);
    console.log('   Error details:', error);
    return null;
  }
}

async function testEmbeddings() {
  console.log('\n🎯 Test 5: Testing Embedding Service...');
  try {
    const embeddings = new EmbeddingService({
      provider: 'local' // Use local embeddings, no API key needed
    });

    const vector = await embeddings.embed('Scanner broken in warehouse');
    console.log('✅ Embedding generated, dimension:', vector?.length || 'unknown');

    return embeddings;
  } catch (error) {
    console.log('❌ Embedding service failed:', error.message);
    console.log('   This might need OpenAI API key or local model');
    return null;
  }
}

// Simplified test for just database creation
async function simpleTest() {
  console.log('📦 Simple Test: Basic database operations...\n');

  try {
    // Create database
    const Database = require('better-sqlite3');
    const db = new Database('./simple-test.db');

    // Create a simple table for transcripts
    db.exec(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert a test transcript
    const insert = db.prepare('INSERT INTO transcripts (worker_id, content, metadata) VALUES (?, ?, ?)');
    const info = insert.run(
      'WORKER-123',
      'Scanner is broken in aisle 5',
      JSON.stringify({ location: 'Warehouse A', issue_type: 'equipment' })
    );

    console.log('✅ Inserted transcript with ID:', info.lastInsertRowid);

    // Retrieve it
    const select = db.prepare('SELECT * FROM transcripts WHERE worker_id = ?');
    const transcript = select.get('WORKER-123');

    console.log('✅ Retrieved transcript:', {
      id: transcript.id,
      worker: transcript.worker_id,
      preview: transcript.content.substring(0, 30) + '...'
    });

    // Create worker profiles table
    db.exec(`
      CREATE TABLE IF NOT EXISTS worker_profiles (
        worker_id TEXT PRIMARY KEY,
        name TEXT,
        role TEXT,
        metadata TEXT,
        last_contact DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert worker profile
    const insertProfile = db.prepare('INSERT OR REPLACE INTO worker_profiles (worker_id, name, role, metadata) VALUES (?, ?, ?, ?)');
    insertProfile.run(
      'WORKER-123',
      'John Doe',
      'warehouse',
      JSON.stringify({ location: 'Warehouse A', shift: 'morning', total_calls: 5 })
    );

    console.log('✅ Worker profile created');

    // Count transcripts
    const count = db.prepare('SELECT COUNT(*) as total FROM transcripts').get();
    console.log('✅ Total transcripts:', count.total);

    db.close();

    console.log('\n✨ Simple database test completed successfully!');
    console.log('📊 Database file: ./simple-test.db');

    return true;

  } catch (error) {
    console.log('❌ Simple test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🎯 Running comprehensive tests...\n');
  console.log('=' .repeat(50));

  // Run simple test first
  const simpleSuccess = await simpleTest();

  console.log('\n' + '='.repeat(50));
  console.log('\n🔬 Advanced AgentDB features test...\n');

  const db = await testDatabase();

  // Try advanced features (might fail without proper setup)
  await testReflexionMemory();
  await testSkillLibrary();
  await testCausalMemory();
  await testEmbeddings();

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 Test Summary:');
  console.log('   ✅ Basic SQLite: ' + (simpleSuccess ? 'WORKING' : 'FAILED'));
  console.log('   📦 AgentDB installed: YES');
  console.log('   🧠 Advanced features: Need configuration');
  console.log('\n💡 Next Steps:');
  console.log('   1. Configure OpenAI API key for embeddings');
  console.log('   2. Set up proper AgentDB initialization');
  console.log('   3. Integrate with voice agent');
  console.log('   4. Test with real conversations');
}

runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
