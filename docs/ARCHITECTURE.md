# 🏗️ Business Intelligence Platform Architecture

**Vision:** Uncover everything about a company by letting employees talk to AI naturally, then working with that context to recommend improvements.

---

## ✅ Test Results Summary

### What's Working:
- ✅ **AgentDB Installed** - Package ready to use
- ✅ **SQLite Backend** - Fast, local, file-based storage
- ✅ **Basic Database Operations** - Store/retrieve transcripts and profiles
- ✅ **WASM SQLite** - Works without build tools (sql.js)

### What Needs Setup:
- ⚠️ Advanced AgentDB features need proper API initialization
- ⚠️ MidStream integration (next step)
- ⚠️ OpenAI API key configuration for embeddings

---

## 🎯 Recommended MVP Architecture

### **Core Stack:**

```
┌─────────────────────────────────────────────────┐
│  LAYER 1: Real-time Voice (Current)             │
├─────────────────────────────────────────────────┤
│  - OpenAI Realtime API (voice conversations)    │
│  - WebSocket Server (existing)                  │
│  - Slovak language support ✅                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  LAYER 2: MidStream (NEW - Real-time Analysis)  │
├─────────────────────────────────────────────────┤
│  - Analyzes conversation AS IT HAPPENS          │
│  - Detects patterns in real-time               │
│  - Instant insights during call                 │
│  - Built with Rust (fast) + TypeScript          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  LAYER 3: AgentDB (Memory & Storage)            │
├─────────────────────────────────────────────────┤
│  - SQLite database (simple-test.db working!)   │
│  - Stores transcripts with metadata            │
│  - Worker profiles                              │
│  - Vector embeddings (for semantic search)      │
│  - Sub-millisecond queries                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  LAYER 4: Analytics Engine (NEW)                │
├─────────────────────────────────────────────────┤
│  - Pattern detection (recurring issues)         │
│  - Company knowledge graph                      │
│  - Improvement recommendations                  │
│  - Trend analysis                               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  LAYER 5: Admin Dashboard (NEW)                 │
├─────────────────────────────────────────────────┤
│  - Company insights                             │
│  - Worker profiles view                         │
│  - Searchable transcripts                       │
│  - Recommendations display                      │
└─────────────────────────────────────────────────┘
```

---

## 🔥 **Why MidStream + AgentDB is Perfect**

### **MidStream Advantages:**
1. **Real-time Pattern Detection** - Spot issues DURING conversation
   - "3 workers mentioned 'broken scanner' this hour"
   - "Unusual spike in supply requests"

2. **Live Insights** - Dashboard updates while call is happening
   - Managers see issues as they're reported
   - Can intervene immediately if urgent

3. **Multi-modal** - Handles text, audio, video streaming
   - Future: Video calls for technical support
   - Audio analysis for sentiment/stress detection

4. **Performance** - Rust-powered, sub-millisecond latency
   - Won't slow down voice conversations
   - Can handle many concurrent calls

### **AgentDB Advantages:**
1. **Lightning Fast** - 150x faster than traditional databases
   - Perfect for real-time queries during calls
   - Workers don't wait while agent "thinks"

2. **Local First** - SQLite file, no external service
   - Works on your Hetzner VPS
   - Simple deployment with Docker
   - No cloud database costs

3. **Semantic Search** - Find similar conversations
   - Admin searches "equipment problems"
   - Finds even if worker said "machine broken", "device failed", etc.

4. **Memory Features** - Built for AI agents
   - Causal reasoning (X caused Y)
   - Reflexion (self-critique and learning)
   - Skill library (conversation patterns)

---

## 📊 **Data Flow (How It All Works)**

### **Scenario: Worker calls about broken scanner**

```
1. WORKER SPEAKS (Slovak)
   "Skener v uličke 5 je pokazený"

   ↓

2. OPENAI REALTIME API
   - Transcribes Slovak audio
   - Translates if needed
   - Generates response

   ↓

3. MIDSTREAM (Real-time Analysis)
   - Detects keyword: "scanner"
   - Identifies issue type: "equipment"
   - Checks recent patterns: "Scanner mentioned 5x this week"
   - Triggers: HIGH PRIORITY alert

   ↓

4. AGENTDB (Memory Query) - 0.1ms
   - Loads worker profile: "John Doe, Warehouse A"
   - Retrieves past issues: "Reported scanner issue 2 weeks ago"
   - Finds similar reports: "3 other workers, same scanner"

   ↓

5. AGENT RESPONDS (Context-Aware)
   "Hi John, I see you reported this scanner before.
    Other workers have too. I'll escalate this as urgent."

   ↓

6. SAVE TO AGENTDB
   - Store full transcript
   - Update worker profile: +1 call
   - Add to issue tracker: "Scanner B, Warehouse A"
   - Update causal graph: "Scanner B failures → productivity loss"

   ↓

7. ANALYTICS ENGINE (Background)
   - Pattern detected: Scanner B failing frequently
   - Recommendation generated: "Replace Scanner B (ROI: 2 weeks)"
   - Knowledge graph updated: "Warehouse A → Scanner B → Frequent failures"

   ↓

8. ADMIN DASHBOARD (Live Update)
   - New issue appears in real-time
   - Pattern highlighted: "URGENT: Scanner B"
   - Recommendation shown: "Replace unit, $500 vs $2000/week lost productivity"
```

