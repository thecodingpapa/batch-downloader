const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: ['http://localhost:5173', 'https://apple-site-clone-95524.web.app', 'https://www.pigsub.com'],
  credentials: true
}));
// Expose Content-Type header so client can read MIME type of blob
app.use((req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'Content-Type');
  next();
});
app.use(express.json());

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

app.post('/download', (req, res) => {
  console.log('Received download request:', req.body);
  const { url, start, end, videoId } = req.body;

  // Basic validation of required fields
  if (!url || start === undefined || end === undefined || !videoId) {
    return res.status(400).json({ error: 'Missing required fields: url, start, end, videoId' });
  }

  // Ensure yt-dlp binary exists before proceeding
  const ytDlpPath = path.join(__dirname, 'yt-dlp');
  if (!fs.existsSync(ytDlpPath)) {
    console.error('yt-dlp binary not found at', ytDlpPath);
    return res.status(500).json({ error: 'Server configuration error: yt-dlp not found' });
  }

  const outputFilename = `${videoId}.mp4`;
  const outputPath = path.join(downloadsDir, outputFilename);

  console.log(`Starting download for ${videoId}: ${start}s - ${end}s`);

  // yt-dlp command to download specific section
  // Note: Using the local binary ./yt-dlp
  // Using android client to bypass YouTube bot detection
  const ytDlp = spawn('./yt-dlp', [
    '--download-sections', `*${start}-${end}`,
    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '--force-keyframes-at-cuts',
    '--extractor-args', 'youtube:player_client=android',
    '-o', outputPath,
    url
  ]);

  ytDlp.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ytDlp.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  ytDlp.on('close', (code) => {
    if (code === 0) {
      console.log(`Download complete: ${outputPath}`);
      
      // Check if file exists (yt-dlp might append .mp4 automatically if not in template, 
      // but we specified output path. However, if it merges, it might be correct.
      // Let's verify file existence.)
      
      if (fs.existsSync(outputPath)) {
        // Set correct Content-Type for MP4 download
        res.setHeader('Content-Type', 'video/mp4');
        res.download(outputPath, outputFilename, (err) => {
          if (err) {
            console.error('Error sending file:', err);
          }
          // Clean up file after sending
          fs.unlink(outputPath, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting file:', unlinkErr);
          });
        });
      } else {
        // Sometimes yt-dlp might add .webm or other extensions if format selection fails
        // We should check for files starting with videoId in downloadsDir
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find(f => f.startsWith(videoId));
        
        if (downloadedFile) {
             const realPath = path.join(downloadsDir, downloadedFile);
             res.download(realPath, downloadedFile, (err) => {
                if (err) console.error('Error sending file:', err);
                fs.unlink(realPath, (unlinkErr) => {
                    if (unlinkErr) console.error('Error deleting file:', unlinkErr);
                });
             });
        } else {
            res.status(500).json({ error: 'File not found after download' });
        }
      }
    } else {
      console.error(`yt-dlp process exited with code ${code}`);
      res.status(500).json({ error: 'Download failed' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
