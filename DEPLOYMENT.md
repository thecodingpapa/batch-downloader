# Deployment Guide

This guide covers deploying the frontend to Firebase Hosting and the backend to AWS EC2.

---

## Frontend Deployment (Firebase Hosting)

### Prerequisites
- Firebase account
- Firebase CLI installed globally

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase in Your Project
Navigate to the `client` directory:
```bash
cd client
firebase init hosting
```

When prompted:
- **Select a Firebase project**: Choose an existing project or create a new one
- **What do you want to use as your public directory?**: Enter `dist`
- **Configure as a single-page app?**: Yes
- **Set up automatic builds and deploys with GitHub?**: No (unless you want CI/CD)
- **Overwrite existing files?**: No

### Step 4: Build the Frontend
```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Step 5: Update API Endpoint
Before deploying, update the backend URL in `src/App.jsx`:

```javascript
// Change from:
const response = await axios.post('http://localhost:3000/download', {

// To (replace with your EC2 public IP or domain):
const response = await axios.post('http://YOUR_EC2_IP:3000/download', {
```

Then rebuild:
```bash
npm run build
```

### Step 6: Deploy to Firebase
```bash
firebase deploy --only hosting
```

Your app will be live at: `https://YOUR_PROJECT_ID.web.app`

---

## Backend Deployment (AWS EC2)

### Prerequisites
- AWS account
- EC2 instance running (Ubuntu 22.04 LTS recommended)
- SSH access to your EC2 instance

### Step 1: Launch an EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS**
3. Instance type: **t2.micro** (free tier) or **t2.small** (recommended for video processing)
4. Configure Security Group:
   - SSH (port 22) - Your IP
   - Custom TCP (port 3000) - Anywhere (0.0.0.0/0)
5. Create/select a key pair for SSH access
6. Launch the instance

### Step 2: Fix SSH Key Permissions

After downloading your `.pem` key file, you need to set the correct permissions:

```bash
# Navigate to where your key is stored
cd ~/.ssh

# Set correct permissions (read-only for owner)
chmod 400 batch-downloader.pem

# Verify permissions (should show -r--------)
ls -l batch-downloader.pem
```

> **Why?** SSH requires that private key files are not accessible by others for security reasons. The error "WARNING: UNPROTECTED PRIVATE KEY FILE!" means the permissions are too open (0644 allows read access to everyone).

### Step 3: Connect to Your EC2 Instance
```bash
ssh -i ~/.ssh/batch-downloader.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

If you still get permission errors, ensure:
- The key file is in the correct location
- You're using the correct username (`ubuntu` for Ubuntu instances, `ec2-user` for Amazon Linux)
- Your EC2 Security Group allows SSH (port 22) from your IP

### Step 4: Install Node.js and Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install ffmpeg
sudo apt install -y ffmpeg

# Install Python 3 (for yt-dlp)
sudo apt install -y python3 python3-pip

# Verify installations
node --version
npm --version
ffmpeg -version
python3 --version
```

### Step 5: Transfer Backend Files to EC2

On your local machine, from the project root:
```bash
# Create a tarball of the server directory
cd /Users/wonjunyang/Documents/Playground/batch-downloader
tar -czf server.tar.gz server/

# Copy to EC2
scp -i ~/.ssh/batch-downloader.pem server.tar.gz ubuntu@YOUR_EC2_PUBLIC_IP:~/
```

### Step 6: Set Up the Backend on EC2

SSH into your EC2 instance and run:
```bash
# Extract the files
tar -xzf server.tar.gz
cd server

# Install Node.js dependencies
npm install

# Download yt-dlp binary (already included in your server folder)
# Verify it's executable
chmod +x yt-dlp

# Test yt-dlp
./yt-dlp --version
```

### Step 7: Configure CORS for Frontend

Edit `server.js` to allow your Firebase domain:
```javascript
// Update the CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://YOUR_PROJECT_ID.web.app'],
  credentials: true
}));
```

### Step 8: Run the Server with PM2 (Process Manager)

Install PM2 to keep the server running:
```bash
sudo npm install -g pm2

# Start the server
pm2 start server.js --name "batch-downloader"

# Save the PM2 process list
pm2 save

# Set PM2 to start on system boot
pm2 startup
# Follow the instructions from the output
```

### Step 9: Verify the Server is Running
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs batch-downloader

# Test the server
curl http://localhost:3000
```

### Step 10: (Optional) Set Up Nginx as Reverse Proxy

For production, use Nginx:
```bash
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/clip-downloader
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/clip-downloader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Update your Security Group to allow HTTP (port 80).

---

## Environment Variables (Optional)

Create a `.env` file in the server directory:
```bash
PORT=3000
NODE_ENV=production
```

Update `server.js` to use it:
```javascript
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

---

## Monitoring and Maintenance

### View Server Logs
```bash
pm2 logs batch-downloader
```

### Restart Server
```bash
pm2 restart batch-downloader
```

### Update the Server
```bash
# On local machine, create new tarball
tar -czf server.tar.gz server/
scp -i ~/.ssh/batch-downloader.pem server.tar.gz ubuntu@YOUR_EC2_PUBLIC_IP:~/

# On EC2
cd ~
tar -xzf server.tar.gz
cd server
npm install
pm2 restart batch-downloader
```

---

## Troubleshooting

### SSH Connection Issues

**Error: "WARNING: UNPROTECTED PRIVATE KEY FILE!"**
```bash
# Fix permissions
chmod 400 ~/.ssh/batch-downloader.pem

# Verify
ls -l ~/.ssh/batch-downloader.pem
# Should show: -r-------- (400)
```

**Error: "Permission denied (publickey)"**
- Ensure you're using the correct key file
- Verify you're using the correct username (`ubuntu` for Ubuntu, `ec2-user` for Amazon Linux)
- Check that your EC2 Security Group allows SSH (port 22) from your IP
- Verify the key pair matches the one assigned to your EC2 instance

**Error: "Connection timed out"**
- Check your EC2 Security Group allows SSH from your IP address
- Verify the EC2 instance is running
- Ensure you're using the correct public IP address

### Frontend can't connect to backend
- Check EC2 Security Group allows port 3000 (or 80 if using Nginx)
- Verify CORS configuration in `server.js`
- Check the API URL in `App.jsx`

### yt-dlp fails to download
- Ensure `yt-dlp` binary is executable: `chmod +x yt-dlp`
- Update yt-dlp: `./yt-dlp -U` or download latest from GitHub

### Server crashes or runs out of memory
- Upgrade to a larger EC2 instance (t2.small or t2.medium)
- Add swap space:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

---

## Cost Optimization

- Use **AWS Free Tier** (t2.micro) for testing
- Stop EC2 instance when not in use
- Use **Firebase Free Plan** (10GB hosting, 360MB/day bandwidth)
- Consider AWS Lambda + API Gateway for serverless backend (more complex setup)

---

## Next Steps

1. Set up a custom domain for Firebase Hosting
2. Add HTTPS with Let's Encrypt for EC2 (if using Nginx)
3. Implement authentication for the download endpoint
4. Add rate limiting to prevent abuse
5. Set up CloudWatch or monitoring for EC2