---

## 💾 **Database Schema (Simple & Effective)**

### **Tables we'll create:**

```sql
-- Conversations (every call stored)
CREATE TABLE transcripts (
  id INTEGER PRIMARY KEY,
  session_id TEXT UNIQUE,
  worker_id TEXT NOT NULL,
  worker_name TEXT,
  role TEXT,
  conversation_json TEXT,  -- Full transcript
  duration_seconds INTEGER,
  created_at DATETIME,

  -- Analysis results
  issues_detected TEXT,    -- JSON array
  sentiment TEXT,
  topics TEXT,            -- JSON array

  -- Metadata
  location TEXT,
  shift TEXT,
  language TEXT DEFAULT 'slovak'
);

-- Worker Profiles (remember everyone)
CREATE TABLE worker_profiles (
  worker_id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  location TEXT,
  shift TEXT,

  -- Stats
  total_calls INTEGER DEFAULT 0,
  first_call DATETIME,
  last_call DATETIME,

  -- Learned info
  common_issues TEXT,      -- JSON array
  preferences TEXT,        -- JSON object

  metadata TEXT            -- JSON for flexibility
);

-- Detected Issues (for pattern detection)
CREATE TABLE issues (
  id INTEGER PRIMARY KEY,
  issue_type TEXT,         -- 'equipment', 'supply', 'process', etc.
  description TEXT,
  location TEXT,

  -- Source
  reported_by TEXT,        -- worker_id
  session_id TEXT,
  detected_at DATETIME,

  -- Status
  status TEXT DEFAULT 'new',  -- 'new', 'acknowledged', 'resolved'
  priority TEXT,           -- 'low', 'medium', 'high', 'urgent'

  -- Pattern tracking
  occurrence_count INTEGER DEFAULT 1,
  first_occurrence DATETIME,
  last_occurrence DATETIME
);

-- Company Knowledge (learned facts)
CREATE TABLE knowledge_graph (
  id INTEGER PRIMARY KEY,
  entity TEXT,             -- 'Scanner B', 'Warehouse A', 'Truck 5'
  entity_type TEXT,        -- 'equipment', 'location', 'vehicle'

  -- Relationships
  related_to TEXT,         -- JSON array of related entities

  -- Facts
  facts TEXT,              -- JSON array of learned facts

  -- Statistics
  mention_count INTEGER DEFAULT 0,
  last_mentioned DATETIME,

  -- Insights
  patterns TEXT,           -- JSON array of detected patterns
  recommendations TEXT     -- JSON array of suggestions
);

-- Vector Embeddings (for semantic search)
CREATE TABLE embeddings (
  id INTEGER PRIMARY KEY,
  content_id TEXT,         -- Reference to transcript/issue/etc
  content_type TEXT,       -- 'transcript', 'issue', 'knowledge'
  embedding BLOB,          -- Vector embedding
  created_at DATETIME
);
```

---

## 🚀 **MVP Implementation: 3-Day Sprint**

### **Day 1: Foundation**
- [x] Install AgentDB ✅
- [x] Test basic SQLite operations ✅
- [ ] Create database schema (above tables)
- [ ] Modify voice agent to save to AgentDB
- [ ] Test with one real conversation

**Deliverable:** Voice agent saves transcripts to database

---

### **Day 2: Memory & MidStream**
- [ ] Install MidStream
- [ ] Integrate MidStream with voice agent
- [ ] Implement worker profile loading
- [ ] Add real-time pattern detection
- [ ] Test context-aware conversations

**Deliverable:** Agent remembers workers and detects patterns live

---

### **Day 3: Analytics & Dashboard**
- [ ] Build analytics engine
- [ ] Create pattern detection algorithms
- [ ] Build simple admin dashboard
- [ ] Add semantic search for transcripts
- [ ] Generate first recommendations

**Deliverable:** Working dashboard with insights

---

## 🎯 **Killer Feature Demo Script**

### **Demo Scenario: "The Scanner Problem"**

**Week 1 - Monday:**
- Worker 1 calls: "Scanner is slow"
- System: Stores, no pattern yet

**Week 1 - Wednesday:**
- Worker 2 calls: "Scanner keeps freezing"
- System: Detects 2 mentions, creates issue
- Dashboard: Shows "Scanner" under watch

