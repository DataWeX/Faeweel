# HelixOS — Roadmap (concept & plan before build)

**Status:** Planning only — no implementation started in this workspace (`/workspace/app` has git + notes only).

## 0) Concept
Build a browser-based “HelixOS” experience. Two architectural directions exist; **decision required before build**:

| Track | Description | Pros | Cons / constraints |
|---|---|---|---|
| **A. JS-simulated OS** | Custom JS “kernel”, VFS in `localStorage`, fake shell/commands/apps, CRT UI, optional `startx` DE. | Lightweight, full UI/UX control, easy persistence/themes, works offline as static files. | Not a real Linux kernel/shell; binaries/Wine are shims only. |
| **B. Real Linux VM in browser** | Run real Linux userspace (and kernel image, depending on tech) via x86 emulator/virtualization in WASM; real shell (`ash`/`bash`) and real ELF tools. | Authentic shell/binaries, closer to “real x64 Linux” behavior. | Large downloads, slower, limited devices/networking, complex integration; **x86_64 guest support varies by engine**. |

**User signal:** wants a “real shell in browser for x64 Linux” → Track B is a primary candidate, but **true x86_64** in-browser is constrained (32-bit guests are easier/more common; some stacks virtualize x86 userland differently). Wine running *real* Windows binaries in-browser remains impractical without heavy full-machine emulation + compatible userspace.

### Candidate engines (Track B) — to evaluate
- **v86** (OSS): x86 PC emulator in WASM; boots real Linux images — strong for authentic kernel+shell; 32-bit guests common, x64 support/fit to confirm.
- **JSLinux / TinyEMU x86_64 WASM** (Bellard): boots Linux in-browser with real shell; assets/kernels and configs often CORS-locked on upstream hosts — **vendoring locally** (same-origin) is the practical path. Licensing/redistribution of binaries to check.
- **WebVM / CheerpX**: x86-to-WASM virtualization for Linux/x86 binaries/userspace in browser — evaluate x86_64 capability, networking, persistence, and embedding.

### Proposed Phase 0 spike (concrete, to validate x86_64-in-browser)
Goal: boot a **real x86_64 Linux shell** in-browser without Alpine 9p/CORS by serving everything from this workspace.
- Vendor TinyEMU/JSlinux **x86_64** emulator glue+WASM and a compatible **x86_64 kernel** into `vendor/` and `firmware/` (same-origin).
- Build a minimal **initrd** (cpio/gzip) with a **statically-linked x86_64 busybox** + `/init` (mount proc/sys/dev, install applets, exec `/bin/sh` on console e.g. `hvc0`/ttyS0 as kernel expects) so no 9p root is required.
- Add a local VM config (memory/cmdline `rdinit=/init`, initrd path, virtio console) and a small web page/terminal glue (`term`/stdin/stdout) to run it; serve locally (e.g. `python3 -m http.server`) for preview.
- **Validate:** kernel boots to busybox shell, basic commands run, keyboard I/O works.
- **Risks/limits:** ~20MB+ kernel+assets, browser perf/memory, no clean VM stop/unload in TinyEMU WASM, device/network/persistence limited, initrd/kernel compatibility must be proven in-spike. If x86_64 is not viable, fall back to 32-bit guest or Track A/hybrid (document result).

*None of the above is implemented yet in `/workspace/app` (earlier pasted TinyEMU/v86 work was from another session).*

## 1) Decisions needed (gate for Phase 1)
- [ ] **Primary track:** A (sim), B (real VM), or **hybrid** (HelixOS UI shell + embedded VM terminal for “real” mode).
- [ ] **CPU/guest target:** must be **x86_64** Linux or acceptable to start with x86 32-bit (e.g. i386 Alpine) as MVP?
- [ ] **Distro/image & shell:** e.g. Alpine/Buildroot/Debian-minimal; `ash`/`bash`; required packages/tools.
- [ ] **Integration:** standalone VM page vs embedded in HelixOS CRT/DE UI (tty window, boot handoff, `startx`).
- [ ] **Persistence:** ephemeral vs saved disk/state in browser storage (and size limits).
- [ ] **Networking/files:** need outbound net, file import/export, shared folder with host/VFS?
- [ ] **Scope/name:** product name (HelixOS/NEXUS/etc.) and MVP definition.
- [ ] **Earlier asks (defer or include?):** “Helix OS and then a wallet” — include wallet? (UI mock/local data/other, explicit scope). Media manager (types/features). Wine-style shim (only meaningful as UI mapping in Track A; in Track B depends on VM userspace, likely out of MVP).

## 2) Roadmap phases

### Phase 0 — Planning & spike (current)
- Confirm decisions in §1.
- Run a small **technical spike**: pick 1 engine, boot a minimal image, verify real shell works in-browser, document x64 feasibility/perf/size.
- Define repo/file structure and local preview/run method for this environment.

### Phase 1 — MVP
- **If Track A:** static app scaffold → boot → `tty1` login/getty → basic shell + VFS (`localStorage`) + core commands/themes.
- **If Track B:** embed chosen VM, boot to login/shell, basic UX (terminal fit, keyboard, copy/paste) + minimal persistence/file exchange.
- **If hybrid:** Track A shell/UI frame with a “real Linux” terminal app/session backed by VM.

### Phase 2 — Desktop & integration
- `startx` / window manager & DE (HelixDE-style) or integrate VM display/serial console into windows.
- Session flow polish: logout/return to TTY, status bar, theming/CRT visuals.

### Phase 3 — Apps & features (prioritized per decisions)
- File manager (VFS ↔ device upload/download; and/or VM filesystem bridge if Track B).
- Media manager (types/UI TBD).
- Wallet module (only if explicitly scoped).
- Compatibility shims/mappings (e.g. Wine-style UI/name mapping) — **clearly labeled non-real** unless running inside capable VM userspace.

### Phase 4 — Hardening & docs
- Performance/asset loading, error states, reset/reseed flows, README/usage notes, honest capability reporting (`neofetch`/about).

## 3) Repurposed feature backlog (reference)
Details captured earlier (carry forward as applicable to chosen track): CRT retro aesthetic & palettes, command history/tab completion/pipes/ANSI/shortcuts, neofetch, editor/calc/games (`snake`, `matrix`, etc.), seeded files/motd/fortunes, multi-user basics, file manager drag-drop & save-to-device, Wine prefix/mappings/`winecfg` & PE refusal messaging.

## 4) Immediate next step
**Edit this file to answer §1 (especially Track A/B/hybrid and x86_64 requirement), set MVP priorities, then reply “proceed with roadmap decisions…”** — implementation will start only after decisions are recorded.

Suggested next action based on latest request (“real shell in browser for x64 linux”): **proceed with Phase 0 spike** for Track B — vendor x86_64 TinyEMU/JSLinux assets + build local busybox initrd (per plan above) to prove feasibility in this workspace. Reply with explicit go-ahead and any constraints (must be x86_64 vs 32-bit fallback acceptable, offline vendoring allowed, target shell/packages).
