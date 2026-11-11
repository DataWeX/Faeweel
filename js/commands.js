(function () {
  function out(text, cls) { Helix.terminal.print(text, cls); }
  function err(text) { out(text, "err"); }
  function argsOf(s) { return s.trim() ? s.trim().match(/(?:[^\s"]+|"[^"]*")+/g).map(x => x.replace(/^"|"$/g, "")) : []; }
  function resolveTarget(t) { return Helix.vfs.norm(t, Helix.kernel.state.cwd); }
  function tree(path, prefix, lines) {
    path = path || Helix.kernel.state.cwd;
    const n = Helix.vfs.getNode(path, "/");
    if (!n || n.node.type !== "dir") throw new Error("tree: not a directory: " + path);
    const names = Helix.vfs.list(path, "/");
    names.forEach((name, i) => {
      const last = i === names.length - 1;
      const child = n.node.children[name];
      lines.push(prefix + (last ? "└── " : "├── ") + name + (child.type === "dir" ? "/" : ""));
      if (child.type === "dir") tree(Helix.vfs.norm(path + "/" + name, "/"), prefix + (last ? "    " : "│   "), lines);
    });
    return lines;
  }
  const manPages = {
    help: "help - list available commands",
    ls: "ls [-l] [path] - list directory contents",
    cd: "cd [dir] - change directory (~ for home)",
    cat: "cat FILE... - print file contents",
    cp: "cp SRC DEST - copy file",
    mv: "mv SRC DEST - move/rename file",
    rm: "rm [-r] FILE - remove file or directory",
    mkdir: "mkdir DIR - create directory",
    touch: "touch FILE - create empty file if missing",
    grep: "grep PATTERN FILE - search for pattern in file",
    head: "head [-n N] FILE - show first lines",
    tail: "tail [-n N] FILE - show last lines",
    tree: "tree [path] - display directory tree",
    theme: "theme [name] - set theme (phosphor|amber|ice|rose)",
    neofetch: "neofetch - show system info",
    resetfs: "resetfs - reset virtual filesystem to defaults",
    startx: "startx - launch desktop (placeholder in MVP)"
  };
  const cmds = {
    help() {
      return "Commands: help, man, clear, echo, pwd, cd, ls, cat, cp, mv, mkdir, touch, rm, grep, head, tail, tree, whoami, hostname, date, uname, neofetch, theme, startx, logout, resetfs, history";
    },
    man(a) { if (!a[0]) return "usage: man COMMAND"; return manPages[a[0]] || "No manual entry for " + a[0]; },
    clear() { Helix.terminal.clear(); return ""; },
    echo(a) { return a.join(" "); },
    pwd() { return Helix.kernel.state.cwd; },
    cd(a) {
      const target = a[0] || "~";
      const p = Helix.vfs.norm(target, Helix.kernel.state.cwd);
      const n = Helix.vfs.getNode(p, "/");
      if (!n) throw new Error("cd: no such file or directory: " + target);
      if (n.node.type !== "dir") throw new Error("cd: not a directory: " + target);
      Helix.kernel.state.cwd = p;
      return "";
    },
    ls(a) {
      const target = a.find(x => !x.startsWith("-")) || ".";
      const p = Helix.vfs.norm(target, Helix.kernel.state.cwd);
      const n = Helix.vfs.getNode(p, "/");
      if (!n) throw new Error("ls: cannot access '" + target + "'");
      if (n.node.type === "file") return target;
      const items = Helix.vfs.list(p, "/");
      const long = a.includes("-l") || a.includes("-la") || a.includes("-al");
      if (!long) return items.join("  ");
      return items.map(name => {
        const c = n.node.children[name];
        const t = c.type === "dir" ? "d" : "-";
        return t + (c.mode || "644") + " " + (c.owner || "root") + " " + String(c.size || 0).padStart(6) + " " + name + (c.type === "dir" ? "/" : "");
      }).join("\n");
    },
    cat(a) {
      if (!a[0]) throw new Error("cat: missing file");
      return a.map(f => Helix.vfs.read(f, Helix.kernel.state.cwd)).join("\n");
    },
    cp(a) { if (a.length < 2) throw new Error("cp: missing operand"); Helix.vfs.copy(a[0], a[1], Helix.kernel.state.cwd); return ""; },
    mv(a) { if (a.length < 2) throw new Error("mv: missing operand"); Helix.vfs.move(a[0], a[1], Helix.kernel.state.cwd); return ""; },
    mkdir(a) { if (!a[0]) throw new Error("mkdir: missing operand"); Helix.vfs.mkdir(a[0], Helix.kernel.state.cwd); return ""; },
    touch(a) { if (!a[0]) throw new Error("touch: missing file"); if (!Helix.vfs.exists(a[0], Helix.kernel.state.cwd)) Helix.vfs.write(a[0], "", Helix.kernel.state.cwd); return ""; },
    rm(a) {
      const r = a.includes("-r") || a.includes("-rf") || a.includes("-fr");
      const target = a.find(x => !x.startsWith("-"));
      if (!target) throw new Error("rm: missing operand");
      Helix.vfs.rm(target, Helix.kernel.state.cwd, r); return "";
    },
    grep(a) {
      if (a.length < 2) throw new Error("grep: usage: grep PATTERN FILE");
      const pat = a[0]; const file = a[1];
      const text = Helix.vfs.read(file, Helix.kernel.state.cwd);
      const re = new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      return text.split("\n").filter(l => re.test(l)).join("\n");
    },
    head(a) {
      let n = 10, file;
      for (let i = 0; i < a.length; i++) { if (a[i] === "-n" && a[i+1]) { n = parseInt(a[++i],10)||10; } else if (!a[i].startsWith("-")) file = a[i]; }
      if (!file) throw new Error("head: missing file");
      return Helix.vfs.read(file, Helix.kernel.state.cwd).split("\n").slice(0,n).join("\n");
    },
    tail(a) {
      let n = 10, file;
      for (let i = 0; i < a.length; i++) { if (a[i] === "-n" && a[i+1]) { n = parseInt(a[++i],10)||10; } else if (!a[i].startsWith("-")) file = a[i]; }
      if (!file) throw new Error("tail: missing file");
      const lines = Helix.vfs.read(file, Helix.kernel.state.cwd).split("\n");
      return lines.slice(Math.max(0, lines.length-n)).join("\n");
    },
    tree(a) {
      const target = a[0] ? resolveTarget(a[0]) : Helix.kernel.state.cwd;
      const out = [a[0] || "."];
      return tree(target, "", out).join("\n");
    },
    whoami() { return Helix.kernel.state.user || "guest"; },
    hostname() { return Helix.kernel.state.host; },
    date() { return new Date().toString(); },
    uname() { return "HelixOS helix 1.0.0-js wasm32 browser"; },
    history() { return Helix.kernel.state.history.map((h,i)=>String(i+1).padStart(4)+"  "+h).join("\n"); },
    theme(a) {
      const t = a[0];
      const map = { phosphor: ["#05080a","#7CFF7A","#9dff8a"], amber:["#0a0702","#ffbf5a","#ffd68a"], ice:["#04080c","#7fdcff","#b6ecff"], rose:["#0c0508","#ff7fa8","#ffb3cb"] };
      if (!t || !map[t]) return "themes: " + Object.keys(map).join(", ");
      const r = document.documentElement.style;
      r.setProperty("--bg", map[t][0]); r.setProperty("--fg", map[t][1]); r.setProperty("--accent", map[t][2]);
      Helix.kernel.state.theme = t;
      return "theme: " + t;
    },
    neofetch() {
      return [
        "   /\\_/\\     " + (Helix.kernel.state.user||"guest") + "@" + Helix.kernel.state.host,
        "  ( -.- )    OS: HelixOS 1.0.0-js (browser simulation)",
        "   > ^ <     Kernel: JavaScript (wasm32/browser sandbox)",
        "  /|   |\\    Shell: hsh",
        " (_|   |_)   Uptime: " + Math.floor(performance.now()/1000) + "s",
        "             Theme: " + Helix.kernel.state.theme,
        "             Memory: " + (performance && performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576)+"MB" : "n/a"),
      ].join("\n");
    },
    startx() { return "HelixDE placeholder: graphical desktop not implemented in this MVP. (Console-first tty1 active.)"; },
    logout() { Helix.kernel.logout(); Helix.terminal.setLoginMode(true); return "logout"; },
    resetfs() { Helix.vfs.reset(); return "filesystem reset to defaults (reload recommended)"; }
  };
  async function run(line) {
    const raw = (line || "").trim();
    if (!raw) return;
    Helix.kernel.state.history.push(raw);
    const parts = argsOf(raw);
    const name = parts[0];
    const a = parts.slice(1);
    if (cmds[name]) {
      try {
        const r = cmds[name](a);
        if (r) out(r);
      } catch (e) { err(e.message || String(e)); }
    } else {
      err("hsh: command not found: " + name);
    }
  }
  window.Helix = window.Helix || {};
  Helix.commands = { run, cmds };
})();