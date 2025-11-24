#!/bin/bash

echo "📦 Installing Batch Downloader dependencies..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install server dependencies
echo "📡 Installing server dependencies..."
cd server
if [ ! -f "package.json" ]; then
    echo "❌ server/package.json not found!"
    exit 1
fi
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi
echo "✅ Server dependencies installed"
cd ..

echo ""

# Install client dependencies
echo "🌐 Installing client dependencies..."
cd client
if [ ! -f "package.json" ]; then
    echo "❌ client/package.json not found!"
    exit 1
fi
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi
echo "✅ Client dependencies installed"
cd ..

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run: ./run-batch-downloader.sh"
echo "   2. Open: http://localhost:5174/"
echo "   3. Stop: ./stop-batch-downloader.sh"
echo ""
