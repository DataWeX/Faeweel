const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const FileTransferManager = require('./fileTransfer');
const HDMIDisplayManager = require('./hdmiDisplay');

let mainWindow;
let hdmiWindow = null;
let fileTransferManager;
let hdmiDisplayManager;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (hdmiWindow) {
      hdmiWindow.close();
    }
  });
}

function createHDMIWindow(display) {
  if (hdmiWindow) {
    hdmiWindow.close();
  }

  const displayBounds = display.bounds;

  hdmiWindow = new BrowserWindow({
    x: displayBounds.x,
    y: displayBounds.y,
    width: displayBounds.width,
    height: displayBounds.height,
    fullscreen: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  hdmiWindow.loadFile(path.join(__dirname, 'hdmiDisplay.html'));

  hdmiWindow.on('closed', () => {
    hdmiWindow = null;
  });

  return hdmiWindow;
}

app.whenReady().then(() => {
  createMainWindow();

  // Initialize managers
  fileTransferManager = new FileTransferManager();
  hdmiDisplayManager = new HDMIDisplayManager();

  // Set up IPC handlers
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIPC() {
  // File transfer operations
  ipcMain.handle('select-source-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  ipcMain.handle('select-destination-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  ipcMain.handle('start-transfer', async (event, config) => {
    return await fileTransferManager.startTransfer(config, (progress) => {
      mainWindow.webContents.send('transfer-progress', progress);
      if (hdmiWindow) {
        hdmiWindow.webContents.send('transfer-progress', progress);
      }
    });
  });

  ipcMain.handle('stop-transfer', async () => {
    return await fileTransferManager.stopTransfer();
  });

  ipcMain.handle('get-transfer-stats', async () => {
    return fileTransferManager.getStats();
  });

  // HDMI display operations
  ipcMain.handle('get-displays', async () => {
    const displays = screen.getAllDisplays();
    return displays.map(d => ({
      id: d.id,
      label: d.label || `Display ${d.id}`,
      bounds: d.bounds,
      primary: d.bounds.x === 0 && d.bounds.y === 0
    }));
  });

  ipcMain.handle('open-hdmi-display', async (event, displayId) => {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id === displayId);

    if (targetDisplay) {
      createHDMIWindow(targetDisplay);
      return { success: true };
    }
    return { success: false, error: 'Display not found' };
  });

  ipcMain.handle('close-hdmi-display', async () => {
    if (hdmiWindow) {
      hdmiWindow.close();
      hdmiWindow = null;
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('update-hdmi-content', async (event, content) => {
    if (hdmiWindow) {
      hdmiWindow.webContents.send('update-content', content);
      return { success: true };
    }
    return { success: false };
  });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
