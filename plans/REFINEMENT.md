# 🔍 ImpofAI - Refinement & Quality Assurance

**SPARC Phase 4: Refinement**
**Version:** 1.0
**Date:** 2025-01-18
**Status:** ✅ Complete

---

## 📋 Table of Contents

1. [Code Review Guidelines](#code-review-guidelines)
2. [Security Audit](#security-audit)
3. [Performance Testing](#performance-testing)
4. [Quality Assurance](#quality-assurance)
5. [User Acceptance Testing](#user-acceptance-testing)
6. [Documentation Review](#documentation-review)
7. [Pre-Deployment Checklist](#pre-deployment-checklist)

---

## 1. Code Review Guidelines

### 1.1 Code Review Checklist

**General Code Quality:**
- [ ] Code follows ES6+ modern JavaScript standards
- [ ] No hardcoded credentials or API keys
- [ ] Proper error handling (try/catch blocks)
- [ ] Logging is informative but not excessive
- [ ] No console.log in production code (use proper logger)
- [ ] Comments explain "why" not "what"
- [ ] Functions are single-purpose and < 50 lines
- [ ] Variable names are descriptive (no `data`, `temp`, `foo`)

**Slovak Language Support:**
- [ ] UTF-8 encoding confirmed in all files
- [ ] Slovak characters (á, č, ď, é, ž) handled correctly
- [ ] Database TEXT fields support Slovak without truncation
- [ ] OpenAI API configured with `language: 'sk'`
- [ ] No ASCII-only assumptions in text processing

**Security:**
- [ ] All user input validated with Zod schemas
- [ ] SQL queries use prepared statements (no string concatenation)
- [ ] XSS protection with DOMPurify on dashboard
- [ ] CSRF tokens on state-changing operations
- [ ] API keys stored in environment variables
- [ ] No sensitive data logged

**Performance:**
- [ ] Database queries use proper indexes
- [ ] No N+1 query problems
- [ ] Large operations are paginated
- [ ] WebSocket connections properly managed
- [ ] Memory leaks prevented (event listeners cleaned up)

**AgentDB Integration:**
- [ ] WAL mode enabled for SQLite
- [ ] Embeddings generated for searchable content
- [ ] Learning components initialized correctly
- [ ] Nightly learning scheduled properly

### 1.2 Code Review Process

**Before Implementation:**
1. Review SPECIFICATION.md for requirements
2. Review PSEUDOCODE.md for algorithms
3. Review ARCHITECTURE.md for system design

**During Implementation:**
1. Write code in small, reviewable chunks
2. Test each component individually
3. Verify Slovak language support at each step
4. Check memory usage with long-running operations

**After Implementation:**
1. Run all tests (unit, integration, e2e)
2. Perform security audit (Section 2)
3. Run performance benchmarks (Section 3)
4. Document any deviations from architecture

---

## 2. Security Audit

### 2.1 OWASP Top 10 Checklist

#### **A01: Broken Access Control**
- [ ] API endpoints verify authentication
- [ ] Workers can only access their own data
- [ ] Admins have separate authentication
- [ ] Session tokens expire after inactivity
- [ ] No IDOR vulnerabilities (predictable IDs)

#### **A02: Cryptographic Failures**
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] TLS 1.2+ only (no older protocols)
- [ ] API keys hashed with bcrypt (cost factor 10+)
- [ ] Database backup files encrypted
- [ ] Environment variables not committed to git

#### **A03: Injection**
- [ ] SQL injection: All queries use prepared statements
- [ ] Command injection: No `exec()` with user input
- [ ] XSS: All user content sanitized with DOMPurify
- [ ] Zod validation on all API inputs

**Test Cases:**
```javascript
// SQL Injection Test
POST /api/v1/workers
{ "workerId": "'; DROP TABLE conversations; --" }
// Expected: 400 Validation Error

// XSS Test
POST /api/v1/conversations/start
{ "workerId": "<script>alert('XSS')</script>" }
// Expected: 400 Validation Error or sanitized
```

#### **A04: Insecure Design**
- [ ] Rate limiting implemented (10 req/min per IP)
- [ ] Conversation Planner doesn't leak sensitive info
- [ ] Error messages don't reveal system internals
- [ ] Backup strategy prevents data loss

#### **A05: Security Misconfiguration**
- [ ] Helmet.js configured for security headers
- [ ] CORS restricted to known origins
- [ ] Directory listing disabled in Nginx
- [ ] Default credentials changed (PM2, database)
- [ ] Unnecessary services disabled

#### **A06: Vulnerable Components**
- [ ] `npm audit` shows no critical/high vulnerabilities
- [ ] Dependencies updated within last 6 months
- [ ] AgentDB version 1.6.1+ (confirmed secure)
- [ ] OpenAI SDK version 4.73.0+ (latest)

#### **A07: Authentication Failures**
- [ ] API keys are long and random (64+ chars)
- [ ] No default/test API keys in production
- [ ] Failed auth attempts logged
- [ ] No brute force vulnerabilities

#### **A08: Software and Data Integrity**
- [ ] Database integrity checks scheduled (PRAGMA integrity_check)
- [ ] Backups verified after creation (gunzip -t)
- [ ] Git commits signed (optional but recommended)
- [ ] npm packages verified (package-lock.json committed)

#### **A09: Logging and Monitoring**
- [ ] All API errors logged with context
- [ ] Failed auth attempts logged
- [ ] Database errors logged
- [ ] Log files rotated (PM2 log rotation enabled)
- [ ] Critical errors trigger alerts (optional for MVP)

#### **A10: Server-Side Request Forgery (SSRF)**
- [ ] No user-controlled URLs in OpenAI API calls
- [ ] WebSocket connections only to OpenAI domain
- [ ] No arbitrary webhook callbacks

### 2.2 GDPR Compliance Checklist

**Data Minimization:**
- [ ] Only collect necessary worker data (name, role, phone)
- [ ] Audio recordings optional (can be deleted after transcription)
- [ ] No unnecessary metadata stored

**Right to Access:**
- [ ] Workers can view their conversation history
- [ ] Admins can export worker data (JSON format)

**Right to Deletion:**
- [ ] API endpoint to delete worker data
- [ ] Cascade delete (conversations, patterns)
- [ ] Confirm deletion in database

**Consent:**
- [ ] Workers informed before first conversation
- [ ] Opt-in for audio recording storage
- [ ] Privacy policy accessible in UI

**Data Breach Notification:**
- [ ] Incident response plan documented
- [ ] Contact information for data controller
- [ ] 72-hour notification procedure defined

### 2.3 Security Testing Commands

```bash
# Check for hardcoded secrets
grep -r "sk-proj-" src/
grep -r "api_key" src/
grep -r "password" src/

# Audit npm dependencies
npm audit

# Check for common vulnerabilities
npm install -g eslint-plugin-security
eslint src/ --plugin security

# Test TLS configuration (after deployment)
testssl.sh impofai.yourdomain.com

# Test rate limiting
for i in {1..15}; do curl -X POST https://impofai.yourdomain.com/api/v1/conversations/start; done
# Should get 429 error after 10 requests
```

---

## 3. Performance Testing

### 3.1 Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Voice response latency | < 2s | < 5s |
| API response time | < 200ms | < 500ms |
| Database query time | < 50ms | < 100ms |
| Concurrent voice sessions | 10+ | 5+ |
| WebSocket reconnection time | < 3s | < 10s |
| Nightly learning completion | < 10min | < 30min |
| Dashboard load time | < 1s | < 3s |

### 3.2 Load Testing Plan

**Tools:**
- [k6](https://k6.io/) - Load testing
- `node --inspect` - Memory profiling
- `clinic.js` - Performance profiling

**Test Scenarios:**

#### **Scenario 1: Voice Session Load**
Simulate 10 concurrent voice conversations for 5 minutes.

```javascript
// k6 script: load-test-voice.js
import { check } from 'k6';
import http from 'k6/http';

export let options = {
  vus: 10, // 10 virtual users
  duration: '5m',
};

export default function() {
  let response = http.post('http://localhost:3000/api/v1/conversations/start',
    JSON.stringify({
      workerId: `WORKER-${__VU}`,
      workerPhone: '+421901234567'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**Expected Results:**
- 95th percentile response time < 500ms
- 0% error rate
- Memory usage stable (no leaks)

#### **Scenario 2: Database Query Performance**
Test pattern detection query with 1,000 conversations.

```bash
# Seed database with test data
node tests/seed-database.js --conversations=1000

# Run performance test
node tests/benchmark-queries.js
```

**Expected Results:**
- Pattern detection query < 100ms
- Knowledge graph query < 200ms
- Full-text search < 50ms

#### **Scenario 3: Nightly Learning**
Benchmark learning cycle with 100 conversations.

```bash
time node src/learning/runNightlyLearning.js
```

**Expected Results:**
- Completion time < 5 minutes for 100 conversations
- Memory usage < 500MB
- All patterns detected correctly

### 3.3 Memory Leak Detection

**Test Procedure:**
1. Start application with `node --inspect src/index.js`
2. Run load test for 30 minutes
3. Take heap snapshots every 5 minutes
4. Compare snapshots in Chrome DevTools

**Red Flags:**
- Heap size continuously growing
- Event listener count increasing
- Retained objects not garbage collected

**Common Causes:**
- WebSocket connections not closed
- Event listeners not removed
- Circular references in conversation data

### 3.4 Database Performance Optimization

**Before Production:**

```sql
-- Analyze query performance
EXPLAIN QUERY PLAN
SELECT * FROM conversations WHERE worker_id = 'WORKER-001';

-- Check index usage
PRAGMA index_info(idx_conversations_worker);

-- Verify WAL mode enabled
PRAGMA journal_mode;
-- Should return: wal

-- Check database size
SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();
```

**Optimization Techniques:**
- Vacuum database monthly: `VACUUM;`
- Analyze query patterns: `ANALYZE;`
- Consider partial indexes for large tables
- Archive old conversations (>1 year) to separate database

---

## 4. Quality Assurance

### 4.1 Testing Strategy

**Test Pyramid:**
```
         /\
        /  \  E2E Tests (10%)
       /____\
      /      \
     / Integration \ (30%)
    /__________\
   /            \
  /  Unit Tests  \ (60%)
 /________________\
```

### 4.2 Unit Testing

**Framework:** Jest or Vitest

**Coverage Targets:**
- Overall: 80%+
- Critical paths: 100%
- Security functions: 100%

**Test Files Structure:**
```
/tests/
├── unit/
│   ├── voice/
│   │   ├── OpenAIRealtimeClient.test.js
│   │   └── ConversationManager.test.js
│   ├── learning/
│   │   ├── NightlyLearner.test.js
│   │   └── SkillLibrary.test.js
│   └── analytics/
│       ├── PatternEngine.test.js
│       └── RecommendationGenerator.test.js
```

**Example Unit Test:**

```javascript
// tests/unit/voice/ConversationManager.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationManager } from '../../../src/voice/ConversationManager.js';

describe('ConversationManager', () => {
  let manager;
  let mockDB;

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        run: vi.fn()
      })
    };
    manager = new ConversationManager(mockDB);
  });

  it('should create conversation with Slovak worker', async () => {
    const result = await manager.startConversation({
      workerId: 'WORKER-001',
      workerName: 'Ján Novák',
      role: 'warehouse'
    });

    expect(result.conversationId).toBeDefined();
    expect(result.status).toBe('active');
  });

  it('should handle Slovak characters in transcript', async () => {
    const transcript = 'Dobrý deň, skener nefunguje.';

    await manager.addTranscriptTurn({
      conversationId: 'conv-123',
      speaker: 'worker',
      text: transcript
    });

    // Verify Slovak characters stored correctly
    expect(mockDB.prepare).toHaveBeenCalledWith(
      expect.stringContaining('Dobrý deň')
    );
  });
});
```

### 4.3 Integration Testing

**Test Scope:** Multiple components working together

**Example Integration Test:**

```javascript
// tests/integration/voice-to-database.test.js
import { describe, it, expect } from 'vitest';
import { ConversationManager } from '../../src/voice/ConversationManager.js';
import { initializeAgentDB } from '../../src/database/initAgentDB.js';

describe('Voice to Database Integration', () => {
  let db;
  let manager;

  beforeAll(async () => {
    db = await initializeAgentDB({ filename: ':memory:' });
    manager = new ConversationManager(db);
  });

  it('should store complete Slovak conversation', async () => {
    // Start conversation
    const { conversationId } = await manager.startConversation({
      workerId: 'WORKER-TEST',
      workerName: 'Test Pracovník',
      role: 'warehouse'
    });

    // Add Slovak turns
    await manager.addTranscriptTurn({
      conversationId,
      speaker: 'worker',
      text: 'Skener v uličke 5 nefunguje.'
    });

    await manager.addTranscriptTurn({
      conversationId,
      speaker: 'agent',
      text: 'Kedy ste si prvýkrát všimli problém?'
    });

    // End conversation
    await manager.endConversation(conversationId);

    // Verify stored in database
    const stored = db.prepare(`
      SELECT * FROM conversations WHERE conversation_id = ?
    `).get(conversationId);

    expect(stored).toBeDefined();
    expect(stored.transcript).toContain('Skener v uličke 5');
    expect(stored.duration_seconds).toBeGreaterThan(0);
  });
});
```

### 4.4 End-to-End Testing

**Framework:** Playwright or Cypress

**Test Scenarios:**

1. **Worker Voice Session E2E:**
   - Worker opens app
   - Clicks "Start Conversation"
   - Speaks in Slovak (simulated)
   - Conversation saved to database
   - Dashboard shows new conversation

2. **Admin Pattern Review E2E:**
   - Admin logs in
   - Views dashboard
   - Sees detected patterns
   - Clicks on pattern details
   - Exports report

3. **Configuration Change E2E:**
   - Admin opens settings
   - Toggles Conversation Planner OFF
   - Saves configuration
   - Starts new conversation
   - Verifies planner not used

---

## 5. User Acceptance Testing

### 5.1 UAT Test Cases

#### **TC-001: Worker Reports Issue in Slovak**

**Objective:** Verify worker can report equipment issue in natural Slovak

**Preconditions:**
- Worker has access to voice interface
- OpenAI API is configured for Slovak

**Steps:**
1. Worker opens voice interface
2. Worker clicks "Nahlásiť problém" (Report Problem)
3. Worker speaks: "Dobrý deň, mám problém so skenerom v uličke 5. Nefunguje už dva dni."
4. AI responds in Slovak with follow-up question
5. Worker answers follow-up
6. Conversation ends after information gathered

**Expected Results:**
- ✅ Slovak speech transcribed correctly (95%+ accuracy)
- ✅ AI responds in natural Slovak
- ✅ Conversation stored in database
- ✅ Worker feels conversation was natural, not robotic

**Success Criteria:** 9/10 workers rate conversation as "natural"

---

#### **TC-002: Admin Views Patterns Dashboard**

**Objective:** Verify admin can quickly identify top issues

**Preconditions:**
- At least 10 conversations in database
- Patterns detected by analytics engine

**Steps:**
1. Admin logs into dashboard
2. Dashboard loads within 2 seconds
3. Admin sees top 3 patterns highlighted
4. Admin clicks on "Scanner malfunction" pattern
5. Pattern details show:
   - 5 workers affected
   - Location: Warehouse, aisle 5
   - ROI calculation: €300 fix, 5 day payback
   - Recommendation: Replace scanner

**Expected Results:**
- ✅ Dashboard loads quickly (< 2s)
- ✅ Patterns clearly presented
- ✅ ROI calculations visible
- ✅ Actionable recommendations provided

**Success Criteria:** Admin can identify and prioritize top issue within 1 minute

---

#### **TC-003: Toggle Conversation Planner**

**Objective:** Verify Conversation Planner can be toggled on/off

**Preconditions:**
- Admin has access to configuration panel

**Steps:**
1. Admin opens Voice Agent Configuration
2. Sees "Conversation Planner: ON" toggle
3. Toggles to OFF
4. Saves configuration
5. Starts test conversation
6. Observes AI conversation style

**Expected Results:**
- ✅ Configuration saved successfully
- ✅ With planner ON: AI follows structured question pattern (who, what, where, when, how)
- ✅ With planner OFF: AI asks more natural, conversational questions
- ✅ Change takes effect immediately (no restart needed)

**Success Criteria:** Conversation style noticeably different with planner OFF

---

#### **TC-004: Pattern Detection Accuracy**

**Objective:** Verify analytics engine correctly identifies repeated issues

**Preconditions:**
- System seeded with 3 conversations about same issue (scanner aisle 5)
- System seeded with 2 conversations about different issue (forklift malfunction)

**Steps:**
1. Run nightly learning cycle
2. Check patterns table in database
3. Verify pattern created for "Scanner malfunction, aisle 5"
4. Verify affected_workers count = 3
5. Check dashboard displays pattern

**Expected Results:**
- ✅ Pattern correctly grouped (3 workers, same issue, same location)
- ✅ No false patterns (unrelated issues not grouped together)
- ✅ Pattern displayed on dashboard
- ✅ Recommendation generated with ROI

**Success Criteria:** 100% accuracy in grouping same issues

---

#### **TC-005: Slovak Character Handling**

**Objective:** Verify all Slovak special characters handled correctly

**Preconditions:**
- Database created with UTF-8 encoding

**Steps:**
1. Worker speaks text with all Slovak characters: "Áno, čistenie ďalej, éra ľadu, ňutro, óda, ŕžať, šport, ťažký, úroda, ý čas, žena"
2. Conversation stored
3. Admin views transcript in dashboard
4. Export transcript to PDF report

**Expected Results:**
- ✅ All characters stored correctly in database
- ✅ All characters display correctly in dashboard
- ✅ All characters exported correctly in PDF
- ✅ No character corruption or ???? symbols

**Success Criteria:** 100% accurate Slovak character handling

---

### 5.2 UAT Sign-Off Criteria

**Must Pass:**
- [ ] TC-001: Worker voice interaction (9/10 satisfaction)
- [ ] TC-002: Admin dashboard usability
- [ ] TC-004: Pattern detection accuracy (100%)
- [ ] TC-005: Slovak character handling (100%)

**Should Pass:**
- [ ] TC-003: Configuration toggle working
- [ ] All critical bugs fixed
- [ ] Performance targets met

**Nice to Have:**
- [ ] Dashboard polished UI
- [ ] Report exports formatted nicely
- [ ] Mobile-responsive design

---

## 6. Documentation Review

### 6.1 Documentation Checklist

**README.md:**
- [ ] Installation instructions accurate
- [ ] Quick start guide works for new developers
- [ ] Environment variables documented
- [ ] Testing commands correct
- [ ] License included

**API Documentation:**
- [ ] All endpoints documented
- [ ] Request/response examples included
- [ ] Error codes explained
- [ ] Authentication described
- [ ] Rate limits documented

**Code Comments:**
- [ ] Complex algorithms explained
- [ ] Slovak language quirks noted
- [ ] Security considerations documented
- [ ] Performance optimizations explained

**User Guides:**
- [ ] Worker voice interface guide (Slovak)
- [ ] Admin dashboard guide
- [ ] Configuration panel guide
- [ ] Troubleshooting guide

### 6.2 Code Documentation Standards

**JSDoc Example:**

```javascript
/**
 * Analyzes a Slovak conversation turn and extracts entities
 * @param {string} text - Slovak text from conversation
 * @param {Object} context - Previous conversation context
 * @returns {Promise<Object>} Extracted entities (location, equipment, people, issue)
 * @throws {Error} If text contains unsupported language
 *
 * @example
 * const entities = await analyzeTurn(
 *   "Skener v uličke 5 nefunguje.",
 *   { workerId: 'WORKER-001' }
 * );
 * // Returns: { equipment: 'skener', location: 'ulička 5', issue: 'nefunguje' }
 */
async function analyzeTurn(text, context) {
  // Implementation
}
```

---

## 7. Pre-Deployment Checklist

### 7.1 Environment Setup

**Development:**
- [ ] Node.js 18+ installed
- [ ] npm dependencies installed (`npm install`)
- [ ] `.env.development` configured
- [ ] OpenAI API key set
- [ ] Database initialized

**Staging (Optional):**
- [ ] Separate Hetzner VPS or Docker container
- [ ] `.env.staging` configured
- [ ] SSL certificate (Let's Encrypt)
- [ ] Test with real Slovak conversations
- [ ] Performance tested under load

**Production:**
- [ ] Hetzner VPS provisioned (CX21 minimum)
- [ ] Ubuntu 22.04 LTS installed
- [ ] Nginx configured (SSL, reverse proxy)
- [ ] PM2 ecosystem.config.js ready
- [ ] `.env.production` configured
- [ ] Database backup cron jobs scheduled
- [ ] Off-site backup configured
- [ ] Monitoring setup (optional: Grafana/Prometheus)

### 7.2 Pre-Launch Security Scan

```bash
# Run all security checks
npm audit --audit-level=high
npm run test:security

# Check for exposed secrets
git secrets --scan

# Verify environment variables
node scripts/verify-env.js

# Test HTTPS configuration
curl -I https://impofai.yourdomain.com

# Verify rate limiting
node tests/test-rate-limit.js
```

### 7.3 Performance Baseline

**Before Launch, Record:**

| Metric | Baseline | Date Measured |
|--------|----------|---------------|
| API response time (avg) | ____ ms | __________ |
| Voice session latency | ____ s | __________ |
| Database query time (avg) | ____ ms | __________ |
| Nightly learning duration | ____ min | __________ |
| Dashboard load time | ____ s | __________ |
| Memory usage (idle) | ____ MB | __________ |
| Memory usage (10 sessions) | ____ MB | __________ |

**Post-Launch, Monitor:**
- Performance degradation > 20% triggers investigation
- Error rate > 1% triggers alert
- Memory leak (>10% growth/hour) triggers restart

### 7.4 Rollback Plan

**If Critical Bug Found in Production:**

1. **Immediate Response (< 5 min):**
   ```bash
   # Rollback to previous version
   cd /var/www/impofai
   git checkout <previous-commit-hash>
   npm install --production
   pm2 restart impofai
   ```

2. **Restore Database (if corrupted):**
   ```bash
   ./scripts/restore-database.sh /var/backups/impofai/agentdb_backup_<timestamp>.sqlite.gz
   ```

3. **Notify Users:**
   - Post status update (if status page exists)
   - Email admin users about issue
   - Provide ETA for fix

4. **Root Cause Analysis:**
   - Review logs: `pm2 logs impofai --lines 1000`
   - Check database integrity: `sqlite3 data/agentdb.sqlite "PRAGMA integrity_check;"`
   - Document incident in `docs/INCIDENTS.md`

### 7.5 Go-Live Checklist

**24 Hours Before:**
- [ ] All tests passing (unit, integration, e2e)
- [ ] UAT sign-off received
- [ ] Security audit complete (no critical issues)
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Backup strategy tested (restore from backup)
- [ ] Rollback procedure tested

**Launch Day:**
- [ ] Deploy to production server
- [ ] Verify SSL certificate valid
- [ ] Run smoke tests on production
- [ ] Test with real Slovak conversation
- [ ] Monitor logs for 1 hour
- [ ] Verify backups running

**48 Hours After:**
- [ ] Check error logs daily
- [ ] Monitor performance metrics
- [ ] Verify nightly learning completed
- [ ] Test database backup restore
- [ ] Collect initial user feedback

---

## 📋 Refinement Completion Checklist

- [x] Code review guidelines documented
- [x] Security audit checklist (OWASP Top 10, GDPR)
- [x] Performance testing strategy with benchmarks
- [x] QA strategy (unit, integration, e2e tests)
- [x] UAT test cases with acceptance criteria
- [x] Documentation review standards
- [x] Pre-deployment checklist
- [x] Rollback plan defined
- [x] Go-live checklist created

---

## 🎯 Next Phase: Completion (Implementation)

**Phase 5 will deliver:**
- Working codebase in `/src/`
- All tests passing
- Deployed to Hetzner VPS
- Monitoring active
- Documentation complete

**Estimated Timeline:**
- Core implementation: 6-8 hours
- Testing & QA: 2-3 hours
- Deployment: 1-2 hours
- **Total:** 9-13 hours to production

---

**Document Version:** 1.0
**Last Updated:** 2025-01-18
**Status:** ✅ Refinement Phase Complete - Ready for Implementation
