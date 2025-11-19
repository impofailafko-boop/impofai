# 📊 ImpofAI Component Catalog

Complete inventory of all system components for the Business Intelligence Platform.

---

## Component Overview

| Category | Components | Status |
|----------|-----------|--------|
| **Voice System** | 3 components | 📋 Specified |
| **Learning System** | 6 components | 📋 Specified |
| **Analytics Engine** | 4 components | 📋 Specified |
| **Admin Dashboard** | 7 components | 📋 Specified |
| **Infrastructure** | 4 components | 📋 Specified |
| **Utilities** | 3 components | 📋 Specified |
| **TOTAL** | **27 components** | **Phase 1/5** |

---

## 1. Voice Conversation System

### 1.1 Realtime Voice Agent
- **Purpose:** OpenAI Realtime API integration for Slovak voice conversations
- **Technology:** OpenAI gpt-4o-realtime-preview
- **Features:**
  - Speech-to-text (Slovak language)
  - Text-to-speech (natural voice)
  - Real-time streaming transcription
  - WebSocket communication
- **Status:** 📋 Specified
- **File:** `/src/voice/realtime-agent.js` (to be built)

### 1.2 WebSocket Server
- **Purpose:** Real-time communication between worker UI and backend
- **Technology:** Express.js + ws library
- **Features:**
  - Session management
  - Audio stream handling
  - Message routing
  - Connection lifecycle
- **Status:** 📋 Specified
- **File:** `/src/voice/server.js` (to be built)

### 1.3 Conversation Analyzer
- **Purpose:** Real-time topic detection and sentiment analysis
- **Technology:** Custom NLP + MidStream integration
- **Features:**
  - Topic classification (equipment, supplies, safety, etc.)
  - Sentiment detection (positive, negative, urgent)
  - Keyword extraction
  - Pattern matching
- **Status:** 📋 Specified
- **File:** `/src/voice/conversation-analyzer.js` (to be built)

---

## 2. AgentDB Learning System

### 2.1 NightlyLearner
- **Purpose:** Automated overnight pattern discovery and recommendation generation
- **Technology:** AgentDB built-in component
- **Features:**
  - Discover causal relationships
  - Calculate propensity scores
  - Generate recommendations with ROI
  - Statistical confidence calculations
  - Pattern consolidation
- **Status:** ✅ Tested & Validated
- **Integration:** `/src/learning/nightly-learner.js` (to be built)

### 2.2 ReflexionMemory
- **Purpose:** AI self-improvement through conversation critique
- **Technology:** AgentDB built-in component
- **Features:**
  - Store conversation episodes with outcomes
  - Identify successful vs failed questioning strategies
  - Build critique library
  - Retrieve relevant past experiences
  - Calculate success rates
- **Status:** ✅ Tested & Validated
- **Integration:** `/src/learning/reflexion-manager.js` (to be built)

### 2.3 SkillLibrary
- **Purpose:** Consolidate effective interview patterns
- **Technology:** AgentDB built-in component
- **Features:**
  - Store successful question patterns
  - Semantic search for relevant questions
  - Link related skills
  - Calculate pattern confidence
  - Extract keyword frequencies
  - Build skill hierarchies
- **Status:** ✅ Tested & Validated
- **Integration:** `/src/learning/skill-consolidator.js` (to be built)

### 2.4 CausalMemoryGraph
- **Purpose:** Map cause-effect relationships with ROI calculations
- **Technology:** AgentDB built-in component
- **Features:**
  - Add causal edges (cause → effect)
  - Calculate uplift (impact measurement)
  - Query causal chains
  - Detect confounders (hidden variables)
  - Statistical significance testing
  - ROI estimation
- **Status:** ✅ Tested & Validated
- **Integration:** `/src/learning/causal-analyzer.js` (to be built)

