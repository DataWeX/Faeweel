# Faeweel Assets

This directory contains application assets including icons and images.

## Required Assets

### Application Icons

For production builds, you'll need to provide icons in the following formats:

- **icon.png** - Main application icon (512x512 px recommended)
- **icon.icns** - macOS icon file
- **icon.ico** - Windows icon file

### Icon Requirements

- **Size**: 512x512 pixels (will be scaled down automatically)
- **Format**: PNG with transparency
- **Style**: Clear, recognizable at small sizes
- **Colors**: Should work well on light and dark backgrounds

## Creating Icons

### From PNG to platform-specific formats

**For macOS (.icns):**
```bash
# Using iconutil (macOS only)
mkdir icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
rm -rf icon.iconset
```

**For Windows (.ico):**
- Use online converter: https://convertio.co/png-ico/
- Or use ImageMagick: `convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico`

**For Linux:**
- PNG files work directly
- Place in appropriate sizes in `hicolor` theme directories

## Display Images

You can also add images for the HDMI display:

- **background.png** - Custom background image
- **logo.png** - Logo for display header
- **placeholder.png** - Placeholder for idle state

## Usage in Application

To use custom icons, update `package.json`:

```json
{
  "build": {
    "appId": "com.faeweel.hdmi-transfer",
    "productName": "Faeweel",
    "icon": "assets/icon.png",
    "mac": {
      "icon": "assets/icon.icns"
    },
    "win": {
      "icon": "assets/icon.ico"
    },
    "linux": {
      "icon": "assets/icon.png"
    }
  }
}
```

## License

All assets should be either:
- Created by you
- Licensed for commercial use
- Public domain

Include attribution in this file if required by the asset's license.
