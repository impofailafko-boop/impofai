#!/bin/bash

# ImpofAI Hetzner VPS Deployment Script
# Run this script ON YOUR HETZNER VPS (not locally)

set -e  # Exit on error

echo "🚀 ImpofAI Hetzner VPS Deployment"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}⚠️  Please do not run as root. Run as regular user with sudo access.${NC}"
    exit 1
fi

echo "📋 Step 1: Update system"
sudo apt update && sudo apt upgrade -y

echo ""
echo "📋 Step 2: Install Docker"
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

echo ""
echo "📋 Step 3: Install Docker Compose"
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

echo ""
echo "📋 Step 4: Clone ImpofAI repository"
read -p "Enter your GitHub repository URL (or press Enter for default): " REPO_URL
REPO_URL=${REPO_URL:-"https://github.com/impofailafko-boop/impofai.git"}

if [ -d "impofai" ]; then
    echo "Directory impofai already exists. Pulling latest changes..."
    cd impofai
    git pull
else
    git clone "$REPO_URL"
    cd impofai
fi

echo ""
echo "📋 Step 5: Configure environment"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file and add your OpenAI API key${NC}"
    echo ""
    read -p "Enter your OpenAI API key (or press Enter to skip): " OPENAI_KEY
    if [ ! -z "$OPENAI_KEY" ]; then
        sed -i "s|OPENAI_API_KEY=sk-proj-your-key-here|OPENAI_API_KEY=$OPENAI_KEY|g" .env
        echo -e "${GREEN}✅ OpenAI API key configured${NC}"
    fi

    # Set production port
    echo "HOST_PORT=80" >> .env
    echo "NODE_ENV=production" >> .env
    echo "ALLOWED_ORIGINS=http://$(curl -s ifconfig.me)" >> .env
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""
echo "📋 Step 6: Create data directories"
mkdir -p data logs
chmod 755 data logs

echo ""
echo "📋 Step 7: Build and start Docker containers"
docker-compose down
docker-compose build
docker-compose up -d

echo ""
echo "📋 Step 8: Wait for services to start"
echo "Waiting 10 seconds for services to initialize..."
sleep 10

echo ""
echo "📋 Step 9: Check service status"
docker-compose ps

echo ""
echo "📋 Step 10: Test health endpoint"
if curl -f http://localhost:80/health &> /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed. Check logs with: docker-compose logs${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📊 Access ImpofAI:"
PUBLIC_IP=$(curl -s ifconfig.me)
echo "   Admin Dashboard: http://$PUBLIC_IP"
echo "   Worker UI:       http://$PUBLIC_IP/worker"
echo "   API:             http://$PUBLIC_IP/api/v1/"
echo "   Health:          http://$PUBLIC_IP/health"
echo ""
echo "📝 Useful commands:"
echo "   View logs:       docker-compose logs -f"
echo "   Restart:         docker-compose restart"
echo "   Stop:            docker-compose down"
echo "   Update:          git pull && docker-compose up -d --build"
echo ""
echo "⚠️  Next steps:"
echo "   1. Set up firewall: sudo ufw allow 80 && sudo ufw enable"
echo "   2. Set up SSL (optional): Follow DOCKER.md guide"
echo "   3. Test the application: curl http://$PUBLIC_IP/health"
echo ""
echo "🔒 Security reminder:"
echo "   - Add your OpenAI API key to .env"
echo "   - Configure firewall rules"
echo "   - Set up SSL for production use"
echo "   - Regular backups: ./data/agentdb.sqlite"
echo ""
