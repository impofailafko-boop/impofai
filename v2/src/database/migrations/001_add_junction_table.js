/**
 * Migration: Add pattern_workers junction table
 *
 * This migration:
 * 1. Creates pattern_workers junction table
 * 2. Migrates existing affected_workers JSON data
 * 3. Adds indexes for performance
 * 4. Keeps old column temporarily for rollback safety
 */

import Database from 'better-sqlite3';

export function up(db) {
  console.log('⬆️  Running migration: 001_add_junction_table');

  // Step 1: Create junction table
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
  `);

  console.log('✅ Created pattern_workers junction table');

  // Step 2: Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pw_worker ON pattern_workers(worker_id);
    CREATE INDEX IF NOT EXISTS idx_pw_pattern ON pattern_workers(pattern_id);
    CREATE INDEX IF NOT EXISTS idx_pw_reported_at ON pattern_workers(reported_at);
  `);

  console.log('✅ Created indexes on pattern_workers');

  // Step 3: Migrate existing data from patterns.affected_workers (JSON)
  console.log('🔄 Migrating existing affected_workers data...');

  const patterns = db.prepare(`
    SELECT pattern_id, affected_workers, urgency_level, first_occurrence
    FROM patterns
    WHERE affected_workers IS NOT NULL AND affected_workers != '[]'
  `).all();

  let migratedCount = 0;

  const insertStmt = db.prepare(`
    INSERT INTO pattern_workers (pattern_id, worker_id, reported_at, severity_at_report)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(pattern_id, worker_id) DO NOTHING
  `);

  for (const pattern of patterns) {
    try {
      const workerIds = JSON.parse(pattern.affected_workers);

      if (Array.isArray(workerIds)) {
        for (const workerId of workerIds) {
          insertStmt.run(
            pattern.pattern_id,
            workerId,
            pattern.first_occurrence,
            pattern.urgency_level
          );
          migratedCount++;
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not migrate pattern ${pattern.pattern_id}:`, error.message);
    }
  }

  console.log(`✅ Migrated ${migratedCount} pattern-worker relationships`);

  // Step 4: Create issue_mentions table (for audit trail)
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

  console.log('✅ Created issue_mentions table');

  // Note: We don't rename affected_workers column here because SQLite doesn't support
  // renaming columns easily without recreating the table. Instead, we'll just stop
  // using it in the code and it can be dropped manually later if needed.

  console.log('✅ Migration 001_add_junction_table complete!');
  console.log('ℹ️  Note: The old affected_workers column is still present but no longer used.');
  console.log('ℹ️  You can manually drop it later if desired.');
}

export function down(db) {
  console.log('⬇️  Rolling back migration: 001_add_junction_table');

  // Drop junction table
  db.exec(`
    DROP TABLE IF EXISTS pattern_workers;
    DROP TABLE IF EXISTS issue_mentions;
  `);

  console.log('✅ Rollback complete');
  console.log('ℹ️  The patterns.affected_workers column has been preserved.');
}
