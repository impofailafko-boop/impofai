/**
 * Migration Runner
 * Run with: node v2/src/database/runMigrations.js
 */

import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { up as migration001 } from './migrations/001_add_junction_table.js';

dotenv.config();

async function runMigrations() {
  const dbPath = process.env.AGENTDB_PATH || './data/agentdb.sqlite';
  console.log(`🗄️  Running migrations on: ${dbPath}`);

  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  try {
    // Create migrations tracking table
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if migration already applied
    const applied = db.prepare('SELECT 1 FROM migrations WHERE name = ?').get('001_add_junction_table');

    if (applied) {
      console.log('ℹ️  Migration 001_add_junction_table already applied. Skipping.');
    } else {
      // Run migration
      migration001(db);

      // Record migration
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run('001_add_junction_table');

      console.log('✅ All migrations complete!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

runMigrations();
