# Define ports
SERVER_PORT=3000
CLIENT_PORT=5174

# Function to kill process on a specific port
kill_port() {
  local port=$1
  local name=$2
  echo "🔍 Checking for existing $name on port $port..."
  
  # Find PID using lsof
  local pid=$(lsof -ti :$port)
  
  if [ -n "$pid" ]; then
    echo "⚠️  Found process $pid on port $port. Killing it..."
    kill -9 $pid
    echo "✅ Process $pid killed."
  else
    echo "✅ No existing process found on port $port."
  fi
}

echo "🚀 Starting Batch Downloader..."

# Kill existing processes
kill_port $SERVER_PORT "Server"
kill_port $CLIENT_PORT "Client"

echo "-----------------------------------"

# Start server in background
echo "📡 Starting server on port $SERVER_PORT..."
cd server
PORT=$SERVER_PORT node server.js > ../server.log 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > ../server.pid
cd ..

# Wait a moment for server to start
sleep 2

# Start client in background
echo "🌐 Starting client on port $CLIENT_PORT..."
cd client
PORT=$CLIENT_PORT npm run dev > ../client.log 2>&1 &
CLIENT_PID=$!
echo $CLIENT_PID > ../client.pid
cd ..

echo ""
echo "✅ Batch Downloader is running!"
echo "   Server: http://localhost:$SERVER_PORT (PID: $SERVER_PID)"
echo "   Client: http://localhost:$CLIENT_PORT (PID: $CLIENT_PID)"
echo ""
echo "📝 Logs:"
echo "   Server: tail -f server.log"
echo "   Client: tail -f client.log"
echo ""
echo "🛑 To stop: ./stop-batch-downloader.sh"
