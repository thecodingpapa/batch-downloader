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

// --- Fetch available formats / resolutions for a video ---
function parseResolutions(jsonStr) {
  const info = JSON.parse(jsonStr);
  const formats = info.formats || [];

  // Collect video formats, dedup by height
  const seen = new Set();
  const resolutions = [];

  for (const f of formats) {
    const h = f.height;
    if (!h || seen.has(h)) continue;
    if (f.vcodec === 'none') continue;
    seen.add(h);
    // Prefer H.264 (avc1) for QuickTime compatibility, fall back to any codec
    resolutions.push({
      height: h,
      label: `${h}p`,
      formatFilter: `bv*[height=${h}][vcodec^=avc1]+ba/bv*[height=${h}]+ba/b`,
    });
  }

  resolutions.sort((a, b) => b.height - a.height);
  return resolutions;
}

function buildSpawnEnv() {
  const spawnEnv = { ...process.env };
  const extraPaths = [
    '/usr/local/bin',
    '/opt/homebrew/bin',
    '/usr/bin',
    '/bin',
  ];
  spawnEnv.PATH = [...extraPaths, spawnEnv.PATH || ''].join(':');
  return spawnEnv;
}

app.post('/formats', (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing required field: url' });
  }

  if (!fs.existsSync(ytDlpPath)) {
    return res.status(500).json({ error: 'Server configuration error: yt-dlp not found' });
  }

  const spawnEnv = buildSpawnEnv();

  // Try default web client first (returns all resolutions including 1080p+)
  const defaultArgs = [
    '--js-runtimes', 'node',
    '--no-check-certificates',
    '-j',
    url
  ];

  console.log('Fetching formats with default client...');
  const proc = spawn(ytDlpPath, defaultArgs, { cwd: downloadsDir, env: spawnEnv });
  let stdout = '';
  let stderr = '';

  proc.stdout.on('data', (d) => { stdout += d; });
  proc.stderr.on('data', (d) => { stderr += d; });

  proc.on('close', (code) => {
    if (code === 0) {
      try {
        const resolutions = parseResolutions(stdout);
        if (resolutions.length > 0) {
          console.log(`Default client returned ${resolutions.length} resolutions`);
          return res.json({ resolutions });
        }
      } catch (e) {
        console.error('Error parsing default client JSON:', e);
      }
    }

    // Fallback: try android client (more reliable but fewer resolutions)
    console.log('Default client failed or returned no results, falling back to android client...');
    const androidArgs = [
      '--extractor-args', 'youtube:player_client=android',
      '--js-runtimes', 'node',
      '--no-check-certificates',
      '-j',
      url
    ];

    const proc2 = spawn(ytDlpPath, androidArgs, { cwd: downloadsDir, env: spawnEnv });
    let stdout2 = '';
    let stderr2 = '';

    proc2.stdout.on('data', (d) => { stdout2 += d; });
    proc2.stderr.on('data', (d) => { stderr2 += d; });

    proc2.on('close', (code2) => {
      if (code2 !== 0) {
        console.error('yt-dlp formats error (android fallback):', stderr2);
        return res.status(500).json({ error: 'Failed to fetch formats' });
      }

      try {
        const resolutions = parseResolutions(stdout2);
        console.log(`Android client returned ${resolutions.length} resolutions`);
        res.json({ resolutions });
      } catch (e) {
        console.error('Error parsing android client JSON:', e);
        res.status(500).json({ error: 'Failed to parse format data' });
      }
    });
  });
});

