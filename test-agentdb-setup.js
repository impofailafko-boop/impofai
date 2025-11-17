/**
 * Test proper AgentDB setup with database connection
 */

const {
  createDatabase,
  LearningSystem,
  ReasoningBank,
  EmbeddingService
} = require('agentdb');

async function testProperSetup() {
  console.log('🔧 Testing AgentDB Proper Setup\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Create database
    console.log('\n1️⃣ Creating database...');
    const db = await createDatabase({
      filename: './learning-test.db'
    });
    console.log('✅ Database created');

    // Step 2: Create embedder
    console.log('\n2️⃣ Creating embedding service...');
    const embedder = new EmbeddingService({
      provider: 'local' // or 'openai' if you have API key
    });
    console.log('✅ Embedder created');

    // Step 3: Initialize LearningSystem
    console.log('\n3️⃣ Initializing LearningSystem...');
    const learningSystem = new LearningSystem(db, embedder);
    console.log('✅ LearningSystem initialized');
    console.log('   Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(learningSystem)).slice(0, 10));

    // Step 4: Initialize ReasoningBank
    console.log('\n4️⃣ Initializing ReasoningBank...');
    const reasoningBank = new ReasoningBank(db, embedder);
    console.log('✅ ReasoningBank initialized');
    console.log('   Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(reasoningBank)).slice(0, 10));

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ All components initialized successfully!');

    console.log('\n📋 Setup Summary:');
    console.log('   Database: learning-test.db');
    console.log('   Embedder: Local (no API key needed)');
    console.log('   LearningSystem: Ready ✅');
    console.log('   ReasoningBank: Ready ✅');

    return { db, embedder, learningSystem, reasoningBank };

  } catch (error) {
    console.log('\n❌ Error during setup:', error.message);
    console.log('\nStack:', error.stack);
    return null;
  }
}

// Test it
testProperSetup().then(result => {
  if (result) {
    console.log('\n🎯 Ready to use all AgentDB learning features!');
  } else {
    console.log('\n⚠️ Setup incomplete - check errors above');
  }
});
