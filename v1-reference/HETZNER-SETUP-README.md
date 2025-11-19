# 🚀 Hetzner Deployment Setup for Voice Agent

This repository now includes everything you need to deploy the Voice Agent application to a Hetzner VPS server.

## 📁 What's Been Added

### Deployment Scripts

1. **`voice-agent/deploy-to-hetzner.sh`** (7.3KB)
   - Automated deployment script for Hetzner VPS
   - Installs Docker, configures firewall, sets up application
   - One-command deployment

2. **`voice-agent/setup-ssl.sh`** (11KB)
   - Automated SSL/HTTPS setup using Let's Encrypt
   - Configures nginx with SSL certificates
   - Sets up auto-renewal

### Documentation

1. **`voice-agent/HETZNER-DEPLOYMENT.md`** (15KB)
   - Comprehensive deployment guide
   - Step-by-step instructions
   - Troubleshooting and maintenance sections
   - Security best practices

2. **`voice-agent/QUICKSTART-HETZNER.md`** (5.6KB)
   - Quick 10-minute deployment guide
   - Minimal steps to get up and running
   - Common commands reference card

3. **`voice-agent/.env.production`** (6.2KB)
   - Production-ready environment template
   - All configuration options documented
   - Security notes and best practices

## 🚀 Quick Start

### For the Impatient (10 minutes)

See: **[QUICKSTART-HETZNER.md](./voice-agent/QUICKSTART-HETZNER.md)**

### For Complete Guide

See: **[HETZNER-DEPLOYMENT.md](./voice-agent/HETZNER-DEPLOYMENT.md)**

## 📋 Deployment Options

### Option 1: Automated (Recommended)

```bash
# On your Hetzner server
cd /opt
git clone https://github.com/Johnymachettes/voice-agent
cd voice-agent
./deploy-to-hetzner.sh
```

### Option 2: From This Repository

```bash
# On your Hetzner server
cd /opt
git clone <your-repo-url>
cd impofai/voice-agent
./deploy-to-hetzner.sh
```

## 🔐 SSL/HTTPS Setup

```bash
# After basic deployment
cd /opt/voice-agent
./setup-ssl.sh yourdomain.com
```

## 📦 What Gets Deployed

- **Voice Agent Application** - AI voice assistant
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy with rate limiting
- **Firewall** - UFW configured for security
- **SSL/HTTPS** - Optional Let's Encrypt certificates
- **Auto-restart** - Services restart on failure
- **Health checks** - Automatic monitoring

## 🌐 Access URLs

After deployment:

```
http://YOUR_SERVER_IP:3000          - Main Application
http://YOUR_SERVER_IP:3000/setup    - Configuration
http://YOUR_SERVER_IP:3000/dashboard - Analytics Dashboard
http://YOUR_SERVER_IP:3000/voice    - Voice Interface
```

With SSL:
```
https://yourdomain.com              - Main Application
https://yourdomain.com/setup        - Configuration
https://yourdomain.com/dashboard    - Analytics Dashboard
https://yourdomain.com/voice        - Voice Interface
```

## 💰 Costs

