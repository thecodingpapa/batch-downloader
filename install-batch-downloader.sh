#!/bin/bash

set -e  # Exit on error

echo "� Batch Downloader - Complete Installation Script"
echo "=================================================="
echo ""

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo "🖥️  Detected OS: $OS"
echo ""

# Function to install Node.js on macOS
install_node_mac() {
    echo "📥 Installing Node.js on macOS..."
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo "📦 Homebrew not found. Installing Homebrew first..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ $(uname -m) == 'arm64' ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    fi
    
    echo "�📦 Installing Node.js via Homebrew..."
    brew install node
    echo "✅ Node.js installed successfully"
}

# Function to install Node.js on Linux
install_node_linux() {
    echo "📥 Installing Node.js on Linux..."
    
    # Detect Linux distribution
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        echo "📦 Detected Debian/Ubuntu. Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        # RedHat/CentOS/Fedora
        echo "📦 Detected RedHat/CentOS/Fedora. Installing Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo "❌ Unsupported Linux distribution"
        echo "   Please install Node.js manually from: https://nodejs.org/"
        exit 1
    fi
    
    echo "✅ Node.js installed successfully"
}

# Function to install Node.js on Windows (Git Bash/WSL)
install_node_windows() {
    echo "❌ Automated Node.js installation on Windows is not supported by this script."
    echo ""
    echo "📝 Please install Node.js manually:"
    echo "   1. Visit: https://nodejs.org/"
    echo "   2. Download the Windows installer (.msi)"
    echo "   3. Run the installer and follow the prompts"
    echo "   4. Restart your terminal"
    echo "   5. Run this script again"
    echo ""
    exit 1
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js is not installed on your system."
    echo ""
    read -p "Would you like to install Node.js now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        case $OS in
            mac)
                install_node_mac
                ;;
            linux)
                install_node_linux
                ;;
            windows)
                install_node_windows
                ;;
            *)
                echo "❌ Unsupported operating system"
                echo "   Please install Node.js manually from: https://nodejs.org/"
                exit 1
                ;;
        esac
    else
        echo "❌ Node.js is required to run this application."
        echo "   Please install Node.js from: https://nodejs.org/"
        exit 1
    fi
else
    echo "✅ Node.js is already installed"
fi

# Verify Node.js and npm installation
echo ""
echo "🔍 Verifying installation..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo "   Node.js version: $NODE_VERSION"
echo "   npm version: $NPM_VERSION"
echo ""

# Check Node.js version (require v18 or higher)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected."
    echo "   This application requires Node.js v18 or higher."
    echo "   Please update Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version is compatible"
echo ""

# Install server dependencies
echo "📡 Installing server dependencies..."
if [ ! -d "server" ]; then
    echo "❌ server/ directory not found!"
    echo "   Please run this script from the project root directory."
    exit 1
fi

cd server
if [ ! -f "package.json" ]; then
    echo "❌ server/package.json not found!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install server dependencies"
    exit 1
fi
echo "✅ Server dependencies installed"
cd ..

echo ""

# Install client dependencies
echo "🌐 Installing client dependencies..."
if [ ! -d "client" ]; then
    echo "❌ client/ directory not found!"
    echo "   Please run this script from the project root directory."
    exit 1
fi

cd client
if [ ! -f "package.json" ]; then
    echo "❌ client/package.json not found!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install client dependencies"
    exit 1
fi
echo "✅ Client dependencies installed"
cd ..

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start the application:"
echo "      ./run-batch-downloader.sh"
echo ""
echo "   2. Open your browser to:"
echo "      http://localhost:5174/"
echo ""
echo "   3. When finished, stop the application:"
echo "      ./stop-batch-downloader.sh"
echo ""
echo "💡 Tip: View logs with:"
echo "   ./watch-logs.sh"
echo ""
