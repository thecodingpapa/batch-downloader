const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Expose Content-Type header so client can read MIME type of blob
app.use((req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'Content-Type');
  next();
});
// app.use(express.json()); // Parsing handled by multer for multipart/form-data, but we might need it for other endpoints if any. 
// Actually, for mixed use, we can keep it, but multer will handle the multipart request.
app.use(express.json());

// Ensure downloads directory exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Configure multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.post('/download', upload.single('cookies'), (req, res) => {
  console.log('Received download request:', req.body);
  const { url, start, end, videoId } = req.body;
  const cookiesFile = req.file;

  // Basic validation of required fields
  if (!url || start === undefined || end === undefined || !videoId) {
    if (cookiesFile) {
        fs.unlink(cookiesFile.path, () => {}); // Clean up if validation fails
    }
    return res.status(400).json({ error: 'Missing required fields: url, start, end, videoId' });
  }

  // Ensure yt-dlp binary exists before proceeding
  const ytDlpPath = path.join(__dirname, 'yt-dlp');
  if (!fs.existsSync(ytDlpPath)) {
    console.error('yt-dlp binary not found at', ytDlpPath);
    if (cookiesFile) {
        fs.unlink(cookiesFile.path, () => {});
    }
    return res.status(500).json({ error: 'Server configuration error: yt-dlp not found' });
  }

  const outputFilename = `${videoId}.mp4`;
  const outputPath = path.join(downloadsDir, outputFilename);

  console.log(`Starting download for ${videoId}: ${start}s - ${end}s`);

  // yt-dlp command to download specific section
  // Note: Using the local binary ./yt-dlp
  // Using android client to bypass YouTube bot detection
  const args = [
    '--download-sections', `*${start}-${end}`,
    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '--force-keyframes-at-cuts',
    '--extractor-args', 'youtube:player_client=android',
    '-o', outputPath,
    url
  ];

  if (cookiesFile) {
      console.log(`Using cookies from ${cookiesFile.path}`);
      args.push('--cookies', cookiesFile.path);
  }

  const ytDlp = spawn('./yt-dlp', args);

  ytDlp.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ytDlp.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  ytDlp.on('close', (code) => {
    // Clean up cookies file
    if (cookiesFile) {
        fs.unlink(cookiesFile.path, (err) => {
            if (err) console.error('Error deleting cookies file:', err);
        });
    }

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
