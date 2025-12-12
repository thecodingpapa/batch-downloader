#!/bin/bash

# Script to diagnose and fix Node.js PATH issues
# Run this if your terminal keeps using the old Node.js version

echo "🔧 Node.js PATH Diagnostic & Fix Tool"
echo "======================================"
echo ""

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
else
    OS="other"
fi

# Check current Node.js
echo "1️⃣  Current Node.js Configuration"
echo "-----------------------------------"

if command -v node &> /dev/null; then
    CURRENT_VERSION=$(node --version)
    CURRENT_PATH=$(which node)
    echo "   Version: $CURRENT_VERSION"
    echo "   Location: $CURRENT_PATH"
else
    echo "   ❌ Node.js not found in PATH"
fi
echo ""

# Check for Homebrew Node.js (macOS only)
if [[ "$OS" == "mac" ]]; then
    echo "2️⃣  Homebrew Node.js"
    echo "-----------------------------------"
    
    if [[ $(uname -m) == 'arm64' ]]; then
        BREW_PREFIX="/opt/homebrew"
    else
        BREW_PREFIX="/usr/local"
    fi
    
    BREW_NODE="$BREW_PREFIX/bin/node"
    
    if [ -f "$BREW_NODE" ]; then
        BREW_VERSION=$($BREW_NODE --version)
        echo "   ✅ Found: $BREW_VERSION"
        echo "   Location: $BREW_NODE"
    else
        echo "   ❌ Not found at $BREW_NODE"
    fi
    echo ""
fi

# Check for nvm
echo "3️⃣  Node Version Manager (nvm)"
echo "-----------------------------------"
if [ -d "$HOME/.nvm" ]; then
    echo "   ⚠️  nvm is installed at $HOME/.nvm"
    echo "   This may override Homebrew's Node.js"
    NVM_DETECTED=true
else
    echo "   ✅ nvm not detected"
    NVM_DETECTED=false
fi
echo ""

# Check PATH
echo "4️⃣  Current PATH"
echo "-----------------------------------"
echo "$PATH" | tr ':' '\n' | nl
echo ""

# Check shell config files
echo "5️⃣  Shell Configuration Files"
echo "-----------------------------------"

SHELL_CONFIGS=(
    "$HOME/.zshrc"
    "$HOME/.zprofile"
    "$HOME/.bash_profile"
    "$HOME/.bashrc"
    "$HOME/.profile"
)

for config in "${SHELL_CONFIGS[@]}"; do
    if [ -f "$config" ]; then
        echo "   📄 $config"
        
        # Check for nvm
        if grep -q "nvm" "$config" 2>/dev/null; then
            echo "      ⚠️  Contains nvm configuration"
        fi
        
        # Check for node paths
        if grep -q "node" "$config" 2>/dev/null; then
            echo "      ℹ️  Contains node references"
        fi
    fi
done
echo ""

# Diagnosis
echo "======================================"
echo "📋 Diagnosis"
echo "======================================"
echo ""

ISSUES=0

if [[ "$OS" == "mac" ]] && [ -f "$BREW_NODE" ]; then
    if [[ "$CURRENT_PATH" != "$BREW_NODE" ]]; then
        echo "❌ Issue: Terminal is not using Homebrew's Node.js"
        echo "   Current: $CURRENT_PATH ($CURRENT_VERSION)"
        echo "   Homebrew: $BREW_NODE ($BREW_VERSION)"
        ISSUES=$((ISSUES + 1))
    fi
fi

if [ "$NVM_DETECTED" = true ]; then
    echo "⚠️  Issue: nvm is installed and may conflict with Homebrew"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ No PATH issues detected"
    echo ""
    
    # Check version compatibility
    if command -v node &> /dev/null; then
        NODE_MAJOR=$(echo $CURRENT_VERSION | cut -d'.' -f1 | sed 's/v//')
        NODE_MINOR=$(echo $CURRENT_VERSION | cut -d'.' -f2)
        
        VERSION_OK=false
        if [ "$NODE_MAJOR" -gt 22 ]; then
            VERSION_OK=true
        elif [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -ge 12 ]; then
            VERSION_OK=true
        elif [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -ge 19 ]; then
            VERSION_OK=true
        fi
        
        if [ "$VERSION_OK" = true ]; then
            echo "✅ Node.js version is compatible with Vite"
            echo ""
            echo "You can now run:"
            echo "   ./install-batch-downloader.sh"
        else
            echo "❌ Node.js version $CURRENT_VERSION is too old"
            echo "   Required: 20.19+ or 22.12+"
        fi
    fi
else
    echo ""
    echo "======================================"
    echo "🔧 Recommended Fixes"
    echo "======================================"
    echo ""
    
    if [[ "$OS" == "mac" ]] && [ -f "$BREW_NODE" ] && [[ "$CURRENT_PATH" != "$BREW_NODE" ]]; then
        echo "Fix 1: Update your shell configuration to use Homebrew's Node.js"
        echo ""
        
        # Detect current shell
        CURRENT_SHELL=$(basename "$SHELL")
        
        if [[ "$CURRENT_SHELL" == "zsh" ]]; then
            CONFIG_FILE="$HOME/.zshrc"
        else
            CONFIG_FILE="$HOME/.bash_profile"
        fi
        
        echo "Add this to $CONFIG_FILE:"
        echo ""
        echo "   # Use Homebrew's Node.js"
        echo "   export PATH=\"$BREW_PREFIX/bin:\$PATH\""
        echo ""
        echo "Then run:"
        echo "   source $CONFIG_FILE"
        echo ""
        
        read -p "Would you like me to add this automatically? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Backup config file
            cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
            
            # Add Homebrew path if not already present
            if ! grep -q "export PATH=\"$BREW_PREFIX/bin:\$PATH\"" "$CONFIG_FILE" 2>/dev/null; then
                echo "" >> "$CONFIG_FILE"
                echo "# Use Homebrew's Node.js (added by fix-node-path.sh)" >> "$CONFIG_FILE"
                echo "export PATH=\"$BREW_PREFIX/bin:\$PATH\"" >> "$CONFIG_FILE"
                
                echo "✅ Updated $CONFIG_FILE"
                echo "   Backup saved to: $CONFIG_FILE.backup.*"
                echo ""
                echo "Now run:"
                echo "   source $CONFIG_FILE"
                echo "   node --version"
                echo ""
                echo "Or close this terminal and open a new one."
            else
                echo "ℹ️  PATH already configured in $CONFIG_FILE"
            fi
        fi
    fi
    
    if [ "$NVM_DETECTED" = true ]; then
        echo ""
        echo "Fix 2: nvm Conflict"
        echo ""
        echo "You have nvm installed. To use Homebrew's Node.js instead:"
        echo ""
        echo "Option A: Uninstall nvm (if you don't need it)"
        echo "   1. Remove nvm lines from $CONFIG_FILE"
        echo "   2. rm -rf ~/.nvm"
        echo "   3. Close terminal and open a new one"
        echo ""
        echo "Option B: Use nvm to install Node.js 20+"
        echo "   nvm install 20"
        echo "   nvm use 20"
        echo "   nvm alias default 20"
        echo ""
    fi
fi

echo ""