**Week 1 - Friday:**
- Worker 3 calls: "Can't use scanner at all"
- MidStream: LIVE ALERT to manager
- System: Escalates to URGENT
- Dashboard: **Recommendation appears:**
  ```
  🚨 URGENT: Scanner B (Warehouse A)

  Pattern: 3 reports in 5 days
  Impact: ~$500/day productivity loss
  Recommendation: Replace unit immediately
  Cost: $300 scanner vs $2500/week lost
  ROI: Pays for itself in 2 days
  ```

**Week 2 - Monday:**
- Manager replaces scanner
- Worker 4 calls about different issue
- System knows scanner is fixed
- Knowledge graph updated

**Result:** Company saves money, workers happier, issues resolved faster

---

## 🔧 **Tech Choices Explained**

### **Why NOT use other solutions:**

❌ **PostgreSQL + pgvector**
- Too heavy for MVP
- Requires separate server
- Overkill for single VPS

❌ **ChromaDB / Pinecone**
- External service dependency
- Additional costs
- Network latency

❌ **Simple JSON files (current approach)**
- No search capability
- No scalability
- Hard to query patterns

✅ **AgentDB + SQLite = Perfect MVP**
- Single file database
- Built for AI agents
- Vector search included
- Sub-millisecond queries
- Works offline
- No external dependencies

---

## 📁 **Folder Structure (One Repo)**

```
/impofai
│
├── /voice-agent                 # Existing voice system
│   ├── /src
│   │   ├── server.js           # WebSocket + Express
│   │   ├── realtime-voice-agent.js
│   │   └── db-adapter.js       # NEW: AgentDB integration
│   ├── /config
│   ├── /public                 # Voice interface
│   └── package.json
│
├── /midstream-integration      # NEW: Real-time analysis
│   ├── /src
│   │   ├── stream-analyzer.js  # MidStream wrapper
│   │   ├── pattern-detector.js # Real-time patterns
│   │   └── alert-manager.js    # Live alerts
│   └── package.json
│
├── /analytics                  # NEW: Intelligence layer
│   ├── /src
│   │   ├── pattern-engine.js   # Find patterns
│   │   ├── knowledge-graph.js  # Company learning
│   │   └── recommender.js      # Generate insights
│   └── /jobs
│       └── daily-analysis.js   # Background jobs
│
├── /dashboard                  # NEW: Admin interface
│   ├── /public
│   │   ├── insights.html       # Company view
│   │   ├── workers.html        # Worker profiles
│   │   └── search.html         # Semantic search
│   └── /api
│       └── dashboard-api.js    # REST endpoints
│
├── /shared                     # Shared utilities
│   ├── /database
│   │   ├── init.js            # Create schema
│   │   ├── queries.js         # Common queries
│   │   └── migrations.js      # Schema updates
│   └── /utils
│
├── /tests                      # Tests
│   ├── test-agentdb-real.js   ✅ Working!
│   └── test-midstream.js      # TODO
│
├── docker-compose.yml          # Updated for all services
├── package.json                # Root dependencies
├── .env.production
└── README.md
```

---

## 🎬 **Ready to Build Tomorrow?**

### **Testing Checklist:**
- ✅ AgentDB installed and tested
- ✅ Basic SQLite working perfectly
- ✅ Database schema designed
- ⏳ MidStream integration (tomorrow)
- ⏳ Analytics engine (tomorrow)
- ⏳ Dashboard (tomorrow)

### **What to test tomorrow:**

1. **Voice → Database Flow**
   - Have conversation in Slovak
   - Check if saved to AgentDB
   - Verify worker profile created

2. **Memory Test**
   - Call again as same worker
   - See if agent remembers you
   - Check context loading

3. **Pattern Detection**
   - Multiple workers report same issue
   - Check if system detects pattern
   - See recommendation generated

4. **Dashboard**
   - View all transcripts
   - Search semantically
   - See insights/patterns

---

## 💡 **Key Insights from Testing**

1. **AgentDB works great** - SQLite backend is fast and simple
2. **No external services needed** - Everything runs on your VPS
3. **Slovak language ready** - OpenAI Realtime API handles it
4. **MidStream = Game changer** - Real-time analysis vs batch processing
5. **Simple beats complex** - MVP can use basic DB, add vectors later

---

## 🚦 **Next Steps**

**Immediate (Tonight/Tomorrow Morning):**
1. Review this architecture
2. Approve or suggest changes
3. I'll start building Day 1 tasks

**Tomorrow Testing:**
1. Create database schema
2. Integrate AgentDB with voice agent
3. Test real conversations
4. Add MidStream if time permits

**Questions to Answer:**
1. Should we use MidStream for MVP or add later?
2. What's most important: Memory? Patterns? Dashboard?
3. Any specific features for Slovak language?

---

**Ready when you are! 🚀**
