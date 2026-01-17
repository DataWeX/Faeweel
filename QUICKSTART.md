# Faeweel Quickstart Guide

Get up and running with Faeweel in 5 minutes!

## 🚀 Quick Setup

### 1. Install and Run

```bash
# Clone the repository (if not already done)
git clone https://github.com/DataWeX/Faeweel.git
cd Faeweel

# Run setup script (Linux/macOS)
chmod +x scripts/setup.sh
./scripts/setup.sh

# Or install manually
npm install

# Start the application
npm start
```

### 2. First Transfer

1. **Launch Faeweel**
   - The main window will open automatically

2. **Select Folders**
   - Click "Browse" next to **Source Folder**
   - Choose a folder to monitor (e.g., `Downloads`, `Desktop/test-source`)
   - Click "Browse" next to **Destination Folder**
   - Choose where files should go (e.g., `Documents/backup`)

3. **Start Transfer**
   - Leave "Transfer existing files" checked if you want to copy what's already there
   - Click **"Start Transfer"**
   - Watch the statistics update in real-time!

4. **Test It**
   - Copy or create a file in your source folder
   - Watch it automatically appear in the destination folder
   - See statistics update in the dashboard

## 📺 HDMI Display Setup

### Connect External Display

1. **Physical Connection**
   - Connect your second monitor/TV via HDMI

2. **In Faeweel**
   - Go to the "HDMI Display Control" section
   - Click **"Refresh"** to detect displays
   - Select your external display from the dropdown
   - Click **"Open on Display"**

3. **View Statistics**
   - Your external display now shows real-time transfer stats
   - Full-screen visualization with large, readable text
   - Recent transfers list at the bottom
   - Status indicator shows active/idle state

## 🎯 Quick Examples

### Example 1: Auto-Backup Downloads

**Goal**: Automatically backup all downloads to an external drive

```
Source: ~/Downloads
Destination: /Volumes/Backup/Downloads
Transfer Existing: ✓ Checked
```

Click **Start Transfer** - Now every file you download is automatically backed up!

### Example 2: Photo Organization

**Goal**: Auto-transfer photos from camera import folder

```
Source: ~/Pictures/Camera Import
Destination: ~/Pictures/Organized/2026
Transfer Existing: ✗ Unchecked (only new photos)
```

### Example 3: Code Deployment

**Goal**: Auto-copy built files to deployment folder

```
Source: ~/Projects/myapp/dist
Destination: ~/Server/public
Transfer Existing: ✓ Checked
```

Perfect for development workflow - every build is automatically deployed!

## 🛠️ Testing with Sample Files

Use the included test file generator:

```bash
# Create test files
chmod +x scripts/create-test-files.sh
./scripts/create-test-files.sh ./my-test-files

# Or specify a location
./scripts/create-test-files.sh ~/Desktop/faeweel-test
```

This creates 17 test files including:
- 10 text files
- 5 files in a subdirectory
- 1 JSON file
- 1 Markdown file

Now use this folder as your source and watch them transfer!

## 📊 Understanding Statistics

| Statistic | What It Means |
|-----------|---------------|
| **Files Transferred** | Total number of files successfully copied |
| **Data Transferred** | Total size of all transferred files |
| **Transfer Rate** | Current speed in bytes/second |
| **Uptime** | How long the transfer has been running |
| **Queue Length** | Files waiting to be transferred |
| **Errors** | Number of failed transfers |

## 🎨 Activity Log Colors

- 🟢 **Green** - Successful file transfer
- 🔴 **Red** - Error occurred
- 🔵 **Blue** - Informational message (started, stopped, etc.)
- 🟡 **Yellow** - Warning (not currently used)

## ⚡ Keyboard Shortcuts

Currently, use mouse/touch controls. Keyboard shortcuts planned for future release!

## 🐛 Common Issues

**"Please select both source and destination folders"**
- Make sure you've clicked Browse and selected folders for both

**Files not transferring?**
- Check that the source folder has files
- Verify you clicked "Start Transfer"
- Check the Activity Log for errors

**HDMI display not showing?**
- Click "Refresh" in Display Control
- Make sure your second display is connected and detected by your OS
- Try selecting a different display

**Application won't start?**
- Run: `npm install` to ensure dependencies are installed
- Check that Node.js v16+ is installed: `node --version`

## 🔄 Stopping a Transfer

Simply click the **"Stop Transfer"** button!

- Currently queued files will be completed
- File watching will stop
- No new files will be transferred
- You can start again anytime

## 📖 Next Steps

- Read the full [README.md](README.md) for detailed features
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- Explore [config/default.json](config/default.json) for advanced options
- Report issues on GitHub

## 💡 Pro Tips

1. **Keep the app running** - Faeweel works in the background
2. **Use meaningful folder names** - Easy to remember source/destination
3. **Check the log** - Activity log shows exactly what's happening
4. **Test first** - Use test folders before production data
5. **External display** - Great for monitoring during events or presentations

---

**That's it!** You're now ready to use Faeweel. Happy transferring! 🎉
