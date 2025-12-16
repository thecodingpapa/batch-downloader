# Batch Downloader

A web application to batch download YouTube video clips with custom start and end times.

## Demo Video

<iframe src="https://drive.google.com/file/d/18QV4DFb65qqbL0YDA053ag-gYMAP58ed/preview" width="640" height="480" allow="autoplay"></iframe>

## Requirements

**Node.js Version:** 20.19+ or 22.12+

> ⚠️ **Important:** This application uses Vite, which requires Node.js 20.19+ or 22.12+. If you have an older version (like 18.x), you **must** upgrade Node.js first.

Check your version:
```bash
node --version
```

If you need to upgrade, see the [Troubleshooting Guide](TROUBLESHOOTING.md#issue-nodejs-version-too-old).

> **Tip:** After upgrading Node.js, you can run `./check-node-version.sh` to verify the new version is active in your terminal.

## Quick Start (No Prerequisites Required!)

The installation script will automatically install Node.js and all dependencies if they're not already on your system.

### 1. Download the project

1. Download the ZIP file: [batch-downloader-main.zip](https://github.com/thecodingpapa/batch-downloader/archive/refs/heads/main.zip)
2. Extract the ZIP file
3. **Open Terminal**:
   - Press `Command + Space` to open Spotlight Search.
   - Type `Terminal` and press `Enter`.

4. **Navigate to the project folder**:
   - In the Terminal window, type `cd` followed by a space (don't press Enter yet).
   - **Drag and drop** the extracted `batch-downloader-main` folder from Finder into the Terminal window.
   - It should look something like: `cd /Users/yourname/Downloads/batch-downloader-main`
   - Press `Enter`.

### 2. Run the installation script

```bash
chmod +x install-batch-downloader.sh
./install-batch-downloader.sh
```

**What this script does:**
- Detects your operating system (macOS, Linux, or Windows)
- Checks Node.js version compatibility (requires 20.19+ or 22.12+)
- **Automatically offers to upgrade Node.js if needed (macOS with Homebrew)**
- **Automatically fixes Homebrew permission/symlink issues**
- Installs Node.js and npm if not already installed
  - **macOS**: Installs via Homebrew (installs Homebrew first if needed)
  - **Linux**: Installs via package manager (apt/yum)
  - **Windows**: Provides manual installation instructions
- Installs all client and server dependencies
- Verifies everything is set up correctly

> **Note**: On macOS with Homebrew, the script can automatically upgrade Node.js and fix common permission issues for you. On other platforms, you'll need to upgrade manually if your version is too old.

### 3. Generate SSL Certificate for HTTPS (Optional)

If you need to run the client app with HTTPS (for localhost development), generate a local SSL certificate:

```bash
openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost-cert.pem -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" && sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain localhost-cert.pem && echo "✅ Certificate created and trusted!"
```

**What this does:**
- Generates a self-signed SSL certificate valid for 365 days
- Creates `localhost-cert.pem` (certificate) and `localhost-key.pem` (private key)
- Automatically trusts the certificate in your macOS Keychain

> **Note**: You'll be prompted for your password to add the certificate to the system keychain. This is normal and required to trust the certificate.

> **Note**: This step is optional and only needed if your application requires HTTPS. The application will work fine with HTTP for local development.

## Usage

### Start the application

```bash
./run-batch-downloader.sh
```

This will start:
- Server on `http://localhost:3000`
- Client on `http://localhost:5174`

### Access the application

Open your browser to: **http://localhost:5174/**

### Stop the application

```bash
./stop-batch-downloader.sh
```

## Features

- Drag and drop text file with YouTube URLs and timestamps
- Select multiple clips to download
- Batch download functionality
- Cookie support for authentication (server-side)

## Logs

View real-time logs:

```bash
tail -f server.log  # Server logs
tail -f client.log  # Client logs
```

## Troubleshooting

If you encounter issues (especially with the client not starting), **first run the diagnostic script:**

```bash
./diagnose.sh
```

This will check your setup and identify any problems.

For detailed solutions, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

**Common issues:**
- Client not starting → Check `client.log` for errors
- SSL certificate errors → Application will run in HTTP mode automatically
- Port conflicts → Script automatically kills existing processes
- "vite: command not found" → Run `./install-batch-downloader.sh`
- **Node.js version still old after upgrade** → Run `./fix-node-path.sh`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.
