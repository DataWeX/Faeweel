const Wine = (() => {
  const VERSION = "9.0-helix";
  const PREFIX = "/home/guest/.wine";

  const MAP = {
    "notepad.exe": { app: "edit", note: "Notepad" },
    notepad: { app: "edit", note: "Notepad" },
    "wordpad.exe": { app: "edit", note: "WordPad" },
    wordpad: { app: "edit", note: "WordPad" },
    "write.exe": { app: "edit", note: "Write" },
    "explorer.exe": { app: "files", note: "Explorer" },
    explorer: { app: "files", note: "Explorer" },
    "cmd.exe": { app: "term", note: "Command Prompt" },
    cmd: { app: "term", note: "Command Prompt" },
    "command.com": { app: "term", note: "COMMAND.COM" },
    "powershell.exe": { app: "term", note: "PowerShell" },
    powershell: { app: "term", note: "PowerShell" },
    "mspaint.exe": { app: "media", note: "Paint" },
    mspaint: { app: "media", note: "Paint" },
    "pbrush.exe": { app: "media", note: "Paintbrush" },
    "snippingtool.exe": { app: "media", note: "Snipping Tool" },
    "webcam.exe": { app: "camera", note: "Camera" },
    "winmine.exe": { app: "snake", note: "Minesweeper" },
    winmine: { app: "snake", note: "Minesweeper" },
    "sol.exe": { app: "snake", note: "Solitaire" },
    "solitaire.exe": { app: "snake", note: "Solitaire" },
    "matrix.exe": { app: "matrix", note: "Matrix" },
    winecfg: { app: "wine", note: "Wine Configuration" },
    "winecfg.exe": { app: "wine", note: "Wine Configuration" },
    "control.exe": { app: "wine", note: "Control Panel" },
    "regedit.exe": { app: "edit", note: "Registry Editor" }
  };

  const EXT_APP = {
    bat: "script",
    cmd: "script",
    vbs: "script",
    ps1: "script",
    com: "win32",
    exe: "win32",
    scr: "win32",
    pif: "win32",
    cpl: "win32",
    msc: "win32",
    dll: "win32-lib",
    ocx: "win32-lib",
    sys: "win32-lib",
    msi: "installer",
    txt: "edit",
    log: "edit",
    ini: "edit",
    inf: "edit",
    reg: "edit",
    rtf: "edit",
    doc: "edit",
    docx: "edit",
    xml: "edit",
    html: "edit",
    htm: "edit",
    url: "edit",
    cfg: "edit",
    conf: "edit",
    bmp: "media",
    dib: "media",
    png: "media",
    jpg: "media",
    jpeg: "media",
    gif: "media",
    ico: "media",
    tif: "media",
    tiff: "media",
    wav: "media",
    mp3: "media",
    wma: "media",
    mid: "media",
    avi: "media",
    mpg: "media",
    mpeg: "media",
    wmv: "media"
  };

  const WIN_EXTS = new Set([
    "exe", "com", "bat", "cmd", "msi", "dll", "scr", "pif", "cpl", "msc",
    "ocx", "sys", "vbs", "ps1", "lnk"
  ]);

  function basename(name) {
    return String(name || "").split(/[/\\]/).pop() || "";
  }

  function keyOf(name) {
    return basename(name).toLowerCase();
  }

  function extOf(name) {
    const base = basename(name);
    const i = base.lastIndexOf(".");
    return i >= 0 ? base.slice(i + 1).toLowerCase() : "";
  }

  function isWinName(name) {
    return WIN_EXTS.has(extOf(name));
  }

  function looksLikePE(node) {
    if (!node) return false;
    const mime = (node.mime || "").toLowerCase();
    if (mime === "application/x-msdownload" || mime === "application/vnd.microsoft.portable-executable") return true;
    const raw = node.content || "";
    if (node.binary && node.encoding === "base64") {
      try {
        const head = atob(raw.slice(0, 8));
        return head.charCodeAt(0) === 0x4d && head.charCodeAt(1) === 0x5a;
      } catch {
        return String(raw).indexOf("TV") === 0;
      }
    }
    return raw.charCodeAt(0) === 0x4d && raw.charCodeAt(1) === 0x5a;
  }

  function stubApp(content) {
    const body = String(content || "");
    if (body.indexOf("helix-wine:") === 0) return body.replace("helix-wine:", "").trim();
    return "";
  }

  function usage() {
    return {
      lines: [
        "wine: Helix Wine " + VERSION + " (OS compatibility layer)",
        "Windows files open through this layer. Native PE/Win32 cannot execute in the browser.",
        "",
        "usage: wine <file> [args]",
        "       winecfg",
        "",
        "associations:",
        "  .exe .com .scr     Win32 programs (mapped or compat runner)",
        "  .bat .cmd .ps1     scripts -> terminal",
        "  .txt .rtf .doc     notepad -> editor",
        "  .bmp .png .jpg     mspaint -> media",
        "  .wav .mp3 .avi     media",
        "  other files        opened by type through Wine"
      ].map((t) => ({ text: t, cls: "out" }))
    };
  }

  function launch(app, args, note) {
    return { app, args: args || [], wine: note || app };
  }

  function dirname(path) {
    const n = String(path || "/");
    const i = n.lastIndexOf("/");
    if (i <= 0) return "/";
    return n.slice(0, i);
  }

  function resolveTarget(target) {
    if (!target) return { error: "missing operand" };
    const key = keyOf(target);
    const mapped = MAP[key] || null;
    const seen = {};
    const candidates = [];
    function add(p) {
      if (!p || seen[p]) return;
      seen[p] = true;
      candidates.push(p);
    }
    add(Kernel.resolvePath(target));
    add(VFS.join(PREFIX, "drive_c/windows/system32", basename(target)));
    add(VFS.join(PREFIX, "drive_c/windows", basename(target)));
    add(VFS.join(PREFIX, "drive_c/users/guest", basename(target)));
    let path = "";
    let st = null;
    for (const p of candidates) {
      const s = VFS.stat(p);
      if (!s.error) {
        path = p;
        st = s;
        break;
      }
    }
    return { key, path, st, mapped };
  }

  function openNode(path, st, extraArgs) {
    const name = basename(path);
    const key = keyOf(name);
    const ext = extOf(name);
    const args = extraArgs || [];
    const mapped = MAP[key];
    if (mapped) {
      if (mapped.app === "wine") return launch("wine", args, mapped.note);
      if (mapped.app === "edit") return launch("edit", path ? [path].concat(args) : args, mapped.note);
      if (mapped.app === "files") return launch("files", args, mapped.note);
      if (mapped.app === "media") return launch("media", path ? [path].concat(args) : args, mapped.note);
      return launch(mapped.app, args, mapped.note);
    }

    if (st && st.type === "dir") return launch("files", [path], "Explorer");

    const r = path ? VFS.read(path) : { error: "no file" };
    if (!r.error) {
      const stub = stubApp(r.content);
      if (stub) return launch(stub, args, key);
    }

    const kind = EXT_APP[ext] || "";
    if (kind === "script") {
      if (r.error) return { lines: [{ text: "wine: " + key + ": file not found", cls: "err" }] };
      if (looksLikePE(r)) return launch("wine", ["--run", path], key);
      return { script: String(r.content || "") };
    }
    if (kind === "edit") return launch("edit", [path], key);
    if (kind === "media") return launch("media", [dirname(path)], key);
    if (kind === "installer" || kind === "win32" || kind === "win32-lib") {
      return launch("wine", ["--run", path], key);
    }

    if (!r.error && looksLikePE(r)) return launch("wine", ["--run", path], key);

    if (typeof FilesIO !== "undefined") {
      const media = FilesIO.mediaKind({ mime: (st && st.mime) || r.mime, name });
      if (media) return launch("media", [dirname(path)], name);
    }

    if (path && !r.error) return launch("edit", [path], name);
    if (mapped) return launch(mapped.app, args, mapped.note);
    return { lines: [{ text: "wine: " + key + ": no association", cls: "err" }] };
  }

  function run(target, extraArgs) {
    if (!target) return usage();
    const key = keyOf(target);
    if (MAP[key] && !/[\\/]/.test(target)) {
      const mapped = MAP[key];
      if (mapped.app === "wine") return launch("wine", extraArgs || [], mapped.note);
      if (mapped.app === "edit" && extraArgs && extraArgs[0]) {
        return launch("edit", extraArgs, mapped.note);
      }
      return launch(mapped.app, extraArgs || [], mapped.note);
    }
    const info = resolveTarget(target);
    if (info.mapped && !info.path) {
      const mapped = info.mapped;
      if (mapped.app === "wine") return launch("wine", extraArgs || [], mapped.note);
      return launch(mapped.app, extraArgs || [], mapped.note);
    }
    if (!info.path) {
      if (info.mapped) return launch(info.mapped.app, extraArgs || [], info.mapped.note);
      return { lines: [{ text: "wine: " + key + ": file not found", cls: "err" }] };
    }
    return openNode(info.path, info.st, extraArgs);
  }

  function open(path) {
    const p = Kernel.resolvePath(path);
    const st = VFS.stat(p);
    if (st.error) return { lines: [{ text: "wine: " + basename(path) + ": " + st.error, cls: "err" }] };
    return openNode(p, st, []);
  }

  function handles(name, node) {
    if (isWinName(name)) return true;
    if (node && looksLikePE(node)) return true;
    const ext = extOf(name);
    return !!EXT_APP[ext];
  }

  function peInfo(path) {
    const r = VFS.read(path);
    if (r.error) return { error: r.error, name: basename(path) };
    const name = basename(path);
    const pe = looksLikePE(r);
    let size = 0;
    if (r.binary && r.encoding === "base64") {
      size = Math.floor(String(r.content || "").length * 0.75);
    } else size = String(r.content || "").length;
    return {
      path,
      name,
      pe,
      stub: stubApp(r.content),
      mime: r.mime || "",
      size,
      mapped: MAP[keyOf(name)] || null
    };
  }

  return {
    VERSION, PREFIX, MAP, WIN_EXTS,
    run, open, handles, isWinName, looksLikePE, peInfo, keyOf, extOf, usage
  };
})();
