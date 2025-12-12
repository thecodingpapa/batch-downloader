#!/bin/bash

# Helper script to check if Node.js upgrade was successful
# Run this after upgrading Node.js to verify the new version is active

echo "🔍 Node.js Version Check"
echo "========================"
echo ""

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not found in PATH"
    echo ""
    echo "Possible solutions:"
    echo "1. Close this terminal and open a new one"
    echo "2. Restart your computer"
    echo "3. Reinstall Node.js from https://nodejs.org/"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node --version)
echo "📦 Current Node.js version: $CURRENT_VERSION"
echo ""

# Check which node binary is being used
NODE_PATH=$(which node)
echo "📍 Node.js location: $NODE_PATH"
echo ""

# Check if it's the Homebrew version (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [[ $(uname -m) == 'arm64' ]]; then
        BREW_NODE="/opt/homebrew/bin/node"
    else
        BREW_NODE="/usr/local/bin/node"
    fi
    
    if [ -f "$BREW_NODE" ]; then
        BREW_VERSION=$($BREW_NODE --version)
        echo "🍺 Homebrew Node.js version: $BREW_VERSION"
        echo "🍺 Homebrew Node.js location: $BREW_NODE"
        echo ""
        
        if [[ "$CURRENT_VERSION" != "$BREW_VERSION" ]]; then
            echo "⚠️  WARNING: Your terminal is using a different Node.js version!"
            echo ""
            echo "   Current version in use: $CURRENT_VERSION ($NODE_PATH)"
            echo "   Homebrew version:       $BREW_VERSION ($BREW_NODE)"
            echo ""
            echo "Solutions:"
            echo "1. Close this terminal and open a new one"
            echo "2. Run: hash -r && export PATH=\"$(dirname $BREW_NODE):\$PATH\""
            echo "3. Restart your computer"
            echo ""
            exit 1
        fi
    fi
fi

# Check version compatibility
NODE_MAJOR=$(echo $CURRENT_VERSION | cut -d'.' -f1 | sed 's/v//')
NODE_MINOR=$(echo $CURRENT_VERSION | cut -d'.' -f2)

VERSION_OK=false
if [ "$NODE_MAJOR" -gt 22 ]; then
    VERSION_OK=true
elif [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -ge 12 ]; then
    VERSION_OK=true
elif [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; then
    VERSION_OK=true
fi

echo "========================"
echo ""

if [ "$VERSION_OK" = true ]; then
    echo "✅ SUCCESS! Node.js version is compatible with Vite"
    echo ""
    echo "   Version: $CURRENT_VERSION"
    echo "   Required: 20.19+ or 22.12+"
    echo ""
    echo "You can now run:"
    echo "   ./install-batch-downloader.sh"
else
    echo "❌ INCOMPATIBLE: Node.js version is too old"
    echo ""
    echo "   Your version: $CURRENT_VERSION"
    echo "   Required: 20.19+ or 22.12+"
    echo ""
    echo "Please upgrade Node.js:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "   brew upgrade node"
    else
        echo "   Visit: https://nodejs.org/"
    fi
    echo ""
    echo "After upgrading, close this terminal, open a new one,"
    echo "and run this script again to verify."
fi

echo ""
