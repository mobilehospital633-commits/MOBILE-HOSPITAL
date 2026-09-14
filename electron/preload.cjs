const { contextBridge } = require('electron');

// Expose safe desktop system APIs
contextBridge.exposeInMainWorld('desktopAPI', {
  isDesktop: true,
  platform: process.platform,
  version: '1.0.0',
});
