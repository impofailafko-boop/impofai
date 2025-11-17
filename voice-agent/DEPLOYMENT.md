# 🚀 Deployment Guide - Business Voice Agent

This guide explains how to deploy the Business Voice Agent for external access (mobile testing, production use, etc.)

## 📋 Table of Contents

1. [Local Testing](#local-testing)
2. [Docker Deployment](#docker-deployment)
3. [External Access Options](#external-access-options)
4. [Production Deployment](#production-deployment)
5. [Mobile Testing](#mobile-testing)

---

## 1. Local Testing

### Quick Start

```bash
cd tribes/business-voice

# Install dependencies
npm install

# Start the server
npm run server

# Access at:
# http://localhost:3000
```

Your computer must stay on and connected to network.

---

## 2. Docker Deployment

### Build and Run with Docker

```bash
cd tribes/business-voice

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Build and start with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f business-voice-agent

# Access at:
# http://localhost:3000     (main app)
# http://localhost:80       (via nginx)
```

### Stop Docker Services

```bash
docker-compose down
```

---

## 3. External Access Options

### Option A: ngrok (Easiest for Testing)

**Best for:** Quick mobile testing, sharing with friends

```bash
# 1. Install ngrok
# Get it from: https://ngrok.com/download

# 2. Start your app
npm run server
# OR
docker-compose up

# 3. In another terminal, expose it
ngrok http 3000

# You'll get a URL like:
# https://abc123.ngrok.io

# Share this URL with your friend!
# They can access it on their phone
```

**Pros:**
- Instant setup
- HTTPS automatically
- Works through firewalls

**Cons:**
- URL changes each time (unless you pay)
- Session expires after a few hours

### Option B: LocalTunnel (Free Alternative)

```bash
# 1. Install localtunnel
npm install -g localtunnel

# 2. Start your app
npm run server

# 3. Expose it
lt --port 3000 --subdomain my-voice-agent

# Access at:
# https://my-voice-agent.loca.lt
```

### Option C: Tailscale (Private Network)

**Best for:** Secure access within a team

```bash
# 1. Install Tailscale on your computer
# https://tailscale.com/download

# 2. Install on your friend's phone
# (Tailscale app from App Store/Play Store)

# 3. Start your app
npm run server

# 4. Get your Tailscale IP
tailscale ip -4

# Share this IP with your friend (e.g., 100.x.x.x)
# They access: http://100.x.x.x:3000
```

**Pros:**
- Very secure (private network)
- Permanent URL
- No bandwidth limits

**Cons:**
- Requires app installation on both sides

---

## 4. Production Deployment

### Option A: Deploy to Cloud (Recommended)

#### Deploy to DigitalOcean App Platform

```bash
# 1. Push your code to GitHub
git add .
git commit -m "Ready for deployment"
git push

# 2. Go to DigitalOcean App Platform
# https://cloud.digitalocean.com/apps

# 3. Click "Create App" → Choose your GitHub repo

# 4. Configure:
#    - Build Command: npm install
#    - Run Command: npm run server
#    - Port: 3000
#
# 5. Add Environment Variables:
#    OPENAI_API_KEY=your-key
#    NODE_ENV=production

# 6. Deploy!

# You'll get: https://your-app.ondigitalocean.app
```

**Cost:** ~$5-12/month

#### Deploy to Railway.app

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Add environment variables
railway variables set OPENAI_API_KEY=your-key

# 5. Deploy
railway up

# You'll get: https://your-app.up.railway.app
```

**Cost:** Free tier available, then ~$5/month

#### Deploy to Fly.io

```bash
# 1. Install Fly CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Launch
fly launch
# Follow prompts, it will detect your Dockerfile

# 4. Set secrets
fly secrets set OPENAI_API_KEY=your-key

# 5. Deploy
fly deploy

# Access at: https://your-app.fly.dev
```

**Cost:** Free tier available

### Option B: Self-Hosted VPS

#### Setup on Ubuntu Server

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 3. Clone your repo
git clone https://github.com/your-username/agentic-tribe
cd agentic-tribe/tribes/business-voice

# 4. Create .env
nano .env
# Add: OPENAI_API_KEY=your-key

# 5. Start with Docker
docker-compose up -d

# 6. (Optional) Set up domain
# Point your domain's A record to your server IP
# Update nginx config with your domain
# Add SSL certificate (Let's Encrypt)

# Access at: http://your-server-ip:80
# Or: https://your-domain.com (after DNS setup)
```

#### Add SSL Certificate (Free with Let's Encrypt)

```bash
# 1. Install certbot
sudo apt install certbot python3-certbot-nginx

# 2. Get certificate
sudo certbot --nginx -d your-domain.com

# 3. Auto-renewal is configured automatically!

# Now access via HTTPS:
# https://your-domain.com
```

---

## 5. Mobile Testing

### Quick Mobile Test (Same WiFi)

If your phone is on the **same WiFi** as your computer:

```bash
# 1. Find your computer's local IP
# On Mac/Linux:
ifconfig | grep "inet "
# On Windows:
ipconfig

# Look for something like: 192.168.1.XXX

# 2. Start your app
npm run server

# 3. On your phone's browser, go to:
http://192.168.1.XXX:3000

# Replace XXX with your actual IP
```

### Test Over Internet (ngrok method)

```bash
# 1. Start app
npm run server

# 2. Expose via ngrok
ngrok http 3000

# 3. Send the https URL to your friend
# They can test on their phone from anywhere!
```

---

## 🔒 Security Checklist

Before sharing externally:

- [ ] OpenAI API key is in `.env` (not hardcoded)
- [ ] `.env` is in `.gitignore`
- [ ] Rate limiting is enabled (nginx config)
- [ ] HTTPS is configured for production
- [ ] API key validation is working
- [ ] CORS is configured appropriately

---

## 📱 Mobile App Conversion (Optional)

Want a real mobile app? You can convert this to:

### Progressive Web App (PWA)

Already mobile-friendly! Users can "Add to Home Screen":

1. Open site in mobile browser
2. Click "Share" → "Add to Home Screen"
3. App icon appears on phone!

### React Native Wrapper (Future)

Can be wrapped with React Native WebView for App Store/Play Store distribution.

---

## 🐛 Troubleshooting

### Can't access from mobile?

**Check:**
1. Same WiFi network?
2. Firewall blocking port 3000?
3. Computer not sleeping?

**Solutions:**
```bash
# Allow port in firewall (Mac)
sudo pfctl -d  # Disable temporarily

# Allow port in firewall (Linux)
sudo ufw allow 3000

# Keep computer awake
# Use caffeinate (Mac) or similar tool
```

### Docker issues?

```bash
# Check logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Rebuild from scratch
docker-compose down
docker-compose up --build
```

### API key not working?

1. Check `.env` file exists
2. Verify API key is valid at OpenAI dashboard
3. Restart server after changing `.env`

---

## 💡 Tips

1. **For quick testing:** Use ngrok
2. **For team use:** Use Tailscale or deploy to cloud
3. **For production:** Use cloud platform with SSL
4. **Keep costs low:** Start with free tiers (Railway, Fly.io)

---

## 📞 Support

Need help deploying?

- Check logs: `docker-compose logs -f`
- GitHub Issues: [Report an issue]
- Discord: [Join Agentic Tribe community]

---

**Next Steps:**

1. ✅ Choose deployment method
2. ✅ Test locally first
3. ✅ Deploy and get external URL
4. ✅ Share with your friend for mobile testing!
5. ✅ Iterate based on feedback

Good luck! 🚀
