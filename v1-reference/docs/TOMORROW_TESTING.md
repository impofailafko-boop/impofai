# 🧪 Tomorrow's Testing Plan

## ✅ What We Accomplished Today

1. **✅ AgentDB Tested & Working**
   - Installed successfully
   - SQLite backend operational
   - Basic database operations verified
   - Test file: `test-agentdb-real.js`

2. **✅ Architecture Designed**
   - Complete MVP roadmap created
   - Database schema designed
   - Integration patterns defined
   - See: `ARCHITECTURE.md`

3. **✅ MidStream Research Complete**
   - Real-time analysis capabilities mapped
   - Integration code written
   - Example analyzer ready to use
   - See: `MIDSTREAM_INTEGRATION.md`

---

## 🎯 Tomorrow: What to Test

### **Test #1: AgentDB with Voice Agent** ⏱️ 30 minutes

**Goal:** Save conversations to database instead of JSON files

**Steps:**
1. Create database schema (SQL provided)
2. Modify `realtime-voice-agent.js` to use AgentDB
3. Have a test conversation
4. Verify transcript saved to SQLite
5. Check worker profile created

**Success Criteria:**
- ✅ Conversation saved to `voice-memory.db`
- ✅ Worker profile created automatically
- ✅ Can query conversations with SQL

---

### **Test #2: Memory & Context** ⏱️ 30 minutes

**Goal:** Agent remembers past conversations

**Steps:**
1. Have first conversation as Worker #123
2. End session
3. Start new session as same worker
4. Agent should load context
5. Verify it "remembers" you

**Success Criteria:**
- ✅ Agent greets you by name second time
- ✅ References past conversation
- ✅ Worker profile shows total calls: 2

---

### **Test #3: Real-time Pattern Detection** ⏱️ 45 minutes

**Goal:** MidStream detects issues during conversation

**Steps:**
1. Add MidStream analyzer to voice agent
2. Say "scanner is broken" during call
3. Check console for pattern detection
4. Say "urgent" and check for alert
5. Test Slovak keywords

**Success Criteria:**
- ✅ Pattern detected in console
- ✅ Alert triggered for urgent keywords
- ✅ Slovak keywords recognized
- ✅ Analysis saved with transcript

---

### **Test #4: Multi-Worker Pattern** ⏱️ 45 minutes

**Goal:** System detects same issue from multiple workers

**Steps:**
1. Worker 1 calls: "Scanner broken"
2. Worker 2 calls: "Scanner not working"
3. Worker 3 calls: "Scanner failed"
4. Check pattern detection
5. Verify escalation

**Success Criteria:**
- ✅ System connects 3 similar issues
- ✅ Pattern count increases
- ✅ Escalation triggered at threshold
- ✅ Recommendation generated

---

## 📁 Files Ready for Testing

### **Created Today:**
```
✅ /test-agentdb-real.js          - AgentDB functionality test
✅ /ARCHITECTURE.md                - Complete system design
✅ /MIDSTREAM_INTEGRATION.md       - Integration guide
✅ /TOMORROW_TESTING.md            - This file
✅ /simple-test.db                 - Working SQLite example
```

### **To Create Tomorrow:**
```
⏳ /voice-agent/src/db-adapter.js        - AgentDB integration
⏳ /voice-agent/src/midstream-analyzer.js - Real-time analysis
⏳ /shared/database/schema.sql            - Database tables
⏳ /dashboard/public/live-metrics.html    - Real-time dashboard
```

---

## 🗂️ Database Schema (Ready to Use)

```sql
-- Copy this into a file: /shared/database/schema.sql

-- Transcripts
CREATE TABLE IF NOT EXISTS transcripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT UNIQUE,
  worker_id TEXT NOT NULL,
  worker_name TEXT,
  role TEXT,
  conversation_json TEXT,
  duration_seconds INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Analysis
  issues_detected TEXT,
  sentiment TEXT,
  topics TEXT,

  -- Metadata
  location TEXT,
  shift TEXT,
  language TEXT DEFAULT 'slovak'
);

-- Worker Profiles
CREATE TABLE IF NOT EXISTS worker_profiles (
  worker_id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  location TEXT,
  shift TEXT,

  total_calls INTEGER DEFAULT 0,
  first_call DATETIME,
  last_call DATETIME,

  common_issues TEXT,
  preferences TEXT,
  metadata TEXT
);

-- Issues Tracker
CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issue_type TEXT,
  description TEXT,
  location TEXT,

  reported_by TEXT,
  session_id TEXT,
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',

  occurrence_count INTEGER DEFAULT 1,
  first_occurrence DATETIME,
  last_occurrence DATETIME
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_transcripts_worker
  ON transcripts(worker_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_date
  ON transcripts(created_at);
CREATE INDEX IF NOT EXISTS idx_issues_type
  ON issues(issue_type);
CREATE INDEX IF NOT EXISTS idx_issues_status
  ON issues(status);
```

---

## 🚀 Quick Start Commands

### **Run Tests:**
```bash
# Test AgentDB
node test-agentdb-real.js

# Check database
sqlite3 simple-test.db "SELECT * FROM transcripts;"

# View worker profiles
sqlite3 simple-test.db "SELECT * FROM worker_profiles;"
```

### **Start Voice Agent (current):**
```bash
cd voice-agent
npm run server
# Opens on http://localhost:3001
```

### **After Integration Tomorrow:**
```bash
cd voice-agent
npm run server
# Now with AgentDB + MidStream!
```