### 2.5 Conversation Strategy Planner
- **Purpose:** Goal-oriented interview planning for complete information extraction
- **Technology:** Custom implementation using goal-oriented planning
- **Features:**
  - Define information goals based on worker statements
  - Plan optimal question sequences
  - Track missing information (when, frequency, impact, etc.)
  - Dynamic replanning when answers are vague
  - Completeness validation
  - Integration with SkillLibrary (question templates)
  - Integration with ReflexionMemory (strategy learning)
  - Configurable strictness (strict follow-plan vs loose suggestions)
- **Status:** 📋 Specified (new)
- **Integration:** `/src/learning/conversation-planner.js` (to be built)
- **Priority:** Medium (enhances interview quality)

### 2.6 AgentDB Core
- **Purpose:** Database and memory orchestration
- **Technology:** AgentDB v1.6.1 (npm package)
- **Features:**
  - SQLite backend (sql.js WASM)
  - Vector search (HNSW index)
  - Local embeddings (no API key required)
  - 96-164x faster than traditional databases
  - Learning system coordination
- **Status:** ✅ Installed & Tested
- **Integration:** `/src/shared/db-adapter.js` (to be built)

---

## 3. MidStream Real-Time Analysis

### 3.1 MidStream Analyzer
- **Purpose:** Real-time conversation pattern detection
- **Technology:** MidStream (Rust + TypeScript)
- **Features:**
  - Stream-as-you-speak analysis
  - Dynamic Time Warping pattern matching
  - Chaos/attractor detection
  - Instant insights during conversation
  - Sub-millisecond latency
- **Status:** 📋 Researched (install pending)
- **Integration:** `/src/midstream/analyzer.js` (to be built)

### 3.2 Pattern Detector
- **Purpose:** Identify recurring issues in real-time
- **Technology:** Custom logic + MidStream
- **Features:**
  - Same-issue detection across workers
  - Frequency tracking
  - Urgency escalation
  - Live admin alerts
- **Status:** 📋 Specified
- **File:** `/src/midstream/pattern-detector.js` (to be built)

### 3.3 Alert Manager
- **Purpose:** Real-time notification system for urgent issues
- **Technology:** Custom event system
- **Features:**
  - Urgency classification
  - Admin notification
  - Alert deduplication
  - Priority queuing
- **Status:** 📋 Specified
- **File:** `/src/midstream/alert-manager.js` (to be built)

---

## 4. Analytics Engine

### 4.1 Knowledge Graph Builder
- **Purpose:** Automatically discover company structure from conversations
- **Technology:** Custom graph engine + AgentDB
- **Features:**
  - Entity extraction (people, places, equipment)
  - Relationship mapping
  - Automatic categorization
  - Hierarchy discovery
  - Connection strength calculation
- **Status:** 📋 Specified
- **File:** `/src/analytics/knowledge-graph-builder.js` (to be built)

### 4.2 Pattern Engine
- **Purpose:** Find recurring issues and trends
- **Technology:** Statistical analysis + ML
- **Features:**
  - Temporal pattern detection (day/week/month)
  - Correlation analysis
  - Anomaly detection
  - Trend forecasting
- **Status:** 📋 Specified
- **File:** `/src/analytics/pattern-engine.js` (to be built)

### 4.3 Recommendation Generator
- **Purpose:** Create actionable insights with ROI
- **Technology:** Causal analysis + business logic
- **Features:**
  - Issue prioritization
  - ROI calculation
  - Confidence scoring
  - Implementation suggestions
  - Cost-benefit analysis
- **Status:** 📋 Specified
- **File:** `/src/analytics/recommendation-generator.js` (to be built)

### 4.4 Report Builder
- **Purpose:** Generate intelligence reports
- **Technology:** Template engine + data aggregation
- **Features:**
  - Executive summaries
  - Trend visualizations
  - Department comparisons
  - PDF/CSV export
  - Scheduled delivery
- **Status:** 📋 Specified
- **File:** `/src/analytics/report-builder.js` (to be built)

---

## 5. Admin Dashboard

