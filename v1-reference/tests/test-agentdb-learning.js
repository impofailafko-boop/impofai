/**
 * AgentDB Learning Mode Exploration
 * Testing all learning-related features
 */

const {
  LearningSystem,
  NightlyLearner,
  ReasoningBank,
  ReflexionMemory,
  SkillLibrary,
  CausalMemoryGraph
} = require('agentdb');

console.log('🧠 AgentDB Learning Components Exploration\n');
console.log('='.repeat(60));

// 1. Learning System
console.log('\n📚 1. LearningSystem');
console.log('-'.repeat(60));
try {
  const learningSystem = new LearningSystem();
  console.log('✅ LearningSystem initialized');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(learningSystem)));
  console.log('Constructor params:', LearningSystem.length, 'arguments');
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Constructor info:', LearningSystem.toString().substring(0, 200));
}

// 2. Nightly Learner
console.log('\n🌙 2. NightlyLearner');
console.log('-'.repeat(60));
try {
  const nightlyLearner = new NightlyLearner();
  console.log('✅ NightlyLearner initialized');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(nightlyLearner)));
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Constructor info:', NightlyLearner.toString().substring(0, 200));
}

// 3. Reasoning Bank
console.log('\n🧮 3. ReasoningBank');
console.log('-'.repeat(60));
try {
  const reasoningBank = new ReasoningBank();
  console.log('✅ ReasoningBank initialized');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(reasoningBank)));
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Constructor info:', ReasoningBank.toString().substring(0, 200));
}

// 4. Reflexion Memory
console.log('\n🔄 4. ReflexionMemory');
console.log('-'.repeat(60));
try {
  const reflexion = new ReflexionMemory();
  console.log('✅ ReflexionMemory initialized');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(reflexion)));
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Constructor info:', ReflexionMemory.toString().substring(0, 200));
}

// 5. Skill Library
console.log('\n📖 5. SkillLibrary');
console.log('-'.repeat(60));
try {
  const skillLibrary = new SkillLibrary();
  console.log('✅ SkillLibrary initialized');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(skillLibrary)));
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Constructor info:', SkillLibrary.toString().substring(0, 200));
}

// 6. Causal Memory Graph
console.log('\n🔗 6. CausalMemoryGraph');
console.log('-'.repeat(60));
try {
  const causalGraph = new CausalMemoryGraph();
  console.log('✅ CausalMemoryGraph initialized');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(causalGraph)));
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('Constructor info:', CausalMemoryGraph.toString().substring(0, 200));
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 Summary of Learning Capabilities:\n');

console.log('1. LearningSystem - Main learning orchestrator');
console.log('2. NightlyLearner - Background learning/consolidation');
console.log('3. ReasoningBank - Pattern storage and retrieval');
console.log('4. ReflexionMemory - Self-critique and learning from mistakes');
console.log('5. SkillLibrary - Successful pattern consolidation');
console.log('6. CausalMemoryGraph - Cause-effect relationship mapping');

console.log('\n🎯 For Your Use Case (Company Intelligence):');
console.log('   - ReflexionMemory: AI learns better questions from conversations');
console.log('   - SkillLibrary: Stores successful interview patterns');
console.log('   - CausalMemoryGraph: Maps "Scanner breaks → Productivity loss"');
console.log('   - NightlyLearner: Consolidates daily insights overnight');
console.log('   - ReasoningBank: Fast pattern matching for recurring issues');
console.log('   - LearningSystem: Orchestrates all learning components');
