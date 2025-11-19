#!/bin/bash

echo ""
echo "======================================================================"
echo "  🎤 BUSINESS VOICE AGENT - QUICK START SETUP"
echo "======================================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js 18+ from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the business-voice directory"
    echo "   cd tribes/business-voice && ./scripts/quick-start.sh"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your OpenAI API key!"
    echo "   Get one at: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter when you've added your API key to .env..."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "======================================================================"
echo "  ✅ SETUP COMPLETE!"
echo "======================================================================"
echo ""
echo "You can now run:"
echo ""
echo "  1. Text Demo (try this first!):"
echo "     npm run demo"
echo ""
echo "  2. Analytics Dashboard:"
echo "     npm run dashboard"
echo "     Then open: http://localhost:3000"
echo ""
echo "  3. Real Voice Mode (after testing demo):"
echo "     npm start"
echo ""
echo "======================================================================"
echo ""