### 5.1 Executive Summary View
- **Purpose:** High-level company intelligence overview
- **Technology:** HTML5 + JavaScript + Charts.js
- **Features:**
  - Top issues display
  - Department breakdowns
  - Employee satisfaction score
  - Trend indicators
  - Risk alerts
- **Status:** 📋 Specified
- **File:** `/src/dashboard/public/executive-summary.html` (to be built)

### 5.2 Employee Cards
- **Purpose:** Individual worker profiles and history
- **Technology:** Dynamic UI components
- **Features:**
  - Profile information
  - Conversation history
  - Performance indicators
  - Connection graph
  - Sentiment timeline
  - Topic distribution
- **Status:** 📋 Specified
- **File:** `/src/dashboard/public/employee-cards.html` (to be built)

### 5.3 Insights & Recommendations View
- **Purpose:** Detailed actionable insights
- **Technology:** Interactive data tables
- **Features:**
  - Filterable recommendations
  - Priority sorting
  - ROI visualization
  - Supporting evidence
  - Action tracking
- **Status:** 📋 Specified
- **File:** `/src/dashboard/public/insights.html` (to be built)

### 5.4 Transcript Search
- **Purpose:** Semantic search across all conversations
- **Technology:** AgentDB vector search
- **Features:**
  - Natural language queries
  - Semantic matching
  - Filters (date, worker, topic)
  - Quote extraction
  - Context highlighting
- **Status:** 📋 Specified
- **File:** `/src/dashboard/public/transcripts.html` (to be built)

### 5.5 Trend Analysis
- **Purpose:** Visualize changes over time
- **Technology:** Time-series charts
- **Features:**
  - Multi-metric comparison
  - Before/after analysis
  - Department trends
  - Forecasting
  - Export capabilities
- **Status:** 📋 Specified
- **File:** `/src/dashboard/public/trends.html` (to be built)

### 5.6 AI Q&A Assistant
- **Purpose:** Admin can ask questions about company data
- **Technology:** LLM + context retrieval
- **Features:**
  - Natural language questions
  - Context-aware answers
  - Source citations
  - Confidence scores
  - Follow-up suggestions
- **Status:** 📋 Specified
- **File:** `/src/dashboard/public/ai-assistant.html` (to be built)

### 5.7 Voice Agent Configuration Panel
- **Purpose:** Customize AI interviewer behavior for experimentation and optimization
- **Technology:** HTML form + database persistence
- **Features:**
  - Toggle Conversation Planner ON/OFF
  - Strictness slider (1-10) for planning behavior
  - Question style selection (casual/balanced/structured)
  - Learning features toggles (ReflexionMemory, SkillLibrary)
  - Conversation length settings (duration, max follow-ups)
  - Language tuning (formality level, colloquial Slovak)
  - Preview mode (test settings before applying)
  - Reset to defaults
  - Configuration versioning
  - A/B testing support (compare different configs)
- **Status:** 📋 Specified (new)
- **File:** `/src/dashboard/public/settings.html` (to be built)
- **API:** `/src/dashboard/routes/config.js` (to be built)
- **Database:** `voice_agent_config` table
- **Priority:** Medium (enables experimentation, risk mitigation)

---

## 6. Infrastructure & Deployment

### 6.1 Docker Configuration
- **Purpose:** Containerized deployment
- **Technology:** Docker + Docker Compose
- **Features:**
  - Multi-container orchestration
  - Volume management
  - Network isolation
  - Health checks
- **Status:** 📋 Specified
- **File:** `docker-compose.yml` (to be built)

### 6.2 Nginx Reverse Proxy
- **Purpose:** SSL termination and routing
- **Technology:** Nginx
- **Features:**
  - HTTPS/WSS support
  - Let's Encrypt SSL
  - Rate limiting
  - Static file serving
- **Status:** 📋 Specified
- **File:** `nginx.conf` (to be built)

### 6.3 Monitoring & Logging
- **Purpose:** Application observability
- **Technology:** Winston logger + custom monitoring
- **Features:**
  - Error tracking
  - Performance metrics
  - Usage analytics
  - Log aggregation
