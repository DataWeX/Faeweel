# Changelog

All notable changes to Faeweel will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-17

### Added
- Initial release of Faeweel HDMI File Transfer Application
- Electron-based desktop application for Windows, macOS, and Linux
- Real-time file transfer monitoring with automatic synchronization
- File system watching using Chokidar
- Queue-based transfer processing
- Comprehensive statistics tracking:
  - Files transferred count
  - Total bytes transferred
  - Real-time transfer rate
  - Uptime tracking
  - Queue length monitoring
  - Error counting
- HDMI display output for external monitors
- Multi-display support with display selection
- Full-screen visualization on external displays
- Real-time statistics on HDMI display
- Recent transfers list (last 5 files)
- Visual status indicators (active/idle)
- Modern, responsive main window UI with:
  - Transfer configuration panel
  - Display control panel
  - Statistics dashboard (6 metrics)
  - Live activity log with color-coding
  - Folder browser integration
- Transfer controls (start/stop/configure)
- "Transfer existing files" option for initial sync
- Directory structure preservation during transfer
- Automatic destination directory creation
- Stream-based file copying for memory efficiency
- Error handling and recovery
- Activity logging with timestamps
- IPC-based communication between windows
- Development scripts:
  - Setup script (`scripts/setup.sh`)
  - Development mode script (`scripts/dev.sh`)
  - Test file generator (`scripts/create-test-files.sh`)
- Configuration system (`config/default.json`)
- VS Code integration:
  - Editor settings
  - Debug configurations
- Comprehensive documentation:
  - README with feature overview
  - QUICKSTART guide for new users
  - CONTRIBUTING guidelines
  - Architecture documentation
  - Asset guidelines
- MIT License

### Technical Details
- Electron ^28.0.0
- Node.js file system operations
- Chokidar ^3.5.3 for file watching
- WebSocket ^8.16.0 for future enhancements
- Event-driven architecture with EventEmitter
- Multi-process design (main + renderers)
- Real-time UI updates via IPC events

### Known Issues
- None at initial release

## [Unreleased]

### Planned Features
- Network transfer support (FTP, SFTP, SMB)
- File filtering by type, size, and pattern
- Scheduled transfers
- Email notifications on completion/errors
- Cloud storage integration (S3, Dropbox, Google Drive)
- Transfer history and reporting
- Compression options
- Bandwidth throttling
- Multiple source/destination pairs
- Themes and customization
- Internationalization (i18n)
- Unit and integration tests
- Performance optimizations
- Improved error recovery
- Plugin system
- Command-line interface
- System tray integration
- Auto-update functionality

---

## Version History Format

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes to existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security improvements

---

[1.0.0]: https://github.com/DataWeX/Faeweel/releases/tag/v1.0.0
