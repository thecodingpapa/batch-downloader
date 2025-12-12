#!/bin/bash

# Diagnostic script to check batch-downloader setup

echo "🔍 Batch Downloader - Diagnostic Check"
echo "======================================"
echo ""

# Check Node.js
echo "📦 Node.js:"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Installed: $NODE_VERSION"
    
    # Check if version is compatible with Vite
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    NODE_MINOR=$(echo $NODE_VERSION | cut -d'.' -f2)
    
    VERSION_OK=false
    if [ "$NODE_MAJOR" -gt 22 ]; then
        VERSION_OK=true
    elif [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -ge 12 ]; then
        VERSION_OK=true
    elif [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; then
        VERSION_OK=true
    fi
    
    if [ "$VERSION_OK" = false ]; then
        echo "   ⚠️  WARNING: Vite requires Node.js 20.19+ or 22.12+"
        echo "   Your version ($NODE_VERSION) is too old!"
    fi
else
    echo "   ❌ NOT INSTALLED"
fi

# Check npm
echo ""
echo "📦 npm:"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "   ✅ Installed: $NPM_VERSION"
else
    echo "   ❌ NOT INSTALLED"
fi

# Check current directory
echo ""
echo "📁 Current Directory:"
pwd

# Check if in project root
echo ""
echo "📂 Project Structure:"
if [ -d "server" ]; then
    echo "   ✅ server/ directory exists"
else
    echo "   ❌ server/ directory NOT FOUND"
fi

if [ -d "client" ]; then
    echo "   ✅ client/ directory exists"
else
    echo "   ❌ client/ directory NOT FOUND"
fi

# Check server dependencies
echo ""
echo "📡 Server Dependencies:"
if [ -d "server/node_modules" ]; then
    MODULE_COUNT=$(ls -1 server/node_modules | wc -l)
    echo "   ✅ node_modules exists ($MODULE_COUNT packages)"
else
    echo "   ❌ node_modules NOT FOUND"
fi

if [ -f "server/package.json" ]; then
    echo "   ✅ package.json exists"
else
    echo "   ❌ package.json NOT FOUND"
fi

# Check client dependencies
echo ""
echo "🌐 Client Dependencies:"
if [ -d "client/node_modules" ]; then
    MODULE_COUNT=$(ls -1 client/node_modules | wc -l)
    echo "   ✅ node_modules exists ($MODULE_COUNT packages)"
else
    echo "   ❌ node_modules NOT FOUND"
fi

if [ -f "client/package.json" ]; then
    echo "   ✅ package.json exists"
else
    echo "   ❌ package.json NOT FOUND"
fi

# Check for vite specifically
if [ -f "client/node_modules/.bin/vite" ]; then
    echo "   ✅ vite is installed"
else
    echo "   ❌ vite NOT FOUND (critical!)"
fi

# Check SSL certificates
echo ""
echo "🔐 SSL Certificates:"
if [ -f "localhost+2-key.pem" ]; then
    echo "   ✅ localhost+2-key.pem exists"
else
    echo "   ⚠️  localhost+2-key.pem NOT FOUND (will use HTTP)"
fi

if [ -f "localhost+2.pem" ]; then
    echo "   ✅ localhost+2.pem exists"
else
    echo "   ⚠️  localhost+2.pem NOT FOUND (will use HTTP)"
fi

# Check mkcert
echo ""
echo "🔧 Tools:"
if command -v mkcert &> /dev/null; then
    echo "   ✅ mkcert is installed"
else
    echo "   ⚠️  mkcert NOT INSTALLED (HTTPS won't work)"
fi

# Check ports
echo ""
echo "🔌 Port Status:"
if command -v lsof &> /dev/null; then
    PORT_3000=$(lsof -ti :3000)
    if [ -n "$PORT_3000" ]; then
        echo "   ⚠️  Port 3000 is in use (PID: $PORT_3000)"
    else
        echo "   ✅ Port 3000 is available"
    fi
    
    PORT_5174=$(lsof -ti :5174)
    if [ -n "$PORT_5174" ]; then
        echo "   ⚠️  Port 5174 is in use (PID: $PORT_5174)"
    else
        echo "   ✅ Port 5174 is available"
    fi
else
    echo "   ⚠️  lsof not available, cannot check ports"
fi

# Check running processes
echo ""
echo "🏃 Running Processes:"
if [ -f "server.pid" ]; then
    SERVER_PID=$(cat server.pid)
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "   ✅ Server is running (PID: $SERVER_PID)"
    else
        echo "   ⚠️  server.pid exists but process not running"
    fi
else
    echo "   ℹ️  Server not running"
fi

if [ -f "client.pid" ]; then
    CLIENT_PID=$(cat client.pid)
    if ps -p $CLIENT_PID > /dev/null 2>&1; then
        echo "   ✅ Client is running (PID: $CLIENT_PID)"
    else
        echo "   ⚠️  client.pid exists but process not running"
    fi
else
    echo "   ℹ️  Client not running"
fi

# Check logs
echo ""
echo "📝 Recent Logs:"
if [ -f "client.log" ]; then
    echo "   Client log (last 5 lines):"
    tail -5 client.log | sed 's/^/      /'
else
    echo "   ℹ️  No client.log found"
fi

echo ""
if [ -f "server.log" ]; then
    echo "   Server log (last 5 lines):"
    tail -5 server.log | sed 's/^/      /'
else
    echo "   ℹ️  No server.log found"
fi

# Summary
echo ""
echo "======================================"
echo "📋 Summary:"
echo ""

ISSUES=0

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    NODE_MINOR=$(echo $NODE_VERSION | cut -d'.' -f2)
    
    VERSION_OK=false
    if [ "$NODE_MAJOR" -gt 22 ]; then
        VERSION_OK=true
    elif [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -ge 12 ]; then
        VERSION_OK=true
    elif [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; then
        VERSION_OK=true
    fi
    
    if [ "$VERSION_OK" = false ]; then
        echo "❌ Node.js version $NODE_VERSION is too old"
        echo "   Vite requires Node.js 20.19+ or 22.12+"
        echo "   Upgrade with: brew upgrade node (macOS) or see https://nodejs.org/"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo "❌ Node.js is not installed - RUN: ./install-batch-downloader.sh"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -d "client/node_modules" ] || [ ! -f "client/node_modules/.bin/vite" ]; then
    echo "❌ Client dependencies missing - RUN: ./install-batch-downloader.sh"
    ISSUES=$((ISSUES + 1))
fi

if [ ! -d "server/node_modules" ]; then
    echo "❌ Server dependencies missing - RUN: ./install-batch-downloader.sh"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ No critical issues found!"
    echo ""
    echo "You can start the application with:"
    echo "   ./run-batch-downloader.sh"
else
    echo ""
    echo "⚠️  Found $ISSUES critical issue(s)"
    echo ""
    echo "Recommended action:"
    echo "   ./install-batch-downloader.sh"
fi

echo ""
