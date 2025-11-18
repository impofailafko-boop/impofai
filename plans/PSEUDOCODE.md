# 🎯 SPARC Framework: Pseudocode Phase

## Project: ImpofAI - Conversational Company Intelligence System

**Version:** 1.0.0
**Phase:** Pseudocode (SPARC Phase 2)
**Date:** 2025-01-18
**Previous Phase:** ✅ Specification Complete

---

# 📋 P - PSEUDOCODE

## Overview

This document contains algorithmic designs for all 27 components of ImpofAI. Pseudocode is written at a level between specification and implementation - detailed enough to guide coding but abstract enough to remain language-agnostic.

**Key Principles:**
- Focus on logic, not syntax
- Define data structures clearly
- Specify error handling
- Document integration points
- Include edge cases

---

## Table of Contents

1. [Voice Conversation System](#1-voice-conversation-system) (3 components)
2. [Learning System](#2-learning-system) (6 components)
3. [MidStream Analytics](#3-midstream-analytics) (3 components)
4. [Analytics Engine](#4-analytics-engine) (4 components)
5. [Admin Dashboard](#5-admin-dashboard) (7 components)
6. [Infrastructure](#6-infrastructure) (4 components)
7. [Data Flow Diagrams](#7-data-flow-diagrams)
8. [Integration Points](#8-integration-points)
9. [Error Handling Strategy](#9-error-handling-strategy)

---

# 1. Voice Conversation System

## 1.1 Realtime Voice Agent

**Purpose:** Manage OpenAI Realtime API connection and Slovak voice conversations

### Data Structures

```
Session {
  sessionId: UUID
  workerId: String
  workerName: String (optional, extracted during conversation)
  startTime: Timestamp
  status: Enum(ACTIVE, PAUSED, ENDED)
  transcript: Array<Message>
  apiConnection: WebSocketConnection
  conversationState: ConversationState
}

Message {
  timestamp: Timestamp
  speaker: Enum(WORKER, AI)
  text: String (Slovak)
  audioData: Base64String (optional)
  sentiment: String (optional)
  topics: Array<String> (optional)
}

ConversationState {
  currentTopic: String
  informationGathered: Object {
    when: Boolean
    where: Boolean
    what: Boolean
    frequency: Boolean
    impact: Boolean
    attemptedFixes: Boolean
  }
  plannerGoals: Array<Goal> (if planner enabled)
  questionHistory: Array<String>
}

Config {
  conversationPlannerEnabled: Boolean
  plannerStrictness: Integer (1-10)
  questionStyle: Enum(CASUAL, BALANCED, STRUCTURED)
  useReflexion: Boolean
  useSkillLibrary: Boolean
  targetDurationMinutes: Integer
  maxFollowupQuestions: Integer
  formalityLevel: Integer (1-10)
}
```

### Main Algorithm

```
FUNCTION startVoiceSession(workerId):
  // Initialize
  sessionId = generateUUID()
  config = loadConfigFromDatabase()

  // Create session
  session = new Session {
    sessionId: sessionId
    workerId: workerId
    startTime: getCurrentTimestamp()
    status: ACTIVE
    transcript: []
    conversationState: initializeConversationState()
  }

  // Connect to OpenAI Realtime API
  TRY:
    apiConnection = connectToOpenAI({
      model: "gpt-4o-realtime-preview",
      language: "sk-SK",
      instructions: generateSystemPrompt(config)
    })

    session.apiConnection = apiConnection

  CATCH ConnectionError:
    LOG error "Failed to connect to OpenAI Realtime API"
    RETURN error response

  // Setup event listeners
  apiConnection.on("audio.input", handleWorkerAudio)
  apiConnection.on("conversation.item.created", handleAIResponse)
  apiConnection.on("error", handleAPIError)

  // Send initial greeting
  greeting = generateGreeting(config.questionStyle)
  apiConnection.send({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "assistant",
      content: [{ type: "input_text", text: greeting }]
    }
  })

  // Store session
  activeSessions[sessionId] = session

  RETURN { sessionId, status: "connected" }

END FUNCTION


FUNCTION handleWorkerAudio(audioEvent):
  session = getActiveSession(audioEvent.sessionId)

  // Transcription happens automatically via OpenAI Realtime API
  transcript = audioEvent.transcript

  IF transcript is empty OR transcript is silence:
    RETURN // Ignore

  // Create message record
  message = new Message {
    timestamp: getCurrentTimestamp()
    speaker: WORKER
    text: transcript
    audioData: audioEvent.audio
  }

  session.transcript.push(message)

  // Real-time analysis
  analysis = analyzeMessageInRealtime(transcript, session)
  message.sentiment = analysis.sentiment
  message.topics = analysis.topics

  // Update conversation state
  updateConversationState(session, analysis)

  // Determine next question (if AI needs to respond)
  IF shouldAIRespond(session):
    nextQuestion = determineNextQuestion(session, config)

    // Send to OpenAI
    session.apiConnection.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "assistant",
        content: [{ type: "input_text", text: nextQuestion }]
      }
    })

  // Check if conversation should end
  IF shouldEndConversation(session, config):
    endVoiceSession(session.sessionId)

END FUNCTION


FUNCTION determineNextQuestion(session, config):
  // Load conversation planner config
  IF config.conversationPlannerEnabled:
    // Use goal-oriented planning
    plan = conversationPlanner.generatePlan(
      session.conversationState,
      config.plannerStrictness
    )

    nextGoal = plan.getNextGoal()

    // Get question from SkillLibrary
    IF config.useSkillLibrary:
      question = skillLibrary.search({
        goal: nextGoal.type,
        topic: session.conversationState.currentTopic,
        language: "sk"
      })
    ELSE:
      question = defaultQuestions[nextGoal.type]

    // Allow deviation for natural feel
    IF config.plannerStrictness < 5 AND random() < 0.3:
      // 30% chance to deviate with loose strictness
      question = generateNaturalFollowup(session.transcript)

  ELSE:
    // No planner - use SkillLibrary or ReflexionMemory
    IF config.useSkillLibrary:
      question = skillLibrary.search({
        topic: session.conversationState.currentTopic,
        previousQuestions: session.conversationState.questionHistory,
        language: "sk"
      })
    ELSE:
      // Fallback to pattern-based questions
      question = generatePatternBasedQuestion(session)

  // Apply formality level
  question = adjustFormality(question, config.formalityLevel)

  // Track question
  session.conversationState.questionHistory.push(question)

  RETURN question

END FUNCTION


FUNCTION shouldEndConversation(session, config):
  duration = getCurrentTimestamp() - session.startTime
  durationMinutes = duration / 60

  // Check duration limit
  IF durationMinutes >= config.targetDurationMinutes:
    RETURN TRUE

  // Check if max follow-ups reached
  IF session.conversationState.questionHistory.length >= config.maxFollowupQuestions:
    RETURN TRUE

  // Check if planner says we're done
  IF config.conversationPlannerEnabled:
    IF conversationPlanner.isComplete(session.conversationState):
      RETURN TRUE

  // Check if worker wants to end
  lastMessage = session.transcript[session.transcript.length - 1]
  IF detectGoodbye(lastMessage.text):
    RETURN TRUE

  RETURN FALSE

END FUNCTION


FUNCTION endVoiceSession(sessionId):
  session = getActiveSession(sessionId)

  // Send closing message
  closing = "Ďakujem za váš čas! Dovidenia."
  session.apiConnection.send({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "assistant",
      content: [{ type: "input_text", text: closing }]
    }
  })

  // Close API connection
  session.apiConnection.close()

  // Save to database
  TRY:
    saveTranscriptToDatabase({
      sessionId: session.sessionId,
      workerId: session.workerId,
      workerName: session.workerName,
      startTime: session.startTime,
      endTime: getCurrentTimestamp(),
      transcript: session.transcript,
      conversationState: session.conversationState
    })

    // Trigger real-time analysis
    conversationAnalyzer.analyzeComplete(session)

  CATCH DatabaseError as e:
    LOG error "Failed to save transcript: " + e.message
    // Store in retry queue
    retryQueue.add(session)

  // Clean up
  DELETE activeSessions[sessionId]

  RETURN { status: "ended", duration: getDuration(session) }

END FUNCTION


FUNCTION generateSystemPrompt(config):
  basePrompt = """
  Si AI asistent pre spoločnosť, ktorý pomáha zamestnancom nahlásiť problémy a dávať spätnú väzbu.

  Tvoje úlohy:
  - Počúvať zamestnancov s empatiou
  - Pýtať sa následné otázky pre získanie detailov
  - Zostať pri pracovných témach
  - Byť užitočný a priateľský

  Odpovedaj VŽDY po slovensky.
  """

  // Adjust for question style
  SWITCH config.questionStyle:
    CASE CASUAL:
      basePrompt += "\nBuď veľmi priateľský a neformálny. Rozprávaj sa ako kamarát."
    CASE BALANCED:
      basePrompt += "\nBuď profesionálny ale priateľský."
    CASE STRUCTURED:
      basePrompt += "\nBuď profesionálny a systematický. Pýtaj sa metodicky."

  // Add planner instructions
  IF config.conversationPlannerEnabled:
    basePrompt += "\n\nUisťuj sa, že získaš tieto informácie: kedy, kde, čo, ako často, dopad, čo už skúsili."

  RETURN basePrompt

END FUNCTION
```

### Integration Points

- **Input:** Worker audio via WebSocket
- **Output:** AI responses, transcript saved to database
- **Dependencies:**
  - OpenAI Realtime API
  - ConversationAnalyzer (real-time analysis)
  - ConversationPlanner (if enabled)
  - SkillLibrary (if enabled)
  - Database (transcript storage)

### Error Handling

- API connection failures → retry with exponential backoff
- Transcription errors → request worker to repeat
- Timeout (no response) → prompt worker gently
- Database save failures → queue for retry

---

## 1.2 WebSocket Server

**Purpose:** Handle real-time bidirectional communication between worker UI and backend

### Data Structures

```
WebSocketConnection {
  connectionId: UUID
  workerId: String
  clientIP: String
  connectedAt: Timestamp
  lastActivity: Timestamp
  socket: WebSocket
  sessionId: UUID (voice session)
}

WebSocketMessage {
  type: Enum(
    AUDIO_CHUNK,
    START_SESSION,
    END_SESSION,
    PING,
    PONG,
    ERROR
  )
  payload: Object
  timestamp: Timestamp
}
```

### Main Algorithm

```
FUNCTION initializeWebSocketServer(port):
  server = createWebSocketServer({
    port: port,
    cors: {
      origin: getAllowedOrigins(),
      credentials: true
    }
  })

  server.on("connection", handleNewConnection)
  server.on("error", handleServerError)

  // Heartbeat to detect dead connections
  heartbeatInterval = setInterval(checkHeartbeat, 30000) // 30 seconds

  LOG info "WebSocket server listening on port " + port

  RETURN server

END FUNCTION


FUNCTION handleNewConnection(socket, request):
  // Authenticate (extract worker ID from query params or headers)
  workerId = extractWorkerIdFromRequest(request)

  IF workerId is empty OR NOT isValidWorkerId(workerId):
    socket.close(1008, "Unauthorized")
    RETURN

  // Create connection record
  connectionId = generateUUID()
  connection = new WebSocketConnection {
    connectionId: connectionId
    workerId: workerId
    clientIP: request.socket.remoteAddress
    connectedAt: getCurrentTimestamp()
    lastActivity: getCurrentTimestamp()
    socket: socket
    sessionId: NULL
  }

  activeConnections[connectionId] = connection

  LOG info "Worker " + workerId + " connected (connectionId: " + connectionId + ")"

  // Setup event listeners
  socket.on("message", (data) => handleClientMessage(connection, data))
  socket.on("close", () => handleConnectionClose(connection))
  socket.on("error", (error) => handleConnectionError(connection, error))
  socket.on("pong", () => updateHeartbeat(connection))

  // Send welcome message
  sendToClient(connection, {
    type: "CONNECTED",
    payload: { connectionId: connectionId }
  })

END FUNCTION


FUNCTION handleClientMessage(connection, data):
  connection.lastActivity = getCurrentTimestamp()

  TRY:
    message = parseJSON(data)

    SWITCH message.type:
      CASE "START_SESSION":
        handleStartSession(connection, message.payload)

      CASE "AUDIO_CHUNK":
        handleAudioChunk(connection, message.payload)

      CASE "END_SESSION":
        handleEndSession(connection, message.payload)

      CASE "PING":
        sendToClient(connection, { type: "PONG" })

      DEFAULT:
        LOG warning "Unknown message type: " + message.type

  CATCH ParseError:
    sendError(connection, "Invalid message format")

END FUNCTION


FUNCTION handleStartSession(connection, payload):
  // Start voice session
  result = realtimeVoiceAgent.startVoiceSession(connection.workerId)

  IF result.error:
    sendError(connection, "Failed to start session: " + result.error)
    RETURN

  connection.sessionId = result.sessionId

  sendToClient(connection, {
    type: "SESSION_STARTED",
    payload: {
      sessionId: result.sessionId,
      status: "ready"
    }
  })

  LOG info "Session started for worker " + connection.workerId

END FUNCTION


FUNCTION handleAudioChunk(connection, payload):
  IF connection.sessionId is NULL:
    sendError(connection, "No active session")
    RETURN

  // Forward audio to Realtime Voice Agent
  audioData = payload.audio

  realtimeVoiceAgent.sendAudio({
    sessionId: connection.sessionId,
    audio: audioData,
    format: payload.format || "pcm16"
  })

END FUNCTION


FUNCTION handleEndSession(connection, payload):
  IF connection.sessionId is NULL:
    RETURN // Already ended or never started

  // End voice session
  result = realtimeVoiceAgent.endVoiceSession(connection.sessionId)

  connection.sessionId = NULL

  sendToClient(connection, {
    type: "SESSION_ENDED",
    payload: {
      duration: result.duration,
      status: "completed"
    }
  })

  LOG info "Session ended for worker " + connection.workerId

END FUNCTION


FUNCTION handleConnectionClose(connection):
  LOG info "Connection closed for worker " + connection.workerId

  // End active session if exists
  IF connection.sessionId is NOT NULL:
    realtimeVoiceAgent.endVoiceSession(connection.sessionId)

  // Clean up
  DELETE activeConnections[connection.connectionId]

END FUNCTION


FUNCTION checkHeartbeat():
  currentTime = getCurrentTimestamp()

  FOR EACH connection IN activeConnections:
    timeSinceActivity = currentTime - connection.lastActivity

    // 60 second timeout
    IF timeSinceActivity > 60000:
      LOG warning "Connection timeout for " + connection.workerId
      connection.socket.close(1000, "Timeout")
      DELETE activeConnections[connection.connectionId]
    ELSE:
      // Send ping
      connection.socket.ping()

END FUNCTION


FUNCTION sendToClient(connection, message):
  TRY:
    connection.socket.send(JSON.stringify(message))
  CATCH Error as e:
    LOG error "Failed to send message to client: " + e.message

END FUNCTION
```

### Integration Points

- **Input:** Client WebSocket connections (worker UI)
- **Output:** Messages to Realtime Voice Agent, responses to clients
- **Dependencies:**
  - Realtime Voice Agent
  - Worker authentication system

### Error Handling

- Connection failures → log and clean up
- Invalid messages → send error response to client
- Timeout → close connection gracefully
- API failures → notify client with error message

---

## 1.3 Conversation Analyzer

**Purpose:** Real-time topic detection, sentiment analysis, and entity extraction from Slovak conversations

### Data Structures

```
Analysis {
  topics: Array<String>
  entities: Array<Entity>
  sentiment: Enum(POSITIVE, NEUTRAL, NEGATIVE, URGENT)
  sentimentScore: Float (-1.0 to 1.0)
  urgency: Enum(LOW, MEDIUM, HIGH, CRITICAL)
  issues: Array<Issue>
  keywords: Array<String>
}

Entity {
  type: Enum(PERSON, LOCATION, EQUIPMENT, PROCESS, PRODUCT)
  name: String
  confidence: Float (0.0 to 1.0)
  mentions: Integer
}

Issue {
  type: String (e.g., "equipment_malfunction", "supply_shortage")
  description: String
  location: String (optional)
  equipment: String (optional)
  severity: Enum(LOW, MEDIUM, HIGH, CRITICAL)
}
```

### Main Algorithm

```
FUNCTION analyzeMessageInRealtime(text, session):
  analysis = new Analysis()

  // Topic Detection
  analysis.topics = detectTopics(text)

  // Entity Extraction
  analysis.entities = extractEntities(text)

  // Sentiment Analysis
  sentimentResult = analyzeSentiment(text)
  analysis.sentiment = sentimentResult.sentiment
  analysis.sentimentScore = sentimentResult.score

  // Urgency Detection
  analysis.urgency = detectUrgency(text, session.transcript)

  // Issue Detection
  analysis.issues = detectIssues(text, analysis.entities)

  // Keywords
  analysis.keywords = extractKeywords(text)

  RETURN analysis

END FUNCTION


FUNCTION detectTopics(text):
  // Use keyword matching + ML classification
  topics = []

  // Keyword-based detection (fast)
  topicKeywords = {
    "equipment": ["skener", "stroj", "zariadenie", "počítač", "systém"],
    "supplies": ["materiál", "zásoby", "chýba", "potrebujeme"],
    "safety": ["nebezpečné", "riziko", "bezpečnosť", "úraz"],
    "process": ["postup", "proces", "workflow", "metóda"],
    "delivery": ["dodávka", "kamión", "doprava", "expedícia"],
    "quality": ["kvalita", "chyba", "defekt", "pokazené"]
  }

  textLower = toLowerCase(text)

  FOR EACH topic, keywords IN topicKeywords:
    FOR EACH keyword IN keywords:
      IF textLower contains keyword:
        topics.push(topic)
        BREAK

  // Remove duplicates
  topics = unique(topics)

  // If no topics found, use ML (optional, more expensive)
  IF topics is empty AND useMidStreamAnalysis:
    topics = midstreamAnalyzer.classifyTopics(text)

  RETURN topics

END FUNCTION


FUNCTION extractEntities(text):
  entities = []

  // Slovak-specific patterns
  patterns = {
    EQUIPMENT: regex("(skener|stroj|zariadenie|kamión|auto|systém|počítač)\\s+\\w+", "gi"),
    LOCATION: regex("(sklad|uličke?|oddelenie|hala|budova)\\s+\\w+", "gi"),
    PERSON: regex("([A-ZÁČĎÉÍĽŇÓŔŠŤÚÝŽ][a-záčďéíľňóôŕšťúýž]+\\s+[A-ZÁČĎÉÍĽŇÓŔŠŤÚÝŽ][a-záčďéíľňóôŕšťúýž]+)", "g")
  }

  FOR EACH type, pattern IN patterns:
    matches = text.matchAll(pattern)

    FOR EACH match IN matches:
      entity = new Entity {
        type: type
        name: match[0].trim()
        confidence: 0.8 // Pattern-based, medium confidence
        mentions: 1
      }

      entities.push(entity)

  // Consolidate duplicates
  entities = consolidateEntities(entities)

  RETURN entities

END FUNCTION


FUNCTION analyzeSentiment(text):
  // Simple keyword-based sentiment (fast)
  positiveWords = ["dobre", "super", "výborne", "funguje", "spokojný", "pomohlo"]
  negativeWords = ["nefunguje", "pokazené", "problém", "zlé", "frustrujúce", "chyba"]
  urgentWords = ["urgentne", "okamžite", "naliehavé", "kritické", "vážne", "nebezpečné"]

  textLower = toLowerCase(text)

  positiveCount = 0
  negativeCount = 0
  urgentCount = 0

  FOR EACH word IN positiveWords:
    positiveCount += countOccurrences(textLower, word)

  FOR EACH word IN negativeWords:
    negativeCount += countOccurrences(textLower, word)

  FOR EACH word IN urgentWords:
    urgentCount += countOccurrences(textLower, word)

  // Determine sentiment
  IF urgentCount > 0:
    sentiment = URGENT
    score = -0.8
  ELSE IF negativeCount > positiveCount:
    sentiment = NEGATIVE
    score = -0.5
  ELSE IF positiveCount > negativeCount:
    sentiment = POSITIVE
    score = 0.7
  ELSE:
    sentiment = NEUTRAL
    score = 0.0

  RETURN { sentiment, score }

END FUNCTION


FUNCTION detectUrgency(text, transcript):
  urgencyScore = 0

  // Keyword-based
  urgentKeywords = ["urgentne", "okamžite", "teraz", "hneď", "kritické", "vážne"]
  FOR EACH keyword IN urgentKeywords:
    IF toLowerCase(text) contains keyword:
      urgencyScore += 2

  // Repetition (if worker mentioned same issue multiple times)
  FOR EACH previousMessage IN transcript:
    similarity = calculateTextSimilarity(text, previousMessage.text)
    IF similarity > 0.7: // 70% similar
      urgencyScore += 1

  // Negative sentiment
  sentiment = analyzeSentiment(text)
  IF sentiment.sentiment == URGENT:
    urgencyScore += 3
  ELSE IF sentiment.sentiment == NEGATIVE:
    urgencyScore += 1

  // Map score to urgency level
  IF urgencyScore >= 5:
    RETURN CRITICAL
  ELSE IF urgencyScore >= 3:
    RETURN HIGH
  ELSE IF urgencyScore >= 1:
    RETURN MEDIUM
  ELSE:
    RETURN LOW

END FUNCTION


FUNCTION detectIssues(text, entities):
  issues = []

  // Pattern matching for common issues
  issuePatterns = [
    {
      pattern: regex("(\\w+)\\s+nefunguje", "gi"),
      type: "equipment_malfunction",
      severity: HIGH
    },
    {
      pattern: regex("chýba(\\s+nám)?\\s+(\\w+)", "gi"),
      type: "supply_shortage",
      severity: MEDIUM
    },
    {
      pattern: regex("(\\w+)\\s+(pokazené|pokazený|pokazená)", "gi"),
      type: "equipment_broken",
      severity: HIGH
    },
    {
      pattern: regex("(meškanie|oneskorenie|zdržanie)", "gi"),
      type: "delay",
      severity: MEDIUM
    }
  ]

  FOR EACH issuePattern IN issuePatterns:
    matches = text.matchAll(issuePattern.pattern)

    FOR EACH match IN matches:
      issue = new Issue {
        type: issuePattern.type
        description: match[0]
        severity: issuePattern.severity
      }

      // Try to extract location/equipment from entities
      FOR EACH entity IN entities:
        IF entity.type == EQUIPMENT:
          issue.equipment = entity.name
        ELSE IF entity.type == LOCATION:
          issue.location = entity.name

      issues.push(issue)

  RETURN issues

END FUNCTION
```

### Integration Points

- **Input:** Slovak text from conversation transcript
- **Output:** Analysis object with topics, entities, sentiment, issues
- **Dependencies:**
  - MidStream (optional, for advanced ML classification)
  - Database (save entities for knowledge graph)

### Error Handling

- Text parsing errors → return empty analysis
- ML model failures → fallback to keyword-based detection
- Invalid input → log warning, return default analysis

---

# 2. Learning System

## 2.1 NightlyLearner

**Purpose:** Automated overnight pattern discovery, causal analysis, and recommendation generation

### Data Structures

```
LearningSession {
  sessionId: UUID
  startTime: Timestamp
  endTime: Timestamp
  dateRange: { start: Date, end: Date }
  conversationsAnalyzed: Integer
  patternsDiscovered: Array<Pattern>
  causalEdges: Array<CausalEdge>
  recommendations: Array<Recommendation>
  performanceStats: Object
}

Pattern {
  patternId: UUID
  type: Enum(TEMPORAL, SPATIAL, CAUSAL, CORRELATION)
  description: String
  confidence: Float (0.0 to 1.0)
  evidence: Array<ConversationReference>
  affectedWorkers: Array<String>
  occurrences: Integer
  firstSeen: Timestamp
  lastSeen: Timestamp
}

CausalEdge {
  cause: String
  effect: String
  uplift: Float (impact measurement)
  propensityScore: Float (0.0 to 1.0)
  observations: Integer
  confidence: Float (0.0 to 1.0)
  confounders: Array<String> (hidden variables)
}

Recommendation {
  recommendationId: UUID
  priority: Enum(LOW, MEDIUM, HIGH, CRITICAL)
  issue: String
  impact: String
  solution: String
  investment: Float (cost in €)
  roi: Object { paybackDays: Integer, weeklySavings: Float }
  confidence: Float (0.0 to 1.0)
  evidence: Array<ConversationReference>
}
```

### Main Algorithm

```
FUNCTION runNightlyLearning():
  LOG info "Starting nightly learning cycle"

  session = new LearningSession {
    sessionId: generateUUID()
    startTime: getCurrentTimestamp()
    dateRange: {
      start: getYesterday(),
      end: getToday()
    }
  }

  TRY:
    // 1. Load conversations from period
    conversations = database.query("
      SELECT * FROM transcripts
      WHERE created_at >= ? AND created_at < ?
    ", [session.dateRange.start, session.dateRange.end])

    session.conversationsAnalyzed = conversations.length

    IF conversations.length == 0:
      LOG info "No conversations to analyze"
      RETURN

    // 2. Pattern Discovery
    session.patternsDiscovered = discoverPatterns(conversations)

    // 3. Causal Analysis
    session.causalEdges = analyzeCausalRelationships(conversations, session.patternsDiscovered)

    // 4. Generate Recommendations
    session.recommendations = generateRecommendations(
      session.patternsDiscovered,
      session.causalEdges
    )

    // 5. Consolidate Skills (successful interview patterns)
    consolidateSkills(conversations)

    // 6. Reflexion Learning (critique conversations)
    performReflexion(conversations)

    // 7. Update Knowledge Graph
    updateKnowledgeGraph(conversations, session.patternsDiscovered)

    // 8. Generate Report
    report = generateNightlyReport(session)

    // 9. Save everything
    saveNightlySession(session, report)

    session.endTime = getCurrentTimestamp()
    duration = (session.endTime - session.startTime) / 60000 // minutes

    LOG info "Nightly learning completed in " + duration + " minutes"
    LOG info "Patterns discovered: " + session.patternsDiscovered.length
    LOG info "Recommendations generated: " + session.recommendations.length

  CATCH Error as e:
    LOG error "Nightly learning failed: " + e.message
    // Save partial results
    savePartialResults(session)

END FUNCTION


FUNCTION discoverPatterns(conversations):
  patterns = []

  // 1. Temporal Patterns (time-based)
  temporalPatterns = discoverTemporalPatterns(conversations)
  patterns.addAll(temporalPatterns)

  // 2. Spatial Patterns (location-based)
  spatialPatterns = discoverSpatialPatterns(conversations)
  patterns.addAll(spatialPatterns)

  // 3. Issue Clustering (same issue, multiple workers)
  clusterPatterns = discoverIssueClusters(conversations)
  patterns.addAll(clusterPatterns)

  // 4. Correlation Patterns
  correlationPatterns = discoverCorrelations(conversations)
  patterns.addAll(correlationPatterns)

  RETURN patterns

END FUNCTION


FUNCTION discoverIssueClusters(conversations):
  // Find: Multiple workers reporting same issue
  clusters = []

  // Group by issue + location
  issueGroups = new Map()

  FOR EACH conversation IN conversations:
    FOR EACH issue IN conversation.analysis.issues:
      key = issue.type + "|" + (issue.location || "unknown")

      IF NOT issueGroups.has(key):
        issueGroups.set(key, [])

      issueGroups.get(key).push({
        workerId: conversation.workerId,
        workerName: conversation.workerName,
        timestamp: conversation.created_at,
        severity: issue.severity,
        description: issue.description
      })

  // Identify clusters (2+ workers)
  FOR EACH [key, reports] IN issueGroups:
    IF reports.length >= 2:
      [issueType, location] = key.split("|")

      pattern = new Pattern {
        patternId: generateUUID()
        type: SPATIAL
        description: reports.length + " workers reported " + issueType + " at " + location
        confidence: calculateConfidence(reports.length, conversations.length)
        evidence: reports
        affectedWorkers: reports.map(r => r.workerId)
        occurrences: reports.length
        firstSeen: min(reports.map(r => r.timestamp))
        lastSeen: max(reports.map(r => r.timestamp))
      }

      clusters.push(pattern)

  RETURN clusters

END FUNCTION


FUNCTION discoverTemporalPatterns(conversations):
  // Find: Issues that happen at specific times
  patterns = []

  // Group by day of week
  dayOfWeekGroups = groupByDayOfWeek(conversations)

  FOR EACH [dayOfWeek, dayConversations] IN dayOfWeekGroups:
    issues = extractAllIssues(dayConversations)

    // Check if certain issues spike on specific days
    FOR EACH issueType IN getUniqueIssueTypes(issues):
      issueCount = issues.filter(i => i.type == issueType).length
      avgCount = getAverageIssueCount(issueType, conversations)

      // If 50% more than average
      IF issueCount > avgCount * 1.5:
        pattern = new Pattern {
          patternId: generateUUID()
          type: TEMPORAL
          description: issueType + " spikes on " + dayOfWeek + "s"
          confidence: calculateTemporalConfidence(issueCount, avgCount)
          evidence: issues.filter(i => i.type == issueType)
          occurrences: issueCount
          firstSeen: min(dayConversations.map(c => c.created_at))
          lastSeen: max(dayConversations.map(c => c.created_at))
        }

        patterns.push(pattern)

  RETURN patterns

END FUNCTION


FUNCTION analyzeCausalRelationships(conversations, patterns):
  causalEdges = []

  // Use AgentDB CausalMemoryGraph
  causalGraph = new CausalMemoryGraph(database)

  FOR EACH pattern IN patterns:
    // Look for cause-effect relationships

    // Example: Scanner breaks → Workers wait → Productivity drops
    IF pattern.type contains "equipment_malfunction":
      // Find related productivity mentions
      productivityIssues = findRelatedIssues(conversations, "productivity", pattern.evidence)

      IF productivityIssues.length > 0:
        // Calculate causal relationship
        uplift = calculateProductivityImpact(productivityIssues)
        propensity = calculatePropensityScore(pattern.evidence, productivityIssues)

        edge = new CausalEdge {
          cause: pattern.description
          effect: "Productivity loss"
          uplift: uplift
          propensityScore: propensity
          observations: pattern.occurrences
          confidence: propensity * 0.9 // slightly conservative
          confounders: detectConfounders(pattern, productivityIssues)
        }

        causalEdges.push(edge)

        // Add to AgentDB
        causalGraph.addEdge(edge.cause, edge.effect, {
          uplift: edge.uplift,
          propensity: edge.propensityScore,
          observations: edge.observations
        })

  RETURN causalEdges

END FUNCTION


FUNCTION generateRecommendations(patterns, causalEdges):
  recommendations = []

  FOR EACH pattern IN patterns:
    // Only generate recommendations for actionable patterns
    IF pattern.confidence < 0.6:
      CONTINUE // Low confidence, skip

    recommendation = NULL

    // Equipment malfunction → Replace/repair
    IF pattern.description contains "equipment" OR pattern.description contains "scanner":
      recommendation = generateEquipmentRecommendation(pattern, causalEdges)

    // Supply shortage → Increase order
    ELSE IF pattern.description contains "supply" OR pattern.description contains "shortage":
      recommendation = generateSupplyRecommendation(pattern, causalEdges)

    // Process issue → Improve process
    ELSE IF pattern.description contains "process" OR pattern.description contains "delay":
      recommendation = generateProcessRecommendation(pattern, causalEdges)

    IF recommendation is NOT NULL:
      recommendations.push(recommendation)

  RETURN recommendations

END FUNCTION


FUNCTION generateEquipmentRecommendation(pattern, causalEdges):
  // Extract equipment name from pattern
  equipment = extractEquipmentName(pattern.description)

  // Find causal impact
  causalImpact = causalEdges.find(e => e.cause contains equipment)

  // Calculate cost impact
  affectedWorkers = pattern.affectedWorkers.length
  hoursLostPerDay = estimateHoursLost(pattern.occurrences)
  costPerHour = 15 // €15/hour average
  dailyCost = affectedWorkers * hoursLostPerDay * costPerHour

  // Estimate replacement cost (could be from database or ML)
  replacementCost = estimateReplacementCost(equipment) || 300 // default €300

  // Calculate ROI
  paybackDays = Math.ceil(replacementCost / dailyCost)
  weeklySavings = dailyCost * 7

  recommendation = new Recommendation {
    recommendationId: generateUUID()
    priority: calculatePriority(dailyCost, pattern.confidence)
    issue: pattern.description
    impact: "€" + dailyCost + "/day productivity loss (" + affectedWorkers + " workers affected)"
    solution: "Replace " + equipment
    investment: replacementCost
    roi: {
      paybackDays: paybackDays
      weeklySavings: weeklySavings
    }
    confidence: pattern.confidence
    evidence: pattern.evidence
  }

  RETURN recommendation

END FUNCTION
```

### Integration Points

- **Input:** Conversations from database (previous 24 hours)
- **Output:** Patterns, causal edges, recommendations saved to database
- **Dependencies:**
  - CausalMemoryGraph (AgentDB)
  - SkillLibrary (consolidate successful patterns)
  - ReflexionMemory (learn from conversation quality)
  - Knowledge Graph Builder
  - Database

### Error Handling

- No conversations → skip gracefully
- Analysis failures → save partial results
- Database errors → retry queue
- Long runtime → checkpoint progress

---

## 2.2 ReflexionMemory Integration

**Purpose:** AI self-improvement through conversation critique

### Data Structures

```
ReflexionEpisode {
  episodeId: UUID
  conversationId: UUID
  task: String (e.g., "interview_equipment_issue")
  actions: Array<String> (questions asked)
  outcome: Enum(SUCCESS, PARTIAL_SUCCESS, FAILURE)
  critique: String
  successMetrics: Object {
    detailLevel: Float (0.0 to 1.0)
    completeness: Float (0.0 to 1.0)
    workerEngagement: Float (0.0 to 1.0)
  }
  strategiesUsed: Array<String>
  lessonsLearned: String
  embedding: Vector (for similarity search)
}
```

### Main Algorithm

```
FUNCTION performReflexion(conversations):
  reflexionMemory = new ReflexionMemory(database)

  FOR EACH conversation IN conversations:
    // Evaluate conversation quality
    outcome = evaluateConversationOutcome(conversation)

    // Extract strategies used
    strategies = extractStrategiesUsed(conversation)

    // Generate critique
    critique = generateCritique(conversation, outcome)

    // Create episode
    episode = new ReflexionEpisode {
      episodeId: generateUUID()
      conversationId: conversation.sessionId
      task: categorizeConversationType(conversation)
      actions: conversation.conversationState.questionHistory
      outcome: outcome
      critique: critique
      successMetrics: calculateSuccessMetrics(conversation)
      strategiesUsed: strategies
      lessonsLearned: extractLessons(critique, outcome)
      embedding: generateEmbedding(critique + " " + strategies.join(" "))
    }

    // Store in ReflexionMemory
    reflexionMemory.store(episode)

  // Analyze patterns in success/failure
  analyzeReflexionPatterns(reflexionMemory)

END FUNCTION


FUNCTION evaluateConversationOutcome(conversation):
  // Criteria for success
  completenessScore = checkInformationCompleteness(conversation.conversationState)
  detailScore = calculateDetailLevel(conversation.transcript)
  engagementScore = calculateWorkerEngagement(conversation.transcript)

  averageScore = (completenessScore + detailScore + engagementScore) / 3

  IF averageScore >= 0.8:
    RETURN SUCCESS
  ELSE IF averageScore >= 0.5:
    RETURN PARTIAL_SUCCESS
  ELSE:
    RETURN FAILURE

END FUNCTION


FUNCTION generateCritique(conversation, outcome):
  critique = ""

  // What worked well
  IF outcome == SUCCESS OR outcome == PARTIAL_SUCCESS:
    successfulQuestions = findSuccessfulQuestions(conversation)
    critique += "Successful strategies: " + successfulQuestions.join(", ") + ". "

  // What didn't work
  IF outcome == FAILURE OR outcome == PARTIAL_SUCCESS:
    failedQuestions = findVagueOrUnproductiveQuestions(conversation)
    critique += "Ineffective approaches: " + failedQuestions.join(", ") + ". "

  // Specific improvements
  missingInfo = findMissingInformation(conversation.conversationState)
  IF missingInfo.length > 0:
    critique += "Missing information: " + missingInfo.join(", ") + ". "
    critique += "Should have asked about: " + generateMissedQuestions(missingInfo).join(", ")

  RETURN critique

END FUNCTION


FUNCTION analyzeReflexionPatterns(reflexionMemory):
  // Find: What question strategies have highest success rate?

  allEpisodes = reflexionMemory.retrieveAll()

  successfulEpisodes = allEpisodes.filter(e => e.outcome == SUCCESS)
  failedEpisodes = allEpisodes.filter(e => e.outcome == FAILURE)

  // Extract common strategies from successful episodes
  successfulStrategies = extractCommonPatterns(successfulEpisodes.map(e => e.strategiesUsed))

  // Extract anti-patterns from failed episodes
  antiPatterns = extractCommonPatterns(failedEpisodes.map(e => e.strategiesUsed))

  // Update SkillLibrary with successful strategies
  FOR EACH strategy IN successfulStrategies:
    skillLibrary.updateSuccessRate(strategy, 1.0)

  // Demote anti-patterns
  FOR EACH antiPattern IN antiPatterns:
    skillLibrary.updateSuccessRate(antiPattern, 0.0)

  LOG info "Reflexion analysis complete"
  LOG info "Successful strategies: " + successfulStrategies.join(", ")
  LOG info "Anti-patterns: " + antiPatterns.join(", ")

END FUNCTION
```

### Integration Points

- **Input:** Completed conversations
- **Output:** Reflexion episodes stored, SkillLibrary updated
- **Dependencies:**
  - ReflexionMemory (AgentDB)
  - SkillLibrary
  - Embedding generation

---

## 2.3 SkillLibrary Integration

**Purpose:** Consolidate and retrieve effective interview patterns

### Data Structures

```
Skill {
  skillId: UUID
  skillName: String
  skillType: Enum(QUESTIONING_PATTERN, TOPIC_HANDLER, CONVERSATION_STRATEGY)
  description: String
  examples: Array<String> (example questions/approaches)
  successRate: Float (0.0 to 1.0)
  usageCount: Integer
  linkedSkills: Array<UUID> (related skills)
  embedding: Vector (for semantic search)
  language: String (default: "sk")
}
```

### Main Algorithm

```
FUNCTION consolidateSkills(conversations):
  skillLibrary = new SkillLibrary(database)

  FOR EACH conversation IN conversations:
    IF conversation.outcome == SUCCESS:
      // Extract successful question patterns
      questions = conversation.conversationState.questionHistory

      FOR EACH question IN questions:
        // Check if similar skill exists
        similarSkills = skillLibrary.search(question, topK: 1)

        IF similarSkills.length > 0 AND similarity(similarSkills[0], question) > 0.8:
          // Update existing skill
          skillLibrary.incrementUsageCount(similarSkills[0].skillId)
          skillLibrary.addExample(similarSkills[0].skillId, question)
        ELSE:
          // Create new skill
          skill = new Skill {
            skillId: generateUUID()
            skillName: summarizeQuestion(question)
            skillType: QUESTIONING_PATTERN
            description: "Effective question for " + conversation.conversationState.currentTopic
            examples: [question]
            successRate: 1.0
            usageCount: 1
            linkedSkills: []
            embedding: generateEmbedding(question)
            language: "sk"
          }

          skillLibrary.add(skill)

END FUNCTION


FUNCTION searchSkillLibrary(goal, topic, language):
  skillLibrary = new SkillLibrary(database)

  // Semantic search based on goal + topic
  query = goal + " " + topic
  queryEmbedding = generateEmbedding(query)

  // Search with filters
  results = skillLibrary.search(queryEmbedding, {
    language: language,
    skillType: QUESTIONING_PATTERN,
    minSuccessRate: 0.6,
    topK: 3
  })

  IF results.length > 0:
    // Return highest success rate question
    bestSkill = results.sortBy(s => s.successRate).first()
    RETURN random(bestSkill.examples) // Pick random example for variety

  ELSE:
    // Fallback to default questions
    RETURN getDefaultQuestion(goal)

END FUNCTION
```

---

## 2.4 CausalMemoryGraph Integration

**Purpose:** Map cause-effect relationships with ROI calculations

Algorithms integrated into NightlyLearner (Section 2.1) above.

---

## 2.5 Conversation Strategy Planner

**Purpose:** Goal-oriented interview planning for complete information extraction

### Data Structures

```
ConversationGoal {
  goalId: UUID
  type: Enum(
    GATHER_TIMING,      // When did it happen?
    GATHER_FREQUENCY,   // How often?
    GATHER_IMPACT,      // How does it affect work?
    GATHER_LOCATION,    // Where?
    GATHER_ATTEMPTED_FIXES,  // What did they try?
    GATHER_ROOT_CAUSE   // Why did it happen?
  )
  completed: Boolean
  priority: Integer (1-10)
}

ConversationPlan {
  planId: UUID
  goals: Array<ConversationGoal>
  currentGoalIndex: Integer
  strictness: Integer (1-10, from config)
  allowDeviation: Boolean (from config)
  completenessThreshold: Float (0.0 to 1.0)
}
```

### Main Algorithm

```
FUNCTION conversationPlanner.generatePlan(conversationState, strictness):
  plan = new ConversationPlan {
    planId: generateUUID()
    goals: []
    currentGoalIndex: 0
    strictness: strictness
    allowDeviation: strictness < 6 // Allow deviation if strictness < 6
    completenessThreshold: 0.8
  }

  // Determine missing information
  gathered = conversationState.informationGathered

  // Create goals for missing information (ordered by priority)
  IF NOT gathered.when:
    plan.goals.push(new ConversationGoal {
      goalId: generateUUID()
      type: GATHER_TIMING
      completed: FALSE
      priority: 9 // High priority
    })

  IF NOT gathered.frequency:
    plan.goals.push(new ConversationGoal {
      goalId: generateUUID()
      type: GATHER_FREQUENCY
      completed: FALSE
      priority: 7
    })

  IF NOT gathered.impact:
    plan.goals.push(new ConversationGoal {
      goalId: generateUUID()
      type: GATHER_IMPACT
      completed: FALSE
      priority: 10 // Highest priority (for ROI)
    })

  IF NOT gathered.attemptedFixes:
    plan.goals.push(new ConversationGoal {
      goalId: generateUUID()
      type: GATHER_ATTEMPTED_FIXES
      completed: FALSE
      priority: 6
    })

  // Sort by priority (highest first)
  plan.goals = plan.goals.sortBy(g => g.priority, descending: TRUE)

  RETURN plan

END FUNCTION


FUNCTION conversationPlanner.getNextGoal():
  // Find first incomplete goal
  FOR EACH goal IN plan.goals:
    IF NOT goal.completed:
      RETURN goal

  RETURN NULL // All goals completed

END FUNCTION


FUNCTION conversationPlanner.isComplete(conversationState):
  completeness = calculateCompleteness(conversationState)

  RETURN completeness >= plan.completenessThreshold

END FUNCTION


FUNCTION conversationPlanner.updateFromResponse(workerResponse, conversationState):
  // Check if response answers current goal

  currentGoal = getNextGoal()

  IF currentGoal is NULL:
    RETURN // Already complete

  answered = FALSE

  SWITCH currentGoal.type:
    CASE GATHER_TIMING:
      IF detectsTiming(workerResponse):
        conversationState.informationGathered.when = TRUE
        currentGoal.completed = TRUE
        answered = TRUE

    CASE GATHER_FREQUENCY:
      IF detectsFrequency(workerResponse):
        conversationState.informationGathered.frequency = TRUE
        currentGoal.completed = TRUE
        answered = TRUE

    CASE GATHER_IMPACT:
      IF detectsImpact(workerResponse):
        conversationState.informationGathered.impact = TRUE
        currentGoal.completed = TRUE
        answered = TRUE

    CASE GATHER_ATTEMPTED_FIXES:
      IF detectsAttemptedFixes(workerResponse):
        conversationState.informationGathered.attemptedFixes = TRUE
        currentGoal.completed = TRUE
        answered = TRUE

  // If answer was vague, keep goal incomplete
  IF NOT answered AND plan.strictness >= 7:
    // Strict mode: will ask again more directly
    plan.currentGoalIndex-- // Stay on same goal

  // Dynamic replanning: If worker mentions something urgent, reorder
  IF detectsUrgency(workerResponse) AND plan.allowDeviation:
    reprioritizeGoals(GATHER_IMPACT) // Prioritize impact for urgent issues

END FUNCTION


FUNCTION detectsTiming(text):
  timingKeywords = [
    "dnes", "včera", "minulý týždeň", "ráno", "poobede",
    "o 8:00", "pred hodinou", "už týždeň"
  ]

  textLower = toLowerCase(text)

  FOR EACH keyword IN timingKeywords:
    IF textLower contains keyword:
      RETURN TRUE

  RETURN FALSE

END FUNCTION


FUNCTION detectsFrequency(text):
  frequencyKeywords = [
    "často", "denne", "každý deň", "niekedy", "vždy",
    "prvýkrát", "opäť", "znova", "už druhýkrát"
  ]

  textLower = toLowerCase(text)

  FOR EACH keyword IN frequencyKeywords:
    IF textLower contains keyword:
      RETURN TRUE

  RETURN FALSE

END FUNCTION
```

### Integration Points

- **Input:** Conversation state, config (strictness level)
- **Output:** Conversation plan with ordered goals
- **Dependencies:**
  - SkillLibrary (get questions for each goal type)
  - Configuration system (strictness, deviation settings)

### Configurable Behavior (FR-6.7)

- **Strictness 1-3:** Very loose, AI often deviates, natural conversation
- **Strictness 4-6:** Balanced, follows plan but allows some deviation
- **Strictness 7-10:** Strict, methodically follows plan, re-asks if vague

---

## 2.6 AgentDB Core Orchestration

**Purpose:** Coordinate all AgentDB components and manage database lifecycle

### Main Algorithm

```
FUNCTION initializeAgentDB():
  // Create database
  db = await createDatabase({
    filename: './data/impofai.db'
  })

  // Initialize embedder (local, no API key)
  embedder = new EmbeddingService({
    provider: 'local'
  })

  // Initialize learning components
  learningSystem = new LearningSystem(db, embedder)
  reasoningBank = new ReasoningBank(db, embedder)
  reflexionMemory = new ReflexionMemory(db, embedder)
  skillLibrary = new SkillLibrary(db, embedder)
  causalGraph = new CausalMemoryGraph(db, embedder)
  nightlyLearner = new NightlyLearner(db, embedder)

  // Create custom tables (non-AgentDB)
  db.exec(`
    CREATE TABLE IF NOT EXISTS transcripts (...);
    CREATE TABLE IF NOT EXISTS worker_profiles (...);
    CREATE TABLE IF NOT EXISTS issues (...);
    CREATE TABLE IF NOT EXISTS voice_agent_config (...);
    -- etc.
  `)

  LOG info "AgentDB initialized successfully"

  RETURN {
    db,
    learningSystem,
    reflexionMemory,
    skillLibrary,
    causalGraph,
    nightlyLearner
  }

END FUNCTION
```

---

This completes the Learning System section. Should I continue with:
1. **Admin Dashboard** (including Configuration Panel 5.7)
2. **Analytics Engine** (pattern detection, recommendations)
3. **Data flows and integration points**

Let me know and I'll continue! 🚀
