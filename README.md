# 🎯 ImpofAI - Business Intelligence Through Conversational AI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![SPARC Framework](https://img.shields.io/badge/Framework-SPARC-green.svg)](https://github.com/ruvnet/sparc)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![AgentDB](https://img.shields.io/badge/AgentDB-1.6.1-purple)](https://www.npmjs.com/package/agentdb)

> An AI-powered "invisible consultant" platform that conducts natural conversations with employees to extract deep company insights, identify problems, discover patterns, and generate actionable recommendations.

---

## 🌟 Overview

**ImpofAI** transforms how companies understand their operations. Instead of expensive consultants, static surveys, or manual data entry, ImpofAI uses conversational AI to interview employees in their native language (Slovak), automatically building a comprehensive knowledge graph of company operations and generating intelligence reports with ROI-backed recommendations.

### Key Features

- 🗣️ **Natural Voice Conversations** - Employees simply talk, AI asks smart follow-up questions
- 🧠 **Self-Improving AI** - Learns better questioning strategies from every conversation (ReflexionMemory)
- 📊 **Auto-Discovery** - Builds company structure, finds patterns without manual setup
- 💰 **ROI Calculations** - Causal analysis quantifies business impact of issues
- 🌙 **Nightly Learning** - Discovers patterns, generates recommendations overnight
- 🇸🇰 **Slovak Language** - Native support for Slovak employees
- 🔒 **Privacy-First** - GDPR compliant, data stays on company servers

---

## 📋 SPARC Framework

This project is developed using the **SPARC methodology** (Specification, Pseudocode, Architecture, Refinement, Completion):

### **S - Specification**

**Scope:** AI-powered business intelligence platform for medium-to-large companies (50-500 employees).

**Core Components:**
- Voice conversation system (OpenAI Realtime API)
- AgentDB learning system (NightlyLearner, ReflexionMemory, SkillLibrary, CausalMemoryGraph)
- MidStream real-time analysis
- Admin intelligence dashboard
- Automatic knowledge graph construction

**Success Criteria:**
- 70%+ worker adoption
- 90%+ conversations contain actionable insights
- 95%+ Slovak transcription accuracy
- Sub-5-second voice response time
- AI improves question quality +10% per month

**See:** [plans/SPECIFICATION.md](plans/SPECIFICATION.md) for complete requirements.

---

### **P - Pseudocode**

High-level implementation flow:

```pseudocode
// Worker Voice Interface
FUNCTION startConversation(workerId, role):
  session = createSession(workerId, role)
  ai = initializeRealtimeAgent(session, SLOVAK_LANGUAGE)

  WHILE conversation_active:
    audio = captureWorkerAudio()
    transcript = ai.transcribe(audio, real_time=true)

    // Real-time analysis with MidStream
    analysis = midstream.analyze(transcript, context=session)
    IF analysis.contains_urgent_issue():
      sendAlertToAdmin(analysis)

    // AI response with learning
    topics = detectTopics(transcript)
    followUpQuestions = skillLibrary.getBestQuestions(topics)
    response = ai.generateResponse(transcript, followUpQuestions)

    playAudioResponse(response)

    // Store with AgentDB
    agentdb.store(
      type: TRANSCRIPT,
      content: transcript,
      embedding: true,
      metadata: {workerId, topics, sentiment, timestamp}
    )

  saveSession(session)
  reflexionMemory.learn(session, outcome=conversationQuality)

// Nightly Learning Cycle
FUNCTION nightlyLearning():
  conversations = loadToday()

  // Discover patterns
  patterns = nightlyLearner.discover(conversations)
  causalEdges = detectCausalRelationships(patterns)

  // Generate recommendations
  FOR EACH pattern IN patterns:
    IF pattern.occurrence_count >= THRESHOLD:
      recommendation = generateRecommendation(pattern, causalEdges)
      calculateROI(recommendation)
      storeRecommendation(recommendation)

  // Update skill library
  successfulQuestions = extractSuccessfulPatterns(conversations)
  skillLibrary.consolidate(successfulQuestions)

  generateReport()

// Admin Dashboard
FUNCTION renderDashboard():
  insights = loadLatestInsights()
  recommendations = loadRecommendations(priority=HIGH)
  employeeCards = buildEmployeeProfiles()
  trends = calculateTrends(timeRange=WEEK)

  display(insights, recommendations, employeeCards, trends)

  // Admin can ask questions
  ON adminQuestion(query):
    context = searchAllTranscripts(query, semantic=true)
    answer = ai.synthesize(context, query)
    displayWithSources(answer, context)
```

**See:** [plans/PSEUDOCODE.md](plans/PSEUDOCODE.md) - **✅ Complete (2,200+ lines, 14 components)**

---

### **A - Architecture**

