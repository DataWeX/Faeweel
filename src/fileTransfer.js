const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { EventEmitter } = require('events');

class FileTransferManager extends EventEmitter {
  constructor() {
    super();
    this.isTransferring = false;
    this.watcher = null;
    this.stats = {
      filesTransferred: 0,
      bytesTransferred: 0,
      errors: 0,
      startTime: null,
      lastTransferTime: null
    };
    this.config = null;
    this.transferQueue = [];
    this.isProcessingQueue = false;
  }

  async startTransfer(config, progressCallback) {
    if (this.isTransferring) {
      throw new Error('Transfer already in progress');
    }

    this.config = config;
    this.progressCallback = progressCallback;
    this.isTransferring = true;
    this.stats.startTime = Date.now();

    // Ensure destination directory exists
    if (!fs.existsSync(config.destination)) {
      fs.mkdirSync(config.destination, { recursive: true });
    }

    // Watch for new files in source directory
    this.watcher = chokidar.watch(config.source, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: !config.transferExisting,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (filePath) => this.handleNewFile(filePath))
      .on('error', (error) => this.handleError(error));

    // If transferring existing files, scan directory
    if (config.transferExisting) {
      await this.scanExistingFiles(config.source);
    }

    return { success: true, message: 'Transfer started' };
  }

  async scanExistingFiles(directory) {
    const files = this.getAllFiles(directory);
    for (const file of files) {
      this.transferQueue.push(file);
    }
    this.processQueue();
  }

  getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        arrayOfFiles = this.getAllFiles(filePath, arrayOfFiles);
      } else {
        arrayOfFiles.push(filePath);
      }
    });

    return arrayOfFiles;
  }

  async handleNewFile(filePath) {
    this.transferQueue.push(filePath);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessingQueue || this.transferQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.transferQueue.length > 0 && this.isTransferring) {
      const filePath = this.transferQueue.shift();
      await this.transferFile(filePath);
    }

    this.isProcessingQueue = false;
  }

  async transferFile(sourcePath) {
    try {
      const relativePath = path.relative(this.config.source, sourcePath);
      const destPath = path.join(this.config.destination, relativePath);
      const destDir = path.dirname(destPath);

      // Create destination directory if it doesn't exist
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copy file
      const stats = fs.statSync(sourcePath);
      await this.copyFile(sourcePath, destPath);

      // Update statistics
      this.stats.filesTransferred++;
      this.stats.bytesTransferred += stats.size;
      this.stats.lastTransferTime = Date.now();

      // Send progress update
      if (this.progressCallback) {
        this.progressCallback({
          type: 'file-transferred',
          file: relativePath,
          size: stats.size,
          stats: this.getStats()
        });
      }

      console.log(`Transferred: ${relativePath}`);
    } catch (error) {
      this.stats.errors++;
      this.handleError(error, sourcePath);
    }
  }

  copyFile(source, destination) {
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(source);
      const writeStream = fs.createWriteStream(destination);

      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);

      readStream.pipe(writeStream);
    });
  }

  async stopTransfer() {
    this.isTransferring = false;

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.transferQueue = [];
    this.isProcessingQueue = false;

    return { success: true, message: 'Transfer stopped' };
  }

  getStats() {
    const uptime = this.stats.startTime ? Date.now() - this.stats.startTime : 0;
    const transferRate = uptime > 0
      ? (this.stats.bytesTransferred / (uptime / 1000)).toFixed(2)
      : 0;

    return {
      ...this.stats,
      uptime,
      transferRate,
      isTransferring: this.isTransferring,
      queueLength: this.transferQueue.length
    };
  }

  handleError(error, file = null) {
    console.error('Transfer error:', error, file);
    if (this.progressCallback) {
      this.progressCallback({
        type: 'error',
        error: error.message,
        file
      });
    }
  }
}

module.exports = FileTransferManager;
