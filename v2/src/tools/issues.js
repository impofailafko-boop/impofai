/**
 * Issue Logging Tool
 *
 * Allows the ElevenLabs agent to log issues/problems discovered
 * during conversations in real-time.
 */

/**
 * Log an issue reported by a worker
 * @param {Database} db - SQLite database instance
 * @param {Object} issueData - Issue details
 * @returns {Promise<string>} Issue ID
 */
export async function logIssue(db, issueData) {
  try {
    const {
      worker_id,
      issue_description,
      urgency = 'medium',
      location = null,
      equipment = null,
      sentiment = 'neutral',
      conversation_id = null
    } = issueData;

    // Validate required fields
    if (!worker_id || !issue_description) {
      throw new Error('worker_id and issue_description are required');
    }

    // Check if similar pattern already exists
    const existingPattern = db.prepare(`
      SELECT pattern_id, occurrence_count, affected_workers
      FROM patterns
      WHERE status = 'active'
        AND issue_description = ?
        AND (location = ? OR location IS NULL)
      LIMIT 1
    `).get(issue_description, location);

    let patternId;

    if (existingPattern) {
      // Update existing pattern
      patternId = existingPattern.pattern_id;

      // Add worker to affected workers if not already included
      const affectedWorkers = existingPattern.affected_workers
        ? JSON.parse(existingPattern.affected_workers)
        : [];

      if (!affectedWorkers.includes(worker_id)) {
        affectedWorkers.push(worker_id);
      }

      db.prepare(`
        UPDATE patterns
        SET
          occurrence_count = occurrence_count + 1,
          last_occurrence = CURRENT_TIMESTAMP,
          affected_workers = ?,
          urgency_level = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE pattern_id = ?
      `).run(
        JSON.stringify(affectedWorkers),
        urgency,
        patternId
      );

      console.log(`♻️  Updated existing pattern: ${patternId} (${existingPattern.occurrence_count + 1} occurrences)`);

    } else {
      // Create new pattern
      patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      db.prepare(`
        INSERT INTO patterns (
          pattern_id,
          pattern_type,
          issue_description,
          location,
          equipment,
          first_occurrence,
          last_occurrence,
          occurrence_count,
          affected_workers,
          urgency_level,
          sentiment_trend,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).run(
        patternId,
        'reported_issue',
        issue_description,
        location,
        equipment,
        JSON.stringify([worker_id]),
        urgency,
        sentiment
      );

      console.log(`✨ Created new pattern: ${patternId}`);
    }

    // Log the issue event (for audit trail)
    // Note: We could create an 'issue_events' table for this if needed

    return patternId;

  } catch (error) {
    console.error('Error logging issue:', error);
    throw error;
  }
}

/**
 * Get recent issues (helper function)
 * @param {Database} db - SQLite database instance
 * @param {number} limit - Number of issues to return
 */
export async function getRecentIssues(db, limit = 10) {
  try {
    const issues = db.prepare(`
      SELECT * FROM patterns
      WHERE status = 'active'
      ORDER BY last_occurrence DESC
      LIMIT ?
    `).all(limit);

    return issues.map(issue => ({
      id: issue.pattern_id,
      description: issue.issue_description,
      location: issue.location,
      urgency: issue.urgency_level,
      occurrence_count: issue.occurrence_count,
      affected_workers_count: issue.affected_workers
        ? JSON.parse(issue.affected_workers).length
        : 0,
      last_occurrence: issue.last_occurrence
    }));

  } catch (error) {
    console.error('Error getting recent issues:', error);
    throw error;
  }
}

export default logIssue;
