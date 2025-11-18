/**
 * MidStream Analyzer - Real-time Conversation Analysis
 *
 * Uses MidStream's WebAssembly-powered temporal analysis for:
 * - Sentiment detection
 * - Urgency level classification
 * - Topic extraction
 * - Pattern recognition during conversations
 */

import { MetaPattern, TemporalMetrics, TemporalCompare } from 'midstreamer';

export class MidStreamAnalyzer {
  constructor() {
    this.metaPattern = null;
    this.temporalMetrics = null;
    this.initialized = false;

    // Slovak keywords for classification
    this.urgencyKeywords = {
      critical: ['nefunguje', 'pokazené', 'havarijný', 'okamžite', 'kritický', 'nebezpečný'],
      high: ['problém', 'nemôžem', 'nefunkčný', 'rýchlo', 'dôležité', 'urgentné'],
      medium: ['občas', 'niekedy', 'mohol by', 'lepšie', 'zlepšiť'],
      low: ['možno', 'kedykoľvek', 'keď máte čas', 'nie je to naliehavé']
    };

    this.sentimentKeywords = {
      very_negative: ['hrozné', 'strašné', 'katastrofa', 'nemožné', 'frustrujúce'],
      negative: ['problém', 'zlé', 'nefunguje', 'pokazené', 'chyba'],
      neutral: ['normálne', 'v poriadku', 'ako obvykle', 'štandardné'],
      positive: ['dobré', 'funguje', 'vyriešené', 'pomohlo', 'lepšie'],
      very_positive: ['výborné', 'skvelé', 'perfektné', 'super', 'úžasné']
    };

    this.equipmentKeywords = [
      'skener', 'scanner', 'počítač', 'computer', 'tlačiareň', 'printer',
      'telefón', 'phone', 'tablet', 'auto', 'car', 'vozík', 'cart',
      'vysokozdvižný', 'forklift', 'pásový dopravník', 'conveyor',
      'váha', 'scale', 'batéria', 'battery'
    ];

    this.locationKeywords = [
      'ulička', 'aisle', 'sklad', 'warehouse', 'kancelária', 'office',
      'prízemie', 'ground floor', 'poschodie', 'floor', 'parkovisko', 'parking',
      'rampa', 'dock', 'expedícia', 'shipping', 'príjem', 'receiving'
    ];
  }

  /**
   * Initialize MidStream components
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize MetaPattern for pattern detection
      this.metaPattern = new MetaPattern();

      // Initialize TemporalMetrics for temporal analysis
      this.temporalMetrics = new TemporalMetrics();

      this.initialized = true;
      console.log('✅ MidStream Analyzer initialized');
    } catch (error) {
      console.error('❌ Failed to initialize MidStream:', error);
      // Graceful degradation - use fallback analysis
      this.initialized = false;
    }
  }

  /**
   * Analyze a single transcript turn in real-time
   * @param {Object} params - Analysis parameters
   * @param {string} params.text - The text to analyze
   * @param {string} params.speaker - Who is speaking (worker or agent)
   * @param {Array} params.conversationHistory - Previous turns for context
   * @returns {Object} Analysis results
   */
  async analyzeTurn({ text, speaker, conversationHistory = [] }) {
    await this.initialize();

    const textLower = text.toLowerCase();

    // 1. Sentiment Analysis
    const sentiment = this.detectSentiment(textLower);

    // 2. Urgency Detection
    const urgency = this.detectUrgency(textLower);

    // 3. Topic Extraction
    const topics = this.extractTopics(textLower);

    // 4. Entity Detection (equipment, locations, people)
    const entities = this.extractEntities(textLower);

    // 5. Issue Detection
    const issues = this.detectIssues(textLower, entities);

    // 6. Temporal Pattern Analysis (if MidStream initialized)
    let temporalPattern = null;
    if (this.initialized && conversationHistory.length > 0) {
      temporalPattern = await this.analyzeTemporalPattern(conversationHistory, text);
    }

    return {
      sentiment,
      urgency,
      topics,
      entities,
      issues,
      temporalPattern,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect sentiment from text
   */
  detectSentiment(text) {
    let score = 0;
    let matches = [];

    // Check for sentiment keywords
    for (const [sentiment, keywords] of Object.entries(this.sentimentKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          matches.push({ sentiment, keyword });

          // Score mapping
          switch (sentiment) {
            case 'very_negative': score -= 2; break;
            case 'negative': score -= 1; break;
            case 'neutral': score += 0; break;
            case 'positive': score += 1; break;
            case 'very_positive': score += 2; break;
          }
        }
      }
    }

    // Determine overall sentiment
    let overall = 'neutral';
    if (score <= -2) overall = 'very_negative';
    else if (score === -1) overall = 'negative';
    else if (score === 0) overall = 'neutral';
    else if (score === 1) overall = 'positive';
    else if (score >= 2) overall = 'very_positive';

    return {
      overall,
      score,
      matches,
      confidence: matches.length > 0 ? 0.8 : 0.3
    };
  }

  /**
   * Detect urgency level from text
   */
  detectUrgency(text) {
    let urgencyLevel = 'low';
    let matches = [];
    let highestScore = 0;

    const scoreMap = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    for (const [level, keywords] of Object.entries(this.urgencyKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          matches.push({ level, keyword });

          if (scoreMap[level] > highestScore) {
            highestScore = scoreMap[level];
            urgencyLevel = level;
          }
        }
      }
    }

    return {
      level: urgencyLevel,
      score: highestScore,
      matches,
      confidence: matches.length > 0 ? 0.85 : 0.4
    };
  }

