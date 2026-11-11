# HelixOS - project notes and requirements (collected)

## Current workspace state
- `/workspace/app` was cleared earlier at user request (only `.git` kept). No prior project files or running preview are present in this workspace.
- This file captures context shared in chat so work can continue here.

## Context / prior session logs (not present locally)
User pasted fragments from earlier sessions describing a browser-based shell OS project ("HelixOS"/"NEXUS"/"AURORA" mentioned in logs) with goals/features like:
- Boot sequence: BIOS-style header/memory/storage checks → kernel boot messages (timestamps, virtual hardware) → login/getty on `tty1` (guest/root, password check) → shell after auth.
- `startx` launches a window manager/desktop (HelixDE + helixwm on `:0`); terminal becomes an app window; `logout` returns to console. GUI apps require desktop (DISPLAY) where applicable.
- Virtual filesystem persisted via `localStorage`, Unix-like layout (`/bin`, `/home`, `/etc`, `/usr`, `/tmp`, `/var`, `/root`, guest dirs), preloaded files (README, motd, fortunes, todo, poem, secret dotfile), multiple users.
- Shell: POSIX-like commands (file ops, text processing, system utils, process mgmt, networking-ish fakes), command history, tab completion, pipes/redirects (basic), ANSI color output, Ctrl+C/L/U/A/E shortcuts, man/help, neofetch, themes (phosphor/amber/ice/rose/ultraviolet), status bar (hostname/user/time/load or CPU/mem/time).
- TUI/apps: editor (nano-like), calculator/bc/python-eval, snake, tetris?, hangman?, matrix rain, fortune, cowsay, clock, file browser/manager, mail/AI chat/music visualizer/browser (fake) — scope varied across notes.
- File manager: upload/drag-drop into HelixOS vfs, save/download to device, open/edit files; UI as overlay/window.
- Media manager (requested, details TBD): "its own media manager" — needs clarification (images/audio/video, library, preview/play, folders/tags, import/export).
- Wine-style compatibility layer (requested in logs): fake Wine for browser-based OS (cannot run real Win32). Ideas mentioned: `wine` commands, wine prefix, window/chrome for `.exe`, map notepad/explorer/cmd to Helix apps, honest errors for real binaries/PE; neofetch should report actual JS kernel (not Linux).
- Stack: static HTML/CSS/JS (no backend/Vite preferred in notes), modular JS (e.g. kernel/vfs/shell/commands/apps/terminal/main or consolidated), CRT/retro-futuristic visuals (scanlines, phosphor/glow, fonts like JetBrains Mono/Fira/IBM Plex/VT323).
- Preview previously served on port 8000 in other env (not available here).

## User clarifications still needed
- Exact product name and scope to build now (HelixOS features to include/exclude).
- "Helix OS and then a wallet" was mentioned earlier but not found/specified — include wallet? what kind?
- Media manager: supported media types and required features/UI.
- Wine layer: exact command set, prefix paths, `.exe` mappings, and error behavior.
- Should this be rebuilt from scratch in this workspace? preferred file structure?
- Any run/preview expectations for this environment.

## Next step
User: edit this file to confirm priorities and details, then ask to proceed.
