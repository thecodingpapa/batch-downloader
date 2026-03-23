const { app, BrowserWindow, shell, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let server;

const isDev = !app.isPackaged;

// --- File logging (so we can debug the packaged app) ---
const logPath = path.join(app.getPath('userData'), 'app.log');
const logStream = fs.createWriteStream(logPath, { flags: 'w' }); // overwrite each launch

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function timestamp() {
  return new Date().toISOString();
}

console.log = (...args) => {
  const msg = `[${timestamp()}] [LOG] ${args.join(' ')}\n`;
  logStream.write(msg);
  originalLog(...args);
};

console.error = (...args) => {
  const msg = `[${timestamp()}] [ERR] ${args.join(' ')}\n`;
  logStream.write(msg);
  originalError(...args);
};

console.warn = (...args) => {
  const msg = `[${timestamp()}] [WRN] ${args.join(' ')}\n`;
  logStream.write(msg);
  originalWarn(...args);
};

console.log(`App starting. Log file: ${logPath}`);

// --- Path helpers ---
function getResourcePath(...segments) {
  if (isDev) {
    return path.join(__dirname, '..', ...segments);
  }
  return path.join(process.resourcesPath, ...segments);
}

function getYtDlpPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'server', 'yt-dlp');
  }
  // In packaged app, yt-dlp is in extraResources
  return path.join(process.resourcesPath, 'yt-dlp');
}

function getClientDistPath() {
  if (isDev) {
    return path.join(__dirname, '..', 'client', 'dist');
  }
  // In packaged app, client/dist is inside the asar
  return path.join(__dirname, '..', 'client', 'dist');
}

function getFfmpegPath() {
  try {
    // ffmpeg-static provides a pre-compiled binary
    let ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) {
      // In packaged app, the binary is unpacked from asar to app.asar.unpacked
      if (ffmpegPath.includes('app.asar')) {
        ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
      }
      if (fs.existsSync(ffmpegPath)) {
        return ffmpegPath;
      }
    }
  } catch (e) {
    // Not available
  }
  return null;
}

// --- Server startup ---
function startServer() {
  return new Promise((resolve, reject) => {
    // Configure environment for the server
    process.env.ELECTRON_MODE = 'true';
    process.env.YT_DLP_PATH = getYtDlpPath();
    process.env.CLIENT_DIST_PATH = getClientDistPath();

    // Use app's userData directory for writable storage
    const userDataPath = app.getPath('userData');
    process.env.DOWNLOADS_DIR = path.join(userDataPath, 'downloads');
    process.env.UPLOADS_DIR = path.join(userDataPath, 'uploads');

    // Set ffmpeg path if available
    const ffmpeg = getFfmpegPath();
    if (ffmpeg) {
      process.env.FFMPEG_PATH = ffmpeg;
    }

    console.log('--- Electron Server Config ---');
    console.log('  yt-dlp:', process.env.YT_DLP_PATH);
    console.log('  ffmpeg:', process.env.FFMPEG_PATH || 'system');
    console.log('  downloads:', process.env.DOWNLOADS_DIR);
    console.log('  client:', process.env.CLIENT_DIST_PATH);
    console.log('-----------------------------');

    try {
      // Start the Express server (listens on port 0 = random free port)
      server = require('../server/server.js');

      // Wait for the server to finish binding, then read the actual port
      server.on('listening', () => {
        const port = server.address().port;
        console.log(`Electron using server on port ${port}`);
        resolve(port);
      });

      server.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      reject(err);
    }
  });
}

// --- Window creation ---
function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 800,
    minHeight: 600,
    title: 'Batch Downloader',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Open DevTools automatically in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Cmd+Option+I toggles DevTools (works in both dev and packaged builds)
  globalShortcut.register('CommandOrControl+Alt+I', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- App lifecycle ---
app.whenReady().then(async () => {
  try {
    const port = await startServer();
    createWindow(port);
  } catch (err) {
    dialog.showErrorBox('Startup Error', `Failed to start Batch Downloader:\n${err.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, it's common to keep the app running until explicit quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked
  if (mainWindow === null) {
    startServer()
      .then((port) => createWindow(port))
      .catch(console.error);
  }
});

app.on('before-quit', () => {
  // Close the Express server when quitting
  if (server && typeof server.close === 'function') {
    server.close();
  }
});
