# ImpofAI V2 - System Specification (SPARC)

**Version:** 2.0.0
**Last Updated:** November 19, 2025
**Status:** Deep Specification Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Core Requirements](#3-core-requirements)
4. [Architecture Overview](#4-architecture-overview)
5. [API Specification](#5-api-specification)
6. [Data Model](#6-data-model)
7. [ElevenLabs Integration](#7-elevenlabs-integration)
8. [Slovak Language Configuration](#8-slovak-language-configuration)
9. [Security & Privacy](#9-security--privacy)
10. [Performance Requirements](#10-performance-requirements)
11. [Success Metrics](#11-success-metrics)
12. [Dependencies](#12-dependencies)

---

## 1. Executive Summary

**ImpofAI V2** is a complete architectural redesign of ImpofAI, transitioning from OpenAI Realtime API to **ElevenLabs Conversational AI**. The system conducts voice interviews with Slovak-speaking employees to extract operational insights, detect patterns, and generate ROI-backed recommendations.

### Key Changes from V1

| Aspect | V1 (OpenAI) | V2 (ElevenLabs) |
|--------|-------------|-----------------|
| Voice Layer | OpenAI Realtime API (WebSocket) | ElevenLabs Conversational AI |
| Architecture | WebSocket management + audio streaming | Webhooks + REST APIs |
| Code Complexity | ~3000 lines | ~870 lines |
| Integration | Custom voice client | ElevenLabs cloud handles all voice |
| Tool Calling | N/A | Real-time function calling during calls |
| Slovak Support | OpenAI Whisper | ElevenLabs multilingual TTS/STT |

### Core Philosophy

**"Context-Aware & Real-Time"** - The AI knows who it's talking to BEFORE the call starts and logs issues THE MOMENT they're spoken.

---

## 2. System Overview

### 2.1 Purpose

ImpofAI V2 conducts structured voice interviews with employees to:
- Extract operational data about daily challenges
- Identify recurring issues and patterns
- Build knowledge graphs of company operations
- Generate actionable recommendations with ROI calculations
- Maintain conversation history for context-aware follow-ups

### 2.2 Target Users

- **Primary:** Slovak-speaking workers (warehouse, manufacturing, field teams)
- **Secondary:** Company management (insights dashboard)
- **Tertiary:** System administrators (agent configuration)

### 2.3 Core Value Proposition

Replace expensive consultants with an AI that:
- Speaks fluent Slovak with natural intonation
- Remembers every previous conversation
- Identifies patterns across hundreds of conversations
- Calculates business impact and ROI
- Works 24/7 at fraction of consultant costs

---

## 3. Core Requirements

### 3.1 Functional Requirements

#### FR-1: Voice Conversations
- **FR-1.1:** Conduct natural voice conversations in Slovak language
- **FR-1.2:** Support phone calls via ElevenLabs
- **FR-1.3:** Handle interruptions and turn-taking naturally
- **FR-1.4:** Maintain conversation context across multiple exchanges

#### FR-2: Context Awareness
- **FR-2.1:** Retrieve worker profile before call starts
- **FR-2.2:** Access conversation history in real-time
- **FR-2.3:** Reference active issues related to worker
- **FR-2.4:** Personalize greeting with worker name and role

#### FR-3: Real-Time Issue Logging
- **FR-3.1:** Log issues as soon as worker mentions them
- **FR-3.2:** Detect similar patterns and link to existing issues
- **FR-3.3:** Capture urgency, location, equipment details
- **FR-3.4:** Timestamp all logged issues accurately

#### FR-4: Post-Call Processing
- **FR-4.1:** Receive complete call transcript via webhook
- **FR-4.2:** Store transcripts in AgentDB
- **FR-4.3:** Extract metadata (topics, sentiment, duration)
- **FR-4.4:** Trigger pattern detection analysis

#### FR-5: Data Persistence
- **FR-5.1:** Store all conversations in SQLite database
- **FR-5.2:** Maintain worker profiles with engagement metrics
- **FR-5.3:** Track patterns and occurrence counts
- **FR-5.4:** Generate recommendations with ROI calculations

### 3.2 Non-Functional Requirements

#### NFR-1: Performance
- **NFR-1.1:** Tool call response time < 1000ms (critical)
- **NFR-1.2:** Database query latency < 200ms (typical)
- **NFR-1.3:** Webhook processing < 3 seconds
- **NFR-1.4:** Support 50+ concurrent calls (future)

#### NFR-2: Reliability
- **NFR-2.1:** 99% uptime during business hours
- **NFR-2.2:** Graceful degradation if database unavailable
- **NFR-2.3:** Automatic retry for failed tool calls (3x)
- **NFR-2.4:** Transaction rollback for failed operations

#### NFR-3: Scalability
- **NFR-3.1:** Handle 500+ workers without performance degradation
- **NFR-3.2:** Process 10,000+ conversations per month
- **NFR-3.3:** Store 5 years of conversation history
- **NFR-3.4:** Horizontal scaling via load balancer (future)

#### NFR-4: Security
- **NFR-4.1:** GDPR-compliant data storage
- **NFR-4.2:** Webhook signature verification
- **NFR-4.3:** API key rotation support
- **NFR-4.4:** Encrypted database backups

#### NFR-5: Usability
- **NFR-5.1:** Natural Slovak conversation (rated 8/10 by native speakers)
- **NFR-5.2:** Minimal worker training required
- **NFR-5.3:** Admin dashboard for configuration
- **NFR-5.4:** Clear error messages in Slovak

---

## 4. Architecture Overview

### 4.1 System Components

```
┌──────────────────────────────────────────────────────┐
│          User/Worker (Phone/Browser)                 │
│          Slovak Voice Input/Output                   │
└────────────────────┬─────────────────────────────────┘
                     │ Voice (WebRTC)
                     ▼
┌──────────────────────────────────────────────────────┐
│         ElevenLabs Cloud (Voice Layer)               │
│  ┌────────────────────────────────────────────────┐  │
│  │  • Speech-to-Text (Slovak STT)                 │  │
│  │  • Text-to-Speech (Slovak TTS)                 │  │
│  │  • LLM Processing (Claude/GPT)                 │  │
│  │  • Turn Detection & Dialog Management         │  │
│  └────────────────────────────────────────────────┘  │
└────────┬───────────────────────┬─────────────────────┘
         │ Webhooks (POST)       │ Tool Calls (GET/POST)
         ▼                       ▼
┌──────────────────────────────────────────────────────┐
│      ImpofAI V2 Server (Node.js + Express)           │
│  ┌────────────────────────────────────────────────┐  │
│  │  Webhook Handler:                              │  │
│  │   • Receive call transcripts                   │  │
│  │   • Store conversations                        │  │
│  │   • Trigger analytics                          │  │
│  ├────────────────────────────────────────────────┤  │
│  │  Tool Endpoints:                               │  │
│  │   • GET  /api/tools/context/:workerId         │  │
│  │   • POST /api/tools/issue                     │  │
│  ├────────────────────────────────────────────────┤  │
│  │  Admin API:                                    │  │
│  │   • GET  /api/workers                         │  │
│  │   • GET  /api/conversations                   │  │
│  │   • GET  /api/patterns                        │  │
│  └────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────┘
                     │ SQL Queries
                     ▼
┌──────────────────────────────────────────────────────┐
│          AgentDB (SQLite Database)                   │
│  ┌────────────────────────────────────────────────┐  │
│  │  Tables:                                       │  │
│  │   • conversations (transcripts + metadata)     │  │
│  │   • workers (profiles + engagement metrics)    │  │
│  │   • patterns (recurring issues)                │  │
│  │   • recommendations (ROI suggestions)          │  │
│  │   • knowledge_graph_entities                   │  │
│  │   • knowledge_graph_relationships              │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

#### 4.2.1 Pre-Call Context Retrieval
```
1. ElevenLabs agent starts
2. Agent calls GET /api/tools/context/{worker_id}
3. Server queries AgentDB for:
   - Worker profile (name, role, equipment)
   - Recent conversations
   - Active issues
4. Returns JSON context to ElevenLabs
5. Agent uses context to personalize greeting
```

#### 4.2.2 Real-Time Issue Logging
```
1. Worker mentions issue during call
2. Agent recognizes issue and calls POST /api/tools/issue
3. Server receives:
   - worker_id
   - issue_description
   - urgency, location, equipment
4. Server checks for similar patterns
5. Creates new pattern OR updates existing
6. Returns confirmation to agent
7. Agent acknowledges to worker
```

#### 4.2.3 Post-Call Processing
```
1. Call ends on ElevenLabs
2. ElevenLabs sends webhook POST /api/webhook/elevenlabs
3. Server receives:
   - call_id
   - transcript (full conversation)
   - duration, metadata
4. Server stores in conversations table
5. Server triggers async analysis:
   - Extract topics
   - Detect sentiment
   - Update worker metrics
   - Link to patterns
```

---

## 5. API Specification

### 5.1 Tool Endpoints (Called by ElevenLabs during call)

#### 5.1.1 Get Worker Context

**Purpose:** Provides background information about the worker to the AI agent before/during the call.

**Endpoint:** `GET /api/tools/context/:workerId`

**Request:**
```http
GET /api/tools/context/worker_12345 HTTP/1.1
Host: your-server.com
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "worker_id": "worker_12345",
  "context": {
    "worker": {
      "id": "worker_12345",
      "name": "Jozef Novák",
      "role": "Forklift Operator",
      "total_conversations": 12,
      "last_conversation": "2025-11-15T10:30:00Z",
      "average_sentiment": "neutral",
      "preferred_language": "sk-SK"
    },
    "recent_conversations": [
      {
        "date": "2025-11-15T10:30:00Z",
        "topics": ["equipment_maintenance", "daily_routine"],
        "sentiment": "positive"
      },
      {
        "date": "2025-11-10T14:20:00Z",
        "topics": ["staffing_issues", "overtime"],
        "sentiment": "frustrated"
      }
    ],
    "active_issues": [
      {
        "id": "pattern_001",
        "type": "equipment",
        "description": "Forklift brakes squeaking",
        "location": "Warehouse A",
        "urgency": "medium"
      }
    ],
    "conversation_tips": [
      "Follow up on forklift brake issue from last week",
      "Ask about overtime situation mentioned previously",
      "Worker prefers direct, concise questions"
    ]
  }
}
```

**Response (Worker Not Found - 200 OK with flag):**
```json
{
  "success": true,
  "worker_id": "unknown",
  "context": {
    "is_new_worker": true,
    "message": "New worker - no previous context available",
    "suggested_greeting": "Ahoj! Vitajte v ImpofAI. Som váš AI asistent. Ako sa voláte?"
  }
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "error": "Failed to retrieve context",
  "message": "Database connection failed"
}
```

**Performance Requirements:**
- Response time: < 1000ms (critical - agent is waiting)
- Timeout: 5000ms (agent will proceed without context if exceeded)
- Retry: Agent may retry once if timeout

---

#### 5.1.2 Log Issue

**Purpose:** Allows the AI agent to log issues/problems reported by workers in real-time during the conversation.

**Endpoint:** `POST /api/tools/issue`

**Request:**
```http
POST /api/tools/issue HTTP/1.1
Host: your-server.com
Content-Type: application/json

{
  "worker_id": "worker_12345",
  "issue_description": "Scanner battery dies after 2 hours",
  "urgency": "high",
  "location": "Warehouse A",
  "equipment": "Scanner_55",
  "sentiment": "frustrated",
  "conversation_id": "conv_abc123"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `worker_id` | string | Yes | Worker identifier |
| `issue_description` | string | Yes | Plain text description of the issue |
| `urgency` | string | No | One of: "low", "medium", "high" (default: "medium") |
| `location` | string | No | Physical location (e.g., "Warehouse A", "Loading Dock") |
| `equipment` | string | No | Equipment identifier or name |
| `sentiment` | string | No | Worker's emotional state: "neutral", "frustrated", "angry", "concerned" |
| `conversation_id` | string | No | Link to conversation where issue was mentioned |

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "issue_id": "pattern_042",
  "message": "Issue logged successfully",
  "pattern_status": "updated_existing",
  "occurrence_count": 3,
  "affected_workers_count": 2
}
```

**Response (Error - 500):**
```json
{
  "success": false,
  "error": "Failed to log issue",
  "message": "Database write failed"
}
```

**Behavior:**
- If similar issue exists → increment occurrence count, add worker to affected list
- If new issue → create new pattern with occurrence_count = 1
- Returns immediately (< 500ms) with confirmation

---

### 5.2 Webhook Endpoint (Called by ElevenLabs after call)

#### 5.2.1 Call Transcript Webhook

**Purpose:** Receives complete call transcript and metadata after the call ends.

**Endpoint:** `POST /api/webhook/elevenlabs`

**Request from ElevenLabs:**
```http
POST /api/webhook/elevenlabs HTTP/1.1
Host: your-server.com
Content-Type: application/json
X-ElevenLabs-Signature: sha256=abc123...

{
  "call_id": "call_xyz789",
  "agent_id": "agent_01jvmgt8e9fv18dstm404gks7p",
  "phone_number": "+421912345678",
  "started_at": "2025-11-19T10:00:00Z",
  "ended_at": "2025-11-19T10:05:30Z",
  "duration_seconds": 330,
  "transcript": [
    {
      "role": "agent",
      "text": "Ahoj Jozef! Ako sa dnes máš?",
      "timestamp": "2025-11-19T10:00:05Z"
    },
    {
      "role": "user",
      "text": "Ahoj, dobre, len ten skener mi zase nefunguje.",
      "timestamp": "2025-11-19T10:00:12Z"
    },
    {
      "role": "agent",
      "text": "Chápem. Môžeš mi povedať viac o tom probléme so skenerom?",
      "timestamp": "2025-11-19T10:00:20Z"
    }
    // ... more turns
  ],
  "metadata": {
    "worker_id": "worker_12345",
    "language": "sk-SK",
    "sentiment_overall": "neutral",
    "topics_detected": ["equipment_issues", "daily_operations"]
  }
}
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "conversation_id": "conv_abc123",
  "message": "Conversation stored successfully"
}
```

**Processing:**
1. Verify webhook signature (security)
2. Store conversation in database
3. Extract metadata (topics, sentiment)
4. Update worker engagement metrics
5. Link to existing patterns
6. Trigger async analysis (optional)

**Performance:**
- Must respond within 10 seconds
- Heavy processing should be async

---

### 5.3 Admin API Endpoints

#### 5.3.1 List Workers
```http
GET /api/workers
Response: Array of worker profiles
```

#### 5.3.2 List Conversations
```http
GET /api/conversations?limit=50&offset=0
Response: Paginated conversation list
```

#### 5.3.3 List Patterns
```http
GET /api/patterns?status=active
Response: Array of detected patterns
```

---

## 6. Data Model

### 6.1 Database Schema

#### 6.1.1 `conversations` Table
Stores complete call transcripts and metadata.

```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT UNIQUE NOT NULL,
  worker_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  call_id TEXT,                     -- ElevenLabs call ID

  -- Timestamps
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  duration_seconds INTEGER,

  -- Content
  transcript TEXT NOT NULL,         -- JSON array of turns
  audio_url TEXT,                   -- Optional audio recording URL

  -- Analysis
  topics TEXT,                      -- JSON array
  issues TEXT,                      -- JSON array
  sentiment TEXT,                   -- overall: positive/neutral/negative/frustrated
  urgency TEXT,                     -- low/medium/high
  location TEXT,
  equipment_mentioned TEXT,         -- JSON array
  people_mentioned TEXT,            -- JSON array

  -- Metrics
  worker_turns INTEGER DEFAULT 0,
  agent_turns INTEGER DEFAULT 0,
  information_completeness REAL DEFAULT 0.0,

  -- Learning
  processed_by_nightly BOOLEAN DEFAULT FALSE,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (worker_id) REFERENCES workers(worker_id)
);

CREATE INDEX idx_conversations_worker ON conversations(worker_id);
CREATE INDEX idx_conversations_date ON conversations(started_at);
CREATE INDEX idx_conversations_call_id ON conversations(call_id);
```

#### 6.1.2 `workers` Table
Employee profiles and engagement metrics.

```sql
CREATE TABLE workers (
  worker_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,

  -- Engagement
  total_conversations INTEGER DEFAULT 0,
  last_conversation_at DATETIME,
  average_sentiment TEXT,

  -- Preferences
  preferred_language TEXT DEFAULT 'sk-SK',
  communication_style TEXT,           -- concise/detailed/friendly

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
);
```

#### 6.1.3 `patterns` Table
Recurring issues detected across conversations.

```sql
CREATE TABLE patterns (
  pattern_id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL,         -- equipment/process/staffing/safety

  -- Details
  issue_description TEXT NOT NULL,
  location TEXT,
  equipment TEXT,

  -- Occurrence
  first_occurrence DATETIME NOT NULL,
  last_occurrence DATETIME NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  affected_workers TEXT,              -- JSON array of worker_ids

  -- Impact
  urgency_level TEXT,                 -- low/medium/high
  sentiment_trend TEXT,               -- improving/stable/worsening
  estimated_hours_lost_per_day REAL,
  estimated_daily_cost REAL,
  estimated_weekly_cost REAL,

  -- Status
  status TEXT DEFAULT 'active',      -- active/resolved/monitoring
  resolved_at DATETIME,
  resolution_notes TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 6.1.4 `recommendations` Table
ROI-backed action suggestions.

```sql
CREATE TABLE recommendations (
  recommendation_id TEXT PRIMARY KEY,
  pattern_id TEXT,

  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT NOT NULL,

  -- Priority
  priority INTEGER NOT NULL,          -- 1-5 scale
  urgency TEXT NOT NULL,

  -- ROI
  investment_required REAL,
  estimated_savings_per_day REAL,
  payback_period_days INTEGER,
  annual_roi_percentage REAL,

  -- Impact
  affected_workers_count INTEGER,
  affected_locations TEXT,            -- JSON array
  business_impact_score REAL,

  -- Status
  status TEXT DEFAULT 'pending',     -- pending/approved/rejected/completed
  approved_at DATETIME,
  approved_by TEXT,
  completed_at DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pattern_id) REFERENCES patterns(pattern_id)
);
```

### 6.2 Data Relationships

```
workers (1) ──→ (N) conversations
patterns (1) ──→ (N) recommendations
workers (N) ←──→ (N) patterns (via affected_workers JSON array)
conversations (N) ──→ (N) patterns (via issues JSON array)
```

---

## 7. ElevenLabs Integration

### 7.1 Agent Configuration

#### 7.1.1 Agent Settings (Dashboard)

**Basic Settings:**
- Agent Name: "ImpofAI V2 - Slovak Interview Agent"
- Language: Slovak (sk-SK)
- Base Model: Claude 3.5 Sonnet (recommended for Slovak)
- Voice: Premium Slovak voice (TBD after testing)

**System Prompt (Static Fallback):**
```
You are ImpofAI, an AI assistant that helps companies understand their operations by conducting friendly conversations with employees in Slovak.

Your primary goals:
1. Build rapport and make the worker feel comfortable
2. Ask about their daily work and any challenges they face
3. Listen carefully and ask thoughtful follow-up questions
4. Log any issues they mention using the log_issue tool
5. End conversations politely after 5-7 minutes

Guidelines:
- Always speak in Slovak
- Use informal "ty" form (not formal "vy")
- Keep responses concise (2-3 sentences max)
- Ask one question at a time
- Be empathetic when workers mention problems
- Never make promises you can't keep
```

#### 7.1.2 Tool Definitions

**Tool 1: get_context**

```json
{
  "name": "get_context",
  "description": "Retrieves background information about the worker including their name, role, previous conversations, and active issues. Use this at the start of EVERY conversation to personalize the greeting.",
  "parameters": {
    "type": "object",
    "properties": {
      "worker_id": {
        "type": "string",
        "description": "The unique identifier for the worker. This will be provided in the session variables."
      }
    },
    "required": ["worker_id"]
  },
  "execution_mode": "post_speech",
  "timeout_seconds": 5,
  "endpoint": "https://your-server.com/api/tools/context/{worker_id}"
}
```

**Tool 2: log_issue**

```json
{
  "name": "log_issue",
  "description": "Logs a problem or issue reported by the worker. Use this IMMEDIATELY when the worker mentions ANY problem, complaint, or challenge. Be specific in the description.",
  "parameters": {
    "type": "object",
    "properties": {
      "worker_id": {
        "type": "string",
        "description": "The worker's ID from session variables"
      },
      "issue_description": {
        "type": "string",
        "description": "Clear, detailed description of the problem in Slovak. Example: 'Skener má slabú batériu a vydrží len 2 hodiny'"
      },
      "urgency": {
        "type": "string",
        "enum": ["low", "medium", "high"],
        "description": "How urgent is this issue: low (minor inconvenience), medium (affects work), high (critical/safety)"
      },
      "location": {
        "type": "string",
        "description": "Where the issue occurs. Example: 'Sklad A', 'Nakládacia rampa', 'Kancelária'"
      },
      "equipment": {
        "type": "string",
        "description": "Equipment or tool involved. Example: 'Skener 55', 'Vysokozdvižný vozík B', 'Tlačiareň'"
      }
    },
    "required": ["worker_id", "issue_description"]
  },
  "execution_mode": "post_speech",
  "timeout_seconds": 10,
  "endpoint": "https://your-server.com/api/tools/issue"
}
```

#### 7.1.3 Dynamic Variables (Runtime)

ElevenLabs supports dynamic variable override via `startSession()` API call. For ImpofAI V2, we use:

```typescript
const dynamicVariables = {
  // Identification
  worker_id: "worker_12345",

  // Context for prompt
  worker_name: "Jozef",
  worker_role: "Vodič vysokozdvižného vozíka",
  last_conversation_date: "15. novembra",
  active_issues_summary: "Má problém s brzdami na vozíku",

  // Behavior override
  prompt: `[Generated Slovak prompt with personalized context]`,
  first_message: "Ahoj Jozef! Ako sa dnes máš? Funguje ti už lepšie ten vysokozdvižný vozík?"
};

await conversation.startSession({
  agentId: process.env.ELEVENLABS_AGENT_ID,
  dynamicVariables: dynamicVariables
});
```

### 7.2 Tool Calling Best Practices

Based on ElevenLabs quirks research:

#### 7.2.1 Schema Design Rules
1. **Use snake_case only** for parameter names (not camelCase)
2. **Define everything as `string` type** (even numbers) - parse defensively
3. **Always use `enum` with explicit values** for limited choices
4. **Keep descriptions ridiculously explicit** (2-4 sentences + examples)
5. **Avoid nested objects** - keep schemas flat
6. **Set realistic timeouts** per tool (5-30 seconds)
7. **Use `execution_mode: "post_speech"`** for DB operations

#### 7.2.2 Error Handling
- Always return `{ "success": true/false, ... }` format
- Provide user-friendly error messages (in Slovak)
- Never let tool failures break the conversation
- Log all tool errors for debugging

#### 7.2.3 Performance Optimization
- Keep tool responses < 1000ms for real-time feel
- Use database indexes on frequently queried fields
- Cache worker context for duration of call
- Respond immediately, process analytics async

---

## 8. Slovak Language Configuration

### 8.1 Prompt Templates

#### 8.1.1 Standard Interview Prompt (Slovak)

```slovak
Si ImpofAI, priateľský AI asistent ktorý pomáha firmám lepšie porozumieť ich prevádzke.
Tvoja úloha je viesť prirodzený rozhovor so zamestnancom {{worker_name}}, ktorý pracuje ako {{worker_role}}.

KONTEXTOVÉ INFORMÁCIE:
- Meno: {{worker_name}}
- Pozícia: {{worker_role}}
- Posledný rozhovor: {{last_conversation_date}}
- Aktuálne problémy: {{active_issues_summary}}

TVOJE CIELE:
1. Vytvor priateľskú atmosféru a daj zamestnancovi pocit, že ho počúvaš
2. Opýtaj sa na jeho dennú prácu a výzvy, ktorým čelí
3. Pozorne počúvaj a kladiem premyslené následné otázky
4. KEĎ spomenie AKÝKOĽVEK problém, OKAMŽITE použi funkciu log_issue
5. Rozhovor ukončí slušne po 5-7 minútach

PRAVIDLÁ KOMUNIKÁCIE:
- Vždy hovor po slovensky
- Používaj neformálne "ty" (nie formálne "vy")
- Odpovedaj stručne (maximálne 2-3 vety)
- Polož vždy iba jednu otázku naraz
- Buď empatický, keď spomína problémy
- Nikdy nesľubuj veci, ktoré nemôžeš splniť
- Nezabudni sa na konci rozhovoru pekne rozlúčiť

DÔLEŽITÉ: Na začiatku KAŽDÉHO rozhovoru použi funkciu get_context aby si získal aktuálne informácie o zamestnancovi.
```

#### 8.1.2 First Message Templates

**For New Worker:**
```slovak
Ahoj! Volám sa ImpofAI a som tvoj AI asistent. Veľmi ma teší, že sa poznávame.
Ako sa voláš a čo robíš v tejto firme?
```

**For Returning Worker (No Issues):**
```slovak
Ahoj {{worker_name}}! Ako sa dnes máš? Naposledy sme sa rozprávali {{last_conversation_date}}.
Čo nové sa udialo od tej doby?
```

**For Returning Worker (With Active Issue):**
```slovak
Ahoj {{worker_name}}! Ako sa máš? Pamätám si, že si spomínal {{active_issue_summary}}.
Už sa to vyriešilo alebo je to stále problém?
```

### 8.2 Slovak Voice Selection

ElevenLabs offers multiple Slovak voices. Testing criteria:
- Natural intonation
- Clear pronunciation
- Appropriate tone (friendly but professional)
- Good handling of technical terms

Recommended: Test with actual Slovak-speaking workers before final selection.

### 8.3 Slovak-Specific Considerations

**Formality:**
- Use "ty" (informal) for workers - builds rapport
- Use "vy" (formal) only if worker is executive

**Technical Terms:**
- Keep equipment names in Slovak when possible
- Accept both Slovak and English terms (e.g., "skener" vs "scanner")

**Regional Dialects:**
- Standard Slovak (spisovná slovenčina) for agent
- Accept regional variations from workers

---

## 9. Security & Privacy

### 9.1 Data Protection

- **GDPR Compliance:** All data stored on company servers (EU/Slovakia)
- **Data Minimization:** Store only necessary conversation data
- **Retention Policy:** Delete conversations after 5 years (configurable)
- **Anonymization:** Worker names can be pseudonymized for analytics

### 9.2 Access Control

- **API Keys:** Rotate every 90 days
- **Webhook Verification:** Validate ElevenLabs signatures
- **Database Encryption:** SQLite encryption at rest
- **TLS/HTTPS:** All API endpoints HTTPS only

### 9.3 Privacy Features

- **Opt-out:** Workers can request data deletion
- **Audit Logs:** Track all data access
- **No Recording:** Audio not stored by default (optional)

---

## 10. Performance Requirements

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Tool Call Response Time | < 800ms | < 1000ms |
| Database Query Time | < 100ms | < 200ms |
| Webhook Processing | < 2s | < 10s |
| API Availability | 99.5% | 99% |
| Concurrent Calls | 50+ | 20+ |

---

## 11. Success Metrics

### 11.1 Engagement Metrics
- **Adoption Rate:** 70%+ of workers use ImpofAI monthly
- **Average Conversations:** 2-3 per worker per month
- **Completion Rate:** 80%+ conversations reach natural end

### 11.2 Quality Metrics
- **Transcription Accuracy:** 95%+ for Slovak
- **Context Relevance:** Agent mentions context in 100% of calls
- **Issue Detection:** 90%+ of issues successfully logged

### 11.3 Business Metrics
- **Patterns Identified:** 50+ unique patterns per month
- **Recommendations Generated:** 10+ actionable recommendations per month
- **ROI Positive:** 80%+ of implemented recommendations show positive ROI

---

## 12. Dependencies

### 12.1 External Services
- **ElevenLabs:** Conversational AI platform (critical)
- **ngrok:** Development tunneling (dev only)
- **Future:** SMS/Voice gateway for phone calls

### 12.2 NPM Packages
- `express` ^4.18.2 - Web framework
- `better-sqlite3` ^11.8.1 - Database
- `agentdb` ^1.6.1 - AI memory/learning (optional)
- `dotenv` ^16.3.1 - Environment config
- `cors` ^2.8.5 - CORS handling

### 12.3 Infrastructure
- **Node.js:** 18+ required
- **SQLite:** 3.35+ with WAL mode
- **Server:** Linux VPS (Ubuntu 22.04 LTS)
- **Reverse Proxy:** Nginx (optional)

---

## Appendix A: Migration from V1

### A.1 What We Keep
- AgentDB database schema (adapted)
- Pattern detection logic
- ROI calculation algorithms
- Admin dashboard structure

### A.2 What We Remove
- OpenAI Realtime Client (237 lines)
- RealtimeWebSocketServer (371 lines)
- WebSocket complexity
- Audio streaming code

### A.3 Migration Steps
1. Export V1 data (conversations, workers, patterns)
2. Run V2 database migrations
3. Import historical data
4. Configure ElevenLabs agent
5. Run parallel for 2 weeks
6. Deprecate V1

---

## Appendix B: ElevenLabs Webhook Payload Examples

See research documents for complete examples.

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-19 | Initial deep specification |

---

**END OF SPECIFICATION**
