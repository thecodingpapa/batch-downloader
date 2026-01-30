#!/bin/bash
# connect-git.sh

# Check for git
if ! command -v git &> /dev/null; then
    echo "⚠️  Git is not installed."
    echo "   Attempting to install git..."
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            echo "📦 Installing git via Homebrew..."
            brew install git
        else
            echo "📦 Homebrew not found. Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            
            # Add Homebrew to PATH for Apple Silicon Macs
            if [[ $(uname -m) == 'arm64' ]]; then
                echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
                eval "$(/opt/homebrew/bin/brew shellenv)"
            fi
            
            brew install git
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if [ -f /etc/debian_version ]; then
            # Debian/Ubuntu
            echo "📦 Detected Debian/Ubuntu. Installing git..."
            sudo apt-get update && sudo apt-get install -y git
        elif [ -f /etc/redhat-release ]; then
            # RedHat/CentOS/Fedora
            echo "📦 Detected RedHat/CentOS/Fedora. Installing git..."
            sudo yum install -y git
        else
            echo "❌ Unsupported Linux distribution."
            echo "   Please install git manually."
            exit 1
        fi
    else
        echo "❌ Automated git installation is not supported on this OS."
        echo "   Please install git manually."
        exit 1
    fi
    
    # Verify installation
    if ! command -v git &> /dev/null; then
        echo "❌ Git installation failed."
        exit 1
    else
        echo "✅ Git installed successfully!"
    fi
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

echo "📥 Fetching latest updates from main..."
git fetch origin

echo "🔄 Updating local files to match remote main branch..."
# Using reset --hard to force legacy/zip files to match the git repository
# This resolves "unrelated histories" and "untracked files" flags
git reset --hard origin/main

# Set upstream so 'git pull' works in the future
git branch --set-upstream-to=origin/main main

echo ""
echo "✅ Update Complete!"
echo "   Your application is now synced with the latest version."
echo "   You can now run './run-batch-downloader.sh' to start."
