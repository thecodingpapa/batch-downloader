# Server Update Guide

## Quick Update (Recommended)

I've created a script that automates the entire update process. Simply run:

```bash
cd /Users/wonjunyang/Documents/Playground/batch-downloader
./update-server.sh
```

This script will:
1. ✅ Create a tarball of your server directory
2. ✅ Upload it to your EC2 instance
3. ✅ Extract the files on EC2
4. ✅ Install any new dependencies
5. ✅ Restart the PM2 process
6. ✅ Show the server status

---

## Manual Update (Step by Step)

If you prefer to do it manually or if the script doesn't work:

### Step 1: Create Tarball
```bash
cd /Users/wonjunyang/Documents/Playground/batch-downloader
tar -czf server.tar.gz server/
```

### Step 2: Upload to EC2
```bash
scp -i ~/.ssh/batch-downloader.pem server.tar.gz ubuntu@3.142.232.252:~/
```

### Step 3: SSH into EC2
```bash
ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252
```

### Step 4: Extract and Update (on EC2)
```bash
# Extract the new files
tar -xzf server.tar.gz
cd server

# Install/update dependencies
npm install

# Restart the server
pm2 restart batch-downloader

# Check status
pm2 status

# View logs (optional)
pm2 logs batch-downloader --lines 50
```

### Step 5: Exit SSH
```bash
exit
```

---

## Verify the Update

After updating, test the server:

```bash
# Test from your local machine
curl http://3.142.232.252:3000

# Or test the CORS configuration
curl -H "Origin: https://apple-site-clone-95524.web.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://3.142.232.252:3000/download -v
```

---

## Troubleshooting

### Server won't restart
```bash
# Stop the process
pm2 stop batch-downloader

# Start it again
pm2 start server.js --name "batch-downloader"

# Save the process list
pm2 save
```

### Check for errors
```bash
# View real-time logs
pm2 logs batch-downloader

# View last 100 lines
pm2 logs batch-downloader --lines 100
```

### Server not responding
```bash
# Check if it's running
pm2 status

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart
pm2 restart batch-downloader
```

---

## What Changed in This Update

- ✅ Updated CORS configuration to allow Firebase domain
- ✅ Server now accepts requests from `https://apple-site-clone-95524.web.app`
- ✅ Maintained localhost support for local development