**System Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKER INTERFACE                         │
│  One-Button Voice UI (Slovak) - Click to Talk              │
└────────────────────────┬────────────────────────────────────┘
                         │ WebSocket + Audio Stream
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 VOICE CONVERSATION LAYER                    │
│  - OpenAI Realtime API (gpt-4o-realtime-preview)           │
│  - Speech-to-Text + Text-to-Speech (Slovak)                │
│  - WebSocket Server (Express + ws)                         │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────┐     ┌───────────────────────────┐
│  MIDSTREAM ANALYZER     │     │  AGENTDB MEMORY SYSTEM    │
│  (Real-time Analysis)   │     │  (Learning & Storage)     │
│                         │     │                           │
│  - Pattern Detection    │     │  - ReflexionMemory        │
│  - Topic Classification │     │  - SkillLibrary           │
│  - Sentiment Analysis   │     │  - CausalMemoryGraph      │
│  - Urgency Detection    │     │  - NightlyLearner         │
└─────────────────────────┘     │  - Vector Search (HNSW)   │
                                └───────────┬───────────────┘
                                            │
                                            ▼
                          ┌──────────────────────────────────┐
                          │  ANALYTICS ENGINE                │
                          │  - Knowledge Graph Builder       │
                          │  - Pattern Engine                │
                          │  - Recommendation Generator      │
                          │  - ROI Calculator                │
                          └───────────┬──────────────────────┘
                                      │
                                      ▼
                          ┌──────────────────────────────────┐
                          │  ADMIN DASHBOARD                 │
                          │  - Executive Summary             │
                          │  - Employee Cards                │
                          │  - Insights & Recommendations    │
                          │  - Trend Analysis                │
                          │  - AI Q&A Assistant              │
                          └──────────────────────────────────┘
```

**Technology Stack:**

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Voice** | OpenAI Realtime API | Slovak voice transcription + generation |
| **Memory** | AgentDB 1.6.1 | Learning system, vector search, SQLite backend |
| **Analysis** | MidStream | Real-time conversation pattern detection |
| **Backend** | Node.js 18+ + Express | REST API + WebSocket server |
| **Frontend** | Vanilla JS + HTML5 | Worker UI (minimal) + Admin dashboard |
| **Database** | SQLite (via AgentDB) | Transcripts, profiles, knowledge graph |
| **Deployment** | Docker + Hetzner VPS | Single-tenant containerized deployment |

**See:** [plans/ARCHITECTURE.md](plans/ARCHITECTURE.md) - **✅ Complete (1,268 lines, full system design)**

---

### **R - Refinement**

**Performance Optimizations:**
- AgentDB provides 96-164x faster vector search vs traditional DBs
- MidStream Rust core for sub-millisecond pattern matching
- Streaming transcription for <5s voice response latency
- Nightly batch processing for heavy analytics

**Learning Improvements:**
- **ReflexionMemory:** AI critiques own performance, improves questioning
- **SkillLibrary:** Consolidates successful interview patterns
- **CausalMemoryGraph:** Statistical confidence scores for recommendations
- **NightlyLearner:** Automated pattern discovery and insight generation

**Testing Strategy:**
- Unit tests for all AgentDB learning components
- Integration tests for voice → storage → analytics flow
- End-to-end tests with Slovak conversation samples
- Performance benchmarks (target: 95%+ transcription accuracy)

**See:** [plans/REFINEMENT.md](plans/REFINEMENT.md) *(coming in Phase 4)*

---

### **C - Completion**

**Implementation Roadmap:**

**Phase 1: Foundation (Weeks 1-2)**
- Set up AgentDB + MidStream integration
- Build basic voice conversation flow
- Implement transcript storage
- Slovak language testing

**Phase 2: Learning System (Weeks 3-4)**
- Integrate ReflexionMemory for AI improvement
- Build SkillLibrary for question patterns
- Implement NightlyLearner cycle
- CausalMemoryGraph for ROI calculations

**Phase 3: Analytics & Dashboard (Weeks 5-6)**
- Knowledge graph auto-discovery
- Pattern detection engine
- Recommendation generator
- Admin dashboard UI

**Phase 4: Deployment (Week 7)**
- Docker containerization
- Hetzner VPS setup
- Nginx reverse proxy + SSL
- Production testing

**See:** [plans/COMPLETION.md](plans/COMPLETION.md) *(coming in Phase 5)*

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- OpenAI API key (for Realtime API)
- Rust 1.71+ (for MidStream)

### Installation

```bash
# Clone repository
git clone https://github.com/impofailafko-boop/impofai.git
cd impofai

# Install AgentDB
npm install agentdb@1.6.1

# Install MidStream
git clone https://github.com/ruvnet/midstream.git
cd midstream/npm
npm install
npm run build:ts
cd ../..

# Install other dependencies
npm install
```

### Development

```bash
# Run tests
npm test

# Start development server (coming in Phase 5)
npm run dev

