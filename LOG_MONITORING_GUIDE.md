# YouTube Bot Detection Fix - Summary

## ✅ What Was Done

1. **Updated server code** to use `--extractor-args 'youtube:player_client=android'`
2. **Updated yt-dlp** to the latest version on EC2
3. **Deployed changes** to your EC2 server

## 🔍 How to Check Server Logs

### Option 1: Real-time Log Monitoring (Recommended for Testing)
```bash
ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252
pm2 logs batch-downloader
```
Press `Ctrl+C` to exit

### Option 2: View Last N Lines
```bash
# Last 50 lines
ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252 "pm2 logs batch-downloader --lines 50 --nostream"

# Last 100 lines
ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252 "pm2 logs batch-downloader --lines 100 --nostream"
```

### Option 3: View Only Errors
```bash
ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252 "pm2 logs batch-downloader --err --lines 30 --nostream"
```

### Option 4: Clear Old Logs and Start Fresh
```bash
ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252
pm2 flush batch-downloader  # Clear old logs
pm2 logs batch-downloader    # Watch new logs
```

## 🧪 Testing the Fix

1. **Clear old logs** (optional but recommended):
   ```bash
   ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252 "pm2 flush batch-downloader"
   ```

2. **Start monitoring logs**:
   ```bash
   ssh -i ~/.ssh/batch-downloader.pem ubuntu@3.142.232.252 "pm2 logs batch-downloader"
   ```

3. **Try downloading a clip** from your web app

4. **Look for these signs**:
   - ✅ **Success**: You'll see download progress and "Download complete"
   - ❌ **Still failing**: You'll see "ERROR: Sign in to confirm you're not a bot"

## 🔧 If Still Not Working

If you still see bot detection errors, we have a few more options:

### Option A: Use iOS Client (Sometimes Works Better)
Edit `server/server.js` line 54:
```javascript
'--extractor-args', 'youtube:player_client=ios',
```

### Option B: Try Multiple Clients
```javascript
'--extractor-args', 'youtube:player_client=ios,android',
```

### Option C: Update yt-dlp More Frequently
YouTube changes their detection frequently. Run this on EC2:
```bash
cd ~/server
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod +x yt-dlp
pm2 restart batch-downloader
```

### Option D: Use a Proxy (Most Reliable but Costs Money)
If you have a proxy service, add to `server.js`:
```javascript
'--proxy', 'http://your-proxy-url:port',
```

## 📊 Current Configuration

**File**: `/Users/wonjunyang/Documents/Playground/batch-downloader/server/server.js`

**yt-dlp arguments**:
```javascript
const ytDlp = spawn('./yt-dlp', [
  '--download-sections', `*${start}-${end}`,
  '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
  '--force-keyframes-at-cuts',
  '--extractor-args', 'youtube:player_client=android',
  '-o', outputPath,
  url
]);
```

## 🚀 Quick Deploy After Changes

After making any changes to `server.js`, run:
```bash
cd /Users/wonjunyang/Documents/Playground/batch-downloader
./update-server.sh
```

---

**Next Steps**: Try downloading a clip and check the logs to see if the bot detection is resolved!
