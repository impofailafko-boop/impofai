/**
 * Pattern Detection Engine for ImpofAI
 *
 * Detects recurring issues from Slovak conversations and generates
 * ROI-backed recommendations
 */

import { randomUUID } from 'crypto';

export class PatternEngine {
  constructor(db) {
    this.db = db;
  }

  /**
   * Detect patterns from recent conversations
   * Groups similar issues by location and type
   */
  async detectPatterns() {
    console.log('🔍 Running pattern detection...');

    // Get unprocessed conversations
    const stmt = this.db.prepare(`
      SELECT conversation_id, worker_id, issues, location, equipment_mentioned,
             sentiment, urgency, started_at
      FROM conversations
      WHERE processed_by_nightly = FALSE
        AND issues IS NOT NULL
        AND ended_at IS NOT NULL
    `);

    const conversations = stmt.all();

    if (conversations.length === 0) {
      console.log('No new conversations to process');
      return [];
    }

    console.log(`Processing ${conversations.length} conversations...`);

    // Group by issue + location
    const issueGroups = new Map();

    for (const conv of conversations) {
      const issues = JSON.parse(conv.issues || '[]');
      const location = conv.location || 'Unknown';

      for (const issue of issues) {
        const key = `${issue}|${location}`;

        if (!issueGroups.has(key)) {
          issueGroups.set(key, {
            issue,
            location,
            conversations: [],
            workers: new Set(),
            urgencies: [],
            sentiments: []
          });
        }

        const group = issueGroups.get(key);
        group.conversations.push(conv);
        group.workers.add(conv.worker_id);
        if (conv.urgency) group.urgencies.push(conv.urgency);
        if (conv.sentiment) group.sentiments.push(conv.sentiment);
      }
    }

    // Create patterns for recurring issues (2+ occurrences)
    const patterns = [];

    for (const [key, group] of issueGroups.entries()) {
      if (group.conversations.length >= 2) {
        console.log(`✅ Pattern detected: "${group.issue}" at ${group.location} (${group.workers.size} workers)`);

        const pattern = await this.createPattern(group);
        patterns.push(pattern);
      }
    }

    // Mark conversations as processed
    const updateStmt = this.db.prepare(`
      UPDATE conversations
      SET processed_by_nightly = TRUE
      WHERE conversation_id = ?
    `);

    for (const conv of conversations) {
      updateStmt.run(conv.conversation_id);
    }

    console.log(`✅ Detected ${patterns.length} patterns`);
    return patterns;
  }

