#!/bin/bash

# Create standalone package of business-voice tribe
# This creates a .tar.gz file that can be copied to any machine

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_NAME="business-voice-agent"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
PACKAGE_NAME="${PROJECT_NAME}-${TIMESTAMP}.tar.gz"

echo ""
echo "=================================================="
echo "  Creating Standalone Package"
echo "=================================================="
echo ""

# Create temporary directory
TEMP_DIR=$(mktemp -d)
TARGET_DIR="${TEMP_DIR}/${PROJECT_NAME}"

echo "📦 Preparing package..."

# Copy all necessary files
mkdir -p "${TARGET_DIR}"

# Copy core files
cp -r src "${TARGET_DIR}/"
cp -r public "${TARGET_DIR}/"
cp -r config "${TARGET_DIR}/"
cp -r scripts "${TARGET_DIR}/"
cp -r nginx "${TARGET_DIR}/"

# Copy configuration files
cp package.json "${TARGET_DIR}/"
cp .env.example "${TARGET_DIR}/"
cp .gitignore "${TARGET_DIR}/"
cp .dockerignore "${TARGET_DIR}/"

# Copy Docker files
cp Dockerfile "${TARGET_DIR}/"
cp docker-compose.yml "${TARGET_DIR}/"

# Copy documentation
cp README.md "${TARGET_DIR}/"
cp DEPLOYMENT.md "${TARGET_DIR}/"
cp STANDALONE.md "${TARGET_DIR}/"

# Copy setup script
cp setup.sh "${TARGET_DIR}/"
chmod +x "${TARGET_DIR}/setup.sh"

# Create empty directories
mkdir -p "${TARGET_DIR}/data"
mkdir -p "${TARGET_DIR}/logs"

# Create a quick start file
cat > "${TARGET_DIR}/QUICKSTART.txt" << 'EOF'
BUSINESS VOICE AGENT - QUICK START
===================================

1. Extract this archive:
   tar -xzf business-voice-agent-*.tar.gz
   cd business-voice-agent

2. Run setup:
   ./setup.sh

3. Add your OpenAI API key:
   nano .env
   (Add: OPENAI_API_KEY=sk-proj-your-key-here)

4. Start the server:
   npm run server

5. Open browser:
   http://localhost:3000

For more details, see:
- STANDALONE.md - Complete standalone guide
- README.md - Full documentation
- DEPLOYMENT.md - Deploy anywhere guide

System Requirements:
- Node.js 18+
- 100MB disk space
- Internet connection (for npm install)

Troubleshooting:
- If npm not found: Install Node.js first
- If port 3000 busy: Use PORT=8080 npm run server
- If permission error: chmod +x setup.sh

Enjoy! 🚀
EOF

echo "✅ Files copied"

# Create the archive
cd "${TEMP_DIR}"
echo "📦 Creating archive..."
tar -czf "${PACKAGE_NAME}" "${PROJECT_NAME}"

# Move to current directory
mv "${PACKAGE_NAME}" "${SCRIPT_DIR}/"

# Cleanup
rm -rf "${TEMP_DIR}"

echo "✅ Package created: ${PACKAGE_NAME}"
echo ""
echo "=================================================="
echo "  ✅ Package Ready!"
echo "=================================================="
echo ""
echo "Location: ${SCRIPT_DIR}/${PACKAGE_NAME}"
echo "Size: $(du -h ${SCRIPT_DIR}/${PACKAGE_NAME} | cut -f1)"
echo ""
echo "Transfer this file to your Linux machine:"
echo ""
echo "  # Via SCP:"
echo "  scp ${PACKAGE_NAME} user@linux-machine:/path/"
echo ""
echo "  # Or use USB drive, Dropbox, etc."
echo ""
echo "On Linux machine:"
echo "  tar -xzf ${PACKAGE_NAME}"
echo "  cd ${PROJECT_NAME}"
echo "  ./setup.sh"
echo "  npm run server"
echo ""
echo "=================================================="
