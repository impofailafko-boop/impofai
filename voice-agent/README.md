# 🎤 Business Voice Agent - Production-Ready System

> AI voice assistant for workers with real-time analytics, mobile-friendly web UI, and Docker deployment

## 🎯 What This Is

A **complete production system** that lets you deploy an AI voice assistant for your team that:
- 💬 Talks naturally with workers (hands-free, voice-first)
- 📊 Tracks everything automatically (tasks, issues, supplies, sentiment)
- 📱 Works on mobile (responsive web interface)
- 🌐 Deploy anywhere (Docker, cloud platforms, VPS)
- ⚙️ Configure via web UI (no code editing needed!)

Perfect for: Warehouses, field teams, delivery drivers, construction sites, restaurants, retail - any mobile workforce!

---

## ⚡ Quick Start (3 Options)

### Option 1: Local Testing (Fastest)

```bash
cd tribes/business-voice
npm install
npm run server

# Open in browser:
# http://localhost:3000
```

### Option 2: Docker (Recommended)

```bash
cd tribes/business-voice

# Create .env file
cp .env.example .env
# Edit .env and add OPENAI_API_KEY

# Start with Docker
docker-compose up -d

# Access at:
# http://localhost:3000
```

### Option 3: Cloud Deploy (Production)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Railway.app (1-click deploy)
- DigitalOcean App Platform
- Fly.io
- Self-hosted VPS

---

## 🎨 Features

### ✅ Complete Web Interface

**Home Page** (`/`)
- System overview
- Quick actions
- Real-time status

**Setup Page** (`/setup`)
- Configure agent personality
- Set tracking keywords
- Manage workers
- Test OpenAI API key

**Dashboard** (`/dashboard`)
- Live analytics
- Activity feed (updates every 3 seconds)
- Worker performance metrics
- Real-time notifications

**Voice Interface** (`/voice`)
- Start voice conversations
- Real-time transcription
- Automatic tracking

### 🎯 What It Tracks Automatically

From natural conversations, it detects and logs:

| Worker Says | System Detects | Action Taken |
|------------|----------------|--------------|
| "Finished loading truck 5" | Task completion | ✅ Logs task, updates count |
| "The forklift is broken" | Issue report | 🎫 Creates ticket, alerts manager |
| "We need more boxes" | Supply request | 📦 Adds to order list |
| "How many left today?" | Help request | 📊 Tracks support needs |

### 📱 Mobile-First Design

- Responsive layout (works on any device)
- Touch-optimized interface
- Works offline (PWA ready)
- Add to home screen capability
- Fast loading (< 1 second)

### 🐳 Production-Ready

- **Docker**: One-command deployment
- **Docker Compose**: Multi-container setup
- **Nginx**: Reverse proxy with rate limiting
- **Health checks**: Built-in monitoring
- **Logging**: Structured logs
- **Security**: CORS, rate limiting, input validation

---

## 📁 Project Structure

```
business-voice/
├── 🌐 public/                     # Web interface
│   ├── index.html                 # Home page
│   ├── setup.html                 # Configuration UI
│   ├── dashboard.html             # Analytics dashboard
│   ├── css/style.css              # Mobile-first styles
│   └── js/
│       ├── app.js                 # Core functionality
│       ├── setup.js               # Setup page logic
│       └── dashboard.js           # Dashboard updates
│
├── 🤖 src/                        # Backend
│   ├── server.js                  # Main Express server
│   ├── voice-agent.js             # AI agent logic
│   ├── demo.js                    # Text-based demo
│   └── dashboard.js               # Old dashboard (legacy)
│
├── ⚙️  config/
│   └── agent-config.js            # Agent configuration
│
├── 🐳 Docker setup
│   ├── Dockerfile                 # Container image
│   ├── docker-compose.yml         # Multi-container config
│   └── nginx/
│       └── nginx.conf             # Reverse proxy config
│
├── 📚 Documentation
│   ├── README.md                  # This file
│   ├── DEPLOYMENT.md              # Deploy anywhere guide
│   └── .env.example               # Environment template
│
└── 📦 Configuration
    ├── package.json               # Dependencies & scripts
    ├── .gitignore                 # Git exclusions
    └── .dockerignore              # Docker exclusions
```

