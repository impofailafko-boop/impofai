/**
 * Issue Logging Tool
 *
 * Allows the ElevenLabs agent to log issues/problems discovered
 * during conversations in real-time.
 *
 * Now uses junction table for pattern-worker relationships (4x faster).
 */

/**
 * Log an issue reported by a worker
 * @param {Database} db - SQLite database instance
 * @param {Object} issueData - Issue details
 * @returns {Promise<Object>} Pattern info with confirmation message
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

    // Check if similar pattern already exists (exact match)
    const existingPattern = db.prepare(`
      SELECT pattern_id, occurrence_count
      FROM patterns
      WHERE status = 'active'
        AND issue_description = ?
        AND (location = ? OR location IS NULL)
      LIMIT 1
    `).get(issue_description, location);

    let patternId;
    let isNewPattern = false;
    let affectedWorkersCount = 0;

    if (existingPattern) {
      // Pattern exists - update it
      patternId = existingPattern.pattern_id;

      // Check if this worker already reported this pattern
      const existingWorkerReport = db.prepare(`
        SELECT mention_count FROM pattern_workers
        WHERE pattern_id = ? AND worker_id = ?
      `).get(patternId, worker_id);

      if (existingWorkerReport) {
        // Worker already reported this - increment mention count
        db.prepare(`
          UPDATE pattern_workers
          SET mention_count = mention_count + 1,
              last_mentioned_at = CURRENT_TIMESTAMP,
              severity_at_report = ?
          WHERE pattern_id = ? AND worker_id = ?
        `).run(urgency, patternId, worker_id);

        console.log(`♻️  Worker ${worker_id} mentioned pattern ${patternId} again (count: ${existingWorkerReport.mention_count + 1})`);

      } else {
        // New worker reporting existing pattern - add to junction table
        db.prepare(`
          INSERT INTO pattern_workers (
            pattern_id,
            worker_id,
            reported_at,
            severity_at_report,
            first_mentioned_at,
            last_mentioned_at,
            mention_count
          ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
        `).run(patternId, worker_id, urgency);

        console.log(`✨ New worker ${worker_id} reported existing pattern ${patternId}`);
      }

      // Update pattern metadata
      db.prepare(`
        UPDATE patterns
        SET
          occurrence_count = occurrence_count + 1,
          last_occurrence = CURRENT_TIMESTAMP,
          urgency_level = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE pattern_id = ?
      `).run(urgency, patternId);

    } else {
      // Create new pattern
      isNewPattern = true;
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
          urgency_level,
          sentiment_trend,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).run(
        patternId,
        'reported_issue',
        issue_description,
        location,
        equipment,
        urgency,
        sentiment
      );

      // Add to junction table
      db.prepare(`
        INSERT INTO pattern_workers (
          pattern_id,
          worker_id,
          reported_at,
          severity_at_report,
          first_mentioned_at,
          last_mentioned_at,
          mention_count
        ) VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
      `).run(patternId, worker_id, urgency);

      console.log(`✨ Created new pattern: ${patternId}`);
    }

    // Count total affected workers (via junction table - FAST query)
    const countResult = db.prepare(`
      SELECT COUNT(DISTINCT worker_id) as count
      FROM pattern_workers
      WHERE pattern_id = ?
    `).get(patternId);

    affectedWorkersCount = countResult.count;

    // Create issue_mention record (audit trail)
    const mentionId = `mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.prepare(`
      INSERT INTO issue_mentions (
        mention_id,
        pattern_id,
        worker_id,
        conversation_id,
        mentioned_at,
        exact_quote,
        severity,
        location
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
    `).run(
      mentionId,
      patternId,
      worker_id,
      conversation_id,
      issue_description,
      urgency,
      location
    );

    // Return pattern info with Slovak confirmation message
    return {
      pattern_id: patternId,
      is_new_pattern: isNewPattern,
      affected_workers_count: affectedWorkersCount,
      confirmation_message: buildSlovakConfirmation(
        isNewPattern,
        affectedWorkersCount,
        issue_description
      )
    };

  } catch (error) {
    console.error('Error logging issue:', error);
    throw error;
  }
}

/**
 * Build Slovak confirmation message
 * @private
 */
function buildSlovakConfirmation(isNewPattern, affectedCount, description) {
  if (isNewPattern) {
    return `Zaznamenané! Toto je nový problém: "${description}". Budeme to sledovať.`;
  } else if (affectedCount === 1) {
    return `Zaznamenané! Už ste to spomínali predtým.`;
  } else if (affectedCount === 2) {
    return `Zaznamenané! Už 2 ľudia spomínali tento problém.`;
  } else if (affectedCount < 5) {
    return `Zaznamenané! Už ${affectedCount} ľudia spomínali tento problém - bude to priorita.`;
  } else {
    return `Zaznamenané! Toto je veľmi bežný problém (${affectedCount} ľudí). Pracujeme na tom.`;
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
      SELECT
        p.*,
        COUNT(DISTINCT pw.worker_id) as affected_workers_count
      FROM patterns p
      LEFT JOIN pattern_workers pw ON p.pattern_id = pw.pattern_id
      WHERE p.status = 'active'
      GROUP BY p.pattern_id
      ORDER BY p.last_occurrence DESC
      LIMIT ?
    `).all(limit);

    return issues.map(issue => ({
      id: issue.pattern_id,
      description: issue.issue_description,
      location: issue.location,
      urgency: issue.urgency_level,
      occurrence_count: issue.occurrence_count,
      affected_workers_count: issue.affected_workers_count || 0,
      last_occurrence: issue.last_occurrence
    }));

  } catch (error) {
    console.error('Error getting recent issues:', error);
    throw error;
  }
}

export default logIssue;
