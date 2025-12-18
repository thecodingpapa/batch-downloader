#!/bin/bash

# Check available formats for a YouTube video
# Usage: ./check-formats.sh "https://youtube.com/watch?v=..."

if [ -z "$1" ]; then
    echo "Usage: ./check-formats.sh <youtube-url>"
    exit 1
fi

URL="$1"

echo "Checking available formats for: $URL"
echo "================================================"
echo ""

# Determine the correct yt-dlp binary
if [ -f "./yt-dlp" ]; then
    YTDLP="./yt-dlp"
elif [ -f "./yt-dlp.exe" ]; then
    YTDLP="./yt-dlp.exe"
else
    echo "Error: yt-dlp binary not found in current directory"
    exit 1
fi

echo "Using yt-dlp binary: $YTDLP"
echo ""

# List all available formats
echo "All available formats:"
echo "----------------------"
$YTDLP -F "$URL"

echo ""
echo "================================================"
echo "Testing format selection used in server.js:"
echo "----------------------"
$YTDLP -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' --print "%(format_id)s - %(resolution)s - %(ext)s - %(vcodec)s/%(acodec)s" "$URL"

echo ""
echo "================================================"
echo "Testing with Android client (as used in server):"
echo "----------------------"
$YTDLP --extractor-args 'youtube:player_client=android' -F "$URL" | head -30
