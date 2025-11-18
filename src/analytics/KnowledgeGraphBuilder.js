/**
 * Knowledge Graph Builder for ImpofAI
 *
 * Automatically discovers and maps company structure:
 * - Entities: Equipment, locations, people, issues
 * - Relationships: "located_at", "reported_by", "affects", "resolves"
 * - Builds graph from conversations without manual setup
 */

export class KnowledgeGraphBuilder {
  constructor(db) {
    this.db = db;
  }

  /**
   * Build knowledge graph from all conversations
   */
  async buildGraph() {
    console.log('🕸️  Building knowledge graph from conversations...');

    const startTime = Date.now();
    const stats = {
      entitiesCreated: 0,
      relationshipsCreated: 0,
      conversationsProcessed: 0
    };

    try {
      // Get all conversations
      const conversations = this.db.prepare(`
        SELECT * FROM conversations
        WHERE ended_at IS NOT NULL
        ORDER BY started_at ASC
      `).all();

      stats.conversationsProcessed = conversations.length;

      for (const conv of conversations) {
        await this.processConversation(conv);
      }

      // Count entities and relationships
      stats.entitiesCreated = this.db.prepare('SELECT COUNT(*) as count FROM knowledge_graph_entities').get().count;
      stats.relationshipsCreated = this.db.prepare('SELECT COUNT(*) as count FROM knowledge_graph_relationships').get().count;

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Knowledge graph built in ${duration}s`);
      console.log(`   - ${stats.entitiesCreated} entities`);
      console.log(`   - ${stats.relationshipsCreated} relationships`);

      return stats;
    } catch (error) {
      console.error('Error building knowledge graph:', error);
      return stats;
    }
  }

  /**
   * Process single conversation for graph extraction
   */
  async processConversation(conversation) {
    try {
      // Extract entities from conversation metadata
      const entities = this.extractEntities(conversation);

      // Create or update entities
      for (const entity of entities) {
        await this.upsertEntity(entity);
      }

      // Create relationships between entities
      const relationships = this.extractRelationships(conversation, entities);

      for (const rel of relationships) {
        await this.upsertRelationship(rel);
      }
    } catch (error) {
      console.error(`Error processing conversation ${conversation.conversation_id}:`, error);
    }
  }

  /**
   * Extract entities from conversation
   */
  extractEntities(conversation) {
    const entities = [];
    const timestamp = conversation.started_at;

    // Extract worker
    entities.push({
      type: 'worker',
      name: conversation.worker_id,
      timestamp
    });

    // Extract equipment
    if (conversation.equipment_mentioned) {
      try {
        const equipment = JSON.parse(conversation.equipment_mentioned);
        for (const item of equipment) {
          entities.push({
            type: 'equipment',
            name: item,
            timestamp
          });
        }
      } catch (e) {}
    }

    // Extract location
    if (conversation.location) {
      entities.push({
        type: 'location',
        name: conversation.location,
        timestamp
      });
    }

    // Extract issues
    if (conversation.issues) {
      try {
        const issues = JSON.parse(conversation.issues);
        for (const issue of issues) {
          entities.push({
            type: 'issue',
            name: issue,
            timestamp
          });
        }
      } catch (e) {}
    }

    return entities;
  }

  /**
   * Extract relationships between entities
   */
  extractRelationships(conversation, entities) {
    const relationships = [];
    const timestamp = conversation.started_at;

    const worker = entities.find(e => e.type === 'worker');
    const equipment = entities.filter(e => e.type === 'equipment');
    const location = entities.find(e => e.type === 'location');
    const issues = entities.filter(e => e.type === 'issue');

    // Worker → Issue (reported_by)
    for (const issue of issues) {
      if (worker) {
        relationships.push({
          source: this.getEntityId(issue),
          target: this.getEntityId(worker),
          type: 'reported_by',
          timestamp
        });
      }
    }

    // Issue → Equipment (affects)
    for (const issue of issues) {
      for (const equip of equipment) {
        relationships.push({
          source: this.getEntityId(issue),
          target: this.getEntityId(equip),
          type: 'affects',
          timestamp
        });
      }
    }

    // Equipment → Location (located_at)
    for (const equip of equipment) {
      if (location) {
        relationships.push({
          source: this.getEntityId(equip),
          target: this.getEntityId(location),
          type: 'located_at',
          timestamp
        });
      }
    }

    // Worker → Location (works_at)
    if (worker && location) {
      relationships.push({
        source: this.getEntityId(worker),
        target: this.getEntityId(location),
        type: 'works_at',
        timestamp
      });
    }

    return relationships;
  }

  /**
   * Create or update entity
   */
  async upsertEntity(entity) {
    const entityId = this.getEntityId(entity);

    // Check if exists
    const existing = this.db.prepare(`
      SELECT * FROM knowledge_graph_entities WHERE entity_id = ?
    `).get(entityId);

    if (existing) {
      // Update mention count and last mentioned
      this.db.prepare(`
        UPDATE knowledge_graph_entities
        SET mention_count = mention_count + 1,
            last_mentioned = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE entity_id = ?
      `).run(entity.timestamp, entityId);
    } else {
      // Create new entity
      this.db.prepare(`
        INSERT INTO knowledge_graph_entities (
          entity_id, entity_type, name,
          mention_count, centrality_score,
          first_mentioned, last_mentioned,
          created_at, updated_at
        ) VALUES (?, ?, ?, 1, 0.0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        entityId,
        entity.type,
        entity.name,
        entity.timestamp,
        entity.timestamp
      );
    }
  }

