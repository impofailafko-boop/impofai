# 🎯 ImpofAI - Business Intelligence Through Conversational AI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)
[![AgentDB](https://img.shields.io/badge/AgentDB-1.6.1-purple)](https://www.npmjs.com/package/agentdb)

> An AI-powered platform that conducts natural voice conversations with employees to extract deep company insights, identify problems, discover patterns, and generate actionable recommendations.

---

## 🚀 Quick Start

**Active Development: V2 (ElevenLabs Integration)**

```bash
cd v2
npm install
cp .env.example .env
# Edit .env with your ElevenLabs API key
npm start
```

Server will start on **http://localhost:3002**

---

## 📁 Repository Structure

```
impofai/
├── v2/                    # 🎯 CURRENT - ElevenLabs integration (clean architecture)
│   ├── src/
│   │   ├── database/      # AgentDB setup
│   │   ├── tools/         # ElevenLabs tool functions
│   │   └── server.js      # Express server
│   ├── docs/              # V2 documentation
│   ├── plans/             # V2 implementation plans
│   └── package.json       # V2 dependencies
│
└── v1-reference/          # 📦 ARCHIVED - OpenAI Realtime API implementation
    ├── src/               # Original voice system
    ├── plans/             # SPARC documentation
    └── docs/              # V1 documentation
```

---

## 🌟 What is ImpofAI?

**ImpofAI** transforms how companies understand their operations by using conversational AI to interview employees in their native language (Slovak). Instead of expensive consultants, static surveys, or manual data entry, ImpofAI conducts natural voice conversations and automatically builds a comprehensive knowledge graph of company operations.

### Key Features

- 🗣️ **Natural Voice Conversations** - Employees simply talk, AI asks smart follow-up questions
- 🧠 **Self-Improving AI** - Learns better questioning strategies from every conversation (AgentDB)
- 📊 **Auto-Discovery** - Builds company structure, finds patterns without manual setup
- 💰 **ROI Calculations** - Causal analysis quantifies business impact of issues
- 🌙 **Nightly Learning** - Discovers patterns, generates recommendations overnight
- 🇸🇰 **Slovak Language** - Native support for Slovak employees
- 🔒 **Privacy-First** - GDPR compliant, data stays on company servers

---

## 🆕 Version 2.0 (Current)

**Clean Architecture with ElevenLabs Conversational AI**

### Why V2?

- ✅ **Simpler architecture** - ElevenLabs handles all voice complexity
- ✅ **Better Slovak voices** - Superior multilingual TTS
- ✅ **Real-time tool calling** - Agent can query context during calls
- ✅ **Webhook-based** - No WebSocket management
- ✅ **Production-ready** - Scales easily

### Architecture

```
ElevenLabs Cloud (Voice Layer)
    ↓ Webhooks & Tool Calls
Your Server (Data Layer)
    ↓ Queries
AgentDB (Intelligence Layer)
```

### Core Components

1. **Express Server** (`src/server.js`)
   - Webhook receiver for call transcripts
   - Tool endpoints for real-time context
   - Admin API for dashboards

2. **AgentDB** (`src/database/`)
   - SQLite with WAL mode
   - 6 core tables: conversations, workers, patterns, recommendations, knowledge graph
   - Learning and pattern detection

3. **Tools** (`src/tools/`)
   - `context.js` - Get worker history & active issues
   - `issues.js` - Log problems in real-time

### API Endpoints

```
Health:
  GET  /health

Webhooks:
  POST /api/webhook/elevenlabs    # Receive call transcripts

Tools (called by ElevenLabs):
  GET  /api/tools/context/:workerId
  POST /api/tools/issue

Admin:
  GET  /api/workers
  GET  /api/conversations
  GET  /api/patterns
```

---

## 📚 Documentation

- **V2 Setup**: See `v2/docs/` (coming soon)
- **V1 SPARC Docs**: See `v1-reference/plans/` for original architecture
- **API Reference**: See `v2/docs/API.md` (coming soon)

---

## 🛠️ Development

### Prerequisites

- Node.js 18+
- ElevenLabs API account
- ngrok (for webhook development)

### Setup

```bash
# Install V2 dependencies
cd v2
npm install

# Configure environment
cp .env.example .env
# Edit .env with your ElevenLabs credentials

# Start development server
npm run dev
```

### Expose webhooks (development)

```bash
# In a separate terminal
ngrok http 3002

# Copy the ngrok URL and configure it in ElevenLabs dashboard:
# https://your-ngrok-url.ngrok.io/api/webhook/elevenlabs
```

---

## 🚀 Deployment

### Docker (Recommended)

```bash
cd v2
docker build -t impofai-v2 .
docker run -p 3002:3002 --env-file .env impofai-v2
```

### Production Deployment

See `v2/docs/DEPLOYMENT.md` (coming soon) for:
- Hetzner VPS setup
- SSL configuration
- Database backups
- Monitoring

---

## 🧪 Testing

```bash
cd v2

# Run tests (coming soon)
npm test

# Test webhook locally
curl -X POST http://localhost:3002/api/webhook/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{"call_id": "test", "phone_number": "+421123456789", ...}'
```

---

## 🗺️ Roadmap

### V2.1 (Next)
- [ ] Admin dashboard UI
- [ ] ElevenLabs agent configuration panel
- [ ] Pattern detection engine
- [ ] ROI calculation system

### V2.2 (Future)
- [ ] Multi-language support (Czech, English)
- [ ] Voice analytics
- [ ] Real-time dashboards
- [ ] Mobile app

---

## 📄 License

MIT License - see LICENSE file

---

## 🤝 Contributing

This is a private project, but if you have suggestions or find bugs, please create an issue.

---

## 📞 Support

For questions or issues:
- GitHub Issues: [Create an issue](../../issues)
- Documentation: See `v2/docs/`

---

## 🏗️ About V1 (Archived)

The V1 implementation used OpenAI Realtime API with WebSocket management. While functional, it was complex to maintain and scale. V2 simplifies the architecture by delegating voice handling to ElevenLabs.

**V1 is preserved in `v1-reference/` for reference.**

Key V1 components:
- OpenAI Realtime Client (WebSocket)
- Real-time WebSocket Server
- Conversation Manager
- Full SPARC documentation

If you need to reference V1 implementation, see `v1-reference/README.md`.

---

**Built with ❤️ by Agentic Tribe**
