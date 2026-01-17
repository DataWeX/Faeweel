# VS Code Setup for Orant Lang

This guide helps you set up Visual Studio Code for the best development experience with `.lang` files.

## 🎨 Syntax Highlighting

We've included TextMate grammar files for syntax highlighting!

### Enable Syntax Highlighting

**Option 1: Automatic (Recommended)**

The syntax highlighting should work automatically when you open a `.lang` file in the `orant/` workspace.

**Option 2: Manual Association**

1. Open a `.lang` file
2. Click the language indicator in the bottom-right (might say "Plain Text")
3. Select "Configure File Association for '.lang'..."
4. Type "Orant Lang" or select it from the list

**Option 3: Settings**

Add to your VS Code `settings.json`:

```json
{
  "files.associations": {
    "*.lang": "lang"
  }
}
```

## ✨ Features Included

### 1. Syntax Highlighting

Keywords are color-coded:
- **Control keywords**: `invoke`, `as`, `sequence`, `frame`, `render`, `scene`, `emit`
- **Action keywords**: `moves`, `appears`, `floats`, `glows`, `fades`, `merges`, `spins`
- **Modifiers**: `gently`, `bright`, `clockwise`, `in`, `out`
- **Types**: `Son`, `Angel`, `Island`, `DataSphere`
- **Comments**: Lines starting with `#`
- **Strings**: Quoted text
- **Numbers**: Including units like `3s`, `100px`
- **Colors**: Hex codes like `#FF6B35`

### 2. Auto-Closing Pairs

When you type:
- `{` → automatically adds `}`
- `(` → automatically adds `)`
- `"` → automatically adds `"`
- `'` → automatically adds `'`

### 3. Bracket Matching

Click on a bracket and its matching pair will be highlighted.

### 4. Comment Support

Use `Ctrl+/` (or `Cmd+/` on Mac) to toggle line comments.

### 5. Code Snippets

Type these prefixes and press `Tab`:

| Prefix | Description | Result |
|--------|-------------|--------|
| `invoke` | Invoke entity | Full invoke statement |
| `invokeson` | Invoke son | Son with aspect |
| `invokeangel` | Invoke angel | Angel with wings |
| `sequence` | Sequence block | Full sequence structure |
| `frame` | Frame block | Frame with actions |
| `render` | Render scene | Complete render statement |
| `appears` | Appears action | Entity appears at... |
| `moves` | Move action | Entity moves to... |
| `glows` | Glow effect | Entity glows bright |
| `fades` | Fade effect | Entity fades in/out |
| `floats` | Float action | Entity floats gently |
| `emit` | Emit particles | Emit particles: N |
| `merges` | Merge action | Entity merges with... |
| `program` | Complete program | Full template |

### 6. Indentation

Auto-indent works with braces:
- Opening `{` → increases indent
- Closing `}` → decreases indent

## 🚀 Usage Example

### Using Snippets

1. Type `invoke` and press `Tab`
2. Type the entity name, press `Tab`
3. Select entity type from dropdown, press `Tab`
4. Fill in color, press `Tab`
5. Continue filling in fields

**Result:**
```lang
invoke MyEntity as Son {
  color: "#FF6B35"
  property: value
}
```

### Using Auto-Complete

Type `inv` and you'll see suggestions:
- `invoke` snippet
- `invokeson` snippet
- `invokeangel` snippet

Press `Tab` or `Enter` to accept.

## ⚙️ Recommended VS Code Settings

Add to your `settings.json`:

```json
{
  // File associations
  "files.associations": {
    "*.lang": "lang"
  },

  // Editor settings for .lang files
  "[lang]": {
    "editor.tabSize": 2,
    "editor.insertSpaces": true,
    "editor.detectIndentation": false,
    "editor.formatOnSave": false,
    "editor.wordWrap": "off"
  },

  // Syntax highlighting
  "editor.tokenColorCustomizations": {
    "textMateRules": [
      {
        "scope": "keyword.control.lang",
        "settings": {
          "foreground": "#C586C0",
          "fontStyle": "bold"
        }
      },
      {
        "scope": "keyword.action.lang",
        "settings": {
          "foreground": "#4EC9B0"
        }
      },
      {
        "scope": "constant.other.color.lang",
        "settings": {
          "foreground": "#CE9178"
        }
      }
    ]
  }
}
```

