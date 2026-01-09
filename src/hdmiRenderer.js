const { ipcRenderer } = require('electron');

// State
let recentFiles = [];
const MAX_RECENT_FILES = 5;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupListeners();
  updateDisplay();
});

function setupListeners() {
  // Listen for transfer progress from main window
  ipcRenderer.on('transfer-progress', (event, progress) => {
    handleTransferProgress(progress);
  });

  // Listen for content updates
  ipcRenderer.on('update-content', (event, content) => {
    updateContent(content);
  });
}

function handleTransferProgress(progress) {
  if (progress.type === 'file-transferred') {
    // Add to recent files
    addRecentFile(progress.file, progress.size);

    // Update stats display
    updateStats(progress.stats);

    // Update status
    updateStatus(true);
  } else if (progress.type === 'error') {
    console.error('Transfer error:', progress.error);
  }
}

function updateStats(stats) {
  document.getElementById('display-files').textContent = stats.filesTransferred || 0;
  document.getElementById('display-bytes').textContent = formatBytes(stats.bytesTransferred || 0);
  document.getElementById('display-rate').textContent = formatBytes(stats.transferRate || 0) + '/s';
  document.getElementById('display-uptime').textContent = formatDuration(stats.uptime || 0);
  document.getElementById('display-queue').textContent = stats.queueLength || 0;
  document.getElementById('display-errors').textContent = stats.errors || 0;

  // Update status based on transfer state
  updateStatus(stats.isTransferring);
}

function updateStatus(isActive) {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  if (isActive) {
    statusDot.classList.remove('inactive');
    statusText.textContent = 'Active';
  } else {
    statusDot.classList.add('inactive');
    statusText.textContent = 'Idle';
  }
}

function addRecentFile(fileName, size) {
  const timestamp = new Date().toLocaleTimeString();

  recentFiles.unshift({
    name: fileName,
    size: formatBytes(size),
    time: timestamp
  });

  // Keep only the most recent files
  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  }

  updateRecentFilesList();
}

function updateRecentFilesList() {
  const fileList = document.getElementById('file-list');

  if (recentFiles.length === 0) {
    fileList.innerHTML = '<div class="file-entry">No transfers yet...</div>';
    return;
  }

  fileList.innerHTML = recentFiles.map(file => `
    <div class="file-entry">
      <strong>${file.name}</strong> - ${file.size} - ${file.time}
    </div>
  `).join('');
}

function updateContent(content) {
  // Handle custom content updates from main process
  console.log('Content update:', content);
  // Can be extended for different content types
}

function updateDisplay() {
  // Initial display update
  updateRecentFilesList();
  updateStatus(false);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