- **Hetzner VPS**: €4.51/month (CX22 instance)
- **OpenAI API**: ~$10-50/month (usage-based)
- **Domain**: ~$10/year (optional)
- **SSL**: FREE (Let's Encrypt)

**Total**: ~€10-60/month

## 🛠️ Requirements

### Before Deployment

- Hetzner Cloud account
- OpenAI API key ([Get one](https://platform.openai.com/api-keys))
- SSH access to server
- (Optional) Domain name for HTTPS

### Server Requirements

- **OS**: Ubuntu 20.04+ (22.04 recommended)
- **RAM**: 4GB minimum (CX22 or higher)
- **Storage**: 40GB SSD minimum
- **CPU**: 2 vCPU minimum

## 📖 Documentation Structure

```
voice-agent/
├── QUICKSTART-HETZNER.md       # 10-minute quick start
├── HETZNER-DEPLOYMENT.md       # Complete deployment guide
├── deploy-to-hetzner.sh        # Automated deployment script
├── setup-ssl.sh                # SSL/HTTPS setup script
├── .env.production             # Production environment template
├── DEPLOYMENT.md               # General deployment options
├── README.md                   # Application documentation
└── docker-compose.yml          # Docker configuration
```

## 🔧 Common Commands

Once deployed:

```bash
# Connect to server
ssh root@YOUR_SERVER_IP

# Navigate to app
cd /opt/voice-agent

# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Update application
git pull && docker-compose up -d --build

# Stop application
docker-compose down

# Start application
docker-compose up -d

# Check status
docker-compose ps

# Check health
curl http://localhost:3000/health
```

## 🔒 Security Features

- Firewall (UFW) configured
- Rate limiting on API endpoints
- HTTPS/SSL support
- Environment variable protection
- CORS configuration
- Input validation
- Secure headers

## 📊 Monitoring

### Built-in Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# View container stats
docker stats

# View logs
docker-compose logs -f
```

### Optional Monitoring

Set up external monitoring with:
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor: `https://yourdomain.com/health`

## 🐛 Troubleshooting

### Quick Fixes

```bash
# Application not responding
docker-compose restart

# View error logs
docker-compose logs -f | grep -i error

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check disk space
df -h

# Check memory
free -h
```

### Common Issues

1. **Can't access application**
   - Check firewall: `ufw status`
   - Check containers: `docker-compose ps`
   - Check logs: `docker-compose logs -f`

2. **SSL not working**
   - Verify DNS: `dig yourdomain.com`
   - Check certificate: `certbot certificates`
   - Check nginx: `docker-compose logs nginx`

3. **Out of memory**
   - Upgrade server instance in Hetzner console
   - Recommended: CPX21 (4GB RAM)

## 📞 Support

### Documentation
- Quick Start: [QUICKSTART-HETZNER.md](./voice-agent/QUICKSTART-HETZNER.md)
- Full Guide: [HETZNER-DEPLOYMENT.md](./voice-agent/HETZNER-DEPLOYMENT.md)
- Application: [README.md](./voice-agent/README.md)

### Logs
```bash
docker-compose logs -f
```

### Health Check
```bash
curl http://localhost:3000/health
```

## 🎯 Next Steps

After deployment:

1. ✅ Configure OpenAI API key
2. ✅ Set up SSL/HTTPS (if you have domain)
3. ✅ Configure agent settings at `/setup`
4. ✅ Add workers
5. ✅ Test voice interface
6. ✅ Set up monitoring
7. ✅ Configure backups
8. ✅ Share with your team

## 📝 Environment Configuration

Copy and edit the production environment template:

```bash
cp .env.production .env
nano .env
```

Required settings:
```bash
OPENAI_API_KEY=sk-your-actual-key
NODE_ENV=production
DEBUG=false
```

See `.env.production` for all available options.

## 🔄 Updates

To update the application:

```bash
cd /opt/voice-agent
git pull
docker-compose up -d --build
```

## 🎉 Success!

Your voice agent should now be running on Hetzner!

**Test it:**
1. Open: `http://YOUR_SERVER_IP:3000`
2. Configure: `http://YOUR_SERVER_IP:3000/setup`
3. Start talking: `http://YOUR_SERVER_IP:3000/voice`

---

## 📄 File Manifest

All deployment files created:

- ✅ `deploy-to-hetzner.sh` - Main deployment script
- ✅ `setup-ssl.sh` - SSL setup script
- ✅ `HETZNER-DEPLOYMENT.md` - Complete deployment guide
- ✅ `QUICKSTART-HETZNER.md` - Quick start guide
- ✅ `.env.production` - Production environment template

**All scripts are executable and ready to use!**

---

**Questions?** Check the [HETZNER-DEPLOYMENT.md](./voice-agent/HETZNER-DEPLOYMENT.md) for detailed answers.

**Ready to deploy?** Follow [QUICKSTART-HETZNER.md](./voice-agent/QUICKSTART-HETZNER.md) for a 10-minute setup!