---

## 🚀 Usage

### 1. Setup (One-Time)

Visit: **http://localhost:3000/setup**

- Add your OpenAI API key
- Configure agent name and voice
- Set tracking keywords
- Add your workers

**Everything is saved automatically!**

### 2. View Analytics

Visit: **http://localhost:3000/dashboard**

See real-time:
- Active workers
- Tasks completed
- Issues reported
- Supply requests
- Live activity feed

### 3. Start Voice Session

Visit: **http://localhost:3000/voice**

- Select worker
- Start conversation
- Talk naturally
- Everything tracked automatically

---

## 🎛️ Configuration

### Via Web UI (Recommended)

Go to `/setup` and configure everything visually!

### Via Config File (Advanced)

Edit `config/agent-config.js`:

```javascript
module.exports = {
  agent: {
    name: "WorkMate",           // Agent name
    voice: "alloy",             // Voice style
    systemPrompt: "You are..." // Personality
  },

  analytics: {
    taskCompletion: {
      keywords: ["finished", "completed", "done"],
      action: "log_completion"
    },
    // Add your own tracking...
  },

  workers: {
    "W001": { name: "John", role: "Warehouse", shift: "morning" }
  }
}
```

---

## 📊 API Reference

### Configuration API

```bash
# Get current config
GET /api/config

# Update agent settings
POST /api/config/agent
{
  "name": "WorkMate",
  "voice": "alloy",
  "systemPrompt": "You are..."
}

# Update keywords
POST /api/config/analytics
{
  "taskCompletion": {
    "keywords": ["done", "finished"],
    "action": "log_completion"
  }
}

# Add worker
POST /api/config/workers
{
  "workerId": "W001",
  "name": "John",
  "role": "Warehouse",
  "shift": "morning"
}

# Delete worker
DELETE /api/config/workers/:workerId
```

### Analytics API

```bash
# Get analytics
GET /api/analytics

# Log activity
POST /api/activity
{
  "workerId": "W001",
  "type": "task_completion",
  "text": "Finished loading truck 5"
}

# Start voice session
POST /api/voice/start
{
  "workerId": "W001"
}
```

### System API

```bash
# Health check
GET /health

# Test API key
POST /api/test/openai
{
  "apiKey": "sk-..."
}

# List voices
GET /api/voices
```

---

## 🌐 Deployment Options

### Quick Deploy (5 minutes)

**Using ngrok (for mobile testing):**

```bash
# Terminal 1: Start server
npm run server

# Terminal 2: Expose publicly
ngrok http 3000

# Share URL with anyone!
# https://abc123.ngrok.io
```

**Using Railway.app:**

```bash
npm install -g @railway/cli
railway login
railway init
railway up

# Live at: https://your-app.railway.app
```

### Production Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guides:

- ☁️ Cloud platforms (Railway, Fly.io, DigitalOcean)
- 🖥️ Self-hosted VPS
- 🔒 SSL certificate setup
- 📱 Mobile testing
- 🐳 Docker deployment

---

## 📱 Mobile Access

### Same WiFi (Instant)

```bash
# 1. Find your local IP
ifconfig | grep "inet "  # Mac/Linux
ipconfig                 # Windows

# 2. Start server
npm run server

# 3. On phone, visit:
http://192.168.1.XXX:3000
```

### Over Internet (ngrok)

```bash
# 1. Start server
npm run server

# 2. Expose with ngrok
ngrok http 3000

# 3. Visit the https URL on any device!
```

### PWA (Add to Home Screen)

On mobile browser:
1. Visit your deployed site
2. Tap "Share" → "Add to Home Screen"
3. App icon appears!

---

## 🛠️ Development

### Run Locally

```bash
# Install
npm install

# Development (auto-reload)
npm run dev

# Production
npm run server

# Demo (no API key needed)
npm run demo
```

### Docker Commands

```bash
# Build
npm run docker:build

# Start
npm run docker:up

# Stop
npm run docker:down

# Logs
npm run docker:logs
```

