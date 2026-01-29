#!/bin/bash
# connect-git.sh

# Check for git
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

echo "🔗 Connecting to repository..."

# Init if needed
if [ ! -d ".git" ]; then
    git init
    git branch -m main
fi

# Add/Update remote
if git remote | grep -q origin; then
    git remote set-url origin https://github.com/thecodingpapa/batch-downloader.git
else
    git remote add origin https://github.com/thecodingpapa/batch-downloader.git
fi

echo "📥 Fetching latest updates..."
git fetch origin

echo ""
echo "✅ Repository connected!"
echo "   You can now use 'git status' to see differences."
echo "   To update to the latest version (WARNING: Overwrites changes):"
echo "   git reset --hard origin/main"
