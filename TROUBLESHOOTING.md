# Troubleshooting Guide

## Client Not Starting

If the client fails to start when running `./run-batch-downloader.sh`, follow these steps:

### 0. Run the Diagnostic Script (Recommended First Step)

Before diving into logs, run the diagnostic script to get a complete overview:

```bash
chmod +x diagnose.sh
./diagnose.sh
```

This will check:
- Node.js and npm installation
- Project structure
- Dependencies (node_modules)
- SSL certificates
- Port availability
- Running processes
- Recent log entries

The script will tell you exactly what's wrong and what to do.

### 1. Check the Client Logs

```bash
tail -f client.log
```

This will show you the actual error message from the client startup process.

### 2. Common Issues and Solutions

#### Issue: Node.js Version Too Old

**Symptoms:**
- Error message: "Vite requires Node.js version 20.19+ or 22.12+"
- Error: `TypeError: crypto.hash is not a function`
- Client fails to start with vite errors

**Root Cause:**
Your Node.js version is too old. Vite (the build tool used by the client) requires Node.js 20.19+ or 22.12+.

**Solution:**

1. **Check your current Node.js version:**
   ```bash
   node --version
   ```

2. **Upgrade Node.js:**

   **macOS (using Homebrew):**
   ```bash
   brew upgrade node
   ```

   **macOS (manual download):**
   - Visit https://nodejs.org/
   - Download the LTS version (20.x or higher)
   - Run the installer

   **Linux (Ubuntu/Debian):**
   ```bash
   # Remove old version
   sudo apt-get remove nodejs
   
   # Install Node.js 20.x
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

   **Windows:**
   - Visit https://nodejs.org/
   - Download the Windows installer
   - Run the installer

3. **Verify the new version:**
   ```bash
   node --version
   # Should show v20.19.0 or higher, or v22.12.0 or higher
   ```

4. **Reinstall dependencies with the new Node.js version:**
   ```bash
   ./install-batch-downloader.sh
   ```

5. **Start the application:**
   ```bash
   ./run-batch-downloader.sh
   ```

#### Issue: "vite: command not found" or "command not found" errors

**Symptoms:**
- Client log shows: `sh: vite: command not found`
- Error when running `npm run dev`
- Client fails to start immediately

**Root Cause:**
Dependencies were not installed properly. The `node_modules` directory is missing or incomplete.

**Solution:**

1. **Run the installation script:**
   ```bash
   ./install-batch-downloader.sh
   ```

2. **If that fails, manually install client dependencies:**
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   cd ..
   ```

3. **Verify vite is installed:**
   ```bash
   ls -la client/node_modules/.bin/vite
   ```
   
   If this file doesn't exist, the installation failed.

4. **Check for npm errors:**
   - Make sure you have a stable internet connection
   - Try clearing npm cache: `npm cache clean --force`
   - Update npm: `npm install -g npm@latest`

5. **Restart the application:**
   ```bash
   ./run-batch-downloader.sh
   ```

#### Issue: SSL Certificate Error

**Symptoms:**
- Client log shows errors about missing certificate files
- Errors mentioning `localhost+2-key.pem` or `localhost+2.pem`

**Solution:**
The application has been updated to run without HTTPS if certificates are missing. However, if you want HTTPS:

1. Install `mkcert`:
   ```bash
   # macOS
   brew install mkcert
   
   # Linux
   # See: https://github.com/FiloSottile/mkcert#installation
   ```

2. Generate certificates manually:
   ```bash
   mkcert -install
   mkcert localhost 127.0.0.1 ::1
   ```

3. Restart the application:
   ```bash
   ./stop-batch-downloader.sh
   ./run-batch-downloader.sh
   ```

#### Issue: Port Already in Use

**Symptoms:**
- Error message: "EADDRINUSE: address already in use :::5174"

**Solution:**
The `run-batch-downloader.sh` script should automatically kill processes on ports 3000 and 5174. If it doesn't work:

```bash
# Find and kill the process manually
lsof -ti :5174 | xargs kill -9
lsof -ti :3000 | xargs kill -9

# Then restart
./run-batch-downloader.sh
```

#### Issue: Node Modules Missing

**Symptoms:**
- Error about missing modules or packages
- "Cannot find module" errors

**Solution:**
Reinstall dependencies:

```bash
cd client
npm install
cd ..
./run-batch-downloader.sh
```

#### Issue: Node.js Version Incompatibility

**Symptoms:**
- Syntax errors in client code
- Errors about unsupported features

**Solution:**
Ensure you have Node.js v18 or higher:

```bash
node --version
```

If your version is older, update Node.js:
```bash
# macOS
brew upgrade node

# Or download from https://nodejs.org/
```

### 3. Verify Client is Running

After starting, check if the client process is actually running:

```bash
# Check if the PID file exists
cat client.pid

# Check if the process is running
ps -p $(cat client.pid)
```

### 4. Manual Client Startup (for debugging)

If the automated script fails, try starting the client manually to see detailed errors:

```bash
cd client
PORT=5174 npm run dev
```

This will show you real-time output and any errors that occur.

### 5. Check Network Access

Once the client is running, verify you can access it:

```bash
# Check if the port is listening
lsof -i :5174

# Try accessing via curl
curl http://localhost:5174
# or if HTTPS is enabled:
curl -k https://localhost:5174
```

### 6. Browser Access

Open your browser and navigate to:
- **HTTP mode**: http://localhost:5174
- **HTTPS mode**: https://localhost:5174

If using HTTPS and you see a security warning, this is normal for self-signed certificates. Click "Advanced" and "Proceed to localhost".

## Server Issues

If the server starts but the client can't connect to it:

### Check Server Logs

```bash
tail -f server.log
```

### Verify Server is Running

```bash
# Check server process
ps -p $(cat server.pid)

# Check server port
lsof -i :3000

# Test server endpoint
curl https://localhost:3000
```

## Complete Reset

If nothing works, try a complete reset:

```bash
# Stop everything
./stop-batch-downloader.sh

# Kill any lingering processes
lsof -ti :3000 | xargs kill -9
lsof -ti :5174 | xargs kill -9

# Clean up
rm -f *.pid *.log

# Reinstall dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Restart
./run-batch-downloader.sh
```

## Getting Help

If you're still experiencing issues:

1. Check the client and server logs:
   ```bash
   cat client.log
   cat server.log
   ```

2. Verify your environment:
   ```bash
   node --version
   npm --version
   pwd  # Make sure you're in the project root
   ls -la  # Verify all files are present
   ```

3. Create an issue on GitHub with:
   - Your operating system
   - Node.js version
   - Complete error messages from logs
   - Output of `./run-batch-downloader.sh`
