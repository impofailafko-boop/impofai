#!/bin/bash

echo "=================================================="
echo "  Business Voice Agent - Standalone Setup"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the business-voice directory"
    exit 1
fi

echo "✅ Directory check passed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your OpenAI API key!"
    echo "   Get one at: https://platform.openai.com/api-keys"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Create data and logs directories
mkdir -p data logs
echo "✅ Created data and logs directories"
echo ""

echo "=================================================="
echo "  ✅ Setup Complete!"
echo "=================================================="
echo ""
echo "You can now run:"
echo ""
echo "  npm run server    - Start the web server"
echo "  npm run demo      - Run text demo (no API key needed)"
echo "  npm run dev       - Development mode with auto-reload"
echo ""
echo "Then visit: http://localhost:3000"
echo ""
echo "=================================================="