---

## 📊 Expected Results

### **After Test #1:**
```
voice-memory.db created with:
- 1 transcript
- 1 worker profile
- All metadata captured
```

### **After Test #2:**
```
Worker profile updated:
- total_calls: 2
- last_call: [timestamp]
- Agent remembers context
```

### **After Test #3:**
```
Console shows:
✅ Pattern detected: equipment
✅ Keywords matched: scanner, broken
✅ Alert triggered: normal
✅ Analysis saved to DB
```

### **After Test #4:**
```
Database shows:
- 3 transcripts (3 workers)
- 1 issue with occurrence_count: 3
- priority: escalated to 'high'
- Recommendation generated
```

---

## 🎯 Success Metrics for MVP

**Must Have (Tomorrow):**
- ✅ Conversations saved to database
- ✅ Worker profiles working
- ✅ Pattern detection functional
- ✅ Slovak language working

**Nice to Have:**
- ⏳ Real-time dashboard updates
- ⏳ Semantic search working
- ⏳ MidStream fully integrated
- ⏳ Alert notifications

**Future:**
- Video analysis
- ML-powered insights
- Multi-company support
- Mobile app

---

## 🔧 Troubleshooting Guide

### **If AgentDB fails:**
```bash
# Fallback to simple SQLite
npm install better-sqlite3
# Use the simple schema above
```

### **If MidStream fails:**
```bash
# Use our custom analyzer instead
# It's simpler and doesn't need Rust
# File: midstream-analyzer.js (already created)
```

### **If Slovak language issues:**
```bash
# Check OpenAI API language setting
# Verify voice agent config has:
language: 'slovak'
```

### **If database locked:**
```bash
# Close all connections
rm voice-memory.db
# Recreate with schema
```

---

## 💡 Key Insights

### **What Makes This Special:**

1. **One Repo = Everything**
   - No complex microservices
   - Simple deployment
   - Easy to understand

2. **Local First**
   - SQLite file
   - No external services
   - Works offline
   - Fast queries

3. **Real-time Intelligence**
   - Patterns detected DURING call
   - Immediate alerts
   - Live dashboard
   - Instant insights

4. **Slovak Language Ready**
   - OpenAI handles transcription
   - Pattern keywords in Slovak
   - Natural conversations

5. **Business Value**
   - Uncover company issues
   - Recommend improvements
   - Data-driven decisions
   - ROI tracking

---

## 📞 Test Conversations (Slovak)

### **Equipment Issue:**
```
Worker: "Dobrý deň, mám problém so skenerom."
Agent: "Dobrý deň! Aký problém máte so skenerom?"
Worker: "Skener v uličke 5 je pokazený. Nefunguje vôbec."
Agent: "Rozumiem. Kedy ste si prvýkrát všimli problém?"
Worker: "Dnes ráno okolo 8:00."
```

### **Supply Shortage:**
```
Worker: "Potrebujeme viac materiálu v sklade."
Agent: "Aký materiál potrebujete?"
Worker: "Chýbajú nám kartóny. Je ich málo."
Agent: "Koľko kartónov potrebujete?"
```

### **Urgent Issue:**
```
Worker: "URGENTNE! Kamión 5 má problém!"
Agent: "Čo se stalo s kamiónom 5?"
Worker: "Motor sa prehrievava. Nemôžem pokračovať v dodávke."
Agent: "Rozumiem, toto eskalujem ako urgentný problém."
```

---

## 🎬 Tomorrow's Schedule

### **Morning (9:00 - 12:00):**
- ☕ Review architecture document
- 🔧 Set up database schema
- 💾 Integrate AgentDB with voice agent
- 🧪 Test #1: Save to database

### **Afternoon (13:00 - 16:00):**
- 🧠 Test #2: Memory & context
- 🔍 Add MidStream analyzer
- 🧪 Test #3: Pattern detection
- 👥 Test #4: Multi-worker patterns

### **Evening (16:00 - 18:00):**
- 📊 Review results
- 📝 Document findings
- 🎯 Plan next steps
- 🚀 Deploy to Hetzner VPS

---

## 📚 Resources

### **Documentation:**
- `ARCHITECTURE.md` - Full system design
- `MIDSTREAM_INTEGRATION.md` - Real-time analysis guide
- `test-agentdb-real.js` - Working code example

### **External:**
- AgentDB: https://www.npmjs.com/package/agentdb
- MidStream: https://github.com/ruvnet/midstream
- OpenAI Realtime: https://platform.openai.com/docs

### **Test Files:**
- `simple-test.db` - Example database
- `test-agentdb-real.js` - Test script

---

## ✨ Final Checklist

**Before Testing:**
- [ ] Read ARCHITECTURE.md
- [ ] Review database schema
- [ ] Check OpenAI API key
- [ ] Backup current code

**During Testing:**
- [ ] Take notes on what works
- [ ] Screenshot any errors
- [ ] Log test conversations
- [ ] Monitor database

**After Testing:**
- [ ] Document results
- [ ] Identify issues
- [ ] Plan improvements
- [ ] Commit changes

---

## 🚀 Ready to Go!

Everything is set up for tomorrow's testing:

✅ AgentDB installed and tested
✅ Database schema designed
✅ Integration code written
✅ Test plan documented
✅ Example conversations prepared
✅ Troubleshooting guide ready

**Questions? Issues? Next steps?**

Just review the docs tonight and you'll be ready to test in the morning!

**Good luck! 🎉**
