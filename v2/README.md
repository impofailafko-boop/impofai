# ImpofAI V2 - ElevenLabs Integration

Clean architecture rebuild using ElevenLabs Conversational AI.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your ElevenLabs API key

# Start server
npm start
```

Server runs on **http://localhost:3002**

## Architecture

```
┌─────────────────────────────────────┐
│   ElevenLabs Cloud                  │
│   - Voice conversations (STT + TTS) │
│   - Slovak language support         │
│   - Real-time tool calling          │
└──────────┬──────────────────────────┘
           │ Webhooks & API Calls
           ▼
┌─────────────────────────────────────┐
│   Your Express Server (Node.js)     │
│   - Webhook receiver                │
│   - Tool endpoints                  │
│   - Admin API                       │
└──────────┬──────────────────────────┘
           │ Database Queries
           ▼
┌─────────────────────────────────────┐
│   AgentDB (SQLite)                  │
│   - Conversations                   │
│   - Workers                         │
│   - Patterns                        │
│   - Recommendations                 │
│   - Knowledge Graph                 │
└─────────────────────────────────────┘
```

## Project Structure

```
v2/
├── src/
│   ├── database/
│   │   └── initAgentDB.js       # Database initialization
│   ├── tools/
│   │   ├── context.js           # Get worker context
│   │   └── issues.js            # Log issues
│   └── server.js                # Express app
├── docs/                        # Documentation
├── plans/                       # Implementation plans
├── tests/                       # Tests
├── package.json
└── .env.example
```

## API Endpoints

### Health Check
```
GET /health
```

### Webhooks (from ElevenLabs)
```
POST /api/webhook/elevenlabs
```
Receives completed call transcripts.

### Tools (called by ElevenLabs during conversation)
```
GET  /api/tools/context/:workerId
POST /api/tools/issue
```

### Admin (for dashboards)
```
GET /api/workers
GET /api/conversations
GET /api/patterns
```

## ElevenLabs Configuration

1. **Create an agent** in ElevenLabs dashboard
2. **Configure tools** for the agent:

**Tool: get_context**
```json
{
  "name": "get_context",
  "description": "Get context about a worker including their history and active issues",
  "parameters": {
    "type": "object",
    "properties": {
      "worker_id": {
        "type": "string",
        "description": "Worker ID or phone number"
      }
    },
    "required": ["worker_id"]
  },
  "endpoint": "https://your-domain.com/api/tools/context/{worker_id}"
}
```

**Tool: log_issue**
```json
{
  "name": "log_issue",
  "description": "Log an issue reported by a worker",
  "parameters": {
    "type": "object",
    "properties": {
      "worker_id": {"type": "string"},
      "issue_description": {"type": "string"},
      "urgency": {"type": "string", "enum": ["low", "medium", "high"]},
      "location": {"type": "string"},
      "equipment": {"type": "string"}
    },
    "required": ["worker_id", "issue_description"]
  },
  "endpoint": "https://your-domain.com/api/tools/issue"
}
```

3. **Configure webhook** for post-call processing:
```
POST https://your-domain.com/api/webhook/elevenlabs
```

## Development

### Local Development with ngrok

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Expose to internet
ngrok http 3002

# Use the ngrok URL in ElevenLabs dashboard
```

### Environment Variables

See `.env.example` for all configuration options.

Required:
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `ELEVENLABS_AGENT_ID` - Your agent ID
- `WEBHOOK_SECRET` - Secret for webhook verification

## Database Schema

**6 core tables:**

1. `conversations` - Call transcripts from ElevenLabs
2. `workers` - Employee profiles
3. `patterns` - Detected recurring issues
4. `recommendations` - ROI-backed suggestions
5. `knowledge_graph_entities` - Discovered entities
6. `knowledge_graph_relationships` - Entity connections

## Testing

```bash
# Test webhook locally
curl -X POST http://localhost:3002/api/webhook/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{
    "call_id": "test_123",
    "phone_number": "+421123456789",
    "started_at": "2024-01-01T10:00:00Z",
    "ended_at": "2024-01-01T10:05:00Z",
    "duration_seconds": 300,
    "transcript": [
      {"role": "agent", "text": "Ahoj!"},
      {"role": "user", "text": "Ahoj, ako sa máš?"}
    ]
  }'

# Test context tool
curl http://localhost:3002/api/tools/context/worker123

# Test issue logging
curl -X POST http://localhost:3002/api/tools/issue \
  -H "Content-Type: application/json" \
  -d '{
    "worker_id": "worker123",
    "issue_description": "Chýbajú nástroje",
    "urgency": "high",
    "location": "Warehouse A"
  }'
```

## Deployment

See `docs/DEPLOYMENT.md` (coming soon) for production deployment instructions.

## Next Steps

- [ ] Build admin dashboard UI
- [ ] Add pattern detection engine
- [ ] Implement nightly learning jobs
- [ ] Add ROI calculation system
- [ ] Create mobile-friendly worker portal

## License

MIT
