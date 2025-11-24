#!/bin/bash
# Quick Server Update Script for EC2
# This script updates the server code on your EC2 instance

echo "🚀 Updating server on EC2..."

# Step 1: Create tarball of server directory
echo "📦 Creating tarball..."
cd /Users/wonjunyang/Documents/Playground/batch-downloader
tar -czf server.tar.gz server/

# Step 2: Copy to EC2
echo "📤 Uploading to EC2..."
scp -i ~/.ssh/batch-downloader.pem server.tar.gz ubuntu@3.142.232.252:~/

# Step 3: SSH and update
echo "🔧 Updating server on EC2..."
ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252 << 'EOF'
  # Extract files
  tar -xzf server.tar.gz
  cd server
  
  # Install/update dependencies (in case package.json changed)
  npm install
  
  # Check if PM2 process exists
  if pm2 describe batch-downloader > /dev/null 2>&1; then
    echo "♻️  Restarting existing process..."
    pm2 restart batch-downloader
  else
    echo "🆕 Starting new process..."
    pm2 start server.js --name "batch-downloader"
    pm2 save
  fi
  
  # Show status
  pm2 status
  
  echo "✅ Server updated successfully!"
EOF

echo "🎉 Deployment complete!"

