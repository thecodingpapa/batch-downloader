# Batch Downloader

A web application to batch download YouTube video clips with custom start and end times.

## Prerequisites

- Node.js (v20.19+ or v22.12+ recommended)
- npm

## Installation

1. Clone this repository
2. Run the installation script:

```bash
./install-batch-downloader.sh
```

This will install all dependencies for both the client and server.

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
