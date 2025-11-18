# 🏗️ ImpofAI - System Architecture

**SPARC Phase 3: Architecture**
**Version:** 1.1
**Date:** 2025-01-18
**Status:** ✅ Complete (Reviewed & Refined)

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Specification](#api-specification)
6. [Component Architecture](#component-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Security Architecture](#security-architecture)
9. [Database Backup & Recovery](#database-backup--recovery)
10. [Integration Guide](#integration-guide)
11. [Scaling Strategy](#scaling-strategy)

---

## 1. System Overview

### 1.1 High-Level Architecture

ImpofAI is a **business intelligence platform** that uses AI voice conversations in Slovak to gather insights from workers and generate actionable recommendations for companies.

**Core Architecture Pattern:** Event-Driven Microservices

```
┌─────────────────────────────────────────────────────────────┐
│                        ImpofAI Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Voice Layer │  │ Learning     │  │  Analytics   │      │
│  │              │  │ Layer        │  │  Layer       │      │
│  │ - OpenAI API │  │ - AgentDB    │  │ - Patterns   │      │
│  │ - MidStream  │  │ - Memory     │  │ - ROI Calc   │      │
│  │ - WebSocket  │  │ - Skills     │  │ - Reports    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                  ┌─────────▼─────────┐                       │
│                  │   Data Layer      │                       │
│                  │   (AgentDB +      │                       │
│                  │    SQLite)        │                       │
│                  └─────────┬─────────┘                       │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │  Admin       │  │  Worker      │  │  Public      │      │
│  │  Dashboard   │  │  Interface   │  │  API         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 System Characteristics

- **Primary Language:** Slovak (sk-SK)
- **Runtime:** Node.js 18+ (ES Modules)
- **Database:** SQLite 3.44+ (via AgentDB)
- **Voice Processing:** OpenAI Realtime API (WebSocket)
- **Real-time Analysis:** MidStream (Rust + TypeScript)
- **Deployment:** Hetzner VPS (Ubuntu 22.04 LTS)
- **Web Server:** Nginx (reverse proxy)
- **Process Manager:** PM2

---

## 2. Architecture Diagram

### 2.1 Component Interaction Flow

```
┌────────────┐
│   Worker   │ (Slovak voice call)
│   Phone    │
└─────┬──────┘
      │ WebRTC/Phone
      ▼
┌─────────────────────────────────────────────┐
│        Voice Conversation Manager           │
│  ┌────────────────────────────────────┐     │
│  │  OpenAI Realtime API (WebSocket)   │     │
│  │  Model: gpt-4o-realtime-preview    │     │
│  │  Language: sk-SK                   │     │
│  └────────────┬───────────────────────┘     │
│               │                              │
│  ┌────────────▼───────────────────────┐     │
│  │     MidStream (Real-time)          │     │
│  │  - Turn-by-turn analysis           │     │
│  │  - Context tracking                │     │
│  │  - Suggestion generation           │     │
│  └────────────┬───────────────────────┘     │
└───────────────┼─────────────────────────────┘
                │ (transcript + analysis)
                ▼
┌─────────────────────────────────────────────┐
│      Conversation Strategy Planner          │
│  (toggleable, strictness: 1-10)             │
│  - Generate conversation plan               │
│  - Track information gathered               │
│  - Suggest next questions                   │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│         AgentDB (Storage + Learning)        │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Conversation Storage                │  │
│  │  - Transcript (JSON)                 │  │
│  │  - Worker profile                    │  │
│  │  - Metadata (sentiment, urgency)     │  │
│  └──────────────┬───────────────────────┘  │
│                 │                           │
│  ┌──────────────▼───────────────────────┐  │
│  │  Learning Components (Nightly)       │  │
│  │  - NightlyLearner                    │  │
│  │  - ReflexionMemory                   │  │
│  │  - SkillLibrary                      │  │
│  │  - CausalMemoryGraph                 │  │
│  └──────────────┬───────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Analytics Engine                    │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Knowledge Graph Builder             │  │
│  │  - Entity extraction                 │  │
│  │  - Relationship mapping              │  │
│  │  - Centrality scoring                │  │
│  └──────────────┬───────────────────────┘  │
│                 │                           │
│  ┌──────────────▼───────────────────────┐  │
│  │  Pattern Engine                      │  │
│  │  - Issue clustering                  │  │
│  │  - Temporal patterns                 │  │
│  │  - Spatial patterns                  │  │
│  └──────────────┬───────────────────────┘  │
│                 │                           │
│  ┌──────────────▼───────────────────────┐  │
│  │  Recommendation Generator            │  │
│  │  - Priority calculation              │  │
│  │  - ROI analysis                      │  │
│  │  - Action suggestions                │  │
│  └──────────────┬───────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           Admin Dashboard                   │
│  - View insights                            │
│  - Configure voice agent                    │
│  - Generate reports                         │
│  - Monitor patterns                         │
└─────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Primary Flow:** Voice → Analysis → Storage → Learning → Insights → Dashboard

1. **Voice Input:** Worker calls, OpenAI converts Slovak speech to text
2. **Real-time Analysis:** MidStream processes turn-by-turn
3. **Strategy Planning:** Conversation Planner guides questions (if enabled)
4. **Storage:** AgentDB stores conversation + metadata
5. **Nightly Learning:** Learning components analyze patterns
6. **Analytics:** Knowledge graph + pattern detection + ROI calculations
7. **Output:** Dashboard displays insights + recommendations

---

## 3. Technology Stack

### 3.1 Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 18.x LTS | Server-side execution |
| **Database** | AgentDB | 1.6.1 | AI agent memory + learning |
| **Database Engine** | SQLite | 3.44+ | Embedded SQL database |
| **Voice AI** | OpenAI Realtime API | gpt-4o-realtime-preview | Slovak voice conversations |
| **Analysis** | MidStream | Latest | Real-time conversation analysis |
| **Web Server** | Nginx | 1.18+ | Reverse proxy + static files |
| **Process Manager** | PM2 | Latest | Node.js process management |
| **Frontend** | Vanilla JS | ES6+ | Dashboard UI |
| **Charts** | Chart.js | 4.x | Data visualization |

### 3.2 npm Dependencies

```json
{
  "dependencies": {
    "agentdb": "^1.6.1",
    "openai": "^4.73.0",
    "better-sqlite3": "^11.8.1",
    "midstream": "latest",
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "dotenv": "^16.3.1",
    "zod": "^3.22.4",
    "dompurify": "^3.0.8",
    "isomorphic-dompurify": "^2.9.0",
    "csurf": "^1.11.0",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "bcrypt": "^5.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 3.3 External Services

- **OpenAI API:** Voice conversations (gpt-4o-realtime-preview)
- **OpenAI Embeddings:** Semantic search (text-embedding-3-small)
- **Hetzner Cloud:** VPS hosting (CX21 or higher)

---

## 4. Database Schema

### 4.1 Core Tables

#### **conversations**
Stores all voice conversations with full transcripts and analysis.

```sql
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT UNIQUE NOT NULL,
  worker_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  duration_seconds INTEGER,

  -- Transcript data
  transcript TEXT NOT NULL, -- JSON array of turns
  audio_url TEXT, -- Optional: recorded audio

  -- Analysis metadata
  topics TEXT, -- JSON array: ["equipment", "safety"]
  issues TEXT, -- JSON array: ["Scanner malfunction"]
  sentiment TEXT, -- "positive", "negative", "neutral", "urgent", "frustrated"
  urgency TEXT, -- "low", "medium", "high", "critical"
  location TEXT, -- "Warehouse, aisle 5"
  equipment_mentioned TEXT, -- JSON array
  people_mentioned TEXT, -- JSON array

  -- Conversation metrics
  worker_turns INTEGER DEFAULT 0,
  agent_turns INTEGER DEFAULT 0,
  information_completeness REAL DEFAULT 0.0, -- 0.0 to 1.0

  -- Conversation strategy
  plan_used BOOLEAN DEFAULT FALSE,
  plan_id TEXT,
  plan_completeness REAL,

  -- Learning flags
  processed_by_nightly BOOLEAN DEFAULT FALSE,
  included_in_skill_library BOOLEAN DEFAULT FALSE,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (worker_id) REFERENCES workers(worker_id)
);

CREATE INDEX idx_conversations_worker ON conversations(worker_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_date ON conversations(started_at);
CREATE INDEX idx_conversations_sentiment ON conversations(sentiment);
CREATE INDEX idx_conversations_urgency ON conversations(urgency);
CREATE INDEX idx_conversations_processed ON conversations(processed_by_nightly);
CREATE INDEX idx_conversations_location ON conversations(location);
-- Note: For JSON array searches (topics, issues), use JSON_EXTRACT in queries with function-based indexes
```

#### **workers**
Stores worker profiles and engagement metrics.

```sql
CREATE TABLE workers (
  worker_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- "warehouse", "delivery", "production", "maintenance"
  phone_number TEXT,
  email TEXT,

  -- Engagement metrics
  total_conversations INTEGER DEFAULT 0,
  last_conversation_at DATETIME,
  average_sentiment TEXT,

  -- Worker preferences (learned over time)
  preferred_language TEXT DEFAULT 'sk-SK',
  communication_style TEXT, -- "casual", "formal", "technical"

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_workers_role ON workers(role);
CREATE INDEX idx_workers_active ON workers(active);
```

#### **patterns**
Stores detected patterns from multiple conversations.

```sql
CREATE TABLE patterns (
  pattern_id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL, -- "issue_cluster", "temporal", "spatial"

  -- Pattern details
  issue_description TEXT NOT NULL,
  location TEXT,
  equipment TEXT,

  -- Occurrence data
  first_occurrence DATETIME NOT NULL,
  last_occurrence DATETIME NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  affected_workers TEXT, -- JSON array of worker_ids

  -- Impact metrics
  urgency_level TEXT, -- "low", "medium", "high", "critical"
  sentiment_trend TEXT, -- "improving", "stable", "worsening"

  -- Business impact (calculated)
  estimated_hours_lost_per_day REAL,
  estimated_daily_cost REAL,
  estimated_weekly_cost REAL,

  -- Status
  status TEXT DEFAULT 'active', -- "active", "investigating", "resolved", "archived"
  resolved_at DATETIME,
  resolution_notes TEXT,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patterns_type ON patterns(pattern_type);
CREATE INDEX idx_patterns_location ON patterns(location);
CREATE INDEX idx_patterns_status ON patterns(status);
CREATE INDEX idx_patterns_urgency ON patterns(urgency_level);
```

#### **recommendations**
Stores generated recommendations with ROI calculations.

```sql
CREATE TABLE recommendations (
  recommendation_id TEXT PRIMARY KEY,
  pattern_id TEXT,

  -- Recommendation content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT NOT NULL,

  -- Priority
  priority INTEGER NOT NULL, -- 1 (highest) to 10 (lowest)
  urgency TEXT NOT NULL, -- "immediate", "this_week", "this_month", "long_term"

  -- ROI calculation
  investment_required REAL, -- Cost to fix (€)
  estimated_savings_per_day REAL, -- Daily savings (€)
  payback_period_days INTEGER, -- Days to break even
  annual_roi_percentage REAL, -- Annual ROI %

  -- Impact
  affected_workers_count INTEGER,
  affected_locations TEXT, -- JSON array
  business_impact_score REAL, -- 0-100

  -- Status
  status TEXT DEFAULT 'pending', -- "pending", "approved", "in_progress", "completed", "rejected"
  approved_at DATETIME,
  approved_by TEXT, -- Admin user ID
  completed_at DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (pattern_id) REFERENCES patterns(pattern_id)
);

CREATE INDEX idx_recommendations_pattern ON recommendations(pattern_id);
CREATE INDEX idx_recommendations_priority ON recommendations(priority);
CREATE INDEX idx_recommendations_status ON recommendations(status);
CREATE INDEX idx_recommendations_urgency ON recommendations(urgency);
```

#### **knowledge_graph_entities**
Stores entities extracted from conversations.

```sql
CREATE TABLE knowledge_graph_entities (
  entity_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- "equipment", "location", "person", "process", "issue"
  name TEXT NOT NULL,

  -- Graph metrics
  mention_count INTEGER DEFAULT 1,
  centrality_score REAL DEFAULT 0.0, -- PageRank-style centrality

  -- Metadata
  first_mentioned DATETIME NOT NULL,
  last_mentioned DATETIME NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kg_entities_type ON knowledge_graph_entities(entity_type);
CREATE INDEX idx_kg_entities_centrality ON knowledge_graph_entities(centrality_score);
```

#### **knowledge_graph_relationships**
Stores relationships between entities.

```sql
CREATE TABLE knowledge_graph_relationships (
  relationship_id TEXT PRIMARY KEY,
  source_entity_id TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL, -- "located_in", "uses", "reports", "affects", "causes"

  -- Relationship strength
  co_occurrence_count INTEGER DEFAULT 1,
  strength REAL DEFAULT 1.0, -- Relationship strength (0-1)

  -- Temporal data
  first_observed DATETIME NOT NULL,
  last_observed DATETIME NOT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (source_entity_id) REFERENCES knowledge_graph_entities(entity_id),
  FOREIGN KEY (target_entity_id) REFERENCES knowledge_graph_entities(entity_id)
);

CREATE INDEX idx_kg_rel_source ON knowledge_graph_relationships(source_entity_id);
CREATE INDEX idx_kg_rel_target ON knowledge_graph_relationships(target_entity_id);
CREATE INDEX idx_kg_rel_type ON knowledge_graph_relationships(relationship_type);
```

### 4.2 Configuration Tables

#### **voice_agent_config**
Stores voice agent configuration (versioned).

```sql
CREATE TABLE voice_agent_config (
  config_id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,

  -- Conversation Planner
  planner_enabled BOOLEAN DEFAULT TRUE,
  planner_strictness INTEGER DEFAULT 5, -- 1-10

  -- Question Style
  question_style TEXT DEFAULT 'balanced', -- "casual", "balanced", "structured"

  -- Learning Features
  reflexion_memory_enabled BOOLEAN DEFAULT TRUE,
  skill_library_enabled BOOLEAN DEFAULT TRUE,

  -- Conversation Parameters
  target_duration_minutes INTEGER DEFAULT 5,
  max_follow_ups INTEGER DEFAULT 3,

  -- Language Tuning
  formality_level TEXT DEFAULT 'balanced', -- "casual", "balanced", "formal"
  use_colloquial_slovak BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT FALSE,
  created_by TEXT -- Admin user ID
);

CREATE INDEX idx_config_company ON voice_agent_config(company_id);
CREATE INDEX idx_config_active ON voice_agent_config(active);
```

### 4.3 AgentDB Learning Tables

AgentDB automatically creates these tables:

- `reflexion_memory` - AI self-improvement critiques
- `skill_library` - Consolidated successful patterns
- `causal_memory_graph` - Cause-effect relationships
- `nightly_learner_results` - Overnight learning results
- `embeddings` - Vector embeddings for semantic search

---

## 5. API Specification

### 5.1 RESTful API Endpoints

**Base URL:** `https://impofai.yourdomain.com/api/v1`

#### **Voice Conversations**

```
POST   /conversations/start
POST   /conversations/:id/end
GET    /conversations/:id
GET    /conversations
DELETE /conversations/:id
```

**Example: Start Conversation**

```http
POST /api/v1/conversations/start
Content-Type: application/json

{
  "workerId": "WORKER-001",
  "workerPhone": "+421901234567"
}

Response 200 (Success):
{
  "sessionId": "uuid-v4",
  "conversationId": "uuid-v4",
  "status": "connected",
  "websocketUrl": "wss://impofai.yourdomain.com/voice/session-id"
}

Response 400 (Bad Request):
{
  "error": "Invalid request",
  "message": "workerId is required",
  "code": "VALIDATION_ERROR"
}

Response 401 (Unauthorized):
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key",
  "code": "AUTH_ERROR"
}

Response 429 (Rate Limit):
{
  "error": "Rate limit exceeded",
  "message": "Maximum 10 requests per minute",
  "retryAfter": 45,
  "code": "RATE_LIMIT_ERROR"
}

Response 500 (Server Error):
{
  "error": "Internal server error",
  "message": "Failed to initialize voice session",
  "code": "INTERNAL_ERROR",
  "requestId": "req_abc123"
}
```

#### **Workers**

```
POST   /workers
GET    /workers/:id
GET    /workers
PATCH  /workers/:id
DELETE /workers/:id
```

#### **Patterns**

```
GET    /patterns
GET    /patterns/:id
PATCH  /patterns/:id/resolve
GET    /patterns/by-location/:location
GET    /patterns/by-urgency/:level
```

#### **Recommendations**

```
GET    /recommendations
GET    /recommendations/:id
POST   /recommendations/:id/approve
POST   /recommendations/:id/reject
PATCH  /recommendations/:id/complete
```

#### **Analytics**

```
GET    /analytics/dashboard
GET    /analytics/knowledge-graph
GET    /analytics/reports/:type
POST   /analytics/reports/generate
```

#### **Configuration**

```
GET    /config/voice-agent
POST   /config/voice-agent
POST   /config/voice-agent/preview
POST   /config/voice-agent/reset
```

### 5.2 WebSocket API

**Voice Session WebSocket:** `wss://impofai.yourdomain.com/voice/:sessionId`

**Client → Server Messages:**

```json
{
  "type": "audio_data",
  "data": "base64-encoded-audio"
}

{
  "type": "end_session"
}
```

**Server → Client Messages:**

```json
{
  "type": "transcript_update",
  "speaker": "worker",
  "text": "Skener v uličke 5 nefunguje.",
  "timestamp": "2025-01-18T10:30:00Z"
}

{
  "type": "agent_response",
  "text": "Kedy ste si prvýkrát všimli problém?",
  "timestamp": "2025-01-18T10:30:05Z"
}

{
  "type": "session_ended",
  "conversationId": "uuid",
  "summary": { ... }
}
```

### 5.3 Authentication

**Method:** API Key (Header-based)

```http
Authorization: Bearer YOUR_API_KEY_HERE
```

**API Key Scopes:**
- `read:conversations` - Read conversation data
- `write:conversations` - Create/update conversations
- `read:analytics` - Access analytics
- `admin:config` - Modify configuration

---

## 6. Component Architecture

### 6.1 Voice Layer

**File:** `/src/voice/VoiceConversationManager.js`

**Responsibilities:**
- Manage WebSocket connection to OpenAI Realtime API
- Handle audio streaming (bidirectional)
- Coordinate with MidStream for real-time analysis
- Interface with Conversation Strategy Planner
- Store transcripts to AgentDB

**Key Classes:**
```javascript
class VoiceConversationManager {
  constructor(config)
  async startSession(workerId)
  async handleAudioInput(audioData)
  async handleTranscript(text, speaker)
  async endSession()
  async getSessionStatus(sessionId)
}

class MidStreamAnalyzer {
  constructor()
  async analyzeTurn(text, context)
  async getSuggestions(conversationState)
}

class ConversationStrategyPlanner {
  constructor(strictness)
  async generatePlan(conversationState)
  async getNextQuestion(currentState, plan)
  updatePlan(newInformation)
}
```

### 6.2 Learning Layer

**File:** `/src/learning/LearningCoordinator.js`

**Responsibilities:**
- Initialize AgentDB learning components
- Coordinate nightly learning runs
- Manage ReflexionMemory for AI self-improvement
- Build and update SkillLibrary
- Maintain CausalMemoryGraph for ROI analysis

**Key Classes:**
```javascript
class LearningCoordinator {
  constructor(agentDB)
  async runNightlyLearning()
  async initializeLearningComponents()
  async getReflexionInsights()
  async updateSkillLibrary(conversation)
  async updateCausalGraph(conversation)
}
```

### 6.3 Analytics Layer

**File:** `/src/analytics/AnalyticsEngine.js`

**Responsibilities:**
- Build knowledge graph from conversations
- Detect patterns (issue clusters, temporal, spatial)
- Generate recommendations with ROI calculations
- Create reports (HTML/PDF)

**Key Classes:**
```javascript
class KnowledgeGraphBuilder {
  async extractEntities(conversation)
  async buildRelationships()
  async calculateCentrality()
}

class PatternEngine {
  async detectIssuePatterns()
  async detectTemporalPatterns()
  async detectSpatialPatterns()
}

class RecommendationGenerator {
  async generateRecommendations(patterns)
  async calculateROI(pattern)
  async prioritizeRecommendations()
}

class ReportBuilder {
  async generateExecutiveSummary()
  async generateDetailedReport(type)
  async exportToPDF(report)
}
```

### 6.4 Dashboard Layer

**Files:**
- `/src/dashboard/public/index.html`
- `/src/dashboard/public/settings.html`
- `/src/dashboard/server.js`

**Responsibilities:**
- Display insights and recommendations
- Voice agent configuration panel
- Report generation and download
- Pattern monitoring

---

## 7. Deployment Architecture

### 7.1 Hetzner VPS Setup

**Recommended Server:**
- **Plan:** CX21 (2 vCPU, 4 GB RAM, 40 GB SSD)
- **Location:** Nuremberg, Germany (closest to Slovakia)
- **OS:** Ubuntu 22.04 LTS
- **Cost:** ~€5.83/month

### 7.2 Server Configuration

#### **Directory Structure:**

```
/var/www/impofai/
├── src/
│   ├── voice/
│   ├── learning/
│   ├── analytics/
│   └── dashboard/
├── data/
│   └── agentdb.sqlite
├── logs/
├── .env
├── package.json
└── ecosystem.config.js (PM2)
```

#### **Environment Variables (.env):**

```bash
# Application
NODE_ENV=production
PORT=3000

# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_ORG_ID=org-...

# Database
AGENTDB_PATH=/var/www/impofai/data/agentdb.sqlite

# Security
API_SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=https://impofai.yourdomain.com

# Configuration
DEFAULT_LANGUAGE=sk-SK
NIGHTLY_LEARNING_HOUR=2
```

#### **PM2 Configuration (ecosystem.config.js):**

```javascript
module.exports = {
  apps: [{
    name: 'impofai',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

### 7.3 Nginx Configuration

**File:** `/etc/nginx/sites-available/impofai`

```nginx
upstream impofai_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name impofai.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name impofai.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/impofai.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/impofai.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/impofai_access.log;
    error_log /var/log/nginx/impofai_error.log;

    # API requests
    location /api/ {
        proxy_pass http://impofai_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for voice
    location /voice/ {
        proxy_pass http://impofai_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Static files (dashboard)
    location / {
        root /var/www/impofai/src/dashboard/public;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 7.4 Deployment Script

**File:** `/scripts/deploy.sh`

```bash
#!/bin/bash

# ImpofAI Deployment Script

set -e

echo "🚀 Deploying ImpofAI..."

# Pull latest code
git pull origin main

# Build MidStream (Rust components)
echo "📦 Building MidStream..."
if [ -d "midstream" ]; then
  cd midstream
  cargo build --release
  npm install
  npm run build
  cd ..
else
  echo "⚠️  Warning: MidStream directory not found, skipping build"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run database migrations (if any)
echo "🗄️  Running database migrations..."
npm run migrate

# Restart PM2
echo "🔄 Restarting application..."
pm2 restart ecosystem.config.js

# Reload Nginx
echo "🌐 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs impofai"
```

---

## 8. Security Architecture

### 8.1 Security Layers

1. **Transport Security**
   - HTTPS only (TLS 1.2+)
   - WebSocket Secure (WSS)
   - Certificate management via Let's Encrypt

2. **API Security**
   - API key authentication
   - Rate limiting (100 req/min per IP)
   - Request validation (schema-based)
   - CORS restrictions

3. **Data Security**
   - Database encryption at rest (SQLite encryption extension)
   - Sensitive data hashing (bcrypt for API keys)
   - Environment variable management (.env with proper permissions)

4. **Voice Data Security**
   - Encrypted transmission (WSS)
   - Optional audio deletion after transcription
   - Worker consent recording
   - GDPR compliance (data deletion on request)

### 8.2 Rate Limiting

```javascript
// Rate limiting configuration
const rateLimits = {
  conversations: { windowMs: 60000, max: 10 }, // 10 calls/min
  analytics: { windowMs: 60000, max: 30 },     // 30 req/min
  reports: { windowMs: 300000, max: 5 }        // 5 reports/5min
};
```

### 8.3 API Key Management

**Storage:**
```sql
CREATE TABLE api_keys (
  key_id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  scopes TEXT NOT NULL, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  last_used_at DATETIME,
  active BOOLEAN DEFAULT TRUE
);
```

**Generation:**
```javascript
const apiKey = `ifa_${crypto.randomBytes(32).toString('hex')}`;
const hash = await bcrypt.hash(apiKey, 10);
```

### 8.4 Input Validation & Sanitization

**Request Validation Schema (using Zod):**

```javascript
import { z } from 'zod';

// Conversation start validation
const startConversationSchema = z.object({
  workerId: z.string().min(1).max(100).regex(/^[A-Z0-9-]+$/),
  workerPhone: z.string().regex(/^\+421[0-9]{9}$/),
  metadata: z.record(z.string()).optional()
});

// Validate requests
app.post('/api/v1/conversations/start', async (req, res) => {
  try {
    const validated = startConversationSchema.parse(req.body);
    // Proceed with validated data
  } catch (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors
    });
  }
});
```

**SQL Injection Prevention:**
```javascript
// ALWAYS use prepared statements
const stmt = db.prepare('SELECT * FROM conversations WHERE worker_id = ?');
const results = stmt.all(workerId); // Safe

// NEVER use string concatenation
// const query = `SELECT * FROM conversations WHERE worker_id = '${workerId}'`; // UNSAFE!
```

**XSS Protection (Dashboard):**
```javascript
// Sanitize HTML before rendering
import DOMPurify from 'dompurify';

function renderTranscript(text) {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] }); // Strip all HTML
}
```

**CSRF Protection:**
```javascript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

// Protect state-changing operations
app.post('/api/v1/config/voice-agent', csrfProtection, async (req, res) => {
  // Handle config update
});
```

---

## 9. Database Backup & Recovery

### 9.1 Backup Strategy

**Automated Daily Backups:**

```bash
#!/bin/bash
# /scripts/backup-database.sh

set -e

BACKUP_DIR="/var/backups/impofai"
DB_PATH="/var/www/impofai/data/agentdb.sqlite"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/agentdb_backup_$DATE.sqlite"

# Create backup directory
mkdir -p $BACKUP_DIR

# SQLite online backup (safe during operation)
sqlite3 $DB_PATH ".backup $BACKUP_FILE"

# Compress backup
gzip $BACKUP_FILE

# Verify backup integrity
gunzip -t "$BACKUP_FILE.gz"

# Delete backups older than 30 days
find $BACKUP_DIR -name "agentdb_backup_*.sqlite.gz" -mtime +30 -delete

echo "✅ Backup completed: $BACKUP_FILE.gz"
```

**Cron Schedule:**
```bash
# Edit crontab: crontab -e
# Daily backup at 3:00 AM (after nightly learning at 2:00 AM)
0 3 * * * /var/www/impofai/scripts/backup-database.sh >> /var/log/impofai/backup.log 2>&1
```

### 9.2 Point-in-Time Recovery

**WAL Mode (Write-Ahead Logging):**

```javascript
// Enable WAL mode for better concurrency and crash recovery
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('wal_autocheckpoint = 1000');
```

**Benefits:**
- Allows reads while writing
- Better crash recovery
- Automatic checkpointing

### 9.3 Disaster Recovery Procedure

**1. Restore from Backup:**
```bash
#!/bin/bash
# /scripts/restore-database.sh

BACKUP_FILE=$1
DB_PATH="/var/www/impofai/data/agentdb.sqlite"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-database.sh <backup_file.gz>"
  exit 1
fi

# Stop application
pm2 stop impofai

# Backup current database (just in case)
cp $DB_PATH "${DB_PATH}.before-restore"

# Restore from backup
gunzip -c $BACKUP_FILE > $DB_PATH

# Verify restored database
sqlite3 $DB_PATH "PRAGMA integrity_check;"

# Restart application
pm2 start impofai

echo "✅ Database restored from $BACKUP_FILE"
```

**2. Verify Data Integrity:**
```sql
-- Check database integrity
PRAGMA integrity_check;

-- Check foreign key consistency
PRAGMA foreign_key_check;

-- Verify conversation count
SELECT COUNT(*) FROM conversations;
```

### 9.4 Backup Retention Policy

- **Daily backups:** Keep for 30 days
- **Weekly backups:** Keep for 90 days (every Sunday)
- **Monthly backups:** Keep for 1 year (first of each month)

**Implementation:**
```bash
# Weekly backup (Sundays)
0 3 * * 0 cp /var/backups/impofai/agentdb_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sqlite.gz /var/backups/impofai/weekly/

# Monthly backup (1st of month)
0 3 1 * * cp /var/backups/impofai/agentdb_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sqlite.gz /var/backups/impofai/monthly/
```

### 9.5 Off-Site Backup (Production)

**Sync to Hetzner Storage Box:**
```bash
# /scripts/sync-to-remote.sh

STORAGE_BOX="u123456@u123456.your-storagebox.de"
LOCAL_BACKUP="/var/backups/impofai"
REMOTE_BACKUP="/impofai-backups"

# Sync via rsync over SSH
rsync -avz --delete \
  -e "ssh -p 23" \
  $LOCAL_BACKUP/ \
  $STORAGE_BOX:$REMOTE_BACKUP/

echo "✅ Backups synced to off-site storage"
```

**Cron Schedule:**
```bash
# Daily off-site sync at 4:00 AM (after local backup)
0 4 * * * /var/www/impofai/scripts/sync-to-remote.sh >> /var/log/impofai/sync.log 2>&1
```

---

## 10. Integration Guide

### 10.1 MidStream Installation

**Prerequisites:**
- Rust 1.70+ installed
- Node.js 18+ installed

**Installation Steps:**

```bash
# Clone MidStream repository
git clone https://github.com/ruvnet/midstream.git
cd midstream

# Build Rust components
cargo build --release

# Install npm package
npm install

# Link for local development
npm link

# Verify installation
midstream --version
```

**Integration in ImpofAI:**

```javascript
import { MidStreamAnalyzer } from 'midstream';

const analyzer = new MidStreamAnalyzer({
  model: 'gpt-4o',
  language: 'sk-SK'
});

// Use during conversation
const analysis = await analyzer.analyzeTurn(
  "Skener v uličke 5 nefunguje.",
  conversationContext
);
```

### 10.2 AgentDB Initialization

**File:** `/src/database/initAgentDB.js`

```javascript
import { createDatabase, LearningSystem, EmbeddingService } from 'agentdb';
import OpenAI from 'openai';

async function initializeAgentDB() {
  // Create database
  const db = await createDatabase({
    filename: process.env.AGENTDB_PATH || './data/agentdb.sqlite',
    verbose: process.env.NODE_ENV === 'development'
  });

  // Initialize OpenAI for embeddings
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const embeddingService = new EmbeddingService({
    openai: openai,
    model: 'text-embedding-3-small',
    dimensions: 1536
  });

  // Initialize learning system
  const learningSystem = new LearningSystem(db, {
    embeddingService: embeddingService,
    nightlyLearningHour: parseInt(process.env.NIGHTLY_LEARNING_HOUR) || 2
  });

  // Create custom tables
  await createCustomTables(db);

  return { db, learningSystem, embeddingService };
}

async function createCustomTables(db) {
  // Execute all CREATE TABLE statements from Section 4
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (...);
    CREATE TABLE IF NOT EXISTS workers (...);
    -- etc.
  `);
}

export { initializeAgentDB };
```

### 10.3 OpenAI Realtime API Integration

**File:** `/src/voice/OpenAIRealtimeClient.js`

```javascript
import WebSocket from 'ws';

class OpenAIRealtimeClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.ws = null;
    this.sessionConfig = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // Start with 2 seconds
  }

  async connect(sessionConfig) {
    this.sessionConfig = sessionConfig;
    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';

    this.ws = new WebSocket(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    this.ws.on('open', () => {
      console.log('✅ Connected to OpenAI Realtime API');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 2000;

      // Configure session
      this.send({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: this.generateSystemPrompt(sessionConfig),
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1',
            language: 'sk'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        }
      });
    });

    this.ws.on('message', (data) => {
      try {
        this.handleMessage(JSON.parse(data));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      // Error will trigger 'close' event, handled below
    });

    this.ws.on('close', (code, reason) => {
      console.warn(`⚠️  WebSocket closed (code: ${code}, reason: ${reason})`);

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
          this.connect(this.sessionConfig);
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached. Giving up.');
        this.onConnectionFailed && this.onConnectionFailed();
      }
    });
  }

  generateSystemPrompt(config) {
    return `Si AI asistent, ktorý pomáha zamestnancom nahlásiť problémy v práci.
Odpovedaj vždy po slovensky. Buď priateľský a profesionálny.

${config.plannerEnabled ? 'Tvoja úloha je zistiť: KTO má problém, ČO sa stalo, KDE sa to stalo, KEDY sa to stalo, a AKO sa to prejavuje.' : ''}

Štýl otázok: ${config.questionStyle}
Úroveň formálnosti: ${config.formalityLevel}`;
  }

  send(message) {
    this.ws.send(JSON.stringify(message));
  }

  handleMessage(message) {
    // Handle different message types
    switch (message.type) {
      case 'conversation.item.created':
        // New conversation item
        break;
      case 'response.audio.delta':
        // Audio chunk from AI
        break;
      case 'response.text.delta':
        // Text chunk from AI
        break;
      case 'input_audio_buffer.speech_started':
        // Worker started speaking
        break;
      // ... handle other message types
    }
  }
}

export { OpenAIRealtimeClient };
```

---

## 11. Scaling Strategy

### 11.1 Current Capacity (CX21)

**Estimated Capacity:**
- Concurrent voice sessions: 10-15
- Daily conversations: 500-1,000
- Database size: 100 GB (sufficient for 1+ year)

### 11.2 Scaling Plan

**Phase 1: Vertical Scaling (0-1,000 daily calls)**
- Upgrade to CX31 (2 vCPU, 8 GB RAM)
- Cost: ~€10.71/month

**Phase 2: Horizontal Scaling (1,000-5,000 daily calls)**
- Add load balancer (Hetzner LB)
- 2x CX31 instances
- Shared database (upgrade to PostgreSQL)
- Redis for session management
- Cost: ~€50/month

**Phase 3: Microservices (5,000+ daily calls)**
- Separate voice, learning, analytics services
- Kubernetes cluster
- Managed PostgreSQL
- Object storage for audio files
- CDN for dashboard
- Cost: ~€200-500/month

### 11.3 Performance Optimization

1. **Database Indexing:** All foreign keys + frequently queried columns
2. **Caching:** Redis for frequent queries (patterns, recommendations)
3. **Audio Processing:** Offload to separate worker processes
4. **Background Jobs:** Bull queue for nightly learning, report generation
5. **CDN:** Cloudflare for static assets

---

## 📋 Architecture Checklist

- [x] System overview and high-level architecture
- [x] Component interaction diagrams
- [x] Technology stack specification
- [x] Complete database schema with indexes (including location index)
- [x] RESTful API endpoints with error response schemas
- [x] WebSocket API specification with error handling
- [x] Component architecture and class design
- [x] Deployment architecture (Hetzner VPS)
- [x] Nginx reverse proxy configuration
- [x] PM2 process management
- [x] Security architecture (HTTPS, API keys, rate limiting)
- [x] Input validation & sanitization (Zod, SQL injection prevention, XSS, CSRF)
- [x] Database backup & recovery strategy
- [x] MidStream integration guide (with build script)
- [x] AgentDB initialization
- [x] OpenAI Realtime API integration (with reconnection logic)
- [x] Scaling strategy

---

## 🎯 Next Steps

**Phase 4: Refinement** (Next in SPARC)
- Code review and optimization
- Security audit
- Performance testing
- User acceptance testing

**Phase 5: Completion**
- Final implementation
- Documentation
- Deployment to production
- Monitoring setup

---

**Document Version:** 1.0
**Last Updated:** 2025-01-18
**Status:** ✅ Architecture Complete - Ready for Refinement Phase
