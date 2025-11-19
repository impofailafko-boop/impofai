/**
 * Worker Context Tool
 *
 * Retrieves relevant context about a worker for the ElevenLabs agent
 * to use during conversations.
 */

/**
 * Get context about a worker
 * @param {Database} db - SQLite database instance
 * @param {string} workerId - Worker ID or phone number
 * @returns {Promise<Object>} Worker context
 */
export async function getWorkerContext(db, workerId) {
  try {
    // Get worker info
    const worker = db.prepare(`
      SELECT * FROM workers WHERE worker_id = ?
    `).get(workerId);

    // If worker doesn't exist, return basic context
    if (!worker) {
      return {
        is_new_worker: true,
        message: 'New worker - no previous context available',
        suggested_greeting: 'Ahoj! Vitajte v ImpofAI. Som váš AI asistent. Ako sa máte dnes?'
      };
    }

    // Get recent conversations
    const recentConversations = db.prepare(`
      SELECT
        conversation_id,
        started_at,
        topics,
        issues,
        sentiment
      FROM conversations
      WHERE worker_id = ?
      ORDER BY started_at DESC
      LIMIT 3
    `).all(workerId);

    // Get active patterns/issues related to this worker
    const activePatterns = db.prepare(`
      SELECT
        pattern_id,
        pattern_type,
        issue_description,
        location,
        urgency_level
      FROM patterns
      WHERE status = 'active'
        AND (affected_workers LIKE '%' || ? || '%' OR location = ?)
      ORDER BY urgency_level DESC
      LIMIT 5
    `).all(workerId, worker.location || '');

    // Build context object
    const context = {
      worker: {
        id: worker.worker_id,
        name: worker.name,
        role: worker.role,
        total_conversations: worker.total_conversations,
        last_conversation: worker.last_conversation_at,
        average_sentiment: worker.average_sentiment,
        preferred_language: worker.preferred_language
      },
      recent_conversations: recentConversations.map(conv => ({
        date: conv.started_at,
        topics: conv.topics ? JSON.parse(conv.topics) : [],
        sentiment: conv.sentiment
      })),
      active_issues: activePatterns.map(pattern => ({
        id: pattern.pattern_id,
        type: pattern.pattern_type,
        description: pattern.issue_description,
        location: pattern.location,
        urgency: pattern.urgency_level
      })),
      conversation_tips: generateConversationTips(worker, recentConversations, activePatterns)
    };

    return context;

  } catch (error) {
    console.error('Error getting worker context:', error);
    throw error;
  }
}

/**
 * Generate conversation tips based on worker history
 * @private
 */
function generateConversationTips(worker, recentConversations, activePatterns) {
  const tips = [];

  // New worker tip
  if (worker.total_conversations === 0) {
    tips.push('First conversation - build rapport and explain purpose');
  }

  // Returning worker tip
  if (worker.total_conversations > 0 && recentConversations.length > 0) {
    const lastConv = recentConversations[0];
    tips.push(`Follow up on topics from last conversation: ${lastConv.topics || 'general discussion'}`);
  }

  // Sentiment-based tips
  if (worker.average_sentiment === 'negative' || worker.average_sentiment === 'frustrated') {
    tips.push('Worker has shown frustration - be empathetic and solution-focused');
  }

  // Active issues tip
  if (activePatterns.length > 0) {
    tips.push(`Ask about known issues: ${activePatterns[0].issue_description}`);
  }

  // Role-specific tips
  if (worker.role) {
    tips.push(`Ask role-specific questions for: ${worker.role}`);
  }

  return tips;
}

export default getWorkerContext;