# Build for production
npm run build
```

---

## 📊 Component Catalog

See [COMPONENT_CATALOG.md](COMPONENT_CATALOG.md) for complete list of system components.

**Main Components:**
1. **Voice Conversation System** - Worker interface + AI interviewer
2. **AgentDB Learning System** - 5 learning components (NightlyLearner, ReflexionMemory, etc.)
3. **MidStream Analyzer** - Real-time pattern detection
4. **Knowledge Graph Engine** - Auto-discovery of company structure
5. **Analytics Engine** - Pattern detection + ROI calculations
6. **Admin Dashboard** - Intelligence reports + AI Q&A

---

## 📈 Implementation Status

See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for detailed progress tracking.

**Current Phase:** Architecture (Phase 3 of 5) ✅

**Completed Phases:**
- ✅ **Phase 1: Specification** - Complete SPARC Specification (1,207 lines, 29 functional requirements)
- ✅ **Phase 2: Pseudocode** - Detailed algorithms (2,200+ lines, 14 components)
- ✅ **Phase 3: Architecture** - Full system design (1,268 lines, database schema, API specs, deployment)

**Next Phase:** Refinement (Phase 4) - Code review, optimization, security audit

---

## 🧪 Testing

All test files are in `/tests/`:

```bash
# Test AgentDB functionality
node tests/test-agentdb-real.js

# Test AgentDB learning components
node tests/test-agentdb-learning.js

# Test AgentDB setup
node tests/test-agentdb-setup.js
```

**Test Results:**
- ✅ AgentDB SQLite backend working
- ✅ Learning components (NightlyLearner, ReflexionMemory, etc.) functional
- ✅ Local embeddings (no API key needed) confirmed
- ✅ Vector search capabilities verified

---

## 📚 Documentation

- **[Specification](plans/SPECIFICATION.md)** - Complete requirements and use cases
- **[Architecture Docs](docs/ARCHITECTURE.md)** - Previous architecture exploration
- **[MidStream Integration](docs/MIDSTREAM_INTEGRATION.md)** - Real-time analysis guide
- **[Testing Guide](docs/TOMORROW_TESTING.md)** - MVP testing plan

---

## 🏗️ Project Structure

```
/impofai
├── /plans/                      # SPARC framework phases
│   ├── SPECIFICATION.md         # ✅ Phase 1 (Complete - 1,207 lines)
│   ├── PSEUDOCODE.md            # ✅ Phase 2 (Complete - 2,200+ lines)
│   ├── ARCHITECTURE.md          # ✅ Phase 3 (Complete - 1,268 lines)
│   ├── REFINEMENT.md            # ⏳ Phase 4 (Next)
│   └── COMPLETION.md            # ⏳ Phase 5
│
├── /src/                        # Implementation (Phase 5)
│   ├── /voice/                  # Voice conversation system
│   ├── /learning/               # AgentDB learning components
│   ├── /analytics/              # Intelligence engine
│   ├── /dashboard/              # Admin interface
│   └── /shared/                 # Utilities
│
├── /tests/                      # Test suite
│   ├── test-agentdb-real.js    # ✅ AgentDB tests
│   ├── test-agentdb-learning.js # ✅ Learning components
│   ├── test-agentdb-setup.js   # ✅ Setup validation
│   └── /integration/            # Integration tests (TBD)
│
├── /docs/                       # Documentation
│   ├── ARCHITECTURE.md          # Previous exploration
│   ├── MIDSTREAM_INTEGRATION.md # MidStream guide
│   └── TOMORROW_TESTING.md      # Testing plan
│
├── /voice-agent/                # Demo/reference only (not used in new build)
├── README.md                    # This file (SPARC overview)
├── COMPONENT_CATALOG.md         # Component inventory
├── IMPLEMENTATION_SUMMARY.md    # Build status tracker
├── package.json                 # Dependencies
└── docker-compose.yml           # Deployment config (TBD)
```

---

## 🤝 Contributing

This project follows the **SPARC methodology**:

1. Read [plans/SPECIFICATION.md](plans/SPECIFICATION.md) to understand requirements
2. Review current phase progress in [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
3. Follow pseudocode patterns from [plans/PSEUDOCODE.md](plans/PSEUDOCODE.md) (when available)
4. Maintain architectural consistency per [plans/ARCHITECTURE.md](plans/ARCHITECTURE.md) (when available)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Related Projects

- **[AgentDB](https://www.npmjs.com/package/agentdb)** - Lightning-fast AI agent memory system
- **[MidStream](https://github.com/ruvnet/midstream)** - Real-time AI conversation analysis
- **[SPARC Framework](https://github.com/ruvnet/sparc)** - Structured methodology for AI development
- **[Claude Flow](https://github.com/ruvnet/claude-flow)** - Agent orchestration platform
- **[ruv.io](https://github.com/ruvnet/ruv.io)** - NPM ecosystem template (inspiration for this structure)

---

## 📧 Contact

**Project:** ImpofAI - Business Intelligence Platform
**Organization:** Agentic Tribe
**Framework:** SPARC (Specification, Pseudocode, Architecture, Refinement, Completion)

---

**Built with 🧠 using SPARC methodology and powered by AgentDB + MidStream**