  /**
   * Create or update pattern in database
   */
  async createPattern(group) {
    const patternId = randomUUID();
    const now = new Date().toISOString();

    // Calculate impact metrics
    const avgWorkersAffected = group.workers.size;
    const hoursLostPerDay = avgWorkersAffected * 2; // Estimate: 2 hours per worker
    const costPerHour = 30; // €30/hour average
    const dailyCost = hoursLostPerDay * costPerHour;
    const weeklyCost = dailyCost * 5;

    // Determine urgency level
    const urgencyLevel = this.calculateUrgencyLevel(group.urgencies);

    const stmt = this.db.prepare(`
      INSERT INTO patterns (
        pattern_id, pattern_type, issue_description, location,
        first_occurrence, last_occurrence, occurrence_count,
        affected_workers, urgency_level, sentiment_trend,
        estimated_hours_lost_per_day, estimated_daily_cost,
        estimated_weekly_cost, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      patternId,
      'issue_cluster',
      group.issue,
      group.location,
      group.conversations[0].started_at,
      group.conversations[group.conversations.length - 1].started_at,
      group.conversations.length,
      JSON.stringify(Array.from(group.workers)),
      urgencyLevel,
      this.calculateSentimentTrend(group.sentiments),
      hoursLostPerDay,
      dailyCost,
      weeklyCost,
      'active',
      now,
      now
    );

    return {
      patternId,
      issue: group.issue,
      location: group.location,
      occurrences: group.conversations.length,
      workersAffected: group.workers.size,
      dailyCost,
      urgencyLevel
    };
  }

  /**
   * Generate recommendations from patterns
   */
  async generateRecommendations() {
    console.log('💡 Generating recommendations...');

    const stmt = this.db.prepare(`
      SELECT * FROM patterns
      WHERE status = 'active'
      ORDER BY estimated_daily_cost DESC
    `);

    const patterns = stmt.all();
    const recommendations = [];

    for (const pattern of patterns) {
      const recommendation = await this.createRecommendation(pattern);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    console.log(`✅ Generated ${recommendations.length} recommendations`);
    return recommendations;
  }

  /**
   * Create recommendation from pattern
   */
  async createRecommendation(pattern) {
    const recommendationId = randomUUID();

    // Generate recommendation based on issue type
    const { title, description, action, investment } = this.generateRecommendationContent(pattern);

    // Calculate ROI
    const dailySavings = pattern.estimated_daily_cost;
    const paybackDays = Math.ceil(investment / dailySavings);
    const annualROI = ((dailySavings * 365 - investment) / investment) * 100;

    // Calculate priority (1 = highest, 10 = lowest)
    const priority = this.calculatePriority(pattern, paybackDays);

    // Determine urgency
    const urgency = paybackDays <= 7 ? 'immediate' :
                    paybackDays <= 30 ? 'this_week' :
                    paybackDays <= 90 ? 'this_month' : 'long_term';

    const stmt = this.db.prepare(`
      INSERT INTO recommendations (
        recommendation_id, pattern_id, title, description,
        recommended_action, priority, urgency,
        investment_required, estimated_savings_per_day,
        payback_period_days, annual_roi_percentage,
        affected_workers_count, affected_locations,
        business_impact_score, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const affectedWorkers = JSON.parse(pattern.affected_workers || '[]');
    const businessImpactScore = this.calculateBusinessImpact(pattern, paybackDays);

    stmt.run(
      recommendationId,
      pattern.pattern_id,
      title,
      description,
      action,
      priority,
      urgency,
      investment,
      dailySavings,
      paybackDays,
      annualROI,
      affectedWorkers.length,
      JSON.stringify([pattern.location]),
      businessImpactScore,
      'pending',
      new Date().toISOString(),
      new Date().toISOString()
    );

    console.log(`  📌 ${title} - ROI: ${annualROI.toFixed(0)}% (${paybackDays} day payback)`);

    return {
      recommendationId,
      title,
      paybackDays,
      annualROI,
      priority
    };
  }

  /**
   * Generate recommendation content based on pattern
   */
  generateRecommendationContent(pattern) {
    const issue = pattern.issue_description.toLowerCase();

    // Equipment issues
    if (issue.includes('skener') || issue.includes('scanner')) {
      return {
        title: 'Replace malfunctioning scanner',
        description: `Scanner at ${pattern.location} is causing productivity loss for ${JSON.parse(pattern.affected_workers).length} workers.`,
        action: 'Purchase and install new barcode scanner',
        investment: 300 // €300 for scanner
      };
    }

    if (issue.includes('počítač') || issue.includes('computer')) {
      return {
        title: 'Upgrade slow computer',
        description: `Computer issues at ${pattern.location} affecting ${JSON.parse(pattern.affected_workers).length} workers.`,
        action: 'Upgrade computer hardware or replace unit',
        investment: 800
      };
    }

    // Safety issues
    if (issue.includes('bezpečnost') || issue.includes('safety') || issue.includes('nebezpečenstvo')) {
      return {
        title: 'Address safety concern',
        description: `Safety issue reported at ${pattern.location} by multiple workers.`,
        action: 'Conduct safety audit and implement fixes immediately',
        investment: 500
      };
    }

    // Generic recommendation
    return {
      title: `Resolve issue: ${pattern.issue_description}`,
      description: `Recurring issue at ${pattern.location} affecting ${JSON.parse(pattern.affected_workers).length} workers.`,
      action: 'Investigate and resolve the reported issue',
      investment: pattern.estimated_daily_cost * 5 // 5 days of cost
    };
  }

  /**
   * Calculate urgency level from multiple reports
   */
  calculateUrgencyLevel(urgencies) {
    if (urgencies.length === 0) return 'medium';

    const urgencyScores = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };

    const avgScore = urgencies.reduce((sum, u) => sum + (urgencyScores[u] || 2), 0) / urgencies.length;

    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate sentiment trend
   */
  calculateSentimentTrend(sentiments) {
    if (sentiments.length === 0) return 'stable';

    const negativeCount = sentiments.filter(s =>
      s === 'negative' || s === 'frustrated' || s === 'urgent'
    ).length;

    const ratio = negativeCount / sentiments.length;

    if (ratio >= 0.7) return 'worsening';
    if (ratio <= 0.3) return 'improving';
    return 'stable';
  }

  /**
   * Calculate priority (1 = highest, 10 = lowest)
   */
  calculatePriority(pattern, paybackDays) {
    let priority = 5; // Default

    // Faster payback = higher priority
    if (paybackDays <= 3) priority -= 3;
    else if (paybackDays <= 7) priority -= 2;
    else if (paybackDays <= 14) priority -= 1;
    else if (paybackDays > 90) priority += 2;

    // High urgency = higher priority
    if (pattern.urgency_level === 'critical') priority -= 2;
    else if (pattern.urgency_level === 'high') priority -= 1;
    else if (pattern.urgency_level === 'low') priority += 1;

    // More workers affected = higher priority
    const workersAffected = JSON.parse(pattern.affected_workers || '[]').length;
    if (workersAffected >= 5) priority -= 1;
    if (workersAffected >= 10) priority -= 1;

    return Math.max(1, Math.min(10, priority));
  }

  /**
   * Calculate business impact score (0-100)
   */
  calculateBusinessImpact(pattern, paybackDays) {
    let score = 50; // Base score

    // Financial impact (0-40 points)
    const dailyCost = pattern.estimated_daily_cost;
    if (dailyCost > 200) score += 40;
    else if (dailyCost > 100) score += 30;
    else if (dailyCost > 50) score += 20;
    else score += 10;

    // Urgency (0-30 points)
    if (pattern.urgency_level === 'critical') score += 30;
    else if (pattern.urgency_level === 'high') score += 20;
    else if (pattern.urgency_level === 'medium') score += 10;

    // Worker impact (0-30 points)
    const workersAffected = JSON.parse(pattern.affected_workers || '[]').length;
    score += Math.min(30, workersAffected * 3);

    return Math.min(100, score);
  }

  /**
   * Get all active patterns
   */
  getActivePatterns() {
    const stmt = this.db.prepare(`
      SELECT * FROM patterns
      WHERE status = 'active'
      ORDER BY estimated_daily_cost DESC
    `);

    return stmt.all();
  }

  /**
   * Get all recommendations
   */
  getRecommendations(status = null) {
    let query = 'SELECT * FROM recommendations';
    if (status) {
      query += ' WHERE status = ?';
    }
    query += ' ORDER BY priority ASC, business_impact_score DESC';

    const stmt = this.db.prepare(query);
    return status ? stmt.all(status) : stmt.all();
  }
}

export default PatternEngine;
