# 🎤 Business Voice Agent - Standalone Version

> Complete AI voice assistant system - runs independently, no parent repo needed!

## ⚡ Quick Start (Copy & Paste)

### 1. Get This Folder on Your Linux Machine

**Option A: Download as ZIP**
```bash
# If you have this folder, just copy it to your Linux machine
# You can zip it first:
tar -czf business-voice.tar.gz business-voice/

# Then on Linux:
tar -xzf business-voice.tar.gz
cd business-voice
```

**Option B: Direct File Transfer**
```bash
# From your current machine:
scp -r business-voice/ user@your-linux-machine:/path/to/destination/

# Or use a USB drive, Dropbox, etc.
```

**Option C: Git Clone (if you make it public)**
```bash
git clone https://github.com/YOUR-USERNAME/business-voice-agent
cd business-voice-agent
```

### 2. Run Setup Script

```bash
cd business-voice
chmod +x setup.sh
./setup.sh
```

That's it! The script will:
- ✅ Install all dependencies
- ✅ Create .env file
- ✅ Set up directories
- ✅ Check everything works

### 3. Add Your OpenAI Key

```bash
# Edit .env file
nano .env

# Add this line:
OPENAI_API_KEY=sk-proj-your-key-here

# Save and exit
```

### 4. Start the Server

```bash
npm run server

# Open browser:
# http://localhost:3000
```

---

## 📦 What's Included (Fully Standalone)

This folder contains **everything** you need:

```
business-voice/
├── package.json          # All dependencies
├── setup.sh             # One-command setup
├── .env.example         # Config template
├── src/                 # Backend code
├── public/              # Web interface
├── config/              # Settings
├── Dockerfile           # Docker support
├── docker-compose.yml   # Container setup
└── README.md            # This file
```

**No external dependencies!** Everything is self-contained.

---

## 🚀 All Commands

```bash
# Setup (run once)
./setup.sh

# Start server
npm run server

# Development mode (auto-reload)
npm run dev

# Text demo (no API needed)
npm run demo

# Docker
docker-compose up -d

# Stop Docker
docker-compose down
```

---

## 🐧 Linux-Specific Instructions

### On Ubuntu/Debian:

```bash
# 1. Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Run setup
cd business-voice
./setup.sh

# 3. Start
npm run server
```

### On Fedora/RHEL:

```bash
# 1. Install Node.js
sudo dnf install nodejs

# 2. Run setup
cd business-voice
./setup.sh

# 3. Start
npm run server
```

### On Arch:

```bash
# 1. Install Node.js
sudo pacman -S nodejs npm

# 2. Run setup
cd business-voice
./setup.sh

# 3. Start
npm run server
```

---

## 📱 Access from Other Devices

### On Same Network:

```bash
# 1. Find your Linux machine's IP
hostname -I

# 2. Start server
npm run server

# 3. On phone/tablet, visit:
http://YOUR-LINUX-IP:3000
```

### Over Internet (ngrok):

```bash
# 1. Install ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar -xzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# 2. Start server
npm run server

# 3. Expose it
ngrok http 3000

# Share the https:// URL!
```

---

## 🔧 Troubleshooting

### "npm not found"

```bash
# Install Node.js first
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### "Permission denied"

```bash
# Make setup script executable
chmod +x setup.sh
```

### Can't access from other devices

```bash
# Allow port in firewall
sudo ufw allow 3000

# Or temporarily disable firewall
sudo ufw disable
```

### Port 3000 already in use

```bash
# Use different port
PORT=8080 npm run server

# Then visit: http://localhost:8080
```

---

## 📋 System Requirements

**Minimum:**
- Node.js 18+
- 100MB disk space
- 512MB RAM

**Recommended:**
- Node.js 18+
- 500MB disk space
- 1GB RAM
- Ubuntu 20.04+ or equivalent

---

## 🎯 What This System Does

1. **Voice conversations** with workers (hands-free)
2. **Automatic tracking** of tasks, issues, supplies
3. **Real-time analytics** dashboard
4. **Mobile-friendly** web interface
5. **Configure via web UI** (no code editing!)

---

## 🌐 URLs After Starting

- **Home**: http://localhost:3000
- **Setup**: http://localhost:3000/setup
- **Dashboard**: http://localhost:3000/dashboard
- **Health Check**: http://localhost:3000/health

---

## 💾 Data Storage

All data stored locally in:
- `data/` - Analytics database
- `logs/` - Application logs
- `config/agent-config.js` - Settings

**Backup these folders** to preserve your data!

---

## 🔐 Security Notes

When using on Linux server:

1. **Add firewall rules:**
   ```bash
   sudo ufw allow 3000
   ```

2. **Use environment variables:**
   Never commit `.env` file!

3. **Enable HTTPS** for production:
   See DEPLOYMENT.md

4. **Keep updated:**
   ```bash
   npm update
   ```

---

## 📚 Full Documentation

- **DEPLOYMENT.md** - Deploy to cloud/VPS
- **config/agent-config.js** - All settings explained
- **README.md** - Complete guide (this file)

---

## 🤝 Support

Issues? Questions?

1. Check logs: `tail -f logs/*.log`
2. Check health: `curl http://localhost:3000/health`
3. Restart: `npm run server`

---

## ✅ Checklist for New Machine

- [ ] Node.js 18+ installed
- [ ] Copied business-voice folder
- [ ] Ran `./setup.sh`
- [ ] Added OpenAI API key to `.env`
- [ ] Started server: `npm run server`
- [ ] Opened http://localhost:3000
- [ ] Configured agent in `/setup` page
- [ ] Tested dashboard in `/dashboard`

---

**This is a complete, standalone system!**

No GitHub, no parent repo, no external dependencies needed. Just copy this folder and run! 🚀
