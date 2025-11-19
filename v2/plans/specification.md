# ImpofAI V2 - System Specification

## 1. System Overview
ImpofAI V2 is a **Voice-First Business Intelligence Agent**. It conducts structured interviews with employees in Slovak, extracts operational data, and builds a knowledge graph of company issues.

**Core Philosophy**: "Context-Aware & Real-Time". The AI knows who it is talking to and logs issues the moment they are spoken.

## 2. Architecture
*   **Voice Interface**: ElevenLabs Conversational AI (WebRTC/WebSocket).
*   **Backend**: Node.js (Express) Server.
*   **Database**: SQLite (`agentdb.sqlite`).
*   **Connectivity**: `ngrok` Tunnel (Dev) / VPS (Prod).

## 3. API Specification (The "Hands")

### 3.1 Get Worker Context
*   **Endpoint**: `GET /api/tools/context/:workerId`
*   **Purpose**: Provides the AI with background info on the employee.
*   **Response**:
    ```json
    {
      "name": "Jozef",
      "role": "Forklift Driver",
      "assigned_equipment": ["Forklift B", "Scanner 55"],
      "recent_issues": ["Brakes squeaking (2 days ago)"]
    }
    ```

### 3.2 Log Issue
*   **Endpoint**: `POST /api/tools/issue`
*   **Purpose**: Allows the AI to save a reported problem instantly.
*   **Payload**:
    ```json
    {
      "worker_id": "jozef_123",
      "issue_description": "Scanner battery dies after 2 hours",
      "urgency": "high",
      "equipment_id": "Scanner 55",
      "reasoning": "User stated it impacts daily quota"
    }
    ```
*   **Response**: `{"status": "saved", "issue_id": 99}`

### 3.3 Webhook Receiver
*   **Endpoint**: `POST /api/webhook/elevenlabs`
*   **Purpose**: Receives the full transcript and metadata after the call.
*   **Payload**: Standard ElevenLabs Webhook JSON.

## 4. Data Model (The "Brain")
*   **Table `workers`**: ID, Name, Role, Equipment.
*   **Table `patterns`**: Issue, Location, Urgency, Cost Estimate.
*   **Table `conversations`**: Full transcripts and metadata.

## 5. Success Metrics
*   **Latency**: Tool calls must complete in < 1000ms.
*   **Context Accuracy**: AI must reference worker's equipment in 100% of calls.
*   **Data Integrity**: All `log_issue` calls must result in a DB row.
