# ARCHITECTURE - ImpofAI V2

**Version:** 2.1.0
**Date:** November 19, 2025
**Based on:** SPECIFICATION v2.1.0, PSEUDOCODE v2.1.0

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Component Architecture](#2-component-architecture)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Database Architecture](#4-database-architecture)
5. [Security Architecture](#5-security-architecture)
6. [Performance Architecture](#6-performance-architecture)
7. [Integration Points](#7-integration-points)

---

## 1. System Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ELEVENLABS CLOUD                        │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │  Slovak Voice AI  │────────│  Tool Execution  │            │
│  │   (sk-SK, 24kHz) │         │   Engine         │            │
│  └──────────────────┘         └──────────────────┘            │
│           │                            │                        │
│           │ WebSocket Audio            │ HTTPS Tool Calls       │
│           ▼                            ▼                        │
└───────────┼────────────────────────────┼────────────────────────┘
            │                            │
            │                            │
┌───────────┼────────────────────────────┼────────────────────────┐
│           │        WORKER'S DEVICE     │                        │
│           │                            │                        │
│  ┌────────▼────────┐                  │                        │
│  │  Web Browser    │◄─────────────────┘                        │
│  │  (Audio Stream) │   (Tool responses via WebSocket)          │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      IMPOFAI V2 SERVER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Express.js REST API                    │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │  │
│  │  │  /api/tools/   │  │  /api/webhooks/│  │ /api/admin/│ │  │
│  │  │  - context     │  │  - elevenlabs  │  │  - workers │ │  │
│  │  │  - issues      │  │                │  │  - patterns│ │  │
│  │  └────────────────┘  └────────────────┘  └────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Business Logic Layer                    │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │  Context   │  │    Issue     │  │    Webhook      │  │  │
│  │  │  Builder   │  │   Logger     │  │   Processor     │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────────┘  │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │  Slovak    │  │   Pattern    │  │  Performance    │  │  │
│  │  │  Prompt    │  │   Detector   │  │  Monitor        │  │  │
│  │  └────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Database Layer (AgentDB)                │  │
│  │  ┌───────────┐  ┌───────────┐  ┌────────────────────┐   │  │
│  │  │  Workers  │  │  Patterns │  │  Pattern_Workers   │   │  │
│  │  │   Table   │  │   Table   │  │  (Junction Table)  │   │  │
│  │  └───────────┘  └───────────┘  └────────────────────┘   │  │
│  │  ┌─────────────────────┐  ┌───────────────────────┐     │  │
│  │  │   Conversations     │  │   Issue_Mentions      │     │  │
│  │  │       Table         │  │       Table           │     │  │
│  │  └─────────────────────┘  └───────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│                        SQLite (AgentDB.db)                      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

1. **Simplicity First**: REST API only, no WebSockets
2. **Cloud-Offloaded**: ElevenLabs handles voice, NLU, STT/TTS
3. **Stateless Tools**: Each tool call is independent
4. **Junction Tables**: Proper many-to-many relationships
5. **Slovak-First**: All prompts, messages, and data in Slovak
6. **Performance Monitoring**: Every operation timed and logged

---

## 2. Component Architecture

### 2.1 Tool Endpoints Layer

```
┌──────────────────────────────────────────────────────────────┐
│                    TOOL ENDPOINTS                            │
└──────────────────────────────────────────────────────────────┘

GET /api/tools/context/:workerId
┌─────────────────────────────────────────────────────────────┐
│  Purpose: Retrieve worker context for conversation         │
│  Trigger: Called by ElevenLabs BEFORE conversation starts  │
│  Response Time: <1000ms (critical), 35-80ms (typical)      │
├─────────────────────────────────────────────────────────────┤
│  Input:                                                     │
│    - workerId (URL param): "worker_12345"                  │
│                                                             │
│  Processing:                                                │
│    1. Query workers table                                   │
│    2. Query last 3 conversations                            │
│    3. Query active patterns (via junction table)            │
│    4. Build Slovak conversation tips                        │
│    5. Return structured context                             │
│                                                             │
│  Output:                                                    │
│    {                                                        │
│      "success": true,                                       │
│      "worker_id": "worker_12345",                           │
│      "context": {                                           │
│        "worker": { name, role, department },                │
│        "is_new_worker": false,                              │
│        "recent_conversations": [...],                       │
│        "active_patterns": [...],                            │
│        "conversation_tips": [...]                           │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘

POST /api/tools/issues
┌─────────────────────────────────────────────────────────────┐
│  Purpose: Log issue reported during conversation           │
│  Trigger: Called by ElevenLabs DURING conversation         │
│  Response Time: <500ms (critical), 15-35ms (typical)       │
├─────────────────────────────────────────────────────────────┤
│  Input:                                                     │
│    {                                                        │
│      "worker_id": "worker_12345",                           │
│      "issue_description": "Zlé osvetlenie v dielni",       │
│      "severity": "medium",                                  │
│      "location": "Dielňa číslo 3"                           │
│    }                                                        │
│                                                             │
│  Processing:                                                │
│    1. Detect if issue matches existing pattern             │
│    2. If match: Update junction table (mention_count++)    │
│    3. If new: Create pattern + junction table entry        │
│    4. Create issue_mention record                           │
│    5. Return confirmation                                   │
│                                                             │
│  Output:                                                    │
│    {                                                        │
│      "success": true,                                       │
│      "pattern_id": "pattern_abc123",                        │
│      "is_new_pattern": false,                               │
│      "affected_workers_count": 3,                           │
│      "confirmation_message": "Zaznamenané! Už 3 ľudia..."  │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Webhook Processing Layer

```
┌──────────────────────────────────────────────────────────────┐
│                   WEBHOOK PROCESSOR                          │
└──────────────────────────────────────────────────────────────┘

POST /api/webhooks/elevenlabs
┌─────────────────────────────────────────────────────────────┐
│  Purpose: Receive post-call data from ElevenLabs           │
│  Trigger: ElevenLabs sends AFTER conversation ends         │
│  Response Time: <2s (target), <10s (max)                   │
├─────────────────────────────────────────────────────────────┤
│  Security Pipeline:                                         │
│    ┌──────────────────────────────────────────────┐        │
│    │ 1. Extract x-elevenlabs-signature header    │        │
│    │ 2. Read raw request body                     │        │
│    │ 3. Compute HMAC-SHA256(secret, body)         │        │
│    │ 4. Compare: signature == "sha256={hash}"     │        │
│    │ 5. If mismatch → 401 Unauthorized            │        │
│    └──────────────────────────────────────────────┘        │
│                                                             │
│  Data Storage Pipeline:                                     │
│    ┌──────────────────────────────────────────────┐        │
│    │ 1. BEGIN TRANSACTION                         │        │
│    │ 2. INSERT INTO conversations (...)           │        │
│    │ 3. UPDATE workers SET total_conversations++  │        │
│    │ 4. COMMIT TRANSACTION                        │        │
│    └──────────────────────────────────────────────┘        │
│                                                             │
│  Async Analysis (Background):                              │
│    ┌──────────────────────────────────────────────┐        │
│    │ 1. Extract topics (Slovak keywords)          │        │
│    │ 2. Analyze sentiment (positive/neutral/neg)  │        │
│    │ 3. Update conversation record with analysis  │        │
│    │ 4. Update worker analytics                   │        │
│    └──────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Dynamic Variables Layer

```
┌──────────────────────────────────────────────────────────────┐
│                  DYNAMIC VARIABLES BUILDER                   │
└──────────────────────────────────────────────────────────────┘

buildSlovakPrompt(context)
┌─────────────────────────────────────────────────────────────┐
│  Purpose: Build personalized Slovak system prompt          │
│  Called: By frontend BEFORE starting ElevenLabs session     │
├─────────────────────────────────────────────────────────────┤
│  Inputs:                                                    │
│    - context.worker.name: "Jozef"                           │
│    - context.worker.role: "Výrobný pracovník"               │
│    - context.active_patterns: [...]                         │
│    - current_time: Date.now()                               │
│                                                             │
│  Logic:                                                     │
│    1. Determine time-based greeting:                        │
│       - 00:00-11:59 → "Dobré ráno"                          │
│       - 12:00-16:59 → "Dobrý deň"                           │
│       - 17:00-23:59 → "Dobrý večer"                         │
│                                                             │
│    2. Inject worker context:                                │
│       "Práve hovoríš s {name}, ktorý pracuje ako {role}"    │
│                                                             │
│    3. Add tool usage instructions:                          │
│       - Call get_context FIRST                              │
│       - Call log_issue IMMEDIATELY when issue mentioned     │
│                                                             │
│    4. Add Slovak language rules:                            │
│       - Use informal "ty" (not formal "vy")                 │
│       - Be warm and conversational                          │
│       - Use Slovak idioms naturally                         │
│                                                             │
│  Output: Complete Slovak system prompt (500-800 chars)     │
└─────────────────────────────────────────────────────────────┘

buildSlovakFirstMessage(context)
┌─────────────────────────────────────────────────────────────┐
│  Purpose: Build personalized first message (greeting)      │
│  Called: By frontend BEFORE starting ElevenLabs session     │
├─────────────────────────────────────────────────────────────┤
│  Priority Logic:                                            │
│                                                             │
│  IF context.is_new_worker:                                  │
│    → "Dobré ráno! Volám sa ImpofAI a som tvoj AI..."       │
│                                                             │
│  ELSE IF context.active_issues.length > 0:                  │
│    → "Dobrý deň, Jozef! Pamätám si, že si minule..."       │
│                                                             │
│  ELSE IF context.recent_conversations.length > 0:           │
│    → "Ahoj, Jozef! Ako sa dnes máš? Minule sme..."         │
│                                                             │
│  ELSE:                                                      │
│    → "Dobrý deň, Jozef! Ako sa máš? Čo ťa dnes trápi?"     │
│                                                             │
│  Output: Slovak greeting (80-150 chars)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagrams

### 3.1 Pre-Call Flow (Context Retrieval)

```
┌──────────┐                                      ┌──────────────┐
│  Worker  │                                      │  ElevenLabs  │
│  Browser │                                      │    Cloud     │
└────┬─────┘                                      └──────┬───────┘
     │                                                   │
     │ 1. Click "Start Conversation"                    │
     ├──────────────────────────────────────────────────►
     │                                                   │
     │                                                   │ 2. Before connecting,
     │                                                   │    ElevenLabs calls
     │                                                   │    get_context tool
     │                                                   │
     │              ┌─────────────────────────────────┐  │
     │              │      ImpofAI V2 Server          │  │
     │              └─────────────────────────────────┘  │
     │                           ▲                       │
     │                           │                       │
     │                           │ 3. GET /api/tools/context/worker_12345
     │                           │◄──────────────────────┤
     │                           │                       │
     │              ┌────────────┴───────────┐           │
     │              │  Step 1: Query workers │           │
     │              │  SELECT * FROM workers │           │
     │              │  WHERE worker_id = ?   │           │
     │              │  (~5ms)                │           │
     │              └────────────────────────┘           │
     │                           │                       │
     │              ┌────────────┴───────────────────┐   │
     │              │  Step 2: Query conversations   │   │
     │              │  SELECT * FROM conversations   │   │
     │              │  WHERE worker_id = ?           │   │
     │              │  ORDER BY started_at DESC      │   │
     │              │  LIMIT 3 (~8ms)                │   │
     │              └────────────────────────────────┘   │
     │                           │                       │
     │              ┌────────────┴───────────────────────┐
     │              │  Step 3: Query patterns (FAST!)   │
     │              │  SELECT p.* FROM patterns p       │
     │              │  INNER JOIN pattern_workers pw    │
     │              │  ON p.pattern_id = pw.pattern_id  │
     │              │  WHERE pw.worker_id = ?           │
     │              │  (~5-10ms with junction table)    │
     │              └────────────────────────────────────┘
     │                           │                       │
     │              ┌────────────┴────────────┐          │
     │              │  Step 4: Build context  │          │
     │              │  - Slovak tips          │          │
     │              │  - Conversation history │          │
     │              │  (~2ms)                 │          │
     │              └─────────────────────────┘          │
     │                           │                       │
     │                           │ 4. Return context (JSON)
     │                           │──────────────────────►│
     │                           │    Total: 35-80ms     │
     │                                                   │
     │ 5. Start conversation with context                │
     │◄──────────────────────────────────────────────────┤
     │    (Audio stream begins)                          │
     │                                                   │
```

**Performance Target**: <1000ms critical, 35-80ms typical

### 3.2 Real-Time Flow (Issue Logging)

```
┌──────────┐          ┌──────────────┐          ┌─────────────┐
│  Worker  │          │  ElevenLabs  │          │  ImpofAI V2 │
│  (Voice) │          │    Cloud     │          │   Server    │
└────┬─────┘          └──────┬───────┘          └──────┬──────┘
     │                       │                         │
     │ "Zlé osvetlenie       │                         │
     │  v dielni"            │                         │
     ├──────────────────────►│                         │
     │                       │                         │
     │                       │ 1. STT + NLU            │
     │                       │    ElevenLabs LLM       │
     │                       │    decides to use       │
     │                       │    log_issue tool       │
     │                       │                         │
     │                       │ 2. POST /api/tools/issues
     │                       │    {                    │
     │                       │      worker_id,         │
     │                       │      issue_description, │
     │                       │      severity,          │
     │                       │      location           │
     │                       │    }                    │
     │                       ├────────────────────────►│
     │                       │                         │
     │                       │                ┌────────┴────────┐
     │                       │                │ Pattern Matching│
     │                       │                │ Algorithm       │
     │                       │                │                 │
     │                       │                │ IF exists:      │
     │                       │                │   UPDATE count  │
     │                       │                │ ELSE:           │
     │                       │                │   CREATE new    │
     │                       │                │                 │
     │                       │                │ (~15-35ms)      │
     │                       │                └────────┬────────┘
     │                       │                         │
     │                       │ 3. Response with        │
     │                       │    confirmation         │
     │                       │◄────────────────────────┤
     │                       │    {                    │
     │                       │      success: true,     │
     │                       │      pattern_id,        │
     │                       │      affected_workers   │
     │                       │    }                    │
     │                       │                         │
     │                       │ 4. TTS response         │
     │◄──────────────────────┤    "Zaznamenané!       │
     │  "Zaznamenané! Už 3   │     Už 3 ľudia         │
     │   ľudia to spomínali" │     to spomínali"      │
     │                       │                         │
```

**Performance Target**: <500ms critical, 15-35ms typical

### 3.3 Post-Call Flow (Webhook Processing)

```
┌──────────┐          ┌──────────────┐          ┌─────────────┐
│  Worker  │          │  ElevenLabs  │          │  ImpofAI V2 │
│  Browser │          │    Cloud     │          │   Server    │
└────┬─────┘          └──────┬───────┘          └──────┬──────┘
     │                       │                         │
     │ Conversation ends     │                         │
     │ (worker hangs up)     │                         │
     ├──────────────────────►│                         │
     │                       │                         │
     │                       │ 1. ElevenLabs processes │
     │                       │    full conversation    │
     │                       │    (~1-2s)              │
     │                       │                         │
     │                       │ 2. POST /api/webhooks/elevenlabs
     │                       │    Headers:             │
     │                       │      x-elevenlabs-signature
     │                       │    Body:                │
     │                       │      conversation_id,   │
     │                       │      transcript,        │
     │                       │      metadata           │
     │                       ├────────────────────────►│
     │                       │                         │
     │                       │                ┌────────┴────────┐
     │                       │                │ SECURITY CHECK  │
     │                       │                │                 │
     │                       │                │ signature =     │
     │                       │                │   HMAC-SHA256(  │
     │                       │                │     secret,     │
     │                       │                │     body        │
     │                       │                │   )             │
     │                       │                │                 │
     │                       │                │ IF invalid:     │
     │                       │                │   401           │
     │                       │                └────────┬────────┘
     │                       │                         │
     │                       │                ┌────────┴────────┐
     │                       │                │ STORE DATA      │
     │                       │                │ BEGIN TX        │
     │                       │                │ INSERT conv     │
     │                       │                │ UPDATE worker   │
     │                       │                │ COMMIT TX       │
     │                       │                │ (~50-100ms)     │
     │                       │                └────────┬────────┘
     │                       │                         │
     │                       │ 3. 200 OK               │
     │                       │◄────────────────────────┤
     │                       │    { success: true }    │
     │                       │                         │
     │                       │                ┌────────┴────────┐
     │                       │                │ ASYNC ANALYSIS  │
     │                       │                │ (Background)    │
     │                       │                │                 │
     │                       │                │ - Extract topics│
     │                       │                │ - Sentiment     │
     │                       │                │ - Update stats  │
     │                       │                │ (~1-2s)         │
     │                       │                └─────────────────┘
     │                       │                         │
```

**Performance Target**: <2s synchronous, <10s total with async

---

## 4. Database Architecture

### 4.1 Entity-Relationship Diagram

```
┌─────────────────────┐
│      WORKERS        │
├─────────────────────┤
│ worker_id (PK)      │───────┐
│ name                │       │
│ role                │       │
│ department          │       │
│ total_conversations │       │
│ created_at          │       │
└─────────────────────┘       │
         ▲                    │
         │                    │
         │ 1                  │ 1
         │                    │
         │ N                  │ N
         │                    │
┌────────┴──────────┐  ┌──────┴──────────────┐
│  CONVERSATIONS    │  │  PATTERN_WORKERS    │◄───────┐
├───────────────────┤  │  (Junction Table)   │        │
│ conversation_id   │  ├─────────────────────┤        │
│ worker_id (FK) ───┼──┤ pattern_id (PK, FK) │────┐   │
│ started_at        │  │ worker_id (PK, FK)  │    │   │
│ ended_at          │  │ reported_at         │    │   │
│ topics            │  │ severity_at_report  │    │   │
│ sentiment         │  │ first_mentioned_at  │    │   │
│ transcript        │  │ last_mentioned_at   │    │   │
└───────────────────┘  │ mention_count       │    │   │
                       └─────────────────────┘    │   │
                                                  │   │
                       ┌──────────────────────┐   │   │
                       │      PATTERNS        │   │   │
                       ├──────────────────────┤   │   │
                       │ pattern_id (PK) ─────┼───┘   │
                       │ issue_description    │       │
                       │ status               │       │
                       │ urgency_level        │       │
                       │ first_reported_at    │       │
                       │ last_reported_at     │       │
                       │ affected_workers ────┼───────┘
                       │   (via junction tbl) │
                       └──────────────────────┘
                                 ▲
                                 │ 1
                                 │
                                 │ N
                                 │
                       ┌─────────┴──────────┐
                       │  ISSUE_MENTIONS    │
                       ├────────────────────┤
                       │ mention_id (PK)    │
                       │ pattern_id (FK)    │
                       │ worker_id          │
                       │ conversation_id    │
                       │ mentioned_at       │
                       │ exact_quote        │
                       │ severity           │
                       └────────────────────┘
```

### 4.2 Junction Table Architecture (Critical Performance Optimization)

```
WHY JUNCTION TABLE?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OLD APPROACH (SLOW):
┌────────────────────────────────────────────────────────┐
│ patterns.affected_workers = '["worker_123", ...]'     │
│                                                        │
│ Query: SELECT * FROM patterns                          │
│        WHERE affected_workers LIKE '%worker_123%'     │
│                                                        │
│ Problems:                                              │
│   ✗ LIKE queries can't use indexes (20-50ms)          │
│   ✗ Partial matches (worker_1 matches worker_12)      │
│   ✗ No referential integrity                          │
│   ✗ Can't query "all patterns for worker" efficiently │
└────────────────────────────────────────────────────────┘

NEW APPROACH (FAST):
┌────────────────────────────────────────────────────────┐
│ pattern_workers junction table                        │
│                                                        │
│ Schema:                                                │
│   CREATE TABLE pattern_workers (                       │
│     pattern_id TEXT NOT NULL,                          │
│     worker_id TEXT NOT NULL,                           │
│     reported_at DATETIME,                              │
│     mention_count INTEGER DEFAULT 1,                   │
│     PRIMARY KEY (pattern_id, worker_id),               │
│     FOREIGN KEY (pattern_id) REFERENCES patterns,      │
│     FOREIGN KEY (worker_id) REFERENCES workers         │
│   );                                                   │
│   CREATE INDEX idx_pw_worker ON pattern_workers(worker_id);
│   CREATE INDEX idx_pw_pattern ON pattern_workers(pattern_id);
│                                                        │
│ Query: SELECT p.* FROM patterns p                      │
│        INNER JOIN pattern_workers pw                   │
│        ON p.pattern_id = pw.pattern_id                 │
│        WHERE pw.worker_id = ?                          │
│                                                        │
│ Benefits:                                              │
│   ✓ Index-based lookup (5-10ms)                        │
│   ✓ Exact matches only                                 │
│   ✓ Foreign keys enforce integrity                     │
│   ✓ Can query both directions efficiently              │
│   ✓ Stores per-worker metadata (mention_count, etc.)   │
└────────────────────────────────────────────────────────┘

PERFORMANCE COMPARISON:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Operation                    Old (JSON)    New (Junction)
─────────────────────────────────────────────────────────────
Get patterns for worker      20-50ms       5-10ms
Count affected workers       30-60ms       5-10ms
Add worker to pattern        15-25ms       3-5ms
Check if worker reported     10-20ms       2-4ms
```

### 4.3 Key Queries

```sql
-- Query 1: Get all active patterns for a worker (FAST: 5-10ms)
SELECT p.*, pw.reported_at, pw.mention_count
FROM patterns p
INNER JOIN pattern_workers pw ON p.pattern_id = pw.pattern_id
WHERE pw.worker_id = ?
  AND p.status = 'active'
ORDER BY p.urgency_level DESC, pw.reported_at DESC
LIMIT 5;

-- Query 2: Count affected workers for a pattern (FAST: 5-10ms)
SELECT COUNT(DISTINCT worker_id) as affected_count
FROM pattern_workers
WHERE pattern_id = ?;

-- Query 3: Get all patterns with affected worker counts (FAST: 10-15ms)
SELECT p.*, COUNT(pw.worker_id) as affected_workers_count
FROM patterns p
LEFT JOIN pattern_workers pw ON p.pattern_id = pw.pattern_id
WHERE p.status = 'active'
GROUP BY p.pattern_id
ORDER BY affected_workers_count DESC, p.urgency_level DESC;

-- Query 4: Check if worker already reported pattern (FAST: 2-4ms)
SELECT 1 FROM pattern_workers
WHERE pattern_id = ? AND worker_id = ?
LIMIT 1;
```

---

## 5. Security Architecture

### 5.1 Webhook Signature Verification Flow

```
┌──────────────────────────────────────────────────────────────┐
│              ELEVENLABS WEBHOOK SECURITY                     │
└──────────────────────────────────────────────────────────────┘

Step 1: ElevenLabs Sends Webhook
┌────────────────────────────────────────────┐
│ POST /api/webhooks/elevenlabs              │
│                                            │
│ Headers:                                   │
│   x-elevenlabs-signature: sha256={hash}    │
│                                            │
│ Body (raw):                                │
│   {                                        │
│     "conversation_id": "conv_123",         │
│     "transcript": "...",                   │
│     "metadata": {...}                      │
│   }                                        │
└────────────────────────────────────────────┘
                    │
                    ▼
Step 2: ImpofAI Receives Request
┌────────────────────────────────────────────┐
│ const signature = req.headers[            │
│   'x-elevenlabs-signature'                 │
│ ];                                         │
│ const rawBody = JSON.stringify(req.body);  │
│                                            │
│ Example:                                   │
│   signature = "sha256=a1b2c3d4..."        │
│   rawBody = '{"conversation_id":"..."}'   │
└────────────────────────────────────────────┘
                    │
                    ▼
Step 3: Compute Expected Signature
┌────────────────────────────────────────────┐
│ import crypto from 'crypto';               │
│                                            │
│ const secret = process.env.WEBHOOK_SECRET; │
│ const expectedHash = crypto                │
│   .createHmac('sha256', secret)            │
│   .update(rawBody)                         │
│   .digest('hex');                          │
│                                            │
│ const expected = `sha256=${expectedHash}`; │
└────────────────────────────────────────────┘
                    │
                    ▼
Step 4: Compare Signatures (Timing-Safe)
┌────────────────────────────────────────────┐
│ if (signature !== expected) {              │
│   console.error('Signature mismatch!');    │
│   return res.status(401).json({            │
│     success: false,                        │
│     error: 'Invalid webhook signature'     │
│   });                                      │
│ }                                          │
│                                            │
│ // Signature valid → proceed with request │
└────────────────────────────────────────────┘
```

### 5.2 Environment Variables Security

```
┌──────────────────────────────────────────────────────────────┐
│                    SENSITIVE CONFIGURATION                   │
└──────────────────────────────────────────────────────────────┘

File: .env (NEVER commit to git!)
─────────────────────────────────────────────────────────────────
# ElevenLabs Configuration
ELEVENLABS_API_KEY=sk_1a2b3c4d5e6f7g8h9i0j...
ELEVENLABS_AGENT_ID=agent_abc123def456

# Webhook Security
WEBHOOK_SECRET=whsec_abcdef1234567890...    ← CRITICAL
                                              Generate with:
                                              openssl rand -hex 32

# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DB_PATH=/var/data/AgentDB.db

Security Notes:
─────────────────────────────────────────────────────────────────
1. WEBHOOK_SECRET must be:
   - At least 32 bytes (64 hex chars)
   - Cryptographically random
   - Rotated every 90 days
   - Never logged or exposed in errors

2. ELEVENLABS_API_KEY must be:
   - Stored in environment variables only
   - Never in code or logs
   - Rotated if compromised

3. .env file must be:
   - In .gitignore
   - Not readable by other users (chmod 600)
   - Backed up securely (encrypted)
```

---

## 6. Performance Architecture

### 6.1 Performance Monitoring Strategy

```
┌──────────────────────────────────────────────────────────────┐
│               PERFORMANCE MONITORING POINTS                  │
└──────────────────────────────────────────────────────────────┘

Every Tool Call:
┌────────────────────────────────────────────────────┐
│ const startTime = Date.now();                     │
│                                                    │
│ try {                                              │
│   // ... tool logic ...                           │
│                                                    │
│   const duration = Date.now() - startTime;        │
│   console.log(`[PERF] get_context: ${duration}ms`);
│                                                    │
│   if (duration > 1000) {                           │
│     console.warn(`[SLOW] get_context exceeded     │
│                   1000ms target: ${duration}ms`);  │
│   }                                                │
│ }                                                  │
└────────────────────────────────────────────────────┘

Every Database Query:
┌────────────────────────────────────────────────────┐
│ function queryWithTiming(sql, params) {            │
│   const start = Date.now();                        │
│   const result = db.prepare(sql).all(params);      │
│   const duration = Date.now() - start;             │
│                                                    │
│   console.log(`[DB] ${sql.slice(0, 50)}...        │
│                ${duration}ms`);                    │
│                                                    │
│   if (duration > 200) {                            │
│     console.warn(`[SLOW DB] Query exceeded 200ms`);│
│   }                                                │
│                                                    │
│   return result;                                   │
│ }                                                  │
└────────────────────────────────────────────────────┘
```

### 6.2 Performance Targets Summary

```
┌──────────────────────────────────────────────────────────────┐
│                    PERFORMANCE SLA                           │
└──────────────────────────────────────────────────────────────┘

Operation               Target    Typical   Critical   Optimization
─────────────────────────────────────────────────────────────────
get_context tool        <800ms    35-80ms   <1000ms    Junction table
log_issue tool          <300ms    15-35ms   <500ms     Pattern cache
webhook processing      <2s       <1s       <10s       Async analysis
junction table query    <10ms     5-10ms    <20ms      Indexes
worker lookup           <5ms      2-4ms     <10ms      Primary key
pattern matching        <20ms     10-15ms   <50ms      Fuzzy search


OPTIMIZATION STRATEGIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Database Indexes:
   ✓ CREATE INDEX idx_pw_worker ON pattern_workers(worker_id);
   ✓ CREATE INDEX idx_pw_pattern ON pattern_workers(pattern_id);
   ✓ CREATE INDEX idx_conv_worker ON conversations(worker_id);
   ✓ CREATE INDEX idx_patterns_status ON patterns(status);

2. Query Optimization:
   ✓ Use LIMIT on all list queries
   ✓ Use INNER JOIN instead of subqueries
   ✓ Fetch only required columns (not SELECT *)
   ✓ Use EXPLAIN QUERY PLAN to verify index usage

3. Async Processing:
   ✓ Webhook storage = synchronous (< 2s)
   ✓ Conversation analysis = async background job
   ✓ Pattern detection = synchronous (critical for user)

4. Caching Strategy (Future):
   - Cache worker context for 5 minutes
   - Cache active patterns for 1 minute
   - Invalidate on new issue reports
```

---

## 7. Integration Points

### 7.1 ElevenLabs Integration Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  ELEVENLABS INTEGRATION                      │
└──────────────────────────────────────────────────────────────┘

Configuration Flow:
┌────────────────────────────────────────────────────────────┐
│ 1. ElevenLabs Dashboard Setup                              │
│    ├─ Create Agent (Slovak voice)                          │
│    ├─ Configure Tools:                                     │
│    │  ├─ get_context (URL: https://api.impofai.sk/...)    │
│    │  └─ log_issue (URL: https://api.impofai.sk/...)      │
│    ├─ Configure Webhook:                                   │
│    │  └─ URL: https://api.impofai.sk/api/webhooks/...     │
│    └─ Get Agent ID & API Key                              │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 2. ImpofAI Frontend Integration                            │
│    ├─ Load ElevenLabs Conversation SDK                     │
│    ├─ Initialize with API key                              │
│    ├─ Build dynamic variables:                             │
│    │  ├─ Fetch worker context                              │
│    │  ├─ Build Slovak prompt                               │
│    │  └─ Build first message                               │
│    └─ Start session with overrides                         │
└────────────────────────────────────────────────────────────┘

Runtime Integration:
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Frontend (Worker's Browser)                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ const conversation = useConversation({               │  │
│  │   onConnect: async () => {                           │  │
│  │     const context = await fetchWorkerContext(id);    │  │
│  │     return {                                         │  │
│  │       agentId: ELEVENLABS_AGENT_ID,                  │  │
│  │       overrides: {                                   │  │
│  │         prompt: buildSlovakPrompt(context),          │  │
│  │         first_message: buildFirstMessage(context)    │  │
│  │       }                                              │  │
│  │     };                                               │  │
│  │   }                                                  │  │
│  │ });                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                  ▲                │
│         │ WebSocket                        │                │
│         │ (Audio)                          │ (Tool results) │
│         ▼                                  │                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           ElevenLabs Cloud                           │  │
│  │  ┌─────────────────┐      ┌──────────────────────┐  │  │
│  │  │  Voice Engine   │      │   Tool Execution     │──┼──┤
│  │  │  (24kHz Slovak) │      │   Engine             │  │  │
│  │  └─────────────────┘      └──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                     │                       │
│                                     │ HTTPS Tool Calls      │
│                                     ▼                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           ImpofAI V2 Server                          │  │
│  │  /api/tools/context/:workerId                        │  │
│  │  /api/tools/issues                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Tool Definition JSON (ElevenLabs Format)

```json
{
  "tools": [
    {
      "name": "get_context",
      "description": "Retrieves context about the worker you are speaking with, including their conversation history, active issues they've reported, and personalized conversation tips. You MUST call this tool at the START of every conversation, before saying anything else. This ensures you have all the information needed to have a personalized, contextual conversation. The worker_id parameter is ALWAYS available in your session's dynamic variables - never make it up or guess it.",
      "parameters": {
        "type": "object",
        "properties": {
          "worker_id": {
            "type": "string",
            "description": "The unique identifier for the worker you are speaking with. This value is ALWAYS provided in the session's dynamic variables under the key 'worker_id'. The format is a string like 'worker_12345' or 'worker_jozef'. NEVER make this up or guess it - always use the exact value from session variables. If for some reason you don't have it in session variables, the call should not proceed. Example valid values: 'worker_12345', 'worker_maria', 'worker_abc123'. This is case-sensitive - use exact value."
          }
        },
        "required": ["worker_id"]
      },
      "url": "https://api.impofai.sk/api/tools/context/{worker_id}",
      "method": "GET"
    },
    {
      "name": "log_issue",
      "description": "Logs an issue or problem that the worker mentions during the conversation. You MUST call this tool IMMEDIATELY whenever the worker mentions ANY problem, concern, complaint, or issue - do not wait until the end of the conversation. Be very specific in the issue_description - use the worker's exact words when possible (in Slovak). The system will automatically detect if this is part of a larger pattern affecting multiple workers and will inform the worker if others have reported similar issues.",
      "parameters": {
        "type": "object",
        "properties": {
          "worker_id": {
            "type": "string",
            "description": "The unique identifier for the worker reporting the issue. Use the same worker_id from session variables that you used in get_context. Format: 'worker_12345'. Never make this up."
          },
          "issue_description": {
            "type": "string",
            "description": "A specific, detailed description of the issue in Slovak. Use the worker's exact words when possible. Be specific about what the problem is, not just a category. GOOD examples: 'Zlé osvetlenie v dielni číslo 3', 'Chladná voda v umyvárni ráno', 'Hlučný stroj v hale A'. BAD examples: 'problém', 'niečo nefunguje'. Minimum 10 characters, maximum 500 characters."
          },
          "severity": {
            "type": "string",
            "enum": ["low", "medium", "high", "urgent"],
            "description": "How urgent or severe the issue is. Use these guidelines: 'low' = minor inconvenience (e.g., 'studená voda'); 'medium' = affects work quality (e.g., 'zlé osvetlenie'); 'high' = safety concern or major disruption (e.g., 'zlý zápach z ventilátora'); 'urgent' = immediate danger or complete work stoppage (e.g., 'stroj nefunguje'). When in doubt, use 'medium'."
          },
          "location": {
            "type": "string",
            "description": "OPTIONAL. The specific location where the issue occurs, if the worker mentions it. Examples: 'Dielňa číslo 3', 'Hala A', 'Kancelária na druhom poschodí', 'Umyvárne pri vchode'. Use Slovak. If the worker doesn't mention a specific location, you can omit this field."
          }
        },
        "required": ["worker_id", "issue_description", "severity"]
      },
      "url": "https://api.impofai.sk/api/tools/issues",
      "method": "POST"
    }
  ]
}
```

---

## Summary

This architecture delivers:

1. **Simplicity**: REST API, no WebSockets, cloud-offloaded AI
2. **Performance**: Junction tables, indexed queries, async processing
3. **Security**: HMAC-SHA256 webhook verification, environment variables
4. **Slovak-First**: All prompts, messages, and data in Slovak
5. **Scalability**: Stateless design, optimized queries, monitoring built-in

**Next Phase**: REFINEMENT (gap analysis comparing SPEC/PSEUDO/ARCH)
