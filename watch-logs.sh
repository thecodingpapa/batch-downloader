#!/bin/bash

# Quick script to clear logs and monitor in real-time
# Run this before testing a download

EC2_IP="3.142.232.252"
KEY_PATH="$HOME/.ssh/batch-downloader.pem"

echo "🧹 Clearing old logs..."
ssh -i "$KEY_PATH" ubuntu@$EC2_IP "pm2 flush batch-downloader"

echo "✅ Logs cleared!"
echo ""
echo "👀 Now monitoring logs in real-time..."
echo "   Try downloading a clip from your web app"
echo "   Press Ctrl+C to exit"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ssh -i "$KEY_PATH" ubuntu@$EC2_IP "pm2 logs batch-downloader"
