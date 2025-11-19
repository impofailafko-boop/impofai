/**
 * AgentDB Initialization for ImpofAI V2
 *
 * Initializes AgentDB with learning components and creates custom tables for:
 * - Conversations (voice transcripts from ElevenLabs)
 * - Workers (employee profiles)
 * - Patterns (detected issues)
 * - Recommendations (ROI-backed suggestions)
 * - Knowledge Graph (entities + relationships)
 */

import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize AgentDB with learning system and custom tables
 * @returns {Promise<Object>} Initialized database and components
 */
export async function initializeAgentDB() {
  const dbPath = process.env.AGENTDB_PATH || './data/agentdb.sqlite';

  console.log(`🗄️  Initializing AgentDB at: ${dbPath}`);

  // Create SQLite database
  const db = new Database(dbPath, { verbose: console.log });

  // Enable WAL mode for better concurrency and crash recovery
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('wal_autocheckpoint = 1000');
  db.pragma('foreign_keys = ON');

  console.log('✅ SQLite database created with WAL mode');

  // Create custom tables
  await createCustomTables(db);

  console.log('✅ AgentDB initialized successfully');

  return { db };
}

/**
 * Create all custom tables for ImpofAI
 */
async function createCustomTables(db) {
  console.log('📋 Creating custom tables...');

  // 1. Conversations table - stores ElevenLabs call transcripts
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT UNIQUE NOT NULL,
      worker_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      started_at DATETIME NOT NULL,
      ended_at DATETIME,
      duration_seconds INTEGER,

      -- Transcript data (from ElevenLabs webhook)
      transcript TEXT NOT NULL, -- JSON array of turns
      audio_url TEXT,
      call_id TEXT, -- ElevenLabs call ID

      -- Analysis metadata
      topics TEXT, -- JSON array
      issues TEXT, -- JSON array
      sentiment TEXT,
      urgency TEXT,
      location TEXT,
      equipment_mentioned TEXT, -- JSON array
      people_mentioned TEXT, -- JSON array

      -- Conversation metrics
      worker_turns INTEGER DEFAULT 0,
      agent_turns INTEGER DEFAULT 0,
      information_completeness REAL DEFAULT 0.0,

      -- Learning flags
      processed_by_nightly BOOLEAN DEFAULT FALSE,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (worker_id) REFERENCES workers(worker_id)
    );

    CREATE INDEX IF NOT EXISTS idx_conversations_worker ON conversations(worker_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_date ON conversations(started_at);
    CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON conversations(sentiment);
    CREATE INDEX IF NOT EXISTS idx_conversations_urgency ON conversations(urgency);
    CREATE INDEX IF NOT EXISTS idx_conversations_processed ON conversations(processed_by_nightly);
    CREATE INDEX IF NOT EXISTS idx_conversations_location ON conversations(location);
  `);

  // 2. Workers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workers (
      worker_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone_number TEXT,
      email TEXT,

      -- Engagement metrics
      total_conversations INTEGER DEFAULT 0,
      last_conversation_at DATETIME,
      average_sentiment TEXT,

      -- Worker preferences
      preferred_language TEXT DEFAULT 'sk-SK',
      communication_style TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      active BOOLEAN DEFAULT TRUE
    );

    CREATE INDEX IF NOT EXISTS idx_workers_role ON workers(role);
    CREATE INDEX IF NOT EXISTS idx_workers_active ON workers(active);
  `);

  // 3. Patterns table - detected recurring issues
  db.exec(`
    CREATE TABLE IF NOT EXISTS patterns (
      pattern_id TEXT PRIMARY KEY,
      pattern_type TEXT NOT NULL,

      -- Pattern details
      issue_description TEXT NOT NULL,
      location TEXT,
      equipment TEXT,

      -- Occurrence data
      first_occurrence DATETIME NOT NULL,
      last_occurrence DATETIME NOT NULL,
      occurrence_count INTEGER DEFAULT 1,
      affected_workers TEXT, -- JSON array

      -- Impact metrics
      urgency_level TEXT,
      sentiment_trend TEXT,

      -- Business impact
      estimated_hours_lost_per_day REAL,
      estimated_daily_cost REAL,
      estimated_weekly_cost REAL,

      -- Status
      status TEXT DEFAULT 'active',
      resolved_at DATETIME,
      resolution_notes TEXT,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(pattern_type);
    CREATE INDEX IF NOT EXISTS idx_patterns_location ON patterns(location);
    CREATE INDEX IF NOT EXISTS idx_patterns_status ON patterns(status);
    CREATE INDEX IF NOT EXISTS idx_patterns_urgency ON patterns(urgency_level);
  `);

  // 3.5. Junction table for pattern-worker relationships (many-to-many)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pattern_workers (
      pattern_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      severity_at_report TEXT,
      first_mentioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_mentioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      mention_count INTEGER DEFAULT 1,

      PRIMARY KEY (pattern_id, worker_id),
      FOREIGN KEY (pattern_id) REFERENCES patterns(pattern_id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_pw_worker ON pattern_workers(worker_id);
    CREATE INDEX IF NOT EXISTS idx_pw_pattern ON pattern_workers(pattern_id);
    CREATE INDEX IF NOT EXISTS idx_pw_reported_at ON pattern_workers(reported_at);
  `);

  // 3.6. Issue mentions table (audit trail for every time an issue is mentioned)
  db.exec(`
    CREATE TABLE IF NOT EXISTS issue_mentions (
      mention_id TEXT PRIMARY KEY,
      pattern_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      conversation_id TEXT,
      mentioned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      exact_quote TEXT,
      severity TEXT,
      location TEXT,

      FOREIGN KEY (pattern_id) REFERENCES patterns(pattern_id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES workers(worker_id) ON DELETE CASCADE,
      FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_im_pattern ON issue_mentions(pattern_id);
    CREATE INDEX IF NOT EXISTS idx_im_worker ON issue_mentions(worker_id);
    CREATE INDEX IF NOT EXISTS idx_im_conversation ON issue_mentions(conversation_id);
  `);

  // 4. Recommendations table - ROI-backed suggestions
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      recommendation_id TEXT PRIMARY KEY,
      pattern_id TEXT,

      -- Recommendation content
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      recommended_action TEXT NOT NULL,

      -- Priority
      priority INTEGER NOT NULL,
      urgency TEXT NOT NULL,

      -- ROI calculation
      investment_required REAL,
      estimated_savings_per_day REAL,
      payback_period_days INTEGER,
      annual_roi_percentage REAL,

      -- Impact
      affected_workers_count INTEGER,
      affected_locations TEXT, -- JSON array
      business_impact_score REAL,

      -- Status
      status TEXT DEFAULT 'pending',
      approved_at DATETIME,
      approved_by TEXT,
      completed_at DATETIME,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (pattern_id) REFERENCES patterns(pattern_id)
    );

    CREATE INDEX IF NOT EXISTS idx_recommendations_pattern ON recommendations(pattern_id);
    CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);
    CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
    CREATE INDEX IF NOT EXISTS idx_recommendations_urgency ON recommendations(urgency);
  `);

  // 5. Knowledge Graph Entities
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_graph_entities (
      entity_id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      name TEXT NOT NULL,

      -- Graph metrics
      mention_count INTEGER DEFAULT 1,
      centrality_score REAL DEFAULT 0.0,

      -- Metadata
      first_mentioned DATETIME NOT NULL,
      last_mentioned DATETIME NOT NULL,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_kg_entities_type ON knowledge_graph_entities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_kg_entities_centrality ON knowledge_graph_entities(centrality_score);
  `);

  // 6. Knowledge Graph Relationships
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_graph_relationships (
      relationship_id TEXT PRIMARY KEY,
      source_entity_id TEXT NOT NULL,
      target_entity_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL,

      -- Relationship strength
      co_occurrence_count INTEGER DEFAULT 1,
      strength REAL DEFAULT 1.0,

      -- Temporal data
      first_observed DATETIME NOT NULL,
      last_observed DATETIME NOT NULL,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (source_entity_id) REFERENCES knowledge_graph_entities(entity_id),
      FOREIGN KEY (target_entity_id) REFERENCES knowledge_graph_entities(entity_id)
    );

    CREATE INDEX IF NOT EXISTS idx_kg_rel_source ON knowledge_graph_relationships(source_entity_id);
    CREATE INDEX IF NOT EXISTS idx_kg_rel_target ON knowledge_graph_relationships(target_entity_id);
    CREATE INDEX IF NOT EXISTS idx_kg_rel_type ON knowledge_graph_relationships(relationship_type);
  `);

  console.log('✅ Created 8 core tables with indexes (including junction tables)');
}

export { createCustomTables };
