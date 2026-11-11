# HelixOS — Repurposed Ideas & Backlog

Saved/repurposed from chat context (previous session artifacts are **not** in this workspace; `/workspace/app` currently has only git + notes). Use this as the working spec to rebuild/refine here.

## 1) Product vision
- **HelixOS**: a browser-based, Linux-like shell/desktop experience (static HTML/CSS/JS, no backend required).
- **Honest identity**: not real Linux — runs as a JavaScript “kernel” in the browser (e.g. `wasm32`/`helix 1.0.0-js` style in UI). Features like Wine are **compatibility shims**, not real Win32/ELF execution.

## 2) Boot & session flow (repurposed)
- Boot: BIOS-style checks (memory/storage) → kernel/dmesg-style log (timestamps, virtual hardware) → handoff to `tty1`.
- Login/getty: `login:` prompt on `tty1` (e.g. `guest`/`root`, simple password/auth model), shell only after authentication.
- Console-first UX: text shell on TTY; graphical environment started explicitly via `startx` (e.g. HelixDE + helixwm on `:0`).
- Desktop model: terminal becomes an app/window inside DE; `logout` returns to console. GUI apps require active display/DE where applicable.

## 3) Virtual system
- **VFS** persisted in `localStorage` with Unix-like layout (`/bin`, `/home`, `/etc`, `/usr`, `/tmp`, `/var`, `/root`, per-user dirs).
- Seeded content: README, `/etc/motd`, fortunes, sample docs/todo/poem, dotfiles; `resetfs`/reseed path for upgrades.
- Multi-user basics: home dirs, ownership/mode metadata as feasible.

## 4) Shell & commands
- POSIX-like command set (file ops, text processing, system/process/net-ish fakes, utilities) with help/man, tab completion, history, basic pipes/redirects, ANSI color.
- Shortcuts: Enter, history nav, Tab, Ctrl+C/L/U/A/E (and others as needed).
- Utilities/apps ideas: `neofetch` (report JS kernel truthfully), `edit/nano`-like, `bc`/calc, `python`-expr eval (toy), themes, status/menubar info (host/user/time/load/cpu/mem).

## 5) Apps & windows (TTY overlays / DE windows)
- Core: terminal, text editor, file browser/manager.
- File manager: browse VFS, open/edit, upload/drag-drop into VFS, download/save to device; handle binary vs text safely.
- Fun/system: `snake` (+ tetris/hangman optional), `matrix`, `fortune`, `cowsay`, clock, settings/theme.
- **Media manager (requested, spec TBD)** — candidate repurpose:
  - Library for images/audio/video stored in VFS (and/or imported).
  - Import/upload, preview/play, basic metadata, folders/tags, open/download to device.
  - Run as TTY overlay or DE app window consistent with chosen UX.

## 6) Wine-style compatibility layer (shim, not real Wine)
- `wine <program>` command + basic prefix layout in VFS (e.g. `~/.wine/drive_c/...`).
- Map common names to Helix apps (e.g. `notepad.exe`, `explorer.exe`, `cmd.exe`) and provide `winecfg`.
- Refuse real PE/Win32 binaries with clear, honest errors; file manager/open handlers should detect and explain.
- Desktop launcher/menu entry when DE is running; mention in seeded docs/motd.

## 7) Visual design
- Retro-futuristic CRT terminal aesthetic (scanlines, vignette, phosphor glow/flicker), dark theme with accent palettes (phosphor/amber/ice/rose/ultraviolet).
- Monospace fonts (e.g. JetBrains Mono/Fira/IBM Plex Mono/VT323). Responsive full-viewport layout.

## 8) Open questions / to confirm before build
- [ ] Final name/scope for this rebuild (HelixOS/NEXUS/etc.) and MVP feature set.
- [ ] “Helix OS and then a wallet” mentioned earlier — include a **wallet** app/module? what kind (UI mock, VFS-stored data, crypto? scope)?
- [ ] Media manager: supported types, features, and UI (TTY vs window).
- [ ] Wine shim: exact command behavior, mappings, prefix paths, PE detection/error text.
- [ ] Preferred file/module structure and run/preview method in this environment.
- [ ] Start implementation now? if so, prioritize: (a) boot/login/shell, (b) startx/DE+wm, (c) file manager, (d) media manager, (e) wine shim.

---
*Edit this file to set priorities and answer open questions, then ask to proceed.*
