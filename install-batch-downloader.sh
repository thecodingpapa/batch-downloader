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

# Check Node.js version (require v20.19+ or v22.12+)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
NODE_MINOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f2)

echo "🔍 Checking Node.js version compatibility..."

VERSION_OK=false

if [ "$NODE_MAJOR_VERSION" -gt 22 ]; then
    VERSION_OK=true
elif [ "$NODE_MAJOR_VERSION" -eq 22 ] && [ "$NODE_MINOR_VERSION" -ge 12 ]; then
    VERSION_OK=true
elif [ "$NODE_MAJOR_VERSION" -eq 20 ] && [ "$NODE_MINOR_VERSION" -ge 19 ]; then
    VERSION_OK=true
fi

if [ "$VERSION_OK" = false ]; then
    echo ""
    echo "⚠️  Node.js version $NODE_VERSION is not compatible"
    echo ""
    echo "   Vite requires Node.js version 20.19+ or 22.12+"
    echo "   Your version: $NODE_VERSION"
    echo ""
    
    # Offer to upgrade automatically
    if [[ "$OS" == "mac" ]]; then
        if command -v brew &> /dev/null; then
            echo "Would you like to upgrade Node.js now using Homebrew?"
            read -p "Upgrade Node.js? (y/n): " -n 1 -r
            echo ""
            
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo ""
                echo "📦 Upgrading Node.js via Homebrew..."
                brew upgrade node
                
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "✅ Node.js upgraded successfully!"
                    echo ""
                    
                    # Clear the command hash table to use the new node binary
                    hash -r
                    
                    # Try to reload shell environment
                    if [[ $(uname -m) == 'arm64' ]]; then
                        # Apple Silicon Mac
                        export PATH="/opt/homebrew/bin:$PATH"
                        BREW_NODE="/opt/homebrew/bin/node"
                    else
                        # Intel Mac
                        export PATH="/usr/local/bin:$PATH"
                        BREW_NODE="/usr/local/bin/node"
                    fi
                    
                    # Verify new version - try multiple methods
                    NEW_NODE_VERSION=$(node --version 2>/dev/null)
                    
                    # If node command still shows old version, try explicit Homebrew path
                    if [ -z "$NEW_NODE_VERSION" ] || [[ "$NEW_NODE_VERSION" == "$NODE_VERSION" ]]; then
                        if [ -f "$BREW_NODE" ]; then
                            NEW_NODE_VERSION=$($BREW_NODE --version 2>/dev/null)
                            # Update PATH to prioritize Homebrew node
                            export PATH="$(dirname $BREW_NODE):$PATH"
                            hash -r
                        fi
                    fi
                    
                    if [ -z "$NEW_NODE_VERSION" ]; then
                        echo "⚠️  Warning: Cannot detect new Node.js version in current shell"
                        echo ""
                        echo "   The upgrade completed, but your current terminal session"
                        echo "   is still using the old Node.js version."
                        echo ""
                        echo "   Please close this terminal and open a new one, then run:"
                        echo "   ./install-batch-downloader.sh"
                        echo ""
                        exit 1
                    fi
                    
                    # Check if we're still seeing the old version
                    if [[ "$NEW_NODE_VERSION" == "$NODE_VERSION" ]]; then
                        echo "⚠️  Warning: Terminal is still using old Node.js version"
                        echo ""
                        echo "   Homebrew upgrade completed, but your current terminal"
                        echo "   session needs to be restarted to use the new version."
                        echo ""
                        echo "   Please close this terminal and open a new one, then run:"
                        echo "   ./install-batch-downloader.sh"
                        echo ""
                        exit 1
                    fi
                    
                    echo "   New version: $NEW_NODE_VERSION"
                    echo ""
                    
                    # Re-check version
                    NODE_MAJOR_VERSION=$(echo $NEW_NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
                    NODE_MINOR_VERSION=$(echo $NEW_NODE_VERSION | cut -d'.' -f2)
                    
                    VERSION_OK=false
                    if [ "$NODE_MAJOR_VERSION" -gt 22 ]; then
                        VERSION_OK=true
                    elif [ "$NODE_MAJOR_VERSION" -eq 22 ] && [ "$NODE_MINOR_VERSION" -ge 12 ]; then
                        VERSION_OK=true
                    elif [ "$NODE_MAJOR_VERSION" -eq 20 ] && [ "$NODE_MINOR_VERSION" -ge 19 ]; then
                        VERSION_OK=true
                    fi
                    
                    if [ "$VERSION_OK" = false ]; then
                        echo "⚠️  Warning: Upgraded version $NEW_NODE_VERSION is still not compatible"
                        echo "   Please install Node.js 20.19+ or 22.12+ manually from:"
                        echo "   https://nodejs.org/"
                        echo ""
                        echo "   After installing, close this terminal, open a new one, and run:"
                        echo "   ./install-batch-downloader.sh"
                        exit 1
                    fi
                else
                    echo ""
                    echo "❌ Failed to upgrade Node.js via Homebrew"
                    echo "   Please upgrade manually from: https://nodejs.org/"
                    exit 1
                fi
            else
                echo ""
                echo "❌ Node.js upgrade declined."
                echo "   Please upgrade Node.js manually and run this script again."
                echo ""
                echo "   Download from: https://nodejs.org/"
                exit 1
            fi
        else
            echo "   Homebrew not found. Please upgrade Node.js manually:"
            echo ""
            echo "   Option 1 - Install Homebrew first, then upgrade:"
            echo "      /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            echo "      brew install node"
            echo ""
            echo "   Option 2 - Download from official website:"
            echo "      https://nodejs.org/"
            echo ""
            exit 1
        fi
    elif [[ "$OS" == "linux" ]]; then
        echo "   To upgrade Node.js on Linux:"
        echo ""
        if [ -f /etc/debian_version ]; then
            echo "   For Debian/Ubuntu:"
            echo "      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
            echo "      sudo apt-get install -y nodejs"
        elif [ -f /etc/redhat-release ]; then
            echo "   For RedHat/CentOS/Fedora:"
            echo "      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -"
            echo "      sudo yum install -y nodejs"
        else
            echo "   Download from: https://nodejs.org/"
        fi
        echo ""
        echo "   After upgrading, run this script again."
        exit 1
    else
        echo "   Please download and install Node.js 20.19+ or 22.12+ from:"
        echo "   https://nodejs.org/"
        echo ""
        echo "   After installing, run this script again."
        exit 1
    fi
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

# Verify node_modules was created
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules directory was not created"
    echo "   npm install may have failed silently"
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

# Verify node_modules was created
if [ ! -d "node_modules" ]; then
    echo "❌ Error: node_modules directory was not created"
    echo "   npm install may have failed silently"
    exit 1
fi

# Verify vite is installed (critical for client)
if [ ! -f "node_modules/.bin/vite" ]; then
    echo "❌ Error: vite was not installed properly"
    echo "   This is required to run the client"
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
