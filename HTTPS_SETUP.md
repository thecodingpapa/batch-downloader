# HTTPS Setup - Automatic Configuration

## Overview
This project automatically sets up HTTPS for local development using `mkcert`. The setup happens automatically when you run `./run-batch-downloader.sh` for the first time.

## First-Time Setup (Automatic)

When you run the startup script on a new machine:

```bash
./run-batch-downloader.sh
```

The script will automatically:
1. ✅ Detect if SSL certificates are missing
2. ✅ Install `mkcert` (if not already installed)
3. ✅ Install the local Certificate Authority
4. ✅ Generate SSL certificates for localhost
5. ✅ Start both server and client with HTTPS

**Note:** You may be prompted for your system password when installing the Certificate Authority.

## What Gets Created

The script generates two certificate files in the project root:
- `localhost+2-key.pem` (private key)
- `localhost+2.pem` (certificate)

These files are:
- ✅ Valid for ~3 years
- ✅ Trusted by your system (no browser warnings)
- ✅ Automatically excluded from git (in `.gitignore`)
- ✅ Machine-specific (each computer generates its own)

## URLs

After setup, both services run on HTTPS:
- **Server:** `https://localhost:3000`
- **Client:** `https://localhost:5174`

## For Team Members

When cloning this repository on a new computer:
1. Run `./run-batch-downloader.sh`
2. The script automatically handles certificate setup
3. No manual configuration needed!

## Manual Setup (Optional)

If you prefer to set up certificates manually before running the app:

```bash
# Install mkcert
brew install mkcert

# Install local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1
```

## Troubleshooting

### "mkcert: command not found"
- The script will attempt to install via Homebrew
- If Homebrew is not installed, install mkcert manually from: https://github.com/FiloSottile/mkcert

### Certificate warnings in browser
- Run `mkcert -install` to install the local CA
- Restart your browser

### Regenerating certificates
Simply delete the `.pem` files and run the script again:
```bash
rm localhost+2*.pem
./run-batch-downloader.sh
```

## Security Notes

- 🔒 Certificates are only trusted on your local machine
- 🔒 Not suitable for production (use real CA certificates)
- 🔒 Each developer generates their own certificates
- 🔒 Certificate files are never committed to git
