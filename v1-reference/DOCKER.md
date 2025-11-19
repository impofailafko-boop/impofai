# 🐳 ImpofAI Docker Guide

Quick reference for running ImpofAI with Docker.

---

## 🚀 Quick Start

### Option 1: Default Port (3001)

```bash
# Build and run (uses port 3001 by default to avoid conflicts)
docker-compose up -d

# Access the application
# Admin Dashboard: http://localhost:3001
# Worker UI: http://localhost:3001/worker
# API: http://localhost:3001/api/v1/
```

### Option 2: Custom Port

```bash
# Use a different port (e.g., 8080)
HOST_PORT=8080 docker-compose up -d

# Or create a .env file:
echo "HOST_PORT=8080" > .env
docker-compose up -d

# Access the application
# Admin Dashboard: http://localhost:8080
# Worker UI: http://localhost:8080/worker
```

### Option 3: Production with Nginx

```bash
# Run with Nginx reverse proxy (ports 80/443)
docker-compose --profile production up -d

# Access the application
# HTTP: http://localhost
# HTTPS: https://localhost (requires SSL certificates)
```

---

## 📋 Environment Variables

Create a `.env` file in the project root:

```bash
# Host port (default: 3001)
HOST_PORT=3001

# Node environment
NODE_ENV=production

# OpenAI API key (required for voice features)
OPENAI_API_KEY=sk-proj-your-api-key-here

# Allowed origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3001,http://yourdomain.com

# Nginx ports (optional, for production profile)
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
```

---

## 🛠️ Common Commands

### Build

```bash
# Build the Docker image
docker-compose build

# Build without cache (force rebuild)
docker-compose build --no-cache
```

### Run

```bash
# Start services in background
docker-compose up -d

# Start services in foreground (see logs)
docker-compose up

# Start with custom port
HOST_PORT=8080 docker-compose up -d
```

### View Logs

```bash
# View all logs
docker-compose logs

# View logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View only ImpofAI service logs
docker-compose logs -f impofai
```

### Stop and Remove

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes (deletes data!)
docker-compose down -v
```

### Restart

```bash
# Restart all services
docker-compose restart

# Restart only ImpofAI service
docker-compose restart impofai
```

---

## 🔧 Troubleshooting

### Port Already in Use

**Error:** `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution 1:** Use a different port
```bash
HOST_PORT=3001 docker-compose up -d
```

**Solution 2:** Find and stop the process using the port
```bash
# Linux/Mac
lsof -i :3000
kill <PID>

# Or stop your local Node server
pkill -f "node src/index.js"
```

### Container Fails to Start

**Check logs:**
```bash
docker-compose logs impofai
```

**Common issues:**
- Missing .env file → Copy .env.example to .env
- Invalid OPENAI_API_KEY → Check your API key
- Permission issues → Run `chmod -R 755 data logs`

### Database Issues

**Reset database:**
```bash
# Stop services
docker-compose down

# Remove data volume
rm -rf data/agentdb.sqlite

# Start again (will recreate database)
docker-compose up -d
```

### Build Fails

**Clear Docker cache and rebuild:**
```bash
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Health Checks

### Check Container Status

```bash
# View running containers
docker-compose ps

# Check health status
docker inspect impofai --format='{{.State.Health.Status}}'
```

### Manual Health Check

```bash
# Test health endpoint
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","service":"ImpofAI","version":"1.0.0"}
```

---

## 🔒 Production Deployment

### 1. Configure Environment

```bash
# Create production .env
cat > .env << EOF
NODE_ENV=production
HOST_PORT=3000
OPENAI_API_KEY=sk-proj-your-real-api-key
ALLOWED_ORIGINS=https://yourdomain.com
EOF
```

### 2. Set Up SSL Certificates

```bash
# Create SSL directory
mkdir -p ssl

# Copy your SSL certificates
cp /path/to/certificate.crt ssl/
cp /path/to/private.key ssl/

# Or use Let's Encrypt (recommended)
# See: https://letsencrypt.org/getting-started/
```

### 3. Configure Nginx

Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream impofai {
        server impofai:3000;
    }

    server {
        listen 80;
        server_name yourdomain.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/certificate.crt;
        ssl_certificate_key /etc/nginx/ssl/private.key;

        location / {
            proxy_pass http://impofai;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 4. Deploy with Nginx

```bash
# Start with production profile
docker-compose --profile production up -d

# Verify
curl https://yourdomain.com/health
```

---

## 📦 Data Persistence

**Data is persisted in volumes:**

- `./data/` → Database (SQLite)
- `./logs/` → Application logs

**Backup data:**
```bash
# Backup database
cp data/agentdb.sqlite backups/agentdb_$(date +%Y%m%d).sqlite

# Or use Docker volume backup
docker run --rm \
  -v impofai_impofai-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/data_$(date +%Y%m%d).tar.gz /data
```

---

## 🧪 Testing

### Run Integration Test

```bash
# Enter the container
docker-compose exec impofai sh

# Run test
node tests/integration-test-phase55.js

# Exit
exit
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Get conversations
curl http://localhost:3001/api/v1/stats/conversations

# Get patterns
curl http://localhost:3001/api/v1/patterns

# Get recommendations
curl http://localhost:3001/api/v1/recommendations
```

---

## 🚦 Monitoring

### View Resource Usage

```bash
# Real-time stats
docker stats impofai

# Container details
docker inspect impofai
```

### Access Container Shell

```bash
# Bash shell
docker-compose exec impofai sh

# Or directly
docker exec -it impofai sh
```

---

## 📝 Notes

- Default port changed from 3000 to 3001 to avoid conflicts
- Database is automatically initialized on first run
- OpenAI API key is optional (system works without voice features)
- MidStream analyzer works offline (no API key needed)
- Logs are persisted in `./logs/` directory

---

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify .env file: `cat .env`
3. Check port availability: `lsof -i :3001`
4. Rebuild from scratch: `docker-compose down && docker-compose build --no-cache && docker-compose up -d`

---

**Built with 🐳 Docker for easy deployment**
