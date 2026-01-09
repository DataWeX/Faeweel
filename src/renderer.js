const { ipcRenderer } = require('electron');

// DOM elements
let sourceFolderInput;
let destFolderInput;
let transferExistingCheckbox;
let startTransferBtn;
let stopTransferBtn;
let displayList;
let openDisplayBtn;
let closeDisplayBtn;
let refreshDisplaysBtn;
let selectSourceBtn;
let selectDestBtn;
let activityLog;

// State
let isTransferring = false;
let hdmiDisplayOpen = false;
let statsUpdateInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initializeElements();
  attachEventListeners();
  loadDisplays();
  startStatsUpdates();
});

function initializeElements() {
  sourceFolderInput = document.getElementById('source-folder');
  destFolderInput = document.getElementById('dest-folder');
  transferExistingCheckbox = document.getElementById('transfer-existing');
  startTransferBtn = document.getElementById('start-transfer');
  stopTransferBtn = document.getElementById('stop-transfer');
  displayList = document.getElementById('display-list');
  openDisplayBtn = document.getElementById('open-display');
  closeDisplayBtn = document.getElementById('close-display');
  refreshDisplaysBtn = document.getElementById('refresh-displays');
  selectSourceBtn = document.getElementById('select-source');
  selectDestBtn = document.getElementById('select-dest');
  activityLog = document.getElementById('activity-log');
}

function attachEventListeners() {
  selectSourceBtn.addEventListener('click', selectSourceFolder);
  selectDestBtn.addEventListener('click', selectDestinationFolder);
  startTransferBtn.addEventListener('click', startTransfer);
  stopTransferBtn.addEventListener('click', stopTransfer);
  openDisplayBtn.addEventListener('click', openHDMIDisplay);
  closeDisplayBtn.addEventListener('click', closeHDMIDisplay);
  refreshDisplaysBtn.addEventListener('click', loadDisplays);

  // Listen for transfer progress
  ipcRenderer.on('transfer-progress', (event, progress) => {
    handleTransferProgress(progress);
  });
}

async function selectSourceFolder() {
  const folder = await ipcRenderer.invoke('select-source-folder');
  if (folder) {
    sourceFolderInput.value = folder;
  }
}

async function selectDestinationFolder() {
  const folder = await ipcRenderer.invoke('select-destination-folder');
  if (folder) {
    destFolderInput.value = folder;
  }
}

async function startTransfer() {
  const source = sourceFolderInput.value;
  const destination = destFolderInput.value;

  if (!source || !destination) {
    addLog('error', 'Please select both source and destination folders');
    return;
  }

  const config = {
    source,
    destination,
    transferExisting: transferExistingCheckbox.checked
  };

  try {
    const result = await ipcRenderer.invoke('start-transfer', config);
    if (result.success) {
      isTransferring = true;
      updateTransferButtons();
      addLog('success', 'Transfer started');
    }
  } catch (error) {
    addLog('error', `Failed to start transfer: ${error.message}`);
  }
}

async function stopTransfer() {
  try {
    const result = await ipcRenderer.invoke('stop-transfer');
    if (result.success) {
      isTransferring = false;
      updateTransferButtons();
      addLog('info', 'Transfer stopped');
    }
  } catch (error) {
    addLog('error', `Failed to stop transfer: ${error.message}`);
  }
}

function updateTransferButtons() {
  startTransferBtn.disabled = isTransferring;
  stopTransferBtn.disabled = !isTransferring;
}

async function loadDisplays() {
  try {
    const displays = await ipcRenderer.invoke('get-displays');
    displayList.innerHTML = '';

    if (displays.length === 0) {
      displayList.innerHTML = '<option value="">No displays found</option>';
      return;
    }

    displays.forEach(display => {
      const option = document.createElement('option');
      option.value = display.id;
      option.textContent = `${display.label}${display.primary ? ' (Primary)' : ''} - ${display.bounds.width}x${display.bounds.height}`;
      displayList.appendChild(option);
    });

    addLog('info', `Loaded ${displays.length} display(s)`);
  } catch (error) {
    addLog('error', `Failed to load displays: ${error.message}`);
  }
}

async function openHDMIDisplay() {
  const displayId = parseInt(displayList.value);
  if (!displayId) {
    addLog('error', 'Please select a display');
    return;
  }

  try {
    const result = await ipcRenderer.invoke('open-hdmi-display', displayId);
    if (result.success) {
      hdmiDisplayOpen = true;
      updateDisplayButtons();
      addLog('success', 'HDMI display opened');
    } else {
      addLog('error', result.error || 'Failed to open display');
    }
  } catch (error) {
    addLog('error', `Failed to open display: ${error.message}`);
  }
}

async function closeHDMIDisplay() {
  try {
    const result = await ipcRenderer.invoke('close-hdmi-display');
    if (result.success) {
      hdmiDisplayOpen = false;
      updateDisplayButtons();
      addLog('info', 'HDMI display closed');
    }
  } catch (error) {
    addLog('error', `Failed to close display: ${error.message}`);
  }
}

function updateDisplayButtons() {
  openDisplayBtn.disabled = hdmiDisplayOpen;
  closeDisplayBtn.disabled = !hdmiDisplayOpen;
}

function handleTransferProgress(progress) {
  if (progress.type === 'file-transferred') {
    addLog('success', `Transferred: ${progress.file} (${formatBytes(progress.size)})`);
    updateStats(progress.stats);
  } else if (progress.type === 'error') {
    addLog('error', `Error: ${progress.error}${progress.file ? ` (${progress.file})` : ''}`);
  }
}

function startStatsUpdates() {
  statsUpdateInterval = setInterval(async () => {
    if (isTransferring) {
      try {
        const stats = await ipcRenderer.invoke('get-transfer-stats');
        updateStats(stats);
      } catch (error) {
        console.error('Failed to update stats:', error);
      }
    }
  }, 1000);
}

function updateStats(stats) {
  document.getElementById('files-transferred').textContent = stats.filesTransferred || 0;
  document.getElementById('bytes-transferred').textContent = formatBytes(stats.bytesTransferred || 0);
  document.getElementById('transfer-rate').textContent = formatBytes(stats.transferRate || 0) + '/s';
  document.getElementById('uptime').textContent = formatDuration(stats.uptime || 0);
  document.getElementById('queue-length').textContent = stats.queueLength || 0;
  document.getElementById('errors').textContent = stats.errors || 0;
}

function addLog(type, message) {
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;

  const timestamp = new Date().toLocaleTimeString();
  logEntry.innerHTML = `
    <span class="log-time">[${timestamp}]</span>
    <span class="log-message">${message}</span>
  `;

  activityLog.insertBefore(logEntry, activityLog.firstChild);

  // Keep only last 100 entries
  while (activityLog.children.length > 100) {
    activityLog.removeChild(activityLog.lastChild);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