  /**
   * Create or update relationship
   */
  async upsertRelationship(relationship) {
    const relId = `${relationship.source}__${relationship.type}__${relationship.target}`;

    // Check if exists
    const existing = this.db.prepare(`
      SELECT * FROM knowledge_graph_relationships WHERE relationship_id = ?
    `).get(relId);

    if (existing) {
      // Update co-occurrence count
      this.db.prepare(`
        UPDATE knowledge_graph_relationships
        SET co_occurrence_count = co_occurrence_count + 1,
            strength = strength + 0.1,
            last_observed = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE relationship_id = ?
      `).run(relationship.timestamp, relId);
    } else {
      // Create new relationship
      this.db.prepare(`
        INSERT INTO knowledge_graph_relationships (
          relationship_id, source_entity_id, target_entity_id,
          relationship_type, co_occurrence_count, strength,
          first_observed, last_observed,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, 1, 1.0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(
        relId,
        relationship.source,
        relationship.target,
        relationship.type,
        relationship.timestamp,
        relationship.timestamp
      );
    }
  }

  /**
   * Generate entity ID from entity
   */
  getEntityId(entity) {
    return `${entity.type}:${entity.name}`.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * Get all entities of a type
   */
  getEntitiesByType(type) {
    return this.db.prepare(`
      SELECT * FROM knowledge_graph_entities
      WHERE entity_type = ?
      ORDER BY mention_count DESC
    `).all(type);
  }

  /**
   * Get relationships for an entity
   */
  getRelationships(entityId) {
    return this.db.prepare(`
      SELECT * FROM knowledge_graph_relationships
      WHERE source_entity_id = ? OR target_entity_id = ?
      ORDER BY strength DESC
    `).all(entityId, entityId);
  }

  /**
   * Get graph visualization data
   */
  getGraphData() {
    const nodes = this.db.prepare(`
      SELECT entity_id as id, entity_type as type, name, mention_count
      FROM knowledge_graph_entities
      ORDER BY mention_count DESC
      LIMIT 100
    `).all();

    const edges = this.db.prepare(`
      SELECT relationship_id as id, source_entity_id as source,
             target_entity_id as target, relationship_type as type,
             strength
      FROM knowledge_graph_relationships
      WHERE source_entity_id IN (SELECT entity_id FROM knowledge_graph_entities ORDER BY mention_count DESC LIMIT 100)
         OR target_entity_id IN (SELECT entity_id FROM knowledge_graph_entities ORDER BY mention_count DESC LIMIT 100)
      ORDER BY strength DESC
      LIMIT 200
    `).all();

    return { nodes, edges };
  }
}
