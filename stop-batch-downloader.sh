#!/bin/bash

# Script to stop both client and server for batch-downloader

echo "🛑 Stopping Batch Downloader..."

# Stop server
if [ -f server.pid ]; then
    SERVER_PID=$(cat server.pid)
    if ps -p $SERVER_PID > /dev/null 2>&1; then
        echo "📡 Stopping server (PID: $SERVER_PID)..."
        kill $SERVER_PID
        rm server.pid
    else
        echo "⚠️  Server process not found"
        rm server.pid
    fi
else
    echo "⚠️  No server.pid file found"
fi

# Stop client
if [ -f client.pid ]; then
    CLIENT_PID=$(cat client.pid)
    if ps -p $CLIENT_PID > /dev/null 2>&1; then
        echo "🌐 Stopping client (PID: $CLIENT_PID)..."
        kill $CLIENT_PID
        rm client.pid
    else
        echo "⚠️  Client process not found"
        rm client.pid
    fi
else
    echo "⚠️  No client.pid file found"
fi

echo ""
echo "✅ Batch Downloader stopped!"
