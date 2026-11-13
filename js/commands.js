(function () {
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
    cp: "cp [-r] SRC DEST - copy file or directory",
    mv: "mv SRC DEST - move/rename file or directory",
    rm: "rm [-r] FILE - remove file or directory",
    rmdir: "rmdir DIR - remove empty directory",
    mkdir: "mkdir [-p] DIR - create directory",
    touch: "touch FILE - create/update file mtime",
    grep: "grep [-i] PATTERN [FILE] - search for pattern",
    head: "head [-n N] FILE - show first lines",
    tail: "tail [-n N] FILE - show last lines",
    tree: "tree [path] - display directory tree",
    file: "file PATH - show file type/mime info",
    calc: "calc EXPR - evaluate simple arithmetic expression",
    reboot: "reboot - reload HelixOS session",
    poweroff: "poweroff - halt message (browser session remains)",
    ps: "ps - list processes (init/getty/login/hsh, DE when running)",
    kill: "kill PID - stop a non-core process",
    stat: "stat FILE - show file metadata",
    find: "find [path] [name] - list paths (optional name substring filter)",
    id: "id - print user identity",
    passwd: "passwd - change current user password (stored in /etc/passwd)",
    theme: "theme [name] - set theme (phosphor|amber|ice|rose)",
    reloadstyle: "reloadstyle - reload window/app styles from xml/styles.xml",
    neofetch: "neofetch - show system info",
    resetfs: "resetfs - reset virtual filesystem to defaults",
    startx: "startx - launch HelixDE on :0 (graphical session over tty1)"
  };
  const cmds = {
    help() {
      return "Commands: help, man, clear, echo, pwd, cd, ls, cat, cp, mv, mkdir, touch, rm, rmdir, grep, head, tail, tree, wc, file, stat, find, env, ps, kill, id, whoami, hostname, date, uptime, uname, dmesg, df, free, fortune, calc, neofetch, theme, reloadstyle, passwd, startx, reboot, poweroff, logout, resetfs, history | pipes ; > >>, mkdir -p, cp -r, grep -i";
    },
    man(a) { if (!a[0]) return "usage: man COMMAND"; return manPages[a[0]] || "No manual entry for " + a[0]; },
    clear() { Helix.terminal.clear(); return ""; },
    echo(a) { if (a[0] === "-n") return a.slice(1).join(" "); return a.join(" "); },
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
    cat(a, stdin) {
      if (!a[0]) return stdin != null ? String(stdin) : "";
      return a.map(f => {
        const n = Helix.vfs.getNode(f, Helix.kernel.state.cwd);
        if (n && n.node.type === "file" && n.node.encoding === "dataurl") return "cat: " + f + ": binary/media file (" + (n.node.mime || "data") + ", " + (n.node.size || 0) + " bytes)";
        if (n && n.node.type === "dir") throw new Error("cat: " + f + ": Is a directory");
        return Helix.vfs.read(f, Helix.kernel.state.cwd);
      }).join("\n");
    },
    cp(a) {
      const r = a.includes("-r") || a.includes("-R");
      const args = a.filter(x => !x.startsWith("-"));
      if (args.length < 2) throw new Error("cp: missing operand");
      Helix.vfs.copy(args[0], args[1], Helix.kernel.state.cwd, { r });
      return "";
    },
    mv(a) { if (a.length < 2) throw new Error("mv: missing operand"); Helix.vfs.move(a[0], a[1], Helix.kernel.state.cwd); return ""; },
    mkdir(a) {
      const pflag = a.includes("-p");
      const target = a.find(x => !x.startsWith("-"));
      if (!target) throw new Error("mkdir: missing operand");
      Helix.vfs.mkdir(target, Helix.kernel.state.cwd, { p: pflag });
      return "";
    },
    touch(a) {
      if (!a[0]) throw new Error("touch: missing file");
      for (const f of a.filter(x=>!x.startsWith("-"))) {
        const n = Helix.vfs.getNode(f, Helix.kernel.state.cwd);
        if (!n) Helix.vfs.write(f, "", Helix.kernel.state.cwd);
        else if (n.node.type === "file") { n.node.mtime = new Date().toISOString(); Helix.vfs.save(); }
      }
      return "";
    },
    rm(a) {
      const r = a.includes("-r") || a.includes("-rf") || a.includes("-fr");
      const target = a.find(x => !x.startsWith("-"));
      if (!target) throw new Error("rm: missing operand");
      Helix.vfs.rm(target, Helix.kernel.state.cwd, r); return "";
    },
    grep(a, stdin) {
      if (!a[0]) throw new Error("grep: usage: grep [-i] PATTERN [FILE]");
      const ic = a.includes("-i");
      const args = a.filter(x => !x.startsWith("-"));
      const pat = args[0];
      if (!pat) throw new Error("grep: usage: grep [-i] PATTERN [FILE]");
      let text;
      if (args[1]) {
        const n = Helix.vfs.getNode(args[1], Helix.kernel.state.cwd);
        if (n && n.node.type === "file" && n.node.encoding === "dataurl") throw new Error("grep: " + args[1] + ": binary file");
        text = Helix.vfs.read(args[1], Helix.kernel.state.cwd);
      } else if (stdin != null) text = String(stdin);
      else throw new Error("grep: missing file");
      const esc = pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(esc, ic ? "i" : "");
      return String(text).split("\n").filter(l => re.test(l)).join("\n");
    },
    head(a, stdin) {
      let narg = 10, file;
      for (let i = 0; i < a.length; i++) { if (a[i] === "-n" && a[i+1]) { narg = parseInt(a[++i],10)||10; } else if (!a[i].startsWith("-")) file = a[i]; }
      let text;
      if (file) {
        const n = Helix.vfs.getNode(file, Helix.kernel.state.cwd);
        if (n && n.node.type === "file" && n.node.encoding === "dataurl") throw new Error("head: " + file + ": binary file");
        text = Helix.vfs.read(file, Helix.kernel.state.cwd);
      } else if (stdin != null) text = String(stdin);
      else throw new Error("head: missing file");
      return String(text).split("\n").slice(0,narg).join("\n");
    },
    tail(a, stdin) {
      let narg = 10, file;
      for (let i = 0; i < a.length; i++) { if (a[i] === "-n" && a[i+1]) { narg = parseInt(a[++i],10)||10; } else if (!a[i].startsWith("-")) file = a[i]; }
      let text;
      if (file) {
        const n = Helix.vfs.getNode(file, Helix.kernel.state.cwd);
        if (n && n.node.type === "file" && n.node.encoding === "dataurl") throw new Error("tail: " + file + ": binary file");
        text = Helix.vfs.read(file, Helix.kernel.state.cwd);
      } else if (stdin != null) text = String(stdin);
      else throw new Error("tail: missing file");
      const lines = String(text).split("\n");
      return lines.slice(Math.max(0, lines.length-narg)).join("\n");
    },
    tree(a) {
      const target = a[0] ? resolveTarget(a[0]) : Helix.kernel.state.cwd;
      const out = [a[0] || "."];
      return tree(target, "", out).join("\n");
    },
    wc(a, stdin) {
      let text, label = "";
      if (a[0]) {
        const n = Helix.vfs.getNode(a[0], Helix.kernel.state.cwd);
        if (n && n.node.type === "file" && n.node.encoding === "dataurl") throw new Error("wc: " + a[0] + ": binary file");
        text = Helix.vfs.read(a[0], Helix.kernel.state.cwd); label = " " + a[0];
      }
      else if (stdin != null) text = String(stdin);
      else throw new Error("wc: missing file");
      const lines = text === "" ? 0 : String(text).split("\n").length;
      const words = (String(text).trim().match(/\S+/g) || []).length;
      const bytes = String(text).length;
      return lines + " " + words + " " + bytes + label;
    },
    file(a) {
      if (!a[0]) throw new Error("file: missing operand");
      const n = Helix.vfs.getNode(a[0], Helix.kernel.state.cwd);
      if (!n) throw new Error("file: " + a[0] + ": No such file or directory");
      if (n.node.type === "dir") return a[0] + ": directory";
      if (n.node.encoding === "dataurl") return a[0] + ": " + (n.node.mime || "binary") + " (dataurl, " + (n.node.size||0) + " bytes)";
      return a[0] + ": " + (n.node.mime || "text/plain") + " (" + (n.node.size||0) + " bytes)";
    },
    calc(a) {
      const expr = a.join(" ").trim();
      if (!expr) throw new Error("calc: usage: calc EXPRESSION");
      if (!/^[0-9+\-*/().%\s]+$/.test(expr)) throw new Error("calc: unsupported expression");
      try { const v = Function('"use strict";return (' + expr + ')')(); return String(v); } catch (e) { throw new Error("calc: invalid expression"); }
    },
    reboot() { try { location.reload(); } catch(e){} return "rebooting..."; },
    poweroff() { return "System halted. (browser session remains open; close tab to exit)"; },
    env() {
      const k = Helix.kernel.state;
      return ["USER="+(k.user||"guest"), "HOME="+(k.user==="root"?"/root":"/home/"+(k.user||"guest")), "PWD="+k.cwd, "HOSTNAME="+k.host, "SHELL=/bin/hsh", "TERM=helix-tty"].join("\n");
    },
    stat(a) { if(!a[0]) throw new Error("stat: missing file"); const s=Helix.vfs.stat(a[0], Helix.kernel.state.cwd); const n=Helix.vfs.getNode(a[0], Helix.kernel.state.cwd); const extra=(n&&n.node&&(n.node.mime||n.node.encoding)) ? ("\nmime: "+(n.node.mime||"-")+"\nencoding: "+(n.node.encoding||"-")) : ""; return "path: "+s.path+"\ntype: "+s.type+"\nmode: "+s.mode+"\nowner: "+s.owner+"\nsize: "+s.size+"\nmtime: "+s.mtime+extra; },
    fortune() {
      try {
        const txt = Helix.vfs.read("/usr/share/fortunes", "/");
        const items = txt.split(/\n---\n/).map(x=>x.trim()).filter(Boolean);
        return items.length ? items[Math.floor(Math.random()*items.length)] : "";
      } catch(e){ return "fortune: no fortunes"; }
    },
    find(a) {
      const base = a[0] && !a[0].startsWith("-") ? a[0] : ".";
      const pat = (a[1] && !a[1].startsWith("-")) ? a[1] : (a[0] && a[0].startsWith("-") ? "" : "");
      const root = Helix.vfs.norm(base, Helix.kernel.state.cwd);
      const out = [];
      function walk(p) {
        const n = Helix.vfs.getNode(p,"/");
        if (!n) return;
        if (!pat || p.includes(pat)) out.push(p);
        if (n.node.type === "dir") Helix.vfs.list(p,"/").forEach(name => walk(p==="/" ? "/"+name : p+"/"+name));
      }
      walk(root);
      return out.join("\n");
    },
    id() { const u=Helix.kernel.state.user||"guest"; return "uid="+(u==="root"?0:1000)+"("+u+") gid="+(u==="root"?0:1000)+"("+u+")"; },
    uptime() { const s=Math.floor(performance.now()/1000); const m=Math.floor(s/60), sec=s%60; return "up " + m + " min, " + sec + " sec, 1 user, load average: 0.12, 0.08, 0.03"; },
    dmesg() { try { return Helix.vfs.read("/var/log/syslog","/"); } catch(e){ return "[boot] kernel initialized"; } },
    rmdir(a) { if(!a[0]) throw new Error("rmdir: missing operand"); const p=Helix.vfs.norm(a[0], Helix.kernel.state.cwd); const n=Helix.vfs.getNode(p,"/"); if(!n) throw new Error("rmdir: no such file or directory: "+a[0]); if(n.node.type!=="dir") throw new Error("rmdir: not a directory: "+a[0]); if(Object.keys(n.node.children).length) throw new Error("rmdir: directory not empty: "+a[0]); Helix.vfs.rm(a[0], Helix.kernel.state.cwd, false); return ""; },
    kill(a) {
      if (!a[0]) throw new Error("kill: usage: kill PID");
      const pid = parseInt(a[0], 10);
      const p = Helix.kernel.state.processes[pid];
      if (!p) throw new Error("kill: (" + a[0] + ") - No such process");
      if (Helix.kernel.isCoreProc && Helix.kernel.isCoreProc(pid)) throw new Error("kill: (" + pid + ") - Operation not permitted (core process)");
      Helix.kernel.kill(pid);
      return "";
    },
    df() { return "Filesystem      1K-blocks  Used Available Use% Mounted on\nhelixos-vfs        65536    64     65472   1% /\nlocalstorage        n/a    n/a       n/a   -  /persist"; },
    free() { const m = performance && performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) : 0; return "              total        used        free\nMem:           65536        "+m+"MB      "+Math.max(0,65536-m)+"\n(JS heap used shown; simulated)"; },
    true() { return ""; },
    false() { throw new Error(""); },
    passwd(a) {
      const u = Helix.kernel.state.user || "guest";
      const next = a[0];
      if (!next) throw new Error("passwd: usage: passwd NEWPASSWORD");
      let txt = "";
      try { txt = Helix.vfs.read("/etc/passwd","/"); } catch(e){ txt = "root:root\nguest:guest\n"; }
      const lines = txt.split("\n").filter(Boolean).map(l => { const [name,p]=l.split(":"); return name===u ? (name+":"+next) : l; });
      if (!lines.some(l=>l.startsWith(u+":"))) lines.push(u+":"+next);
      Helix.vfs.write("/etc/passwd", lines.join("\n")+"\n", "/");
      return "password updated for " + u;
    },
    whoami() { return Helix.kernel.state.user || "guest"; },
    hostname() { return Helix.kernel.state.host; },
    ps() { return Helix.kernel.ps(); },
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
      if (Helix.kernel.savePrefs) Helix.kernel.savePrefs();
      return "theme: " + t;
    },
    reloadstyle() {
      if (!Helix.xmlstyle || !Helix.xmlstyle.load) return "reloadstyle: xmlstyle not loaded";
      return Helix.xmlstyle.load("xml/styles.xml").then(ok => ok ? "xml styles reloaded (xml/styles.xml)" : "xmlstyle: failed to load");
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
    startx() {
      if (!Helix.desktop || !Helix.desktop.start) return "startx: desktop modules not loaded";
      return Helix.desktop.start();
    },
    hsh() { return "hsh: core login shell process (init→getty→login→hsh). Not an app window; use Terminal or ps."; },
    shell() { return cmds.hsh(); },
    logout() { Helix.kernel.logout(); Helix.terminal.setLoginMode(true); return "logout"; },
    resetfs() { Helix.vfs.reset(); return "filesystem reset to defaults (reload recommended)"; }
  };
  async function run(line, stdin) {
    const raw = (line || "").trim();
    if (!raw) return "";
    const parts = argsOf(raw);
    const name = parts[0];
    const a = parts.slice(1);
    if (cmds[name]) {
      let r = cmds[name](a, stdin);
      if (r && typeof r.then === "function") r = await r;
      return r == null ? "" : String(r);
    }
    throw new Error("hsh: command not found: " + name);
  }
  window.Helix = window.Helix || {};
  Helix.commands = { run, cmds, argsOf };
})();