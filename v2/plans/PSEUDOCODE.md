# ImpofAI V2 - Pseudocode (SPARC)

**Version:** 2.1.0
**Last Updated:** November 19, 2025
**Purpose:** Algorithm definitions for key system components

---

## Table of Contents

1. [Tool Endpoints](#1-tool-endpoints)
2. [Webhook Processing](#2-webhook-processing)
3. [Dynamic Variables](#3-dynamic-variables)
4. [Database Operations](#4-database-operations)
5. [Pattern Detection](#5-pattern-detection)

---

## 1. Tool Endpoints

### 1.1 get_context - Worker Context Retrieval

**Endpoint:** `GET /api/tools/context/:workerId`

**Purpose:** Fetch worker profile, conversation history, and active issues for AI personalization

**Algorithm:**

```pseudocode
FUNCTION getWorkerContext(workerId)
  START_TIMER for performance monitoring

  // Step 1: Fetch worker profile
  worker = DATABASE.query("SELECT * FROM workers WHERE worker_id = ?", [workerId])

  IF worker is NULL THEN
    RETURN {
      success: true,
      worker_id: workerId,
      context: {
        is_new_worker: true,
        message: "New worker - no previous context available",
        suggested_greeting: "Ahoj! Vitajte v ImpofAI. Som váš AI asistent. Ako sa máte dnes?"
      }
    }
  END IF

  // Step 2: Fetch recent conversations (last 3)
  recentConversations = DATABASE.query(
    "SELECT conversation_id, started_at, topics, sentiment
     FROM conversations
     WHERE worker_id = ?
     ORDER BY started_at DESC
     LIMIT 3",
    [workerId]
  )

  // Step 3: Fetch active patterns using JUNCTION TABLE (fast query)
  activePatterns = DATABASE.query(
    "SELECT p.pattern_id, p.pattern_type, p.issue_description,
            p.location, p.urgency_level, pw.reported_at
     FROM patterns p
     INNER JOIN pattern_workers pw ON p.pattern_id = pw.pattern_id
     WHERE pw.worker_id = ? AND p.status = 'active'
     ORDER BY p.urgency_level DESC, p.last_occurrence DESC
     LIMIT 5",
    [workerId]
  )

  // Step 4: Generate conversation tips based on context
  conversationTips = generateConversationTips(worker, recentConversations, activePatterns)

  // Step 5: Build and return context object
  context = {
    worker: {
      id: worker.worker_id,
      name: worker.name,
      role: worker.role,
      total_conversations: worker.total_conversations,
      last_conversation: worker.last_conversation_at,
      preferred_language: worker.preferred_language
    },
    recent_conversations: MAP recentConversations TO {
      date: conv.started_at,
      topics: PARSE_JSON(conv.topics) OR [],
      sentiment: conv.sentiment
    },
    active_issues: MAP activePatterns TO {
      id: pattern.pattern_id,
      type: pattern.pattern_type,
      description: pattern.issue_description,
      location: pattern.location,
      urgency: pattern.urgency_level
    },
    conversation_tips: conversationTips
  }

  ELAPSED_TIME = STOP_TIMER
  LOG "get_context completed in {ELAPSED_TIME}ms for worker {workerId}"

  // Target: < 1000ms, typical: 35-80ms
  IF ELAPSED_TIME > 1000 THEN
    LOG_WARNING "get_context exceeded performance target"
  END IF

  RETURN {
    success: true,
    worker_id: workerId,
    context: context
  }
END FUNCTION


FUNCTION generateConversationTips(worker, recentConversations, activePatterns)
  tips = []

  // Tip 1: New vs returning worker
  IF worker.total_conversations == 0 THEN
    tips.ADD("First conversation - build rapport and explain purpose")
  ELSE IF LENGTH(recentConversations) > 0 THEN
    lastConv = recentConversations[0]
    lastTopics = PARSE_JSON(lastConv.topics) OR []
    IF LENGTH(lastTopics) > 0 THEN
      tips.ADD("Follow up on topics from last conversation: " + JOIN(lastTopics, ", "))
    END IF
  END IF

  // Tip 2: Sentiment-based
  IF worker.average_sentiment IN ["negative", "frustrated"] THEN
    tips.ADD("Worker has shown frustration - be empathetic and solution-focused")
  END IF

  // Tip 3: Active issues
  IF LENGTH(activePatterns) > 0 THEN
    tips.ADD("Ask about known issues: " + activePatterns[0].issue_description)
  END IF

  // Tip 4: Role-specific
  IF worker.role IS NOT NULL THEN
    tips.ADD("Ask role-specific questions for: " + worker.role)
  END IF

  RETURN tips
END FUNCTION
```

**Performance Target:** < 1000ms (critical), typical 35-80ms

---

### 1.2 log_issue - Real-Time Issue Logging

**Endpoint:** `POST /api/tools/issue`

**Purpose:** Log issues mentioned by worker during call, detect patterns, update occurrence counts

**Algorithm:**

```pseudocode
FUNCTION logIssue(issueData)
  START_TIMER for performance monitoring

  // Step 1: Validate required fields
  IF issueData.worker_id IS NULL OR issueData.issue_description IS NULL THEN
    THROW ERROR "worker_id and issue_description are required"
  END IF

  // Step 2: Set defaults for optional fields
  urgency = issueData.urgency OR "medium"
  location = issueData.location OR NULL
  equipment = issueData.equipment OR NULL
  sentiment = issueData.sentiment OR "neutral"

  // Step 3: Check for existing similar pattern (exact match on description + location)
  existingPattern = DATABASE.query(
    "SELECT pattern_id, occurrence_count
     FROM patterns
     WHERE status = 'active'
       AND issue_description = ?
       AND (location = ? OR location IS NULL)
     LIMIT 1",
    [issueData.issue_description, location]
  )

  IF existingPattern EXISTS THEN
    // Pattern already exists - UPDATE
    patternId = existingPattern.pattern_id

    // Step 4a: Check if this worker already reported this pattern
    workerAlreadyReported = DATABASE.query(
      "SELECT 1 FROM pattern_workers
       WHERE pattern_id = ? AND worker_id = ?",
      [patternId, issueData.worker_id]
    )

    IF workerAlreadyReported THEN
      // Worker already in junction table - just update mention count
      DATABASE.execute(
        "UPDATE pattern_workers
         SET mention_count = mention_count + 1,
             last_mentioned_at = CURRENT_TIMESTAMP,
             severity_at_report = ?
         WHERE pattern_id = ? AND worker_id = ?",
        [urgency, patternId, issueData.worker_id]
      )
    ELSE
      // New worker for this pattern - INSERT into junction table
      DATABASE.execute(
        "INSERT INTO pattern_workers
         (pattern_id, worker_id, reported_at, severity_at_report,
          first_mentioned_at, last_mentioned_at, mention_count)
         VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)",
        [patternId, issueData.worker_id, urgency]
      )
    END IF

    // Step 4b: Update pattern occurrence count
    DATABASE.execute(
      "UPDATE patterns
       SET occurrence_count = occurrence_count + 1,
           last_occurrence = CURRENT_TIMESTAMP,
           urgency_level = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE pattern_id = ?",
      [urgency, patternId]
    )

    // Step 4c: Count affected workers
    affectedWorkersCount = DATABASE.query(
      "SELECT COUNT(DISTINCT worker_id) as count
       FROM pattern_workers
       WHERE pattern_id = ?",
      [patternId]
    )

    LOG "Updated existing pattern {patternId} - occurrence #{existingPattern.occurrence_count + 1}"

    RETURN {
      success: true,
      issue_id: patternId,
      message: "Issue logged successfully",
      pattern_status: "updated_existing",
      occurrence_count: existingPattern.occurrence_count + 1,
      affected_workers_count: affectedWorkersCount.count
    }

  ELSE
    // New pattern - CREATE
    patternId = GENERATE_ID("pattern_" + TIMESTAMP + "_" + RANDOM_STRING)

    // Step 5a: Insert new pattern
    DATABASE.execute(
      "INSERT INTO patterns
       (pattern_id, pattern_type, issue_description, location, equipment,
        first_occurrence, last_occurrence, occurrence_count, urgency_level,
        sentiment_trend, status, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, ?, ?, 'active', CURRENT_TIMESTAMP)",
      [patternId, "reported_issue", issueData.issue_description, location, equipment, urgency, sentiment]
    )

    // Step 5b: Insert into junction table
    DATABASE.execute(
      "INSERT INTO pattern_workers
       (pattern_id, worker_id, reported_at, severity_at_report,
        first_mentioned_at, last_mentioned_at, mention_count)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)",
      [patternId, issueData.worker_id, urgency]
    )

    LOG "Created new pattern {patternId}"

    RETURN {
      success: true,
      issue_id: patternId,
      message: "Issue logged successfully",
      pattern_status: "new_pattern",
      occurrence_count: 1,
      affected_workers_count: 1
    }
  END IF

  ELAPSED_TIME = STOP_TIMER
  LOG "log_issue completed in {ELAPSED_TIME}ms"

  // Target: < 500ms
  IF ELAPSED_TIME > 500 THEN
    LOG_WARNING "log_issue exceeded performance target"
  END IF
END FUNCTION
```

**Performance Target:** < 500ms (typical 15-35ms)

---

## 2. Webhook Processing

### 2.1 process_elevenlabs_webhook - Post-Call Transcript Handler

**Endpoint:** `POST /api/webhook/elevenlabs`

**Purpose:** Receive completed call transcript, verify signature, store conversation, trigger analytics

**Algorithm:**

```pseudocode
FUNCTION processElevenLabsWebhook(request, response)
  START_TIMER for performance monitoring

  // Step 1: CRITICAL SECURITY - Verify webhook signature
  signature = request.headers['x-elevenlabs-signature']

  IF signature IS NULL THEN
    LOG_ERROR "Missing webhook signature"
    RETURN response.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Missing signature header"
    })
  END IF

  payload = JSON.stringify(request.body)
  secret = ENVIRONMENT_VARIABLE("WEBHOOK_SECRET")

  expectedSignature = HMAC_SHA256(secret, payload)
  expectedSignatureFormatted = "sha256=" + expectedSignature

  IF signature != expectedSignatureFormatted THEN
    LOG_ERROR "Invalid webhook signature - possible attack attempt"
    RETURN response.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid signature"
    })
  END IF

  LOG "✅ Webhook signature verified"

  // Step 2: Extract data from payload
  callId = request.body.call_id
  phoneNumber = request.body.phone_number
  startedAt = request.body.started_at
  endedAt = request.body.ended_at
  durationSeconds = request.body.duration_seconds
  transcript = request.body.transcript
  metadata = request.body.metadata OR {}

  workerId = metadata.worker_id OR phoneNumber

  // Step 3: Generate conversation ID
  conversationId = GENERATE_ID("conv_" + TIMESTAMP + "_" + RANDOM_STRING)

  // Step 4: Store conversation in database
  BEGIN_TRANSACTION

  TRY
    DATABASE.execute(
      "INSERT INTO conversations
       (conversation_id, worker_id, session_id, started_at, ended_at,
        duration_seconds, transcript, call_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
      [conversationId, workerId, callId, startedAt, endedAt,
       durationSeconds, JSON.stringify(transcript), callId]
    )

    // Step 5: Update worker metrics
    DATABASE.execute(
      "UPDATE workers
       SET total_conversations = total_conversations + 1,
           last_conversation_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE worker_id = ?",
      [startedAt, workerId]
    )

    // If worker doesn't exist, create basic profile
    IF AFFECTED_ROWS == 0 THEN
      DATABASE.execute(
        "INSERT INTO workers (worker_id, name, role, phone_number,
                              total_conversations, last_conversation_at, created_at)
         VALUES (?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)",
        [workerId, "Unknown", "Worker", phoneNumber, startedAt]
      )
    END IF

    COMMIT_TRANSACTION

  CATCH error
    ROLLBACK_TRANSACTION
    LOG_ERROR "Failed to store conversation: " + error.message
    RETURN response.status(500).json({
      success: false,
      error: "Database error",
      message: error.message
    })
  END TRY

  LOG "✅ Stored conversation {conversationId}"

  // Step 6: Trigger async analysis (non-blocking)
  QUEUE_BACKGROUND_JOB("analyze_conversation", {
    conversation_id: conversationId,
    worker_id: workerId
  })

  ELAPSED_TIME = STOP_TIMER
  LOG "Webhook processed in {ELAPSED_TIME}ms"

  // Must respond within 10 seconds (ElevenLabs timeout)
  // Target: < 2 seconds
  IF ELAPSED_TIME > 2000 THEN
    LOG_WARNING "Webhook processing exceeded 2s target"
  END IF

  RETURN response.status(200).json({
    success: true,
    conversation_id: conversationId,
    message: "Conversation stored successfully"
  })
END FUNCTION


FUNCTION analyzeConversation(conversationId, workerId)
  // Async background job - no time pressure

  conversation = DATABASE.query(
    "SELECT * FROM conversations WHERE conversation_id = ?",
    [conversationId]
  )

  // Extract topics using simple keyword detection (can be upgraded to LLM later)
  topics = extractTopics(conversation.transcript)

  // Analyze sentiment
  sentiment = analyzeSentiment(conversation.transcript)

  // Update conversation with analysis
  DATABASE.execute(
    "UPDATE conversations
     SET topics = ?, sentiment = ?, processed_by_nightly = TRUE
     WHERE conversation_id = ?",
    [JSON.stringify(topics), sentiment, conversationId]
  )

  // Update worker's average sentiment
  updateWorkerAverageSentiment(workerId)

  LOG "✅ Analyzed conversation {conversationId}"
END FUNCTION


FUNCTION extractTopics(transcript)
  // Simple keyword-based topic extraction
  topics = []
  text = JOIN(MAP transcript TO turn.text, " ")
  text = LOWERCASE(text)

  // Slovak keywords for common topics
  IF text CONTAINS ["skener", "scanner", "čítačka"] THEN
    topics.ADD("equipment_scanner")
  END IF

  IF text CONTAINS ["vozík", "vysokozdvižný"] THEN
    topics.ADD("equipment_forklift")
  END IF

  IF text CONTAINS ["brzd", "nefunguje", "pokazený"] THEN
    topics.ADD("equipment_malfunction")
  END IF

  IF text CONTAINS ["batéria", "nabíjanie"] THEN
    topics.ADD("equipment_battery")
  END IF

  IF text CONTAINS ["ľudia", "personál", "chýba"] THEN
    topics.ADD("staffing_shortage")
  END IF

  IF text CONTAINS ["bezpečnosť", "nebezpečn"] THEN
    topics.ADD("safety_concern")
  END IF

  RETURN topics
END FUNCTION


FUNCTION analyzeSentiment(transcript)
  // Simple sentiment analysis based on Slovak keywords
  positiveCount = 0
  negativeCount = 0

  FOR EACH turn IN transcript WHERE turn.role == "user" DO
    text = LOWERCASE(turn.text)

    // Positive indicators
    IF text CONTAINS ["dobre", "super", "výborne", "funguje", "v pohode"] THEN
      positiveCount = positiveCount + 1
    END IF

    // Negative indicators
    IF text CONTAINS ["nefunguje", "pokazený", "problém", "zlý", "frustrujúce", "otravné"] THEN
      negativeCount = negativeCount + 1
    END IF
  END FOR

  IF negativeCount > positiveCount + 2 THEN
    RETURN "frustrated"
  ELSE IF negativeCount > positiveCount THEN
    RETURN "negative"
  ELSE IF positiveCount > negativeCount THEN
    RETURN "positive"
  ELSE
    RETURN "neutral"
  END IF
END FUNCTION
```

**Performance Target:** < 2 seconds for webhook response, < 10 seconds max (ElevenLabs timeout)

---

## 3. Dynamic Variables

### 3.1 buildSlovakPrompt - Context-Aware System Prompt Generator

**Purpose:** Generate personalized Slovak system prompt with worker context

**Algorithm:**

```pseudocode
FUNCTION buildSlovakPrompt(context)
  // Extract data with defaults
  workerName = context.worker?.name OR "zamestnanec"
  workerRole = context.worker?.role OR "pracovník"
  lastConvo = context.recent_conversations?[0] OR NULL
  activeIssues = context.active_issues OR []

  // Generate time-based greeting
  hour = CURRENT_HOUR()
  IF hour < 12 THEN
    timeGreeting = "Dobré ráno"
  ELSE IF hour < 17 THEN
    timeGreeting = "Dobrý deň"
  ELSE
    timeGreeting = "Dobrý večer"
  END IF

  // Build context section
  contextInfo = ""

  IF lastConvo IS NOT NULL THEN
    lastDate = FORMAT_DATE(lastConvo.date, "sk-SK", "day numeric, month long")
    contextInfo = contextInfo + "- Posledný rozhovor: " + lastDate + "\n"

    IF LENGTH(lastConvo.topics) > 0 THEN
      contextInfo = contextInfo + "- Minule ste sa rozprávali o: " + JOIN(lastConvo.topics, ", ") + "\n"
    END IF
  ELSE
    contextInfo = contextInfo + "- Prvý rozhovor s týmto zamestnancom\n"
  END IF

  IF LENGTH(activeIssues) > 0 THEN
    issueDescriptions = MAP activeIssues TO issue.description
    contextInfo = contextInfo + "- Aktívne problémy: " + JOIN(issueDescriptions, "; ") + "\n"
  ELSE
    contextInfo = contextInfo + "- Žiadne známe problémy\n"
  END IF

  // Build complete prompt
  prompt = "Si ImpofAI, priateľský AI asistent ktorý pomáha firmám lepšie porozumieť ich prevádzke.\n"
  prompt = prompt + "Práve hovoríš s " + workerName + ", ktorý pracuje ako " + workerRole + ".\n\n"
  prompt = prompt + "KONTEXTOVÉ INFORMÁCIE:\n" + contextInfo + "\n"
  prompt = prompt + "TVOJE CIELE (PRIORITNE):\n"
  prompt = prompt + "1. Na ZAČIATKU KAŽDÉHO rozhovoru použi funkciu get_context s worker_id\n"
  prompt = prompt + "2. Vytvor priateľskú atmosféru a daj zamestnancovi pocit, že ho počúvaš\n"
  prompt = prompt + "3. Opýtaj sa na jeho dennú prácu a výzvy, ktorým čelí\n"
  prompt = prompt + "4. **KRITICKÉ:** KEĎ spomenie AKÝKOĽVEK problém, OKAMŽITE použi funkciu log_issue\n"
  prompt = prompt + "   - Neodkladaj to na koniec\n"
  prompt = prompt + "   - Buď VEĽMI špecifický v popise (cituj jeho presné slová)\n"
  prompt = prompt + "   - Po zaznamenaní povedz: 'Rozumiem, zapísal som si to.'\n"
  prompt = prompt + "5. Rozhovor ukončí slušne po 5-7 minútach\n\n"
  prompt = prompt + "PRAVIDLÁ KOMUNIKÁCIE:\n"
  prompt = prompt + "- Vždy hovor po slovensky (worker hovorí po slovensky)\n"
  prompt = prompt + "- Používaj neformálne 'ty' (nie formálne 'vy')\n"
  prompt = prompt + "- Odpovedaj STRUČNE - maximálne 2-3 vety naraz\n"
  prompt = prompt + "- Polož vždy iba JEDNU otázku naraz\n"
  prompt = prompt + "- Buď empatický, keď spomína problémy\n"
  prompt = prompt + "- Nikdy nesľubuj veci, ktoré nemôžeš splniť\n"
  prompt = prompt + "- Nezabudni sa na konci rozhovoru pekne rozlúčiť\n\n"
  prompt = prompt + "DÔLEŽITÉ TECHNICKÉ POZNÁMKY:\n"
  prompt = prompt + "- Máš k dispozícii 2 funkcie: get_context a log_issue\n"
  prompt = prompt + "- get_context použi na ZAČIATKU (pred prvou vetou)\n"
  prompt = prompt + "- log_issue použi IHNEĎ keď worker spomenie problém (nie na konci!)\n"
  prompt = prompt + "- Ak funkcia zlyhá, skús to znova s upraveními parametrami"

  RETURN prompt
END FUNCTION
```

---

### 3.2 buildSlovakFirstMessage - Personalized Opening Message

**Purpose:** Generate context-aware first message in Slovak

**Algorithm:**

```pseudocode
FUNCTION buildSlovakFirstMessage(context)
  workerName = context.worker?.name OR "priateľu"
  isNewWorker = context.is_new_worker OR FALSE
  activeIssues = context.active_issues OR []
  lastConvo = context.recent_conversations?[0] OR NULL

  // Time-based greeting
  hour = CURRENT_HOUR()
  IF hour < 12 THEN
    timeGreeting = "Dobré ráno"
  ELSE IF hour < 17 THEN
    timeGreeting = "Dobrý deň"
  ELSE
    timeGreeting = "Dobrý večer"
  END IF

  // Priority 1: New worker
  IF isNewWorker THEN
    RETURN timeGreeting + "! Volám sa ImpofAI a som tvoj AI asistent. Veľmi ma teší, že sa poznávame. Ako sa voláš a čo robíš v tejto firme?"
  END IF

  // Priority 2: Returning worker with active issues
  IF LENGTH(activeIssues) > 0 THEN
    issue = activeIssues[0]
    RETURN timeGreeting + ", " + workerName + "! Ako sa máš? Pamätám si, že si minule spomínal " + issue.description + ". Už sa to vyriešilo alebo je to stále problém?"
  END IF

  // Priority 3: Returning worker with conversation history
  IF lastConvo IS NOT NULL THEN
    lastDate = FORMAT_DATE(lastConvo.date, "sk-SK", "day numeric, month long")
    RETURN timeGreeting + ", " + workerName + "! Ako sa dnes máš? Naposledy sme sa rozprávali " + lastDate + ". Čo nové sa udialo od tej doby?"
  END IF

  // Priority 4: Returning worker, no specific context
  RETURN timeGreeting + ", " + workerName + "! Ako sa dnes máš? Ako ti ide práca?"
END FUNCTION
```

---

## 4. Database Operations

### 4.1 Junction Table Queries

**Purpose:** Fast pattern-worker relationship queries using proper junction table

**Algorithms:**

```pseudocode
// Query 1: Get all patterns affecting a specific worker
FUNCTION getPatternsForWorker(workerId)
  RETURN DATABASE.query(
    "SELECT p.*, pw.reported_at, pw.severity_at_report, pw.mention_count
     FROM patterns p
     INNER JOIN pattern_workers pw ON p.pattern_id = pw.pattern_id
     WHERE pw.worker_id = ? AND p.status = 'active'
     ORDER BY p.urgency_level DESC, p.last_occurrence DESC
     LIMIT 5",
    [workerId]
  )
  // Performance: 5-10ms (vs 20-50ms with JSON LIKE query)
END FUNCTION


// Query 2: Count affected workers for a pattern
FUNCTION getAffectedWorkersCount(patternId)
  result = DATABASE.query(
    "SELECT COUNT(DISTINCT worker_id) as count
     FROM pattern_workers
     WHERE pattern_id = ?",
    [patternId]
  )
  RETURN result.count
  // Performance: <5ms
END FUNCTION


// Query 3: Get all patterns with worker counts
FUNCTION getAllPatternsWithCounts()
  RETURN DATABASE.query(
    "SELECT p.*, COUNT(pw.worker_id) as affected_workers_count
     FROM patterns p
     LEFT JOIN pattern_workers pw ON p.pattern_id = pw.pattern_id
     WHERE p.status = 'active'
     GROUP BY p.pattern_id
     ORDER BY affected_workers_count DESC, p.urgency_level DESC",
    []
  )
  // Performance: <20ms
END FUNCTION


// Query 4: Add worker to pattern (when logging issue)
FUNCTION addWorkerToPattern(patternId, workerId, urgency)
  // Check if already exists
  exists = DATABASE.query(
    "SELECT 1 FROM pattern_workers
     WHERE pattern_id = ? AND worker_id = ?",
    [patternId, workerId]
  )

  IF exists THEN
    // Update mention count
    DATABASE.execute(
      "UPDATE pattern_workers
       SET mention_count = mention_count + 1,
           last_mentioned_at = CURRENT_TIMESTAMP,
           severity_at_report = ?
       WHERE pattern_id = ? AND worker_id = ?",
      [urgency, patternId, workerId]
    )
  ELSE
    // Insert new relationship
    DATABASE.execute(
      "INSERT INTO pattern_workers
       (pattern_id, worker_id, reported_at, severity_at_report,
        first_mentioned_at, last_mentioned_at, mention_count)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)",
      [patternId, workerId, urgency]
    )
  END IF
END FUNCTION
```

---

## 5. Pattern Detection

### 5.1 Simple Pattern Matching

**Purpose:** Detect if an issue matches existing patterns

**Algorithm:**

```pseudocode
FUNCTION findMatchingPattern(issueDescription, location)
  // Currently using exact string match on description
  // Future: Could use fuzzy matching or embeddings

  pattern = DATABASE.query(
    "SELECT pattern_id, occurrence_count
     FROM patterns
     WHERE status = 'active'
       AND issue_description = ?
       AND (location = ? OR location IS NULL)
     LIMIT 1",
    [issueDescription, location]
  )

  RETURN pattern OR NULL
END FUNCTION


// Future enhancement: Fuzzy pattern matching
FUNCTION findSimilarPattern(issueDescription, location)
  // Get all active patterns
  patterns = DATABASE.query(
    "SELECT pattern_id, issue_description, location
     FROM patterns
     WHERE status = 'active'
       AND (location = ? OR location IS NULL)",
    [location]
  )

  bestMatch = NULL
  highestSimilarity = 0

  FOR EACH pattern IN patterns DO
    // Calculate similarity (0.0 to 1.0)
    similarity = calculateStringSimilarity(issueDescription, pattern.issue_description)

    // Threshold for considering it a match
    IF similarity > 0.8 AND similarity > highestSimilarity THEN
      highestSimilarity = similarity
      bestMatch = pattern
    END IF
  END FOR

  RETURN bestMatch
END FUNCTION


FUNCTION calculateStringSimilarity(str1, str2)
  // Levenshtein distance or cosine similarity
  // For MVP: simple token overlap

  tokens1 = TOKENIZE(LOWERCASE(str1))
  tokens2 = TOKENIZE(LOWERCASE(str2))

  intersection = SET_INTERSECTION(tokens1, tokens2)
  union = SET_UNION(tokens1, tokens2)

  IF LENGTH(union) == 0 THEN
    RETURN 0.0
  END IF

  similarity = LENGTH(intersection) / LENGTH(union)
  RETURN similarity
END FUNCTION
```

---

## Appendix: Helper Functions

### ID Generation

```pseudocode
FUNCTION GENERATE_ID(prefix)
  timestamp = UNIX_TIMESTAMP_MS()
  randomString = RANDOM_ALPHANUMERIC(9)
  RETURN prefix + "_" + timestamp + "_" + randomString
END FUNCTION
```

### Date Formatting

```pseudocode
FUNCTION FORMAT_DATE(isoDate, locale, format)
  date = PARSE_ISO_DATE(isoDate)
  RETURN date.toLocaleDateString(locale, format)
END FUNCTION

FUNCTION CURRENT_HOUR()
  now = NEW_DATE()
  RETURN now.getHours()
END FUNCTION
```

### String Operations

```pseudocode
FUNCTION TOKENIZE(text)
  // Split on whitespace and punctuation
  tokens = SPLIT(text, /[\s,.!?;:]+/)
  RETURN FILTER(tokens, token => LENGTH(token) > 2)
END FUNCTION

FUNCTION SET_INTERSECTION(set1, set2)
  result = []
  FOR EACH item IN set1 DO
    IF item IN set2 THEN
      result.ADD(item)
    END IF
  END FOR
  RETURN result
END FUNCTION

FUNCTION SET_UNION(set1, set2)
  result = COPY(set1)
  FOR EACH item IN set2 DO
    IF item NOT IN result THEN
      result.ADD(item)
    END IF
  END FOR
  RETURN result
END FUNCTION
```

---

## Performance Summary

| Operation | Target | Typical | Critical |
|-----------|--------|---------|----------|
| get_context | <800ms | 35-80ms | <1000ms |
| log_issue | <300ms | 15-35ms | <500ms |
| webhook processing | <2s | <1s | <10s |
| junction table query | <10ms | 5-10ms | <20ms |
| pattern matching | <50ms | 10-20ms | <100ms |

---

**END OF PSEUDOCODE v2.1.0**

*These algorithms are implementation-ready. Clear logic flow from SPECIFICATION → PSEUDOCODE → CODE.*