  /**
   * Extract topics from text
   */
  extractTopics(text) {
    const topics = [];

    // Equipment-related topics
    if (this.equipmentKeywords.some(kw => text.includes(kw))) {
      topics.push('equipment');
    }

    // Location-related topics
    if (this.locationKeywords.some(kw => text.includes(kw))) {
      topics.push('location');
    }

    // Issue-related topics
    if (text.includes('problém') || text.includes('chyba') || text.includes('nefunguje')) {
      topics.push('issue');
    }

    // Request topics
    if (text.includes('potrebujem') || text.includes('chcem') || text.includes('môžem')) {
      topics.push('request');
    }

    // Safety topics
    if (text.includes('bezpečnosť') || text.includes('nebezpečný') || text.includes('úraz')) {
      topics.push('safety');
    }

    return topics;
  }

  /**
   * Extract entities (equipment, locations, people)
   */
  extractEntities(text) {
    const entities = {
      equipment: [],
      locations: [],
      people: []
    };

    // Extract equipment
    for (const equipment of this.equipmentKeywords) {
      if (text.includes(equipment)) {
        entities.equipment.push(equipment);
      }
    }

    // Extract locations with numbers (e.g., "ulička 5")
    const locationMatch = text.match(/ulička\s+(\d+)/i);
    if (locationMatch) {
      entities.locations.push(`aisle ${locationMatch[1]}`);
    }

    // Generic location keywords
    for (const location of this.locationKeywords) {
      if (text.includes(location)) {
        entities.locations.push(location);
      }
    }

    // People detection (basic - looks for "kolega", "vedúci", etc.)
    const peopleKeywords = ['kolega', 'vedúci', 'manažér', 'kolegyňa', 'šéf'];
    for (const person of peopleKeywords) {
      if (text.includes(person)) {
        entities.people.push(person);
      }
    }

    return entities;
  }

  /**
   * Detect specific issues from text
   */
  detectIssues(text, entities) {
    const issues = [];

    // Equipment malfunction
    if ((text.includes('nefunguje') || text.includes('pokazený')) && entities.equipment.length > 0) {
      for (const equipment of entities.equipment) {
        const location = entities.locations[0] || 'unknown location';
        issues.push(`${equipment} malfunction at ${location}`);
      }
    }

    // Slow performance
    if (text.includes('pomal') && entities.equipment.length > 0) {
      issues.push(`Slow ${entities.equipment[0]}`);
    }

    // Missing items
    if (text.includes('chýba') || text.includes('nemám')) {
      issues.push('Missing equipment or supplies');
    }

    // Safety concern
    if (text.includes('bezpečnosť') || text.includes('nebezpečný')) {
      issues.push('Safety concern');
    }

    return issues;
  }

