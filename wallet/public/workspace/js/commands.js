const Commands = (() => {
  const { env, aliases } = Kernel;

  function out(text, cls = "out") {
    return { lines: String(text).split("\n").map((t) => ({ text: t, cls })) };
  }

  function err(text) {
    return out(text, "err");
  }

  function ok(text) {
    return out(text, "ok");
  }

  function info(text) {
    return out(text, "info");
  }

  function html(markup, cls = "out") {
    return { html: markup, cls };
  }

  function modeString(st) {
    const type = st.type === "dir" ? "d" : st.type === "link" ? "l" : "-";
    const m = st.mode || 0;
    const bits = (n) =>
      ((n & 4) ? "r" : "-") + ((n & 2) ? "w" : "-") + ((n & 1) ? "x" : "-");
    return type + bits((m >> 6) & 7) + bits((m >> 3) & 7) + bits(m & 7);
  }

  function fmtDate(ts) {
    const d = new Date(ts);
    const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
    return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, " ")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function pad(s, n, right = false) {
    s = String(s);
    if (s.length >= n) return s;
    return right ? s + " ".repeat(n - s.length) : " ".repeat(n - s.length) + s;
  }

  const helpData = [
    ["help [cmd]", "show this help or details for a command"],
    ["ls [-la] [path]", "list directory contents"],
    ["cd [path]", "change directory"],
    ["pwd", "print working directory"],
    ["cat <file>", "print file contents"],
    ["echo [text]", "print text"],
    ["touch <file>", "create empty file"],
    ["mkdir [-p] <dir>", "create directory"],
    ["rm [-r] <path>", "remove file or directory"],
    ["cp <src> <dst>", "copy file"],
    ["mv <src> <dst>", "move / rename"],
    ["edit [file]", "open text editor"],
    ["files [path]", "open the visual file manager"],
    ["upload [dir]", "upload files from your device"],
    ["download <file>", "save a file to your device"],
    ["media [path]", "open the media manager"],
    ["camera", "open camera capture"],
    ["head [-n N] <file>", "first N lines"],
    ["tail [-n N] <file>", "last N lines"],
    ["wc <file>", "line / word / byte counts"],
    ["grep <pat> <file>", "search file for pattern"],
    ["find [path] [name]", "find files by name"],
    ["tree [path]", "directory tree"],
    ["stat <path>", "file metadata"],
    ["chmod <mode> <path>", "set permissions (octal)"],
    ["whoami", "current user"],
    ["hostname [name]", "get or set hostname"],
    ["date", "current date and time"],
    ["uptime", "system uptime"],
    ["uname [-a]", "system identity"],
    ["neofetch", "system info banner"],
    ["ps", "process list"],
    ["kill <pid>", "stop a process"],
    ["top", "live-ish process view"],
    ["free", "memory usage"],
    ["df", "disk usage"],
    ["history", "command history"],
    ["alias [k=v]", "list or set aliases"],
    ["export NAME=val", "set environment variable"],
    ["env", "print environment"],
    ["clear", "clear the screen"],
    ["theme [name]", "fire | phosphor | amber | ice | rose | ultraviolet"],
    ["settings", "HelixDE control panel (needs startx)"],
    ["fortune", "a small fortune"],
    ["cowsay [text]", "a cow says things"],
    ["figlet [text]", "big block letters"],
    ["banner [text]", "simple banner"],
    ["cal", "this month's calendar"],
    ["bc <expr>", "tiny calculator"],
    ["sleep <sec>", "wait (max 5s)"],
    ["yes [text]", "repeat a line a few times"],
    ["matrix", "digital rain"],
    ["snake", "terminal snake game"],
    ["cowsay", "ascii cow"],
    ["login", "return to getty login on tty1"],
    ["passwd", "change your password"],
    ["run <file>", "run a script of shell commands"],
    ["apps", "list built-in applications"],
    ["startx", "start HelixDE (window manager)"],
    ["wine [file]", "OS compatibility layer for Windows files"],
    ["open <file>", "open a file through Wine associations"],
    ["vmm [start|stop]", "Helix VMM: TinyEMU + Linux x86_64 guest"],
    ["linux", "attach Linux serial console (needs vmm)"],
    ["logout", "leave HelixDE back to tty1"],
    ["term", "open a terminal window (needs DISPLAY)"],
    ["windows", "list open windows"],
    ["closeall", "close all windows"],
    ["man <cmd>", "manual page"],
    ["resetfs", "restore factory filesystem"],
    ["reboot", "reboot HelixOS"]
  ];

  const manuals = {
    ls: "ls [-l] [-a] [path]\nList directory contents. -l long format, -a include hidden.",
    cd: "cd [path]\nChange the current working directory. cd with no args goes home.",
    cat: "cat <file> [file...]\nConcatenate and print files.",
    edit: "edit [file]\nOpen the Helix editor. Ctrl+S or the Save button writes the file.",
    grep: "grep <pattern> <file>\nPrint lines matching a JavaScript regex.",
    theme: "theme [fire|phosphor|amber|ice|rose|ultraviolet]\nChange CRT phosphor color.",
    snake: "snake\nArrow keys or WASD. Eat food. Do not hit walls or yourself. q to quit.",
    resetfs: "resetfs\nWipe the virtual filesystem back to the factory image. History is kept.",
    files: "files [path]\nOpen the visual file manager. Upload, download, rename, and browse.",
    upload: "upload [dir]\nPick files from your device and copy them into HelixOS (current dir by default).",
    download: "download <file>\nSave a HelixOS file onto your device.",
    media: "media [path]\nOpen the media manager. Browse photos, video, and audio. Import or capture with camera.",
    camera: "camera\nOpen the camera. Snap photos or record short clips into ~/media.",
    startx: "startx\nStart HelixDE on display :0. The window manager (helixwm) is separate from this shell.",
    wine: "wine [file]\nHelix Wine is the OS compatibility layer. Windows files (.exe .bat .cmd .msi .dll .txt .bmp ...) open through it.\nMapped apps still launch Helix tools. Unknown PE binaries open in the Wine runner (they cannot execute natively).\nTry: wine notepad.exe   wine report.txt   wine photo.bmp",
    vmm: "vmm [start|stop|status]\nStart Helix VMM. Guest is TinyEMU + Linux x86_64 (busybox root). v86 i686 is fallback. HelixOS stays userspace.",
    linux: "linux\nAttach the guest Linux console (hvc0). Starts VMM if needed. Arch is x86_64.",
    logout: "logout\nIf HelixDE is running, return to tty1. If already on tty1, end the session.",
    passwd: "passwd\nSet a new password for the current user. Stored locally in this browser.",
    term: "term\nOpen a terminal window on the desktop. Requires startx."
  };

  const commands = {};

  commands.help = (args) => {
    if (args[0] && manuals[args[0]]) return out(manuals[args[0]], "info");
    if (args[0] && commands[args[0]]) {
      const row = helpData.find((h) => h[0].startsWith(args[0]));
      return out(row ? `${row[0]}\n  ${row[1]}` : args[0], "info");
    }
    const rows = helpData
      .map(([c, d]) => `<tr><td>${esc(c)}</td><td>${esc(d)}</td></tr>`)
      .join("");
    return html(`<table class="help-table">${rows}</table>`);
  };

  commands.man = (args) => commands.help(args);

  commands.ls = (args) => {
    const flags = new Set();
    const paths = [];
    args.forEach((a) => {
      if (a.startsWith("-") && a !== "-") a.slice(1).split("").forEach((f) => flags.add(f));
      else paths.push(a);
    });
    const target = Kernel.resolvePath(paths[0] || ".");
    const res = VFS.ls(target);
    if (res.error) return err(`ls: ${res.error}: ${target}`);
    let entries = res.entries;
    if (!flags.has("a")) entries = entries.filter((e) => !e.name.startsWith("."));
    if (!entries.length) return out("");
    if (flags.has("l")) {
      const lines = entries.map((e) => {
        const name = e.type === "dir" ? e.name + "/" : e.name;
        return `${modeString(e)} ${pad(e.owner, 6, true)} ${pad(e.size, 6)} ${fmtDate(e.mtime)} ${name}`;
      });
      return out(lines.join("\n"));
    }
    const markup = `<div class="ls-grid">${entries
      .map((e) => {
        const cls = e.type === "dir" ? "dir" : e.exec ? "exec" : e.name.startsWith(".") ? "hidden-file" : "file";
        const name = e.type === "dir" ? e.name + "/" : e.name;
        return `<span class="${cls}">${esc(name)}</span>`;
      })
      .join("")}</div>`;
    return html(markup);
  };

  commands.cd = (args) => {
    const target = Kernel.resolvePath(args[0] || env.HOME);
    const st = VFS.stat(target);
    if (st.error) return err(`cd: ${st.error}: ${target}`);
    if (st.type !== "dir") return err(`cd: not a directory: ${target}`);
    env.PWD = target;
    return { silent: true };
  };

  commands.pwd = () => out(env.PWD);

  commands.cat = (args) => {
    if (!args.length) return err("cat: missing file operand");
    const chunks = [];
    for (const a of args) {
      const p = Kernel.resolvePath(a);
      const r = VFS.read(p);
      if (r.error) return err(`cat: ${r.error}: ${p}`);
      if (r.binary) return err(`cat: ${p}: binary file`);
      chunks.push(r.content.replace(/\n$/, ""));
    }
    return out(chunks.join("\n"));
  };

  commands.echo = (args) => out(args.join(" "));

  commands.touch = (args) => {
    if (!args.length) return err("touch: missing file operand");
    for (const a of args) {
      const p = Kernel.resolvePath(a);
      const r = VFS.read(p);
      if (r.error) {
        const w = VFS.write(p, "");
        if (w.error) return err(`touch: ${w.error}`);
      } else {
        VFS.write(p, r.content);
      }
    }
    return { silent: true };
  };

  commands.mkdir = (args) => {
    const recursive = args.includes("-p");
    const paths = args.filter((a) => a !== "-p");
    if (!paths.length) return err("mkdir: missing operand");
    for (const a of paths) {
      const r = VFS.mkdir(Kernel.resolvePath(a), { recursive });
      if (r.error) return err(`mkdir: ${r.error}`);
    }
    return { silent: true };
  };

  commands.rm = (args) => {
    const recursive = args.some((a) => a === "-r" || a === "-rf" || a === "-fr");
    const paths = args.filter((a) => !a.startsWith("-"));
    if (!paths.length) return err("rm: missing operand");
    for (const a of paths) {
      const r = VFS.rm(Kernel.resolvePath(a), { recursive });
      if (r.error) return err(`rm: ${r.error}`);
    }
    return { silent: true };
  };

  commands.cp = (args) => {
    if (args.length < 2) return err("cp: missing operand");
    const r = VFS.cp(Kernel.resolvePath(args[0]), Kernel.resolvePath(args[1]));
    return r.error ? err(`cp: ${r.error}`) : { silent: true };
  };

  commands.mv = (args) => {
    if (args.length < 2) return err("mv: missing operand");
    const r = VFS.mv(Kernel.resolvePath(args[0]), Kernel.resolvePath(args[1]));
    return r.error ? err(`mv: ${r.error}`) : { silent: true };
  };

  commands.head = (args) => sliceFile(args, "head");
  commands.tail = (args) => sliceFile(args, "tail");

  function sliceFile(args, kind) {
    let n = 10;
    const files = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-n") n = parseInt(args[++i], 10) || 10;
      else files.push(args[i]);
    }
    if (!files.length) return err(`${kind}: missing file`);
    const r = VFS.read(Kernel.resolvePath(files[0]));
    if (r.error) return err(`${kind}: ${r.error}`);
    const lines = r.content.split("\n");
    const slice = kind === "head" ? lines.slice(0, n) : lines.slice(-n);
    return out(slice.join("\n"));
  }

  commands.wc = (args) => {
    if (!args.length) return err("wc: missing file");
    const p = Kernel.resolvePath(args[0]);
    const r = VFS.read(p);
    if (r.error) return err(`wc: ${r.error}`);
    const lines = r.content.length ? r.content.split("\n").length : 0;
    const words = r.content.trim() ? r.content.trim().split(/\s+/).length : 0;
    return out(`${lines} ${words} ${r.content.length} ${p}`);
  };

  commands.grep = (args) => {
    if (args.length < 2) return err("grep: usage: grep <pattern> <file>");
    const r = VFS.read(Kernel.resolvePath(args[1]));
    if (r.error) return err(`grep: ${r.error}`);
    let re;
    try {
      re = new RegExp(args[0]);
    } catch {
      return err("grep: invalid pattern");
    }
    const hits = r.content.split("\n").filter((l) => re.test(l));
    return out(hits.join("\n"));
  };

  commands.find = (args) => {
    const path = Kernel.resolvePath(args[0] || ".");
    const name = args[1];
    const hits = VFS.find(path, (p, n) => {
      if (!name) return n.type === "file";
      return p.split("/").pop().includes(name);
    });
    return out(hits.join("\n"));
  };

  commands.tree = (args) => {
    const path = Kernel.resolvePath(args[0] || ".");
    const st = VFS.stat(path);
    if (st.error) return err(`tree: ${st.error}`);
    return out(VFS.tree(path, 4).join("\n"));
  };

  commands.stat = (args) => {
    if (!args.length) return err("stat: missing operand");
    const p = Kernel.resolvePath(args[0]);
    const st = VFS.stat(p);
    if (st.error) return err(`stat: ${st.error}`);
    return out(
      `  File: ${p}\n  Type: ${st.type}\n  Size: ${st.size}\n  Mode: ${modeString(st)} (${(st.mode || 0).toString(8)})\n Owner: ${st.owner}\n  Time: ${new Date(st.mtime).toISOString()}`
    );
  };

  commands.chmod = (args) => {
    if (args.length < 2) return err("chmod: missing operand");
    const mode = parseInt(args[0], 8);
    if (Number.isNaN(mode)) return err("chmod: invalid mode");
    const st = VFS.stat(Kernel.resolvePath(args[1]));
    if (st.error) return err(`chmod: ${st.error}`);
    st.node.mode = mode;
    VFS.persist();
    return { silent: true };
  };

  commands.whoami = () => out(env.USER);
  commands.date = () => out(new Date().toString());
  commands.uptime = () => out(`up ${Kernel.uptime()}`);

  commands.hostname = (args) => {
    if (args[0]) {
      env.HOSTNAME = args[0];
      Kernel.saveConfig();
    }
    return out(env.HOSTNAME);
  };

  commands.uname = (args) => {
    if (args.includes("-a")) return out("HelixOS helix 1.0.0-web #1 SMP browser wasm32 GNU/Helix");
    if (args.includes("-s")) return out("HelixOS");
    if (args.includes("-m")) return out("wasm32");
    if (args.includes("-r")) return out("1.0.0-web");
    return out("HelixOS");
  };

  commands.neofetch = () => {
    const art = [
      "      .--.      ",
      "     /    \\     ",
      "    |  Hx  |    ",
      "     \\    /     ",
      "    .-'--'-.    ",
      "   /  helix \\   ",
      "   \\   OS   /   ",
      "    '------'    "
    ];
    const infoLines = [
      `${env.USER}@${env.HOSTNAME}`,
      "----------------",
      `OS: HelixOS 1.0 (browser application)`,
      `Host: browser / wasm`,
      `Core: C/Wasm process registry + JavaScript host` + (typeof VMM !== "undefined" && VMM.running() ? " + linux " + (VMM.status().arch || "guest") : ""),
      `Uptime: ${Kernel.uptime()}`,
      `Shell: hsh 1.0`,
      `WM: ${Kernel.env.WM || "none (tty)"}`,
      `Display: ${Kernel.env.DISPLAY || "unset"}`,
      `Theme: ${env.THEME}`,
      `CPU: not measured`,
      `Memory: not measured`,
      `Disk: vfs://localStorage`
    ];
    const rows = [];
    const n = Math.max(art.length, infoLines.length);
    for (let i = 0; i < n; i++) {
      rows.push(`${art[i] || "                 "}  ${infoLines[i] || ""}`);
    }
    return out(rows.join("\n"), "ok");
  };

  commands.ps = () => {
    const header = "PID   USER     KIND     STATE     CMD";
    const rows = Kernel.processes.map(
      (p) => `${pad(p.pid, 5, true)} ${pad(p.user, 8, true)} ${pad(p.kind, 8, true)} ${pad(p.state, 9, true)} ${p.name}`
    );
    return out([header, ...rows].join("\n"));
  };

  commands.kill = (args) => {
    const pid = parseInt(args[0], 10);
    if (!pid) return err("kill: usage: kill <pid>");
    if (!Kernel.kill(pid)) return err("kill: no such process or permission denied");
    return ok(`killed ${pid}`);
  };

  commands.top = () => commands.ps([]);

  commands.free = () =>
    out("              total        used        free\nMem:        262144      77824      184320\nSwap:            0          0           0");

  commands.df = () =>
    out("Filesystem      Size  Used Avail Use%\nvfs             2.0M  180K  1.8M   9%\nlocalStorage    5.0M  180K  4.8M   4%");

  commands.history = () => out(Kernel.history.map((c, i) => `${pad(i + 1, 4)}  ${c}`).join("\n"));

  commands.alias = (args) => {
    if (!args.length) {
      return out(Object.entries(aliases).map(([k, v]) => `alias ${k}='${v}'`).join("\n"));
    }
    const m = args.join(" ").match(/^(\w+)=(.*)$/);
    if (!m) return err("alias: usage: alias name=value");
    aliases[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    return { silent: true };
  };

  commands.export = (args) => {
    const m = args.join(" ").match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) return err("export: usage: export NAME=value");
    env[m[1]] = m[2];
    return { silent: true };
  };

  commands.env = () => out(Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n"));

  commands.clear = () => ({ clear: true });

  commands.theme = (args) => {
    const names = ["fire", "phosphor", "amber", "ice", "rose", "ultraviolet"];
    if (!args[0]) {
      if (env.DISPLAY) return { app: "theme", args: [] };
      return out(`current: ${env.THEME}\navailable: ${names.join(", ")}`);
    }
    if (!names.includes(args[0])) return err("theme: unknown theme");
    env.THEME = args[0];
    if (typeof Desktop !== "undefined" && Desktop.applyLook) Desktop.applyLook();
    else document.getElementById("crt").dataset.theme = args[0];
    Kernel.saveConfig();
    return ok(`theme set to ${args[0]}`);
  };

  commands.settings = () => ({ app: "settings", args: [] });
  commands.control = () => ({ app: "settings", args: [] });
  commands.design = () => ({ app: "design", args: [] });
  commands.look = () => ({ app: "design", args: [] });
  commands.appearance = () => ({ app: "design", args: [] });
  commands.wallpaper = (args) => {
    if (!args[0]) return { app: "wallpaper", args: [] };
    env.WALLPAPER = args[0];
    if (typeof Desktop !== "undefined" && Desktop.applyLook) Desktop.applyLook();
    Kernel.saveConfig();
    return ok("wallpaper " + args[0]);
  };
  commands.background = () => commands.wallpaper([]);
  commands.color = (args) => {
    if (!args[0]) return { app: "color", args: [] };
    env.ACCENT = args[0] === "reset" ? "" : args[0];
    if (typeof Desktop !== "undefined" && Desktop.applyLook) Desktop.applyLook();
    Kernel.saveConfig();
    return ok(env.ACCENT ? "accent " + env.ACCENT : "accent reset");
  };
  commands.kernel = () => ({ app: "kernel", args: [] });
  commands.filesystem = () => ({ app: "filesystem", args: [] });
  commands.config = () => ({ app: "config", args: [] });
  commands.warnings = () => ({ app: "warnings", args: [] });
  commands.helixwm = () => ({ app: "wm", args: [] });

  commands.fortune = () => {
    const r = VFS.read("/usr/share/fortune");
    if (r.error) return err("fortune: no cookies");
    const parts = r.content.split("\n---\n");
    return out(parts[Math.floor(Math.random() * parts.length)], "info");
  };

  commands.cowsay = (args) => {
    const text = args.join(" ") || "moo";
    const w = Math.min(40, Math.max(text.length, 4));
    const top = " " + "_".repeat(w + 2);
    const bot = " " + "-".repeat(w + 2);
    const cow = [
      top,
      `< ${pad(text, w, true)} >`,
      bot,
      "        \\   ^__^",
      "         \\  (oo)\\_______",
      "            (__)\\       )\\/\\",
      "                ||----w |",
      "                ||     ||"
    ];
    return out(cow.join("\n"));
  };

  commands.figlet = (args) => {
    const text = (args.join(" ") || "HELIX").slice(0, 12).toUpperCase();
    const glyphs = {
      A: ["  ██  ", " █  █ ", "██████", "█    █", "█    █"],
      B: ["████  ", "█   █ ", "████  ", "█   █ ", "████  "],
      C: [" ████ ", "█     ", "█     ", "█     ", " ████ "],
      D: ["████  ", "█   █ ", "█   █ ", "█   █ ", "████  "],
      E: ["█████ ", "█     ", "████  ", "█     ", "█████ "],
      F: ["█████ ", "█     ", "████  ", "█     ", "█     "],
      G: [" ████ ", "█     ", "█  ██ ", "█   █ ", " ████ "],
      H: ["█   █ ", "█   █ ", "█████ ", "█   █ ", "█   █ "],
      I: ["█████ ", "  █   ", "  █   ", "  █   ", "█████ "],
      J: [" ████ ", "    █ ", "    █ ", "█   █ ", " ███  "],
      K: ["█   █ ", "█  █  ", "███   ", "█  █  ", "█   █ "],
      L: ["█     ", "█     ", "█     ", "█     ", "█████ "],
      M: ["█   █ ", "██ ██ ", "█ █ █ ", "█   █ ", "█   █ "],
      N: ["█   █ ", "██  █ ", "█ █ █ ", "█  ██ ", "█   █ "],
      O: [" ███  ", "█   █ ", "█   █ ", "█   █ ", " ███  "],
      P: ["████  ", "█   █ ", "████  ", "█     ", "█     "],
      Q: [" ███  ", "█   █ ", "█   █ ", "█  ██ ", " ████ "],
      R: ["████  ", "█   █ ", "████  ", "█  █  ", "█   █ "],
      S: [" ████ ", "█     ", " ███  ", "    █ ", "████  "],
      T: ["█████ ", "  █   ", "  █   ", "  █   ", "  █   "],
      U: ["█   █ ", "█   █ ", "█   █ ", "█   █ ", " ███  "],
      V: ["█   █ ", "█   █ ", "█   █ ", " █ █  ", "  █   "],
      W: ["█   █ ", "█   █ ", "█ █ █ ", "██ ██ ", "█   █ "],
      X: ["█   █ ", " █ █  ", "  █   ", " █ █  ", "█   █ "],
      Y: ["█   █ ", " █ █  ", "  █   ", "  █   ", "  █   "],
      Z: ["█████ ", "   █  ", "  █   ", " █    ", "█████ "],
      " ": ["    ", "    ", "    ", "    ", "    "],
      "-": ["     ", "     ", "████ ", "     ", "     "]
    };
    const rows = ["", "", "", "", ""];
    for (const ch of text) {
      const g = glyphs[ch] || glyphs[" "];
      g.forEach((line, i) => {
        rows[i] += line + " ";
      });
    }
    return out(rows.join("\n"), "ok");
  };

  commands.banner = (args) => commands.figlet(args);

  commands.cal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const names = "January February March April May June July August September October November December".split(" ");
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    let line = "Su Mo Tu We Th Fr Sa\n";
    let row = "   ".repeat(first);
    for (let d = 1; d <= days; d++) {
      row += pad(d, 2) + " ";
      if ((first + d) % 7 === 0 || d === days) {
        line += row.trimEnd() + "\n";
        row = "";
      }
    }
    return out(`${names[month]} ${year}\n${line}`);
  };

  commands.bc = (args) => {
    const expr = args.join(" ");
    if (!expr) return err("bc: empty expression");
    if (!/^[\d\s+\-*/().%]+$/.test(expr)) return err("bc: invalid characters");
    try {
      const val = Function(`"use strict"; return (${expr})`)();
      return out(String(val));
    } catch {
      return err("bc: syntax error");
    }
  };

  commands.sleep = (args) => {
    const sec = Math.min(5, Math.max(0, parseFloat(args[0]) || 1));
    return { sleep: sec * 1000 };
  };

  commands.yes = (args) => out(Array(8).fill(args.join(" ") || "y").join("\n"));

  commands.login = () => ({ logout: true });

  commands.passwd = (args) => {
    if (!Kernel.session.loggedIn) return err("passwd: not logged in");
    const next = args[0];
    if (!next) return err("passwd: usage: passwd <new-password>");
    Kernel.setPassword(env.USER, next);
    return ok("password updated");
  };

  commands.run = (args) => {
    if (!args.length) return err("run: missing script");
    const r = VFS.read(Kernel.resolvePath(args[0]));
    if (r.error) {
      const r2 = VFS.read(Kernel.resolvePath(env.HOME + "/bin/" + args[0]));
      if (r2.error) return err(`run: ${r.error}`);
      return { script: r2.content };
    }
    return { script: r.content };
  };

  commands.apps = () =>
    out(
      "Console vs desktop:\n  startx        launch HelixDE + helixwm\n  logout        return to tty1\n  term          terminal window (on DE)\n\nDesktop apps (need startx):\n  files         file manager\n  media         photos / video / audio\n  camera        webcam capture\n  edit          text editor\n  snake         arcade snake\n  matrix        digital rain\n  wine          OS compatibility layer for Windows files\n  linux         Linux x86_64 console (TinyEMU)"
    );

  commands.startx = () => {
    if (!Kernel.session.loggedIn) return err("startx: please log in first");
    return { startx: true };
  };
  commands.xinit = () => commands.startx([]);
  commands.startw = () => commands.startx([]);
  commands.logout = () => ({ logout: true });

  function wineRun(target, extraArgs) {
    return Wine.run(target, extraArgs);
  }

  commands.wine = (args) => {
    if (args[0] === "--run") return { app: "wine", args };
    return wineRun(args[0], args.slice(1));
  };
  commands.winecfg = () => ({ app: "wine", args: [] });
  commands.start = (args) => wineRun(args[0], args.slice(1));
  commands.open = (args) => {
    if (!args[0]) return err("open: usage: open <file>");
    return Wine.open(args[0]);
  };
  commands["xdg-open"] = commands.open;
  commands.notepad = (args) => ({ app: "edit", args });

  commands.vmm = (args) => {
    const sub = (args[0] || "status").toLowerCase();
    if (sub === "start" || sub === "up") return { vmmStart: true };
    if (sub === "stop" || sub === "down") return { vmmStop: true };
    const st = typeof VMM !== "undefined" ? VMM.status() : { running: false, arch: "none", backend: "none" };
    return out(
      "Helix VMM\n" +
      "  backend  " + (st.backend || "none") + "\n" +
      "  arch     " + (st.arch || "none") + "\n" +
      "  bios     " + (st.bios || "-") + "\n" +
      "  kernel   " + (st.kernel || "-") + "\n" +
      "  root     " + (st.root || "-") + "\n" +
      "  state    " + (st.starting ? "starting" : st.running ? "running" : "stopped") + "\n" +
      "  usage    vmm start | vmm stop | linux"
    );
  };
  commands.linux = (args) => {
    if (args[0] === "stop") return { vmmStop: true };
    return { linux: true };
  };
  commands.lsh = () => ({ linux: true });
  commands.term = (args) => ({ app: "term", args });
  commands.terminal = (args) => ({ app: "term", args });
  commands.xterm = (args) => ({ app: "term", args });

  commands.media = (args) => ({ app: "media", args });
  commands.photos = (args) => ({ app: "media", args });
  commands.gallery = (args) => ({ app: "media", args });
  commands.camera = (args) => ({ app: "camera", args });
  commands.cam = (args) => ({ app: "camera", args });

  commands.windows = () => {
    const list = WM.list();
    if (!list.length) return out("no open windows");
    return out(list.map((w) => `${w.id}  ${w.minimized ? "[min]" : "[fg] "}  ${w.title}`).join("\n"));
  };
  commands.wm = () => commands.windows([]);
  commands.closeall = () => {
    WM.closeAll();
    return ok("all windows closed");
  };

  commands.files = (args) => ({ app: "files", args });
  commands.fm = (args) => ({ app: "files", args });
  commands.explorer = (args) => ({ app: "files", args });

  commands.upload = (args) => ({ upload: Kernel.resolvePath(args[0] || ".") });

  commands.download = (args) => {
    if (!args.length) return err("download: usage: download <file>");
    const p = Kernel.resolvePath(args[0]);
    const r = FilesIO.downloadPath(p);
    if (r.error) return err(`download: ${r.error}`);
    return ok(`saved ${r.name} to your device`);
  };

  commands.save = (args) => commands.download(args);

  commands.resetfs = () => {
    VFS.reset();
    env.PWD = env.HOME;
    Kernel.loadConfig();
    return warn("filesystem restored to factory image");
  };

  function warn(text) {
    return out(text, "warn");
  }

  commands.reboot = () => {
    if (typeof Desktop !== "undefined" && Desktop.running()) Desktop.stop();
    if (typeof VMM !== "undefined" && VMM.running()) VMM.stop();
    return { reboot: true };
  };

  commands.edit = (args) => ({ app: "edit", args });
  commands.snake = (args) => ({ app: "snake", args });
  commands.matrix = (args) => ({ app: "matrix", args });

  commands.which = (args) => {
    if (!args[0]) return err("which: missing operand");
    return commands[args[0]] ? out(`/bin/${args[0]}`) : err(`which: ${args[0]} not found`);
  };

  commands.true = () => ({ silent: true });
  commands.false = () => err("");

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function complete(partial) {
    const names = Object.keys(commands).sort();
    if (!partial) return names;
    const hits = names.filter((n) => n.startsWith(partial));
    if (hits.length) return hits;
    const st = VFS.ls(env.PWD);
    if (st.error) return [];
    return st.entries.map((e) => e.name).filter((n) => n.startsWith(partial));
  }

  function dispatch(line) {
    const expanded = Kernel.expand(line.trim());
    if (!expanded) return { silent: true };
    let tokens = Kernel.tokenize(expanded);
    if (!tokens.length) return { silent: true };
    if (aliases[tokens[0]]) {
      const aliasTokens = Kernel.tokenize(aliases[tokens[0]]);
      tokens = aliasTokens.concat(tokens.slice(1));
    }
    const cmd = tokens[0];
    const args = tokens.slice(1);
    if (!commands[cmd]) {
      if (Wine.MAP[Wine.keyOf(cmd)] || Wine.isWinName(cmd) || /\.(exe|com|bat|cmd|msi)$/i.test(cmd)) {
        return wineRun(cmd, args);
      }
      const maybe = Kernel.resolvePath(cmd);
      const st = VFS.stat(maybe);
      if (!st.error && Wine.handles(cmd, st)) return Wine.open(maybe);
      return err(`hsh: command not found: ${cmd}`);
    }
    try {
      return commands[cmd](args) || { silent: true };
    } catch (e) {
      return err(String(e.message || e));
    }
  }

  return { commands, dispatch, complete, helpData, esc };
})();
