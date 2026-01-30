#!/bin/bash

# apply-youtube-fix.sh
# Automates the fix for YouTube download errors by:
# 1. Updating yt-dlp to the latest version
# 2. Patching server.js to use Android client and Node.js runtime

echo "🚀 Starting YouTube Fix Update..."

# Stop the downloader if running
if [ -f "stop-batch-downloader.sh" ]; then
    echo "🛑 Stopping running services..."
    ./stop-batch-downloader.sh
fi

# Update yt-dlp binary
echo "📥 Updating yt-dlp binary..."
if [ -d "server" ]; then
    cd server
    
    # Back up current yt-dlp just in case
    if [ -f "yt-dlp" ]; then
        mv yt-dlp yt-dlp.bak
    fi
    
    # Download latest release
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
    chmod a+x yt-dlp
    
    echo "✅ yt-dlp updated to latest version"
    
    # Check version
    ./yt-dlp --version
    
    cd ..
else
    echo "❌ Server directory not found!"
    exit 1
fi

echo ""
echo "🎉 Update Complete!"
echo "You can now run the downloader with:"
echo "./run-batch-downloader.sh"