app.post('/download', upload.single('cookies'), (req, res) => {
  console.log('Received download request:', req.body);
  const { url, start, end, videoId, formatFilter } = req.body;
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
  const spawnEnv = buildSpawnEnv();

  console.log(`Starting download for ${videoId}: ${start}s - ${end}s, format: ${formatFilter}`);

  // Build base args (without extractor-args — added per attempt)
  function buildDownloadArgs(clientArgs) {
    const args = [
      '--download-sections', `*${start}-${end}`,
      ...clientArgs,
      '--js-runtimes', 'node',
      '--no-check-certificates',
      '-f', formatFilter || 'bv*[height>=1080]+ba/b',
      '--merge-output-format', 'mp4',
      '-o', outputPath,
      url
    ];

    if (ffmpegPath) {
      args.unshift('--ffmpeg-location', ffmpegPath);
    }
    if (cookiesFile) {
      args.push('--cookies', cookiesFile.path);
    }
    return args;
  }

  // Clean up any leftover file from a previous attempt
  function cleanupOutput() {
    try {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      // Also clean partial files (yt-dlp may create .part files)
      const files = fs.readdirSync(downloadsDir);
      files.filter(f => f.startsWith(videoId)).forEach(f => {
        try { fs.unlinkSync(path.join(downloadsDir, f)); } catch (e) {}
      });
    } catch (e) {}
  }

  // Detect VP9/AV1 and re-encode to H.264 for QuickTime compatibility
  function reEncodeIfNeeded(filePath, callback) {
    // Determine ffprobe path (alongside ffmpeg)
    let ffprobePath = 'ffprobe';
    if (ffmpegPath) {
      const ffmpegDir = path.dirname(ffmpegPath);
      const possibleFfprobe = path.join(ffmpegDir, 'ffprobe');
      if (fs.existsSync(possibleFfprobe)) {
        ffprobePath = possibleFfprobe;
      }
    }

    // Check video codec using ffprobe
    const probeArgs = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=codec_name',
      '-of', 'csv=p=0',
      filePath
    ];

    console.log(`Checking video codec with ffprobe: ${filePath}`);
    const probe = spawn(ffprobePath, probeArgs, { env: spawnEnv });
    let codec = '';

    probe.stdout.on('data', (d) => { codec += d.toString().trim(); });
    probe.stderr.on('data', (d) => { /* ignore probe stderr */ });

    probe.on('close', (probeCode) => {
      console.log(`Detected video codec: "${codec}"`);

      // If codec is H.264, no re-encoding needed
      if (probeCode !== 0 || !codec || codec === 'h264') {
        return callback(filePath);
      }

      // VP9, AV1, or other non-H.264 codec — re-encode
      console.log(`Re-encoding from ${codec} to H.264 for QuickTime compatibility...`);
      const reEncodedPath = filePath.replace(/\.mp4$/, '_h264.mp4');

      const ffmpegBin = ffmpegPath || 'ffmpeg';
      const encodeArgs = [
        '-i', filePath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-movflags', '+faststart',
        '-y',
        reEncodedPath
      ];

      const enc = spawn(ffmpegBin, encodeArgs, { env: spawnEnv });
      enc.stdout.on('data', (d) => console.log(`[ffmpeg] ${d}`));
      enc.stderr.on('data', (d) => console.log(`[ffmpeg] ${d}`));

      enc.on('close', (encCode) => {
        if (encCode === 0 && fs.existsSync(reEncodedPath)) {
          console.log('Re-encoding complete, replacing original file');
          // Replace original with re-encoded version
          try {
            fs.unlinkSync(filePath);
            fs.renameSync(reEncodedPath, filePath);
          } catch (e) {
            console.error('Error replacing file:', e);
          }
          callback(filePath);
        } else {
          console.error(`Re-encoding failed (code ${encCode}), sending original VP9 file`);
          // Clean up partial re-encoded file
          try { if (fs.existsSync(reEncodedPath)) fs.unlinkSync(reEncodedPath); } catch (e) {}
          callback(filePath);
        }
      });
    });
  }

  function sendFile() {
    // Find the actual downloaded file
    let fileToSend = null;
    if (fs.existsSync(outputPath)) {
      fileToSend = outputPath;
    } else {
      const files = fs.readdirSync(downloadsDir);
      const downloadedFile = files.find(f => f.startsWith(videoId));
      if (downloadedFile) {
        fileToSend = path.join(downloadsDir, downloadedFile);
      }
    }

    if (!fileToSend) {
      return res.status(500).json({ error: 'File not found after download' });
    }

    // Check codec and re-encode if needed, then send
    reEncodeIfNeeded(fileToSend, (finalPath) => {
      res.setHeader('Content-Type', 'video/mp4');
      const fname = path.basename(finalPath);
      res.download(finalPath, fname, (err) => {
        if (err) console.error('Error sending file:', err);
        fs.unlink(finalPath, (unlinkErr) => {
          if (unlinkErr) console.error('Error deleting file:', unlinkErr);
        });
      });
    });
  }

  function cleanupCookies() {
    if (cookiesFile) {
      fs.unlink(cookiesFile.path, (err) => {
        if (err) console.error('Error deleting cookies file:', err);
      });
    }
  }

  // Attempt 1: Default web client (has all resolutions)
  console.log('Attempt 1: downloading with default client...');
  const defaultArgs = buildDownloadArgs([]);
  const proc1 = spawn(ytDlpPath, defaultArgs, { cwd: downloadsDir, env: spawnEnv });

  proc1.stdout.on('data', (d) => console.log(`[default] stdout: ${d}`));
  proc1.stderr.on('data', (d) => console.error(`[default] stderr: ${d}`));

  proc1.on('close', (code1) => {
    if (code1 === 0) {
      console.log('Download complete (default client)');
      cleanupCookies();
      return sendFile();
    }

    // Attempt 2: Android client fallback
    console.log(`Default client failed (code ${code1}), retrying with android client...`);
    cleanupOutput();

    const androidArgs = buildDownloadArgs(['--extractor-args', 'youtube:player_client=android']);
    const proc2 = spawn(ytDlpPath, androidArgs, { cwd: downloadsDir, env: spawnEnv });

    proc2.stdout.on('data', (d) => console.log(`[android] stdout: ${d}`));
    proc2.stderr.on('data', (d) => console.error(`[android] stderr: ${d}`));

    proc2.on('close', (code2) => {
      cleanupCookies();

      if (code2 === 0) {
        console.log('Download complete (android client fallback)');
        sendFile();
      } else {
        console.error(`Both download attempts failed (default: ${code1}, android: ${code2})`);
        res.status(500).json({ error: 'Download failed' });
      }
    });
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