### Environment Variables

Create `.env`:

```bash
# Required
OPENAI_API_KEY=sk-proj-your-key-here

# Optional
WORKER_ID=W001
PORT=3000
NODE_ENV=production
```

---

## 🎯 Use Cases

### Warehouse Operations

```
Worker: "Finished packing order 1234"
Agent: "Great! That's your 15th order. Next is 1235."
📊 Tracks: productivity, completion time, order count
```

### Field Technicians

```
Worker: "At the Johnson site, AC unit needs part AC-2847"
Agent: "Got it. I'll have it shipped to your next location."
📊 Tracks: job progress, parts needed, location
```

### Delivery Drivers

```
Worker: "Delivered to 123 Main St"
Agent: "Perfect! 12 done. Next stop: 456 Oak Ave."
📊 Tracks: deliveries, routes, timing
```

### Restaurant Staff

```
Worker: "Running low on tomatoes"
Agent: "Added to order. ETA 2pm. Need anything else?"
📊 Tracks: inventory, supply usage
```

---

## 🔒 Security

**Built-in security features:**

- ✅ API key validation
- ✅ Rate limiting (nginx)
- ✅ CORS configuration
- ✅ Input sanitization
- ✅ Environment variables (no hardcoded secrets)
- ✅ HTTPS support (production)
- ✅ Health checks
- ✅ Graceful shutdowns

**Before sharing externally:**

1. Add your `.env` file (never commit!)
2. Enable HTTPS (Let's Encrypt)
3. Configure rate limits
4. Review CORS settings
5. Set up monitoring

---

## 📈 Performance

**Optimizations:**

- Gzip compression (nginx)
- Static file caching
- Real-time updates (3s intervals)
- Lazy loading
- Mobile-first design
- < 1s load time

**Scaling:**

- Docker Compose (multi-container)
- Horizontal scaling ready
- Database-agnostic design
- Stateless architecture

---

## 🐛 Troubleshooting

### Can't access dashboard?

```bash
# Check if server is running
curl http://localhost:3000/health

# Check Docker logs
docker-compose logs -f

# Restart
npm run server
```

### Mobile can't connect?

1. Same WiFi network?
2. Firewall blocking port?
3. Use local IP, not localhost

### API key issues?

1. Get fresh key: https://platform.openai.com/api-keys
2. Check `.env` file
3. Test via `/setup` page
4. Restart server

### Docker issues?

```bash
# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[config/agent-config.js](./config/agent-config.js)** - Configuration reference
- **[API Reference](#api-reference)** - REST API docs

---

## 🤝 Contributing

This is part of **Agentic Tribe**. Contributions welcome!

1. Fork the repo
2. Create your feature branch
3. Test thoroughly
4. Submit pull request

---

## 📄 License

MIT License - Use freely!

---

## 🎉 What's New

### v1.0.0 - Production Release

**🎨 New Features:**

- ✅ Complete web UI (setup, dashboard, voice)
- ✅ Mobile-responsive design
- ✅ Docker deployment
- ✅ Real-time analytics dashboard
- ✅ Configuration via web interface
- ✅ Worker management system
- ✅ API key validation
- ✅ Nginx reverse proxy
- ✅ Health monitoring
- ✅ Comprehensive deployment guide

**📱 Mobile Experience:**

- Touch-optimized interface
- Add to home screen (PWA)
- Works offline
- Fast loading
- Responsive design

**🐳 DevOps:**

- Docker containerization
- Docker Compose setup
- Health checks
- Graceful shutdown
- Structured logging
- Rate limiting

---

## 🚀 Quick Links

- **Home**: http://localhost:3000
- **Setup**: http://localhost:3000/setup
- **Dashboard**: http://localhost:3000/dashboard
- **API Docs**: http://localhost:3000/api/config
- **Health**: http://localhost:3000/health

---

**Built with:**
- OpenAI Realtime API
- Node.js + Express
- Docker + Docker Compose
- Nginx
- Vanilla JavaScript (no frameworks!)

**Part of Agentic Tribe** - Find Your Tribe. Build Together.

🌐 https://ruv.io/tribe
