# 🔄 Faeweel - HDMI File Transfer Application

**Faeweel** is a powerful desktop application that provides continuous file transfer monitoring with real-time HDMI display output. Built with Electron, it offers a flywheel-based architecture for seamless, automated file synchronization with visual feedback on external displays.

## 🌟 Features

### Core Capabilities
- **Automated File Transfer**: Continuously monitors source folders and automatically transfers files to destination
- **Real-time Monitoring**: Watch folder changes in real-time with instant file detection
- **HDMI Display Output**: Project transfer statistics and activity to external displays via HDMI
- **Multi-Display Support**: Choose from any connected display for output visualization
- **Transfer Queue Management**: Efficiently handles multiple file transfers with queue management
- **Statistics Dashboard**: Comprehensive real-time statistics including:
  - Files transferred count
  - Total bytes transferred
  - Transfer rate (bytes/second)
  - Uptime tracking
  - Queue length
  - Error monitoring

### User Interface
- **Clean, Modern Design**: Intuitive interface with responsive layout
- **Live Activity Log**: Real-time logging of all transfer activities
- **Folder Browser**: Easy selection of source and destination folders
- **Transfer Controls**: Start/stop transfers with simple button controls
- **Display Manager**: Easy control of HDMI output windows

### HDMI Display Features
- **Full-screen Visualization**: Beautiful gradient-based display for external monitors
- **Real-time Stats**: Live updating statistics on the external display
- **Recent Transfers List**: Shows the last 5 transferred files with timestamps
- **Status Indicators**: Visual indicators for active/idle transfer states
- **Responsive Design**: Adapts to any display resolution

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Operating System: Windows, macOS, or Linux

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DataWeX/Faeweel.git
   cd Faeweel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

4. **Run in development mode** (with DevTools)
   ```bash
   npm run dev
   ```

### Building for Production

Build standalone executables for your platform:

```bash
npm run build
```

Built applications will be available in the `dist/` directory.

## 📖 Usage Guide

### Basic File Transfer

1. **Launch Faeweel**
   - Start the application using `npm start` or the built executable

2. **Configure Transfer**
   - Click "Browse" next to "Source Folder" to select the folder to monitor
   - Click "Browse" next to "Destination Folder" to select where files should be transferred
   - Check/uncheck "Transfer existing files" based on your needs:
     - ✅ Checked: Transfers all existing files immediately, then monitors for new ones
     - ❌ Unchecked: Only transfers files added after starting the transfer

3. **Start Transfer**
   - Click "Start Transfer" button
   - Monitor progress in the statistics panel and activity log
   - Files are automatically transferred as they're detected

4. **Stop Transfer**
   - Click "Stop Transfer" when done
   - All pending transfers in the queue will be completed

### Using HDMI Display Output

1. **Connect External Display**
   - Connect a second monitor or TV via HDMI or other display connection

2. **Select Display**
   - Click "Refresh" to detect all available displays
   - Choose your target display from the dropdown menu
   - Primary display will be marked with "(Primary)"

3. **Open Display Window**
   - Click "Open on Display" to launch the visualization window
   - The window will open in full-screen on the selected display
   - Real-time statistics will appear automatically

4. **Close Display**
   - Click "Close Display" to close the external display window

### Understanding the Dashboard

#### Statistics Panel
- **Files Transferred**: Total number of files successfully transferred
- **Data Transferred**: Total amount of data moved (in bytes, KB, MB, GB)
- **Transfer Rate**: Current data transfer speed
- **Uptime**: How long the transfer has been running
- **Queue Length**: Number of files waiting to be transferred
- **Errors**: Count of any transfer failures

#### Activity Log
- Real-time log of all transfer activities
- Color-coded entries:
  - 🟢 **Green**: Successful transfers
  - 🔴 **Red**: Errors
  - 🔵 **Blue**: Informational messages
  - 🟡 **Yellow**: Warnings
- Shows timestamps, file names, and file sizes
- Automatically maintains last 100 entries

## 🏗️ Architecture

### Flywheel Concept

Faeweel uses a "flywheel" architecture for continuous, efficient file transfers:

```
┌─────────────────────────────────────────┐
│         Source Folder Watch             │
│         (File System Monitor)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Transfer Queue                   │
│    (Continuous Processing Loop)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      File Transfer Engine                │
│   (Copy with Progress Tracking)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│       Destination Folder                 │
│    (Organized File Structure)           │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Statistics & Display Updates        │
│   (Main UI + HDMI Display Output)       │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Electron**: Cross-platform desktop application framework
- **Node.js**: Backend runtime for file operations
- **Chokidar**: Efficient file system watching
- **HTML/CSS/JavaScript**: Modern web technologies for UI
- **IPC (Inter-Process Communication)**: Communication between main and renderer processes

### Project Structure

```
Faeweel/
├── src/
│   ├── main.js              # Main Electron process
│   ├── fileTransfer.js      # File transfer logic
│   ├── hdmiDisplay.js       # Display management
│   ├── index.html           # Main window UI
│   ├── renderer.js          # Main window logic
│   ├── styles.css           # Main window styles
│   ├── hdmiDisplay.html     # HDMI display UI
│   └── hdmiRenderer.js      # HDMI display logic
├── package.json             # Project configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🔧 Configuration

### Transfer Options

- **Source Folder**: The folder to monitor for files
- **Destination Folder**: Where files will be copied
- **Transfer Existing**: Whether to transfer files that already exist in source

### Advanced Configuration

Edit `package.json` to customize:
- Application name and version
- Build targets for different platforms
- Electron version

## 🐛 Troubleshooting

### Common Issues

**Files not transferring?**
- Ensure both source and destination folders are selected
- Check that you have read permissions for source folder
- Check that you have write permissions for destination folder
- Look for errors in the activity log

**Display not showing?**
- Ensure your second display is properly connected and detected by your OS
- Click "Refresh" to reload the display list
- Try selecting a different display

**Application won't start?**
- Ensure Node.js is installed: `node --version`
- Reinstall dependencies: `npm install`
- Check console for error messages

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📝 License

MIT License - See LICENSE file for details

## 🎯 Use Cases

- **Media Production**: Automatically sync rendered video files to storage servers
- **Data Backup**: Continuous backup of important files to secondary locations
- **Content Distribution**: Transfer files to multiple display stations
- **Live Events**: Monitor file transfers on external displays during events
- **Development**: Sync build outputs to deployment folders
- **Photography**: Auto-transfer photos from camera import folders

## 🚦 Roadmap

Future enhancements planned:
- [ ] Network transfer support (FTP, SFTP, SMB)
- [ ] File filtering by type/size/pattern
- [ ] Scheduled transfers
- [ ] Email notifications on completion/errors
- [ ] Cloud storage integration
- [ ] Transfer history and reporting
- [ ] Compression options
- [ ] Bandwidth throttling
- [ ] Multiple source/destination pairs

## 📧 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review closed issues for similar problems

---

**Built with ❤️ using Electron and Node.js**

*Faeweel - Where continuous file transfer meets visual excellence*
