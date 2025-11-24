# Installation Guide - Starting from Scratch

This guide assumes you have **nothing installed** on your computer and will walk you through the complete setup process.

---

## Table of Contents

1. [Automated Installation (Recommended)](#automated-installation-recommended)
2. [Manual Installation](#manual-installation)
3. [Verification](#verification)
4. [Troubleshooting](#troubleshooting)

---

## Automated Installation (Recommended)

The easiest way to get started is to use our installation script that handles everything automatically.

### Step 1: Get the Code

First, you need to download this project. If you have `git` installed:

```bash
git clone <repository-url>
cd batch-downloader
```

If you don't have `git`, download the project as a ZIP file and extract it.

### Step 2: Run the Installation Script

Make the script executable and run it:

```bash
chmod +x install-batch-downloader.sh
./install-batch-downloader.sh
```

### What the Script Does

The installation script will:

1. **Detect your operating system** (macOS, Linux, or Windows)
2. **Check for Node.js** - if not found, it will:
   - **macOS**: Install Homebrew (if needed), then install Node.js via Homebrew
   - **Linux**: Install Node.js via your system's package manager (apt/yum)
   - **Windows**: Provide instructions for manual installation
3. **Verify Node.js version** (requires v18 or higher)
4. **Install server dependencies** (Express, yt-dlp, etc.)
5. **Install client dependencies** (React, Vite, etc.)

### Interactive Prompts

If Node.js is not installed, you'll see:

```
⚠️  Node.js is not installed on your system.

Would you like to install Node.js now? (y/n):
```

Type `y` and press Enter to proceed with automatic installation.

---

## Manual Installation

If you prefer to install everything manually or the automated script doesn't work for your system:

### Step 1: Install Node.js and npm

#### macOS

**Option A: Using Homebrew (Recommended)**

1. Install Homebrew if you don't have it:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Install Node.js:
   ```bash
   brew install node
   ```

**Option B: Direct Download**

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the macOS installer (.pkg)
3. Run the installer and follow the prompts

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Linux (RedHat/CentOS/Fedora)

```bash
# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

#### Windows

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the Windows installer (.msi)
3. Run the installer
4. Check "Automatically install necessary tools" during installation
5. Restart your computer
6. Open Command Prompt or PowerShell and verify:
   ```cmd
   node --version
   npm --version
   ```

### Step 2: Install Project Dependencies

Once Node.js is installed, navigate to the project directory and install dependencies:

```bash
# Navigate to project directory
cd batch-downloader

# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

---

## Verification

After installation (automated or manual), verify everything is set up correctly:

### 1. Check Node.js and npm

```bash
node --version  # Should show v18.x or higher
npm --version   # Should show 9.x or higher
```

### 2. Check Project Dependencies

```bash
# Check server dependencies
cd server
npm list --depth=0

# Check client dependencies
cd ../client
npm list --depth=0
cd ..
```

### 3. Test Run the Application

```bash
# Start the application
./run-batch-downloader.sh

# You should see:
# ✅ Server started on port 3000 (PID: xxxxx)
# ✅ Client started on port 5174 (PID: xxxxx)
```

Open your browser to: **http://localhost:5174/**

If you see the application interface, congratulations! Everything is working.

### 4. Stop the Application

```bash
./stop-batch-downloader.sh
```

---

## Troubleshooting

### Issue: "command not found: node" after installation

**Solution:**

- **macOS/Linux**: Restart your terminal or run:
  ```bash
  source ~/.zshrc  # or ~/.bashrc
  ```

- **Windows**: Restart your computer

### Issue: "Permission denied" when running scripts

**Solution:**

Make the scripts executable:
```bash
chmod +x install-batch-downloader.sh
chmod +x run-batch-downloader.sh
chmod +x stop-batch-downloader.sh
chmod +x watch-logs.sh
```

### Issue: Node.js version is too old

**Solution:**

Update Node.js:

- **macOS (Homebrew)**:
  ```bash
  brew upgrade node
  ```

- **Linux**:
  ```bash
  # Ubuntu/Debian
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- **Windows**: Download and install the latest version from [nodejs.org](https://nodejs.org/)

### Issue: npm install fails with EACCES errors

**Solution:**

This usually means npm doesn't have permission to install global packages. Fix npm permissions:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc  # or ~/.bashrc
source ~/.zshrc  # or ~/.bashrc
```

### Issue: Homebrew installation fails on macOS

**Solution:**

1. Install Xcode Command Line Tools first:
   ```bash
   xcode-select --install
   ```

2. Try installing Homebrew again

### Issue: Port 3000 or 5174 already in use

**Solution:**

Find and kill the process using the port:

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:5174 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "Cannot find module" errors

**Solution:**

Delete `node_modules` and reinstall:

```bash
# In server directory
cd server
rm -rf node_modules package-lock.json
npm install

# In client directory
cd ../client
rm -rf node_modules package-lock.json
npm install
```

---

## System Requirements

### Minimum Requirements

- **OS**: macOS 10.15+, Ubuntu 18.04+, Windows 10+
- **RAM**: 4GB
- **Disk Space**: 500MB for Node.js + dependencies
- **Internet**: Required for initial installation

### Recommended Requirements

- **OS**: macOS 12+, Ubuntu 22.04+, Windows 11
- **RAM**: 8GB
- **Disk Space**: 1GB
- **Internet**: Broadband connection

---

## Next Steps

Once installation is complete:

1. **Start the application**: `./run-batch-downloader.sh`
2. **Read the usage guide**: See [README.md](README.md)
3. **Deploy to production**: See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [README.md](README.md) for basic usage
2. Check the [DEPLOYMENT.md](DEPLOYMENT.md) for production setup
3. Review the logs: `./watch-logs.sh`
4. Open an issue on GitHub with:
   - Your operating system and version
   - Node.js version (`node --version`)
   - Error messages from the terminal
   - Contents of `server.log` and `client.log`
