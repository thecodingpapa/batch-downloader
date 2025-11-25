# Batch Downloader

A web application to batch download YouTube video clips with custom start and end times.

## Demo Video

<iframe src="https://drive.google.com/file/d/18QV4DFb65qqbL0YDA053ag-gYMAP58ed/preview" width="640" height="480" allow="autoplay"></iframe>


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
- Installs Node.js and npm if not already installed
  - **macOS**: Installs via Homebrew (installs Homebrew first if needed)
  - **Linux**: Installs via package manager (apt/yum)
  - **Windows**: Provides manual installation instructions
- Installs all client and server dependencies
- Verifies everything is set up correctly

> **Note**: On macOS, if Homebrew is not installed, you'll be prompted to install it first. On Windows, you'll need to manually download and install Node.js from [nodejs.org](https://nodejs.org/).

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

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.
