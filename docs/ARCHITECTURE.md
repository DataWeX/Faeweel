# Faeweel Architecture

Technical architecture documentation for developers.

## Overview

Faeweel is built on Electron, utilizing a multi-process architecture with inter-process communication (IPC) for coordinating file transfers and display updates.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐         ┌──────────────────────┐       │
│  │  Main Window   │◄───────►│   Main Process       │       │
│  │  (Renderer)    │   IPC   │                      │       │
│  │                │         │  - File Transfer Mgr │       │
│  │  - UI Controls │         │  - HDMI Display Mgr  │       │
│  │  - Stats View  │         │  - IPC Handlers      │       │
│  │  - Activity Log│         │  - Display Manager   │       │
│  └────────────────┘         └──────────┬───────────┘       │
│         ▲                              │                    │
│         │ IPC Events                   │ IPC                │
│         │                              ▼                    │
│         │                   ┌──────────────────────┐       │
│         └───────────────────┤  HDMI Display Window │       │
│                             │  (Renderer)          │       │
│                             │                      │       │
│                             │  - Stats Visualization│      │
│                             │  - Recent Files      │       │
│                             │  - Status Indicator  │       │
│                             └──────────────────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
           │                           ▲
           │ File Operations           │ File Events
           ▼                           │
┌─────────────────────────────────────────────────────────────┐
│                    File System Layer                         │
│                                                              │
│  ┌─────────────┐      ┌──────────────┐     ┌────────────┐ │
│  │  Chokidar   │──────►│ Transfer     │────►│Destination │ │
│  │  Watcher    │      │ Queue        │     │Folder      │ │
│  │             │      │              │     │            │ │
│  └──────┬──────┘      └──────────────┘     └────────────┘ │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                            │
│  │Source Folder│                                            │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Main Process (src/main.js)

**Responsibilities:**
- Application lifecycle management
- Window creation and management
- IPC handler registration
- Process coordination

**Key Functions:**
- `createMainWindow()` - Creates the main control window
- `createHDMIWindow(display)` - Creates full-screen HDMI display window
- `setupIPC()` - Registers all IPC handlers

**IPC Handlers:**
- `select-source-folder` - Opens folder selection dialog
- `select-destination-folder` - Opens destination folder dialog
- `start-transfer` - Initiates file transfer process
- `stop-transfer` - Halts file transfer
- `get-transfer-stats` - Retrieves current statistics
- `get-displays` - Lists all available displays
- `open-hdmi-display` - Opens HDMI display on specified screen
- `close-hdmi-display` - Closes HDMI display window
- `update-hdmi-content` - Updates HDMI display content

### 2. File Transfer Manager (src/fileTransfer.js)

**Class:** `FileTransferManager extends EventEmitter`

**Responsibilities:**
- File system monitoring using Chokidar
- Transfer queue management
- File copy operations
- Statistics tracking
- Error handling

**Key Properties:**
```javascript
{
  isTransferring: boolean,      // Transfer active status
  watcher: FSWatcher,           // Chokidar watcher instance
  stats: {                      // Transfer statistics
    filesTransferred: number,
    bytesTransferred: number,
    errors: number,
    startTime: timestamp,
    lastTransferTime: timestamp
  },
  config: object,               // Transfer configuration
  transferQueue: array,         // Pending files
  isProcessingQueue: boolean    // Queue processing status
}
```

**Key Methods:**
- `startTransfer(config, progressCallback)` - Initializes transfer
- `stopTransfer()` - Stops transfer and cleanup
- `handleNewFile(filePath)` - Adds file to queue
- `processQueue()` - Processes transfer queue
- `transferFile(sourcePath)` - Copies single file
- `getStats()` - Returns formatted statistics

**Transfer Flow:**
```
1. User starts transfer
2. Chokidar watcher initialized on source folder
3. File events trigger handleNewFile()
4. Files added to transferQueue
5. processQueue() runs continuously
6. Each file transferred via transferFile()
7. Progress callbacks sent to UI
8. Statistics updated in real-time
```

### 3. HDMI Display Manager (src/hdmiDisplay.js)

**Class:** `HDMIDisplayManager extends EventEmitter`

**Responsibilities:**
- Display mode management
- Content formatting for visualization
- Statistics formatting
- Data transformation for display

**Display Modes:**
- `dashboard` - Real-time statistics grid
- `slideshow` - Rotating display (future)
- `video` - Video playback (future)
- `preview` - File preview mode (future)

**Key Methods:**
- `setDisplayMode(mode)` - Changes display mode
- `updateContent(content)` - Updates display content
- `formatStatsForDisplay(stats)` - Formats statistics
- `generateVisualization(stats)` - Creates visualization data

### 4. Main Window Renderer (src/renderer.js)

**Responsibilities:**
- UI event handling
- Folder selection
- Transfer control
- Statistics display updates
- Activity log management
- Display control

**Key Functions:**
- `selectSourceFolder()` - Handles source folder selection
- `selectDestinationFolder()` - Handles destination selection
- `startTransfer()` - Initiates transfer via IPC
- `stopTransfer()` - Stops transfer via IPC
- `handleTransferProgress(progress)` - Updates UI on progress
- `updateStats(stats)` - Updates statistics display
- `addLog(type, message)` - Adds entry to activity log
- `loadDisplays()` - Fetches available displays
- `openHDMIDisplay()` - Opens external display
- `closeHDMIDisplay()` - Closes external display

