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

# Check for SSL certificates
CERT_KEY="localhost+2-key.pem"
CERT_FILE="localhost+2.pem"

if [ ! -f "$CERT_KEY" ] || [ ! -f "$CERT_FILE" ]; then
  echo ""
  echo "🔐 SSL certificates not found. Setting up HTTPS..."
  
  # Check if mkcert is installed
  if ! command -v mkcert &> /dev/null; then
    echo "📦 mkcert not found. Attempting to install..."
    if command -v brew &> /dev/null; then
      brew install mkcert
      if [ $? -ne 0 ]; then
        echo "⚠️  Warning: Failed to install mkcert via Homebrew"
        echo "   The application will run without HTTPS (HTTP only)"
        echo ""
      fi
    else
      echo "⚠️  Warning: Homebrew not found. Cannot auto-install mkcert."
      echo "   The application will run without HTTPS (HTTP only)"
      echo "   To enable HTTPS later, install mkcert from: https://github.com/FiloSottile/mkcert"
      echo ""
    fi
  fi
  
  # Try to generate certificates if mkcert is available
  if command -v mkcert &> /dev/null; then
    # Install local CA
    echo "🔑 Installing local Certificate Authority..."
    mkcert -install
    
    # Generate certificates
    echo "📜 Generating SSL certificates..."
    mkcert localhost 127.0.0.1 ::1
    
    # Verify certificates were created
    if [ -f "$CERT_KEY" ] && [ -f "$CERT_FILE" ]; then
      echo "✅ SSL certificates created successfully!"
      echo ""
    else
      echo "⚠️  Warning: SSL certificate generation may have failed"
      echo "   The application will run without HTTPS (HTTP only)"
      echo ""
    fi
  fi
else
  echo "✅ SSL certificates found"
  echo ""
fi

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

# Determine protocol based on certificate availability
PROTOCOL="http"
if [ -f "$CERT_KEY" ] && [ -f "$CERT_FILE" ]; then
  PROTOCOL="https"
fi

echo ""
echo "✅ Batch Downloader is running!"
echo "   Server: https://localhost:$SERVER_PORT (PID: $SERVER_PID)"
echo "   Client: $PROTOCOL://localhost:$CLIENT_PORT (PID: $CLIENT_PID)"
echo ""
echo "📝 Logs:"
echo "   Server: tail -f server.log"
echo "   Client: tail -f client.log"
echo ""
echo "🛑 To stop: ./stop-batch-downloader.sh"
