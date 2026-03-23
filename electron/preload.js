const { contextBridge } = require('electron');

// Expose minimal API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
});
