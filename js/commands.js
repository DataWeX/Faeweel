(function () {
  function out(text, cls) { Helix.terminal.print(text, cls); }
  function err(text) { out(text, "err"); }
  function argsOf(s) { return s.trim() ? s.trim().match(/(?:[^\s"]+|"[^"]*")+/g).map(x => x.replace(/^"|"$/g, "")) : []; }
  const cmds = {
    help() {
      return "Commands: help, clear, echo, pwd, cd, ls, cat, mkdir, touch, rm, whoami, hostname, date, uname, neofetch, theme, startx, logout, resetfs, history";
    },
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
    mkdir(a) { if (!a[0]) throw new Error("mkdir: missing operand"); Helix.vfs.mkdir(a[0], Helix.kernel.state.cwd); return ""; },
    touch(a) { if (!a[0]) throw new Error("touch: missing file"); if (!Helix.vfs.exists(a[0], Helix.kernel.state.cwd)) Helix.vfs.write(a[0], "", Helix.kernel.state.cwd); return ""; },
    rm(a) {
      const r = a.includes("-r") || a.includes("-rf") || a.includes("-fr");
      const target = a.find(x => !x.startsWith("-"));
      if (!target) throw new Error("rm: missing operand");
      Helix.vfs.rm(target, Helix.kernel.state.cwd, r); return "";
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