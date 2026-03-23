const express = require('express');
const cors = require('cors');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Electron-aware path configuration ---
const isElectron = !!process.env.ELECTRON_MODE;

// yt-dlp binary path
const ytDlpBinary = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const ytDlpPath = process.env.YT_DLP_PATH || path.join(__dirname, ytDlpBinary);

// Downloads & uploads directories (writable location in Electron)
const downloadsDir = process.env.DOWNLOADS_DIR || path.join(__dirname, 'downloads');
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

// ffmpeg path (from ffmpeg-static when running in Electron)
const ffmpegPath = process.env.FFMPEG_PATH || null;

// Client dist path (for serving pre-built React app)
const clientDistPath = process.env.CLIENT_DIST_PATH || path.join(__dirname, '..', 'client', 'dist');

app.use(cors());
// Expose Content-Type header so client can read MIME type of blob
app.use((req, res, next) => {
  res.header('Access-Control-Expose-Headers', 'Content-Type');
  next();
});
app.use(express.json());

// Ensure directories exist
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for handling file uploads
const upload = multer({ dest: uploadsDir });

// --- Version endpoint ---
app.get('/api/version', (req, res) => {
  try {
    const pkgPath = isElectron
      ? path.join(__dirname, '..', 'package.json')
      : path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    res.json({ version: pkg.version });
  } catch (e) {
    res.json({ version: 'unknown' });
  }
});

// --- Serve pre-built React client (for Electron and production) ---
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
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
  const args = [
    '--download-sections', `*${start}-${end}`,
    '--extractor-args', 'youtube:player_client=android',
    '--js-runtimes', 'node',
    '--no-check-certificates',
    '-f', 'bv*[height>=1080]+ba/b',
    '--merge-output-format', 'mp4',
    '-o', outputPath,
    url
  ];

  // Pass ffmpeg location if available (important for Electron bundled ffmpeg)
  if (ffmpegPath) {
    args.unshift('--ffmpeg-location', ffmpegPath);
  }

  if (cookiesFile) {
      console.log(`Using cookies from ${cookiesFile.path}`);
      args.push('--cookies', cookiesFile.path);
  }
  // Build environment for yt-dlp subprocess
  // When launched from Finder (double-click .app), macOS provides only a minimal PATH.
  // yt-dlp needs `node` (for --js-runtimes) and `ffmpeg`, so we add common locations.
  const spawnEnv = { ...process.env };
  const extraPaths = [
    '/usr/local/bin',        // Intel Mac (Homebrew)
    '/opt/homebrew/bin',     // Apple Silicon Mac (Homebrew)
    '/usr/bin',
    '/bin',
  ];
  spawnEnv.PATH = [...extraPaths, spawnEnv.PATH || ''].join(':');

  // Use absolute path for yt-dlp binary
  // cwd must be a real directory (not inside asar archive), so use downloadsDir
  const ytDlp = spawn(ytDlpPath, args, { cwd: downloadsDir, env: spawnEnv });

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
        // Sometimes yt-dlp might add .webm or other extensions
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

// --- SPA fallback: serve index.html for any unmatched routes ---
if (fs.existsSync(clientDistPath)) {
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// --- Start server ---
// In Electron mode, always use HTTP (no SSL needed inside the app)
if (isElectron) {
  // Port 0 = OS assigns a random free port (avoids conflicts)
  const server = app.listen(0, () => {
    const actualPort = server.address().port;
    console.log(`Server running on http://localhost:${actualPort} (Electron mode)`);
  });
  module.exports = server;
} else {
  // Standalone mode: try HTTPS, fall back to HTTP
  const keyPath = path.join(__dirname, '..', 'localhost+2-key.pem');
  const certPath = path.join(__dirname, '..', 'localhost+2.pem');
  const hasSSL = fs.existsSync(keyPath) && fs.existsSync(certPath);

  if (hasSSL) {
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Server running on https://localhost:${PORT}`);
    });
  } else {
    const http = require('http');
    http.createServer(app).listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Note: SSL certificates not found. Running in HTTP mode.');
    });
  }
}
