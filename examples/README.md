# Faeweel Examples

This directory contains examples and test scenarios for Faeweel.

## Directory Structure

```
examples/
├── source/              # Source folder for testing
├── destination/         # Destination folder for testing
├── test-files/          # Pre-generated test files
└── scenarios/           # Example use case configurations
```

## Quick Test

1. **Generate test files**:
   ```bash
   cd /path/to/Faeweel
   chmod +x scripts/create-test-files.sh
   ./scripts/create-test-files.sh examples/test-files
   ```

2. **In Faeweel**:
   - Source: `examples/source`
   - Destination: `examples/destination`
   - Transfer Existing: Unchecked

3. **Copy files**:
   ```bash
   cp examples/test-files/* examples/source/
   ```

4. **Watch them transfer** in real-time!

## Example Scenarios

### Scenario 1: Photo Backup
**Goal**: Backup photos from camera import folder

```json
{
  "name": "Photo Backup",
  "source": "~/Pictures/Camera Import",
  "destination": "/Volumes/Backup/Photos/2026",
  "transferExisting": false,
  "description": "Auto-backup new photos to external drive"
}
```

**Setup**:
1. Connect camera or import photos to Camera Import folder
2. Set source to your camera import folder
3. Set destination to backup drive
4. Uncheck "Transfer Existing" (only new imports)
5. Start transfer

### Scenario 2: Development Build Deployment
**Goal**: Auto-deploy build files to server folder

```json
{
  "name": "Dev Deployment",
  "source": "~/Projects/myapp/dist",
  "destination": "~/Server/public/myapp",
  "transferExisting": true,
  "description": "Deploy build output automatically"
}
```

**Workflow**:
1. Run your build: `npm run build`
2. Files automatically copied to server folder
3. Test server serves updated files immediately
4. No manual copy step needed!

### Scenario 3: Document Sync
**Goal**: Sync documents between two locations

```json
{
  "name": "Document Sync",
  "source": "~/Documents/Work",
  "destination": "/Volumes/USB Drive/Work Backup",
  "transferExisting": true,
  "description": "Backup work documents to USB drive"
}
```

**Use Case**:
- Keep USB drive in sync with work folder
- Every saved document automatically backed up
- Great for end-of-day backups

### Scenario 4: Download Organization
**Goal**: Auto-organize downloads by type

**Setup Multiple Transfers** (future feature):
```json
[
  {
    "source": "~/Downloads/*.pdf",
    "destination": "~/Documents/PDFs"
  },
  {
    "source": "~/Downloads/*.jpg",
    "destination": "~/Pictures/Downloads"
  },
  {
    "source": "~/Downloads/*.zip",
    "destination": "~/Archives/Downloads"
  }
]
```

*Note: File filtering not yet implemented in v1.0*

### Scenario 5: Media Production
**Goal**: Transfer rendered videos with HDMI monitoring

```json
{
  "name": "Video Render Transfer",
  "source": "~/Renders/Output",
  "destination": "/Volumes/Storage/Final Renders",
  "transferExisting": false,
  "hdmiDisplay": true,
  "description": "Transfer completed renders with visual feedback"
}
```

**Benefits**:
- See transfer progress on studio monitor
- Large statistics display easy to see from distance
- Perfect for production environments

### Scenario 6: Code Backup
**Goal**: Continuous backup of source code

```json
{
  "name": "Code Backup",
  "source": "~/Projects/important-project/src",
  "destination": "/Volumes/Backup/Code/important-project",
  "transferExisting": true,
  "description": "Real-time source code backup"
}
```

**Best Practice**:
- Still use git for version control!
- This is for disaster recovery backup
- Complements, doesn't replace git

## Testing Scenarios

### Test 1: Basic Single File
```bash
# Create one file in source
echo "Hello Faeweel" > examples/source/test.txt

# Expected: File appears in destination within seconds
# Check: Activity log shows transfer
# Check: Statistics show 1 file transferred
```

### Test 2: Multiple Files
```bash
# Copy test files
cp examples/test-files/*.txt examples/source/

# Expected: All files transferred
# Check: Queue length increases then decreases
# Check: Files appear in destination
```

### Test 3: Directory Structure
```bash
# Create nested structure
mkdir -p examples/source/level1/level2
echo "Deep file" > examples/source/level1/level2/deep.txt

# Expected: Full structure preserved in destination
# Check: destination/level1/level2/deep.txt exists
```

### Test 4: Large File
```bash
# Create 100MB test file
dd if=/dev/zero of=examples/source/large.bin bs=1M count=100

# Expected: Transfer completes successfully
# Check: Transfer rate shows in statistics
# Check: No memory issues
```

### Test 5: Special Characters
```bash
# Create files with special characters
touch examples/source/"file with spaces.txt"
touch examples/source/"file-with-dashes.txt"
touch examples/source/"file_with_underscores.txt"

# Expected: All files transferred correctly
# Check: Names preserved exactly
```

### Test 6: HDMI Display
```
1. Connect second monitor
2. Refresh display list
3. Select external display
4. Open HDMI display
5. Start transfer
6. Copy files to source
7. Expected: Statistics update on both screens
8. Check: Recent files list updates
9. Check: Status indicator shows "Active"
```

## Troubleshooting Examples

### Issue: Files not transferring

**Test**:
```bash
# Check source folder
ls -la examples/source

# Check permissions
ls -ld examples/destination

# Check if transfer is started
# Look for "Transfer started" in activity log
```

**Solution**: Ensure both folders exist and have proper permissions

### Issue: Partial transfers

**Test**:
```bash
# Check disk space
df -h

# Check destination
ls -la examples/destination
```

**Solution**: Ensure adequate disk space

## Cleanup

To clean up test files:

```bash
# Remove all test files
rm -rf examples/source/*
rm -rf examples/destination/*
rm -rf examples/test-files/*

# Or use git to reset
git clean -fdx examples/
```

## Creating Your Own Tests

1. **Create test directory**:
   ```bash
   mkdir -p my-test/{source,destination}
   ```

2. **Generate files**:
   ```bash
   ./scripts/create-test-files.sh my-test/source
   ```

3. **Configure Faeweel**:
   - Source: `my-test/source`
   - Destination: `my-test/destination`

4. **Test and observe**!

## Example Data Sets

### Small (17 files, ~10 KB)
```bash
./scripts/create-test-files.sh examples/small-test
```

### Medium (100 files, ~1 MB)
```bash
for i in {1..100}; do
  echo "Test data $i" > examples/medium-test/file_$i.txt
done
```

### Large (1000 files, ~100 MB)
```bash
for i in {1..1000}; do
  dd if=/dev/urandom of=examples/large-test/file_$i.bin bs=100k count=1 2>/dev/null
done
```

---

Happy testing! 🧪
