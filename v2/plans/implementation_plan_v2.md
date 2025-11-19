# ImpofAI V2 - Clean Architecture Plan

## Objective
Rebuild the voice interaction layer using **ElevenLabs Conversational AI** and a simplified **Node.js** backend, while retaining the core **AgentDB** logic.

## Directory Structure
```
v2/
├── src/
│   ├── database/       # The "Brain" (AgentDB schema & logic)
│   ├── tools/          # The "Hands" (Functions for ElevenLabs)
│   │   ├── context.js  # get_context
│   │   └── issues.js   # log_issue
│   └── server.js       # The "Body" (Express App + Webhook Receiver)
├── docs/               # Research & Documentation
├── plans/              # Implementation Plans
└── package.json        # Dependencies
```

## Core Components

### Architecture Diagram
```mermaid
graph TD
    User((User/Worker)) <-->|Voice (WebRTC)| EL[ElevenLabs Cloud]
    
    subgraph "Our Infrastructure (V2)"
        Node[Node.js Server]
        DB[(AgentDB SQLite)]
    end

    %% Real-Time Tool Calling Loop
    EL -- "1. Call Tool (get_context)" --> Node
    Node -- "2. Query Worker Data" --> DB
    DB -- "3. Return Context" --> Node
    Node -- "4. Return JSON" --> EL
    
    %% Issue Logging Loop
    EL -- "5. Call Tool (log_issue)" --> Node
    Node -- "6. Insert Issue" --> DB
    
    %% Post-Call Webhook
    EL -- "7. Webhook (Transcript)" --> Node
    Node -- "8. Store Conversation" --> DB
```

### 1. The Server (`src/server.js`)
*   **Framework**: Express.js (Lightweight, robust).
*   **Endpoints** (See `specification.md` for full payloads):
    *   `POST /api/webhook/elevenlabs`: Receives call transcripts.
    *   `GET /api/tools/context/:workerId`: Returns worker context.
    *   `POST /api/tools/issue`: Logs a new issue.

### 2. The Database (`src/database/`)
*   **Action**: Copy `initAgentDB.js` from v1.
*   **Refinement**: Ensure it runs standalone without the old dependencies.

### 3. ElevenLabs Integration
*   **Mode**: Conversational Agent (Dashboard configured).
*   **Connection**: Webhooks pointing to our server (via ngrok).

## Next Steps
1.  Initialize `package.json` in `v2/`.
2.  Copy `initAgentDB.js` to `v2/src/database/`.
3.  Install dependencies (`express`, `better-sqlite3`, `dotenv`).
4.  Write `src/server.js`.