- **Status:** 📋 Specified
- **File:** `/src/shared/logger.js` (to be built)

### 6.4 Database Migrations
- **Purpose:** Schema versioning and updates
- **Technology:** Custom migration system
- **Features:**
  - Version tracking
  - Rollback capability
  - Data preservation
  - Schema validation
- **Status:** 📋 Specified
- **File:** `/src/shared/database/migrations.js` (to be built)

---

## 7. Shared Utilities

### 7.1 Slovak Language Handler
- **Purpose:** Language-specific processing
- **Technology:** Custom utilities
- **Features:**
  - Dialect handling
  - Keyword extraction
  - Sentiment keywords (Slovak)
  - Common phrases
- **Status:** 📋 Specified
- **File:** `/src/shared/utils/slovak-language.js` (to be built)

### 7.2 Configuration Management
- **Purpose:** Centralized configuration
- **Technology:** dotenv + custom config loader
- **Features:**
  - Environment variables
  - AI prompts (Slovak)
  - Question strategies
  - System parameters
- **Status:** 📋 Specified
- **File:** `/src/config/agent-config.js` (to be built)

### 7.3 API Client
- **Purpose:** External API communication
- **Technology:** node-fetch + retry logic
- **Features:**
  - OpenAI API wrapper
  - Retry with exponential backoff
  - Error handling
  - Rate limiting
- **Status:** 📋 Specified
- **File:** `/src/shared/utils/api-client.js` (to be built)

---

## Implementation Priority

### Phase 1: Foundation (Critical)
1. AgentDB Core ✅
2. Realtime Voice Agent
3. WebSocket Server
4. Database Schema

### Phase 2: Learning (High Priority)
5. NightlyLearner Integration
6. ReflexionMemory Integration
7. SkillLibrary Integration
8. CausalMemoryGraph Integration

### Phase 3: Analysis (High Priority)
9. Conversation Analyzer
10. Knowledge Graph Builder
11. Pattern Engine
12. Recommendation Generator

### Phase 4: Dashboard (Medium Priority)
13. Executive Summary View
14. Employee Cards
15. Insights View
16. Transcript Search

### Phase 5: Polish (Lower Priority)
17. MidStream Analyzer
18. Trend Analysis
19. AI Q&A Assistant
20. Monitoring & Logging

---

## Testing Coverage

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|-----------|-------------------|-----------|
| AgentDB Core | ✅ Complete | ⏳ Pending | ⏳ Pending |
| NightlyLearner | ✅ Complete | ⏳ Pending | N/A |
| ReflexionMemory | ✅ Complete | ⏳ Pending | N/A |
| SkillLibrary | ✅ Complete | ⏳ Pending | N/A |
| CausalMemoryGraph | ✅ Complete | ⏳ Pending | N/A |
| Voice System | ⏳ Pending | ⏳ Pending | ⏳ Pending |
| Dashboard | ⏳ Pending | ⏳ Pending | ⏳ Pending |

---

## Dependencies

### Production Dependencies
- `agentdb@1.6.1` - Memory and learning system ✅ Installed
- `openai@^4.20.0` - Realtime API client
- `express@^4.18.2` - Web server
- `ws@^8.14.2` - WebSocket server
- `dotenv@^16.3.1` - Environment config
- `chart.js@^4.0.0` - Data visualization (TBD)

### Build Dependencies
- `midstream` - Real-time analysis (git clone)
- `better-sqlite3` - SQLite bindings (auto-installed by AgentDB)

### Development Dependencies
- `nodemon@^3.0.1` - Development server
- `jest@^29.0.0` - Testing framework (TBD)

---

**Total Components:** 25
**Completed:** 5 (AgentDB learning components)
**In Progress:** 0
**Pending:** 20

**Current Phase:** Specification (1 of 5 SPARC phases)
**Next Milestone:** Pseudocode phase - detailed implementation patterns

---

*Last Updated: 2025-01-18*
*Framework: SPARC Methodology*
