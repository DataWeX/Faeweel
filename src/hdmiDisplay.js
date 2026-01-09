const { EventEmitter } = require('events');

class HDMIDisplayManager extends EventEmitter {
  constructor() {
    super();
    this.currentContent = {
      type: 'idle',
      data: null
    };
    this.displayMode = 'dashboard'; // dashboard, slideshow, video, preview
  }

  setDisplayMode(mode) {
    this.displayMode = mode;
    this.emit('mode-changed', mode);
  }

  updateContent(content) {
    this.currentContent = content;
    this.emit('content-updated', content);
    return { success: true };
  }

  getCurrentContent() {
    return this.currentContent;
  }

  getDisplayMode() {
    return this.displayMode;
  }

  // Format transfer stats for display
  formatStatsForDisplay(stats) {
    return {
      filesTransferred: stats.filesTransferred || 0,
      bytesTransferred: this.formatBytes(stats.bytesTransferred || 0),
      transferRate: this.formatBytes(stats.transferRate || 0) + '/s',
      uptime: this.formatDuration(stats.uptime || 0),
      errors: stats.errors || 0,
      queueLength: stats.queueLength || 0,
      isActive: stats.isTransferring || false
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms) {
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

  // Generate visualization data
  generateVisualization(stats) {
    return {
      type: 'real-time-stats',
      timestamp: Date.now(),
      stats: this.formatStatsForDisplay(stats)
    };
  }
}

module.exports = HDMIDisplayManager;