  /**
   * Analyze temporal patterns using MidStream
   */
  async analyzeTemporalPattern(conversationHistory, currentText) {
    if (!this.initialized) return null;

    try {
      // Convert conversation to temporal sequence
      const sequence = conversationHistory.map((turn, idx) => ({
        index: idx,
        speaker: turn.speaker,
        textLength: turn.text.length,
        timestamp: turn.timestamp || Date.now()
      }));

      // Use TemporalMetrics to analyze conversation flow
      const metrics = {
        turnCount: sequence.length,
        averageLength: sequence.reduce((sum, t) => sum + t.textLength, 0) / sequence.length,
        workerTurns: sequence.filter(t => t.speaker === 'worker').length,
        agentTurns: sequence.filter(t => t.speaker === 'agent').length
      };

      return {
        metrics,
        engagement: metrics.workerTurns / sequence.length, // Higher = more worker engagement
        complexity: currentText.length / metrics.averageLength // Current turn complexity
      };
    } catch (error) {
      console.error('Error in temporal analysis:', error);
      return null;
    }
  }

  /**
   * Analyze entire conversation for patterns
   */
  async analyzeConversation(transcript) {
    await this.initialize();

    const allTopics = new Set();
    const allIssues = new Set();
    const allEquipment = new Set();
    const allLocations = new Set();
    const sentimentScores = [];
    let maxUrgencyScore = 0;
    let maxUrgencyLevel = 'low';

    // Analyze each turn
    for (const turn of transcript) {
      const analysis = await this.analyzeTurn({
        text: turn.text,
        speaker: turn.speaker,
        conversationHistory: transcript.slice(0, transcript.indexOf(turn))
      });

      // Aggregate topics
      analysis.topics.forEach(t => allTopics.add(t));

      // Aggregate issues
      analysis.issues.forEach(i => allIssues.add(i));

      // Aggregate entities
      analysis.entities.equipment.forEach(e => allEquipment.add(e));
      analysis.entities.locations.forEach(l => allLocations.add(l));

      // Track sentiment
      sentimentScores.push(analysis.sentiment.score);

      // Track max urgency
      if (analysis.urgency.score > maxUrgencyScore) {
        maxUrgencyScore = analysis.urgency.score;
        maxUrgencyLevel = analysis.urgency.level;
      }
    }

    // Calculate average sentiment
    const avgSentiment = sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
    let overallSentiment = 'neutral';
    if (avgSentiment <= -1.5) overallSentiment = 'very_negative';
    else if (avgSentiment < -0.5) overallSentiment = 'negative';
    else if (avgSentiment < 0.5) overallSentiment = 'neutral';
    else if (avgSentiment < 1.5) overallSentiment = 'positive';
    else overallSentiment = 'very_positive';

    return {
      topics: Array.from(allTopics),
      issues: Array.from(allIssues),
      equipment: Array.from(allEquipment),
      locations: Array.from(allLocations),
      sentiment: overallSentiment,
      urgency: maxUrgencyLevel,
      conversationQuality: this.calculateConversationQuality(transcript),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate conversation quality score (0-100)
   */
  calculateConversationQuality(transcript) {
    let score = 50; // Start at 50

    // Good: Worker provides details
    const workerTurns = transcript.filter(t => t.speaker === 'worker');
    const avgWorkerLength = workerTurns.reduce((sum, t) => sum + t.text.length, 0) / workerTurns.length;
    if (avgWorkerLength > 50) score += 10; // Detailed responses

    // Good: Balanced conversation
    const balance = workerTurns.length / transcript.length;
    if (balance > 0.4 && balance < 0.6) score += 15; // Balanced turn-taking

    // Good: Issues clearly identified
    const hasIssues = transcript.some(t =>
      t.text.toLowerCase().includes('problém') ||
      t.text.toLowerCase().includes('nefunguje')
    );
    if (hasIssues) score += 10;

    // Good: Location specified
    const hasLocation = transcript.some(t =>
      t.text.toLowerCase().includes('ulička') ||
      t.text.toLowerCase().includes('sklad')
    );
    if (hasLocation) score += 10;

    // Bad: Very short conversation
    if (transcript.length < 4) score -= 20;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, score));
  }
}
