#!/bin/bash

# Script to run both client and server for batch-downloader

echo "🚀 Starting Batch Downloader..."

# Start server in background
echo "📡 Starting server on port 3000..."
cd server
node server.js > ../server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > ../server.pid
cd ..

# Wait a moment for server to start
sleep 2

# Start client in background
echo "🌐 Starting client on port 5174..."
cd client
PORT=5174 npm run dev > ../client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > ../client.pid
cd ..

echo ""
echo "✅ Batch Downloader is running!"
echo "   Server: http://localhost:3000 (PID: $SERVER_PID)"
echo "   Client: http://localhost:5174 (PID: $CLIENT_PID)"
echo ""
echo "📝 Logs:"
echo "   Server: tail -f server.log"
echo "   Client: tail -f client.log"
echo ""
echo "🛑 To stop: ./stop-batch-downloader.sh"
