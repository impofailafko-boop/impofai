# 🌍 Hetzner VPS Deployment Guide

Complete guide for deploying ImpofAI to Hetzner Cloud VPS.

---

## 🚀 Quick Deployment (Automated)

### Step 1: Create Hetzner VPS

1. Go to [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Create new project: "ImpofAI"
3. Add new server:
   - **Location:** Choose closest to your users
   - **Image:** Ubuntu 22.04 LTS
   - **Type:** CX21 (2 vCPU, 4GB RAM) - €5.83/month
   - **Networking:** IPv4 + IPv6
   - **SSH Key:** Add your public SSH key
   - **Name:** impofai-prod

### Step 2: Connect to VPS

```bash
# Get your VPS IP from Hetzner Console
ssh root@YOUR_VPS_IP
```

### Step 3: Run Deployment Script

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/impofailafko-boop/impofai/main/deploy-hetzner.sh -o deploy-hetzner.sh
chmod +x deploy-hetzner.sh
./deploy-hetzner.sh
```

**The script will:**
- ✅ Install Docker & Docker Compose
- ✅ Clone ImpofAI repository
- ✅ Configure environment (.env)
- ✅ Build Docker containers
- ✅ Start services on port 80
- ✅ Run health checks

### Step 4: Access Your Application

```
Admin Dashboard: http://YOUR_VPS_IP
Worker UI:       http://YOUR_VPS_IP/worker
API:             http://YOUR_VPS_IP/api/v1/
Health:          http://YOUR_VPS_IP/health
```

---

## 📋 Manual Deployment (Step-by-Step)

If you prefer manual control:

### 1. Prepare VPS

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
# Clone your repository
git clone https://github.com/impofailafko-boop/impofai.git
cd impofai
```

### 3. Configure Environment

```bash
# Copy example .env
cp .env.example .env

# Edit .env file
nano .env
```

**Add your configuration:**
```bash
NODE_ENV=production
HOST_PORT=80
OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-API-KEY
AGENTDB_PATH=/app/data/agentdb.sqlite
DEFAULT_LANGUAGE=sk-SK
ALLOWED_ORIGINS=http://YOUR_VPS_IP
```

### 4. Build and Run

```bash
# Build Docker image
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 5. Verify Deployment

```bash
# Check running containers
docker-compose ps

# Test health endpoint
curl http://localhost/health

# Should return:
# {"status":"ok","service":"ImpofAI","version":"1.0.0"}
```

---

## 🔒 Security Setup

### 1. Configure Firewall

```bash
# Install UFW (if not installed)
apt install ufw

# Allow SSH (IMPORTANT - do this first!)
ufw allow OpenSSH

# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS (for SSL later)
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 2. Set Up SSL (Recommended for Production)

```bash
# Install Certbot
apt install certbot

# Get SSL certificate (replace with your domain)
certbot certonly --standalone -d yourdomain.com

# Certificates will be in:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

**Update docker-compose.yml for SSL:**
```bash
# Add your domain to .env
echo "DOMAIN=yourdomain.com" >> .env

# Start with Nginx profile
docker-compose --profile production up -d
```

### 3. Set Up Automated Backups

```bash
# Create backup script
cat > /root/backup-impofai.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups/impofai"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cd /root/impofai

# Backup database
docker-compose exec -T impofai sqlite3 /app/data/agentdb.sqlite ".backup /app/data/backup_$DATE.sqlite"
cp data/backup_$DATE.sqlite $BACKUP_DIR/

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sqlite" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sqlite"
EOF

chmod +x /root/backup-impofai.sh

# Schedule daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /root/backup-impofai.sh >> /var/log/impofai-backup.log 2>&1
```

---

## 🔧 Maintenance

### Update Application

```bash
cd /root/impofai

# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f
```

### View Logs

```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Only errors
docker-compose logs | grep ERROR
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart only ImpofAI
docker-compose restart impofai
```

### Check Resource Usage

```bash
# Container stats
docker stats impofai

# System resources
htop

# Disk usage
df -h
du -sh /root/impofai/data
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs impofai

# Check Docker status
systemctl status docker

# Restart Docker
systemctl restart docker
docker-compose up -d
```

### Port 80 Already in Use

```bash
# Find what's using port 80
lsof -i :80

# Stop Apache/Nginx if installed
systemctl stop apache2
systemctl stop nginx

# Or use different port
echo "HOST_PORT=8080" >> .env
docker-compose up -d
```

### Database Corruption

```bash
# Stop services
docker-compose down

# Backup current database
cp data/agentdb.sqlite data/agentdb.sqlite.backup

# Remove corrupted database
rm data/agentdb.sqlite

# Restart (will create new database)
docker-compose up -d
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker images
docker system prune -a

# Clean old logs
docker-compose down
rm -rf logs/*
docker-compose up -d
```

---

## 📊 Monitoring

### Set Up Basic Monitoring

```bash
# Install monitoring tools
apt install htop iotop nethogs

# Check system health
htop              # CPU/RAM usage
iotop             # Disk I/O
nethogs           # Network usage
docker stats      # Container stats
```

### Health Checks

```bash
# Create health check script
cat > /root/check-impofai.sh << 'EOF'
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ ImpofAI is healthy"
else
    echo "❌ ImpofAI is down (HTTP $RESPONSE)"
    # Restart services
    cd /root/impofai
    docker-compose restart
fi
EOF

chmod +x /root/check-impofai.sh

# Run every 5 minutes
crontab -e
# Add: */5 * * * * /root/check-impofai.sh >> /var/log/impofai-health.log 2>&1
```

---

## 💰 Cost Optimization

### Hetzner Server Recommendations

| Server Type | vCPU | RAM | Disk | Price/month | Use Case |
|-------------|------|-----|------|-------------|----------|
| **CX21** | 2 | 4GB | 40GB | €5.83 | Testing, small teams (<10 users) |
| **CX31** | 2 | 8GB | 80GB | €10.77 | Production, medium teams (10-50 users) |
| **CX41** | 4 | 16GB | 160GB | €20.53 | Large teams (50-200 users) |

**Recommendation:** Start with CX21, upgrade if needed.

### Reduce Costs

```bash
# 1. Use snapshots instead of running 24/7 (if testing)
# Create snapshot in Hetzner Console, delete server, restore when needed

# 2. Clean up Docker regularly
docker system prune -a --volumes

# 3. Compress logs
gzip /root/impofai/logs/*.log

# 4. Use volume backups instead of full server backups
```

---

## 🔐 Production Checklist

Before going live:

- [ ] SSL certificate configured
- [ ] Firewall enabled (UFW)
- [ ] Real OpenAI API key in .env
- [ ] Automated backups scheduled
- [ ] Health check monitoring enabled
- [ ] SSH key-only authentication (disable password)
- [ ] Regular security updates scheduled
- [ ] Domain name configured (optional)
- [ ] CORS origins configured correctly
- [ ] Test all features (admin dashboard, worker UI, API)

---

## 📞 Support

**If something goes wrong:**

1. Check logs: `docker-compose logs -f`
2. Verify .env: `cat .env`
3. Test health: `curl http://localhost/health`
4. Restart: `docker-compose restart`
5. Check GitHub issues: https://github.com/impofailafko-boop/impofai/issues

---

## 🎯 Quick Commands Reference

```bash
# Deploy
cd /root/impofai && docker-compose up -d

# Update
cd /root/impofai && git pull && docker-compose up -d --build

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Backup
cp data/agentdb.sqlite backups/agentdb_$(date +%Y%m%d).sqlite

# Health
curl http://localhost/health

# Stats
docker stats impofai
```

---

**Deployment time:** ~10 minutes
**Monthly cost:** From €5.83
**Difficulty:** Easy (automated script) or Medium (manual)

🚀 **Ready to deploy? Run the automated script on your Hetzner VPS!**