**Event Listeners:**
- `transfer-progress` - Receives progress updates from main process
- Button clicks for all UI controls
- Automatic stats refresh every 1 second

### 5. HDMI Display Renderer (src/hdmiRenderer.js)

**Responsibilities:**
- HDMI display UI updates
- Real-time statistics visualization
- Recent files list management
- Status indicator updates

**Key Functions:**
- `handleTransferProgress(progress)` - Updates on file transfer
- `updateStats(stats)` - Updates statistics display
- `updateStatus(isActive)` - Updates status indicator
- `addRecentFile(fileName, size)` - Adds to recent files list
- `updateRecentFilesList()` - Refreshes recent files UI

## Data Flow

### Transfer Initiation
```
1. User clicks "Start Transfer" in Main Window
2. renderer.js calls startTransfer()
3. IPC message sent to main process
4. main.js receives 'start-transfer' event
5. fileTransferManager.startTransfer() called
6. Chokidar watcher initialized
7. Success response sent back to renderer
8. UI updated to show transfer active
```

### File Transfer Process
```
1. New file detected by Chokidar
2. FileTransferManager.handleNewFile() triggered
3. File added to transferQueue
4. processQueue() picks up file
5. transferFile() copies file
6. Progress callback executed
7. main.js receives progress update
8. IPC events sent to both windows:
   - Main window: 'transfer-progress'
   - HDMI display: 'transfer-progress'
9. Both renderers update their displays
10. Statistics incremented
```

### Statistics Update Cycle
```
Main Window:
1. setInterval every 1000ms
2. Calls ipcRenderer.invoke('get-transfer-stats')
3. main.js returns current stats
4. renderer.js updates UI elements

HDMI Display:
1. Receives 'transfer-progress' events
2. Extracts stats from progress object
3. Updates large stat displays
4. Updates recent files list
```

## Event System

### IPC Events

**Main Process → Renderer (broadcast):**
- `transfer-progress` - File transfer progress update
  ```javascript
  {
    type: 'file-transferred',
    file: 'path/to/file.txt',
    size: 1024,
    stats: { /* current stats */ }
  }
  ```
- `update-content` - HDMI display content update

**Renderer → Main Process (request/response):**
- `select-source-folder` → `folderPath`
- `select-destination-folder` → `folderPath`
- `start-transfer` → `{ success: boolean, message: string }`
- `stop-transfer` → `{ success: boolean, message: string }`
- `get-transfer-stats` → `stats object`
- `get-displays` → `array of display objects`
- `open-hdmi-display` → `{ success: boolean, error?: string }`
- `close-hdmi-display` → `{ success: boolean }`

## File System Operations

### Watching

**Library:** Chokidar

**Configuration:**
```javascript
{
  ignored: /(^|[\/\\])\../,  // Ignore dotfiles
  persistent: true,
  ignoreInitial: !config.transferExisting,
  awaitWriteFinish: {
    stabilityThreshold: 2000,  // Wait 2s for file to finish writing
    pollInterval: 100          // Check every 100ms
  }
}
```

**Events Monitored:**
- `add` - New file detected
- `error` - Watch error occurred

### Transfer Queue

**Implementation:** Array-based FIFO queue

**Processing:**
- Single file processed at a time (sequential)
- Queue drained continuously while transfer active
- New files added asynchronously
- Process continues until queue empty and transfer stopped

### File Copying

**Method:** Stream-based copying

```javascript
readStream = fs.createReadStream(source)
writeStream = fs.createWriteStream(destination)
readStream.pipe(writeStream)
```

**Features:**
- Memory efficient for large files
- Preserves directory structure
- Creates destination directories as needed
- Handles errors per-file

## Performance Considerations

### Memory Management
- Stream-based file copying (no full file loads)
- Limited activity log entries (100 max)
- Limited recent files in HDMI display (5 max)
- Queue size monitoring

### CPU Usage
- Single file transfer at a time
- Efficient file watching with Chokidar
- Throttled UI updates (1 second intervals)
- Event-driven architecture

### Scalability
- Handles large numbers of files via queue
- Supports large individual files via streaming
- Recursive directory watching
- No memory leaks from EventEmitter usage

## Security Considerations

### File Access
- Uses Electron dialog for folder selection (safe)
- Validates paths before operations
- No arbitrary path execution
- Read permissions checked on source
- Write permissions checked on destination

### IPC Communication
- Context isolation disabled (required for Node.js integration)
- Only trusted code in renderer processes
- No remote content loaded
- All IPC handlers validated

## Error Handling

### Levels
1. **File-level errors**
   - Logged to stats.errors
   - Reported in activity log
   - Transfer continues for other files

2. **Watcher errors**
   - Logged to console
   - Progress callback notified
   - May require restart

3. **Fatal errors**
   - Uncaught exceptions logged
   - App may need restart

### Recovery
- Individual file failures don't stop queue
- Watcher can be restarted
- Statistics preserved across errors
- User notified via UI

## Future Enhancements

### Planned Architecture Changes
- [ ] Multi-threaded file transfer (worker threads)
- [ ] Plugin system for transfer protocols
- [ ] Database for transfer history
- [ ] WebSocket server for remote monitoring
- [ ] Test framework integration
- [ ] State management library (Redux/MobX)

---

**Last Updated:** 2026-01-17
