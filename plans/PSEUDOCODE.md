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

This is the start of the PSEUDOCODE.md. Should I continue with the remaining 24 components? This will be a very long document (probably 3000+ lines).

Would you like me to:
1. **Continue writing all 27 components** (comprehensive, takes time)
2. **Write key components first** (Learning System, Analytics) and leave infrastructure for later
3. **Create outline structure** for all 27, then fill in details for most critical ones

What's your preference? 🎯
