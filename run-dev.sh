#!/bin/bash

# run-dev.sh - Developer Mode
# Runs services and streams ALL logs to terminal and files.
# Stays active until Ctrl+C is pressed.

SERVER_PORT=3000
CLIENT_PORT=5174

# --- Functions ---

kill_port() {
  local port=$1
  local name=$2
  local pid=$(lsof -ti :$port)
  if [ -n "$pid" ]; then
    echo "⚠️  Killing existing $name on port $port (PID: $pid)..."
    kill -9 $pid 2>/dev/null
  fi
}

cleanup() {
  echo ""
  echo "🛑 Stopping Dev Environment..."
  # Kill the child processes we started
  if [ -n "$SERVER_PID" ]; then kill $SERVER_PID 2>/dev/null; fi
  if [ -n "$CLIENT_PID" ]; then kill $CLIENT_PID 2>/dev/null; fi
  exit
}

# Trap Ctrl+C (SIGINT) and Termination (SIGTERM)
trap cleanup SIGINT SIGTERM

echo "🚀 Starting Batch Downloader (Dev Mode)..."

# --- Checks ---

# Dependency Checks
if [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
  echo "❌ Dependencies not found. Please run ./install-batch-downloader.sh first."
  exit 1
fi

# SSL Check
CERT_KEY="localhost+2-key.pem"
CERT_FILE="localhost+2.pem"
PROTOCOL="http"

if [ -f "$CERT_KEY" ] && [ -f "$CERT_FILE" ]; then
  PROTOCOL="https"
  echo "✅ SSL certificates found ($PROTOCOL mode)"
else
  echo "⚠️  SSL certificates not found. Running in HTTP mode."
  # Optional: logic to generate certs could go here, but kept simple for dev
fi

echo "-----------------------------------"

# --- Startup ---

# Kill ports first
kill_port $SERVER_PORT "Server"
kill_port $CLIENT_PORT "Client"

# Start Server
echo "📡 Starting server on port $SERVER_PORT..."
cd server
PORT=$SERVER_PORT node server.js 2>&1 | tee -a ../server.log &
SERVER_PID=$!
cd ..

# Wait for server to initialize
sleep 2

# Start Client
echo "🌐 Starting client on port $CLIENT_PORT..."
cd client
PORT=$CLIENT_PORT npm run dev 2>&1 | tee -a ../client.log &
CLIENT_PID=$!
echo $CLIENT_PID > ../client.pid # Also save PID for external tools
cd ..

echo "-----------------------------------"
echo "✅ Services Running!"
echo "   Server: $PROTOCOL://localhost:$SERVER_PORT (PID: $SERVER_PID)"
echo "   Client: $PROTOCOL://localhost:$CLIENT_PORT (PID: $CLIENT_PID)"
echo ""
echo "📝 Logs are streaming below. Press Ctrl+C to stop."
echo "-----------------------------------"
echo ""

# Wait indefinitely for background processes
wait