## 🎯 Workflow Tips

### 1. Quick File Navigation

Use `Ctrl+P` (or `Cmd+P`) and type `.lang` to see all lang files.

### 2. Multi-Cursor Editing

When editing multiple entities:
1. Select an entity name
2. Press `Ctrl+D` (or `Cmd+D`) to select next occurrence
3. Edit all at once

### 3. Folding Code Blocks

Click the arrows next to line numbers to fold/unfold:
- Sequences
- Frames
- Invoke blocks
- Render blocks

### 4. Go to Definition

While this doesn't work automatically, you can:
1. Select entity name
2. Press `Ctrl+F` (or `Cmd+F`) to find all usages

### 5. Format Document

While auto-formatting isn't available yet, you can:
1. Select all (`Ctrl+A` or `Cmd+A`)
2. Use `Tab` and `Shift+Tab` to adjust indentation

## 🐛 Troubleshooting

### Syntax Highlighting Not Working

**Try these steps:**

1. **Reload Window**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
   - Type "Developer: Reload Window"
   - Press Enter

2. **Check File Association**
   - Look at bottom-right of VS Code
   - Should say "Orant Lang" or "lang"
   - If not, click and select "lang"

3. **Verify Files Exist**
   - Make sure `.vscode/lang.tmLanguage.json` exists
   - Make sure `.vscode/language-configuration.json` exists

4. **Check Extensions**
   - Make sure no conflicting extensions are installed
   - Try disabling other language extensions temporarily

### Snippets Not Working

1. Make sure `.vscode/lang.code-snippets` exists
2. Try typing the full prefix (e.g., `invoke`) then press `Tab`
3. Check that IntelliSense is enabled in VS Code settings

### Auto-Complete Not Showing

1. Press `Ctrl+Space` to manually trigger
2. Check VS Code settings for `"editor.quickSuggestions"`
3. Make sure `"editor.suggest.snippetsPreventQuickSuggestions"` is `false`

## 📝 Example Workflow

### Creating a New Animation

1. Create new file: `my-animation.lang`
2. Type `program` and press `Tab`
3. Fill in the template
4. Use snippets for additional entities and sequences
5. Save file
6. Compile: `node dist/compiler.js my-animation.lang`

### Editing Existing File

1. Open `.lang` file
2. Use code folding to navigate
3. Use multi-cursor for bulk edits
4. Use snippets for new sections
5. Save and compile

## 🎨 Color Scheme Recommendations

The syntax highlighting works best with these VS Code themes:
- **Dark+** (default dark)
- **Monokai**
- **Dracula**
- **One Dark Pro**
- **Material Theme**

## 🔧 Advanced: Custom Theme

To create custom colors for lang syntax:

```json
{
  "editor.tokenColorCustomizations": {
    "[Your Theme Name]": {
      "textMateRules": [
        {
          "scope": "keyword.control.lang",
          "settings": {
            "foreground": "#FF6B35",  // Custom orange
            "fontStyle": "bold"
          }
        },
        {
          "scope": "storage.type.lang",
          "settings": {
            "foreground": "#4A90E2",  // Custom blue
            "fontStyle": "italic"
          }
        }
      ]
    }
  }
}
```

## ✨ Future Enhancements

Planned features:
- [ ] Language Server Protocol (LSP) for real autocomplete
- [ ] Error checking in editor
- [ ] Hover tooltips with entity info
- [ ] Go to definition for entities
- [ ] Rename refactoring
- [ ] Code formatting
- [ ] Debugging support

## 📚 Learn More

- **Language Reference**: See `LANGUAGE_REFERENCE.md`
- **Quick Start**: See `QUICKSTART.md`
- **TypeScript Guide**: See `TYPESCRIPT.md`

---

**Enjoy coding with Orant Lang in VS Code!** ✨

If you have suggestions for improving the VS Code experience, please contribute to the project!
