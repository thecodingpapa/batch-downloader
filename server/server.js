const express = require('express');
const cors = require('cors');
const https = require('https');
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
  const ytDlpBinary = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const ytDlpPath = path.join(__dirname, ytDlpBinary);
  
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
  // Using Android client (no PO Token needed usually) and enabling Node.js runtime
  // Simplified format selection for better compatibility
  const args = [
    '--download-sections', `*${start}-${end}`,
    '--extractor-args', 'youtube:player_client=android',
    '--js-runtimes', 'node', // Enable Node.js for n-sig calculations
    '--no-check-certificates', // Fix for SSL certificate errors
    '-f', 'bv*[height>=1080]+ba/b',
    '--merge-output-format', 'mp4',
    '-o', outputPath,
    url
  ];

  if (cookiesFile) {
      console.log(`Using cookies from ${cookiesFile.path}`);
      args.push('--cookies', cookiesFile.path);
  }

  const ytDlp = spawn(`./${ytDlpBinary}`, args, { cwd: __dirname });

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

// SSL certificate paths (generated by mkcert in parent directory)
const keyPath = path.join(__dirname, '..', 'localhost+2-key.pem');
const certPath = path.join(__dirname, '..', 'localhost+2.pem');

// Check if SSL certificates exist
const hasSSL = fs.existsSync(keyPath) && fs.existsSync(certPath);

if (hasSSL) {
  // Start HTTPS server if certificates are available
  const sslOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
  
  https.createServer(sslOptions, app).listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
  });
} else {
  // Fall back to HTTP if certificates are missing
  const http = require('http');
  http.createServer(app).listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Note: SSL certificates not found. Running in HTTP mode.');
  });
}
