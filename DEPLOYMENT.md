# DigitalOcean Deployment Guide

Complete walkthrough for deploying Batch Downloader to DigitalOcean.

---

## Part 1: Create DigitalOcean Droplet

### 1.1 Sign Up & Create Droplet
1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Sign up (use referral code for $200 credit if first time)
3. Click **"Create"** → **"Droplets"**

### 1.2 Droplet Configuration
- **Image**: Ubuntu 24.04 LTS (recommended)
- **Plan**: Basic
- **CPU Options**: Regular (4GB RAM / 2 vCPUs - $18/month)
- **Datacenter**: Choose closest to your users (e.g., Singapore, San Francisco)
- **Authentication**: SSH Key (recommended) or Password
- **Hostname**: `batch-downloader` or `pigsub-downloader`
- Click **"Create Droplet"**

### 1.3 Get IP Address
After creation (~60 seconds), copy your droplet's **IP address** (e.g., `143.198.123.45`)

---

## Part 2: Initial Server Setup

### 2.1 SSH into Server
```bash
ssh root@YOUR_IP_ADDRESS
# Example: ssh root@143.198.123.45
```

### 2.2 Update System
```bash
apt update && apt upgrade -y
```

### 2.3 Create Non-Root User (Security Best Practice)
```bash
adduser deployer
usermod -aG sudo deployer
```

Switch to new user:
```bash
su - deployer
```

---

## Part 3: Install Dependencies

### 3.1 Clone Your Repository
```bash
cd ~
git clone https://github.com/thecodingpapa/batch-downloader.git
cd batch-downloader
```

### 3.2 Run Installation Script
```bash
chmod +x install-batch-downloader.sh
./install-batch-downloader.sh
```

This installs:
- Node.js
- npm
- ffmpeg
- yt-dlp
- All project dependencies

---

## Part 4: Install PM2 (Process Manager)

PM2 keeps your app running even after you disconnect.

```bash
sudo npm install -g pm2
```

---

## Part 5: Configure Application for Production

### 5.1 Build Client for Production
```bash
cd ~/batch-downloader/client
npm run build
```

### 5.2 Install Static File Server for Client
```bash
sudo npm install -g serve
```

### 5.3 Start Services with PM2

**Start Server:**
```bash
cd ~/batch-downloader/server
pm2 start server.js --name batch-server
```

**Start Client:**
```bash
cd ~/batch-downloader/client
pm2 start "serve -s dist -l 5174" --name batch-client
```

**Save PM2 Configuration:**
```bash
pm2 save
pm2 startup
# Copy and run the command that PM2 outputs
```

**Check Status:**
```bash
pm2 status
pm2 logs
```

---

## Part 6: Install & Configure Nginx

### 6.1 Install Nginx
```bash
sudo apt install nginx -y
```

### 6.2 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/batch-downloader
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_IP_OR_DOMAIN;

    # Client (Frontend)
    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API (Backend)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for large file downloads
        proxy_read_timeout 600s;
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
    }
}
```

**Note**: Replace `YOUR_IP_OR_DOMAIN` with your actual IP or domain.

### 6.3 Enable Configuration
```bash
sudo ln -s /etc/nginx/sites-available/batch-downloader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Part 7: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Part 8: SSL Setup (HTTPS)

### 8.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 8.2 Get SSL Certificate

**If using domain name:**
```bash
sudo certbot --nginx -d yourdomain.com
```

**If using IP only:**
You'll need a self-signed certificate:
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```

Then update nginx config to use certificates.

---

## Part 9: Access Your Application

### Via IP Address:
```
http://YOUR_IP_ADDRESS
```

### Via Domain (if configured):
```
https://yourdomain.com
```

---

## Part 10: Embed in Iframe (pigsub.com)

On your `pigsub.com` website:

```html
<iframe 
  src="https://YOUR_IP_OR_DOMAIN" 
  width="100%" 
  height="800px"
  frameborder="0"
  allow="clipboard-write"
></iframe>
```

---

## Maintenance Commands

### View Logs
```bash
pm2 logs
pm2 logs batch-server
pm2 logs batch-client
```

### Restart Services
```bash
pm2 restart all
pm2 restart batch-server
```

### Update Code
```bash
cd ~/batch-downloader
git pull
./stop-batch-downloader.sh
cd client && npm run build && cd ..
pm2 restart all
```

### Monitor Resources
```bash
pm2 monit
htop
```

---

## Troubleshooting

### Service won't start
```bash
pm2 logs batch-server --lines 50
```

### Can't access from browser
```bash
sudo nginx -t
sudo systemctl status nginx
sudo ufw status
```

### Out of disk space
```bash
df -h
# Clean old downloads
rm -rf ~/batch-downloader/server/downloads/*
```

---

## Cost Estimate

- **Droplet**: $18/month (4GB RAM)
- **Bandwidth**: 4TB included (should be sufficient)
- **Domain** (optional): ~$12/year
- **Total**: ~$18-20/month

---

## Security Recommendations

1. **Add Authentication**: Protect with password/JWT
2. **Rate Limiting**: Prevent abuse
3. **IP Whitelist**: Restrict to your team's IPs
4. **Regular Updates**: `apt update && apt upgrade`
5. **Backups**: Enable DigitalOcean automated backups (+20% cost)

---

## Next Steps

1. Test the deployment thoroughly
2. Add authentication if needed
3. Monitor usage and costs
4. Set up alerts for high bandwidth usage
