(function () {
  const STORAGE = "helixos.vfs.v1";
  function now() { return new Date().toISOString(); }
  function mkDir(mode, owner) { return { type: "dir", mode: mode || "755", owner: owner || "root", mtime: now(), children: {} }; }
  function mkFile(content, mode, owner, opts) {
    opts = opts || {};
    const c = content == null ? "" : String(content);
    const f = { type: "file", mode: mode || "644", owner: owner || "root", mtime: now(), content: c, size: opts.size != null ? opts.size : c.length };
    if (opts.mime) f.mime = opts.mime;
    if (opts.encoding) f.encoding = opts.encoding;
    return f;
  }
  function defaultFS() {
    const root = mkDir();
    root.children.bin = mkDir();
    root.children.etc = mkDir();
    root.children.home = mkDir();
    root.children.tmp = mkDir("777");
    root.children.var = mkDir();
    root.children.var.children.log = mkDir();
    root.children.usr = mkDir();
    root.children.usr.children.share = mkDir();
    root.children.root = mkDir("700", "root");
    root.children.home.children.guest = mkDir("755", "guest");
    root.children.home.children.guest.children.Documents = mkDir("755", "guest");
    root.children.home.children.guest.children.Pictures = mkDir("755", "guest");
    root.children.home.children.guest.children.Music = mkDir("755", "guest");
    root.children.etc.children.hostname = mkFile("helix\n");
    root.children.etc.children.motd = mkFile("Welcome to HelixOS\nHelixOS core and hsh shell running above Linux x86_64 kernel base (WebVM).\nType 'help' for commands. Type 'startx' for HelixDE. Type 'linux' for Linux base shell.\n");
    root.children.etc.children.passwd = mkFile("root:root\nguest:guest\n");
    root.children.etc.children["helix.conf"] = mkFile("NAME=HelixOS\nVERSION=1.0.0-js\nARCH=helix-core-above-linux-x86_64\nBASE_KERNEL=Linux x86_64 (WebVM/CheerpX)\nKERNEL=helix 1.0.0-js (core layer)\nSHELL=/bin/hsh\n");
    root.children.home.children.guest.children["README.txt"] = mkFile("HelixOS guest home.\nArchitecture: HelixOS core + hsh shell sits above Linux x86_64 kernel/userspace base (WebVM).\nTry: ls, cat /etc/motd, neofetch, uname -a, startx, linux\nFiles persist in browser localStorage (helixos.vfs.v1).\n");
    root.children.home.children.guest.children.Documents.children["notes.txt"] = mkFile("HelixOS notes\n- Base: Linux x86_64 kernel/userspace (WebVM, online)\n- HelixOS core above base: BIOS -> helix core -> getty tty1 -> login -> hsh\n- Core shell: hsh (init/getty/login/hsh)\n- GUI: startx -> HelixDE on :0\n- Real Linux shell: `linux` command or Linux x64 app\n");
    root.children.usr.children.share.children.fortunes = mkFile("Simplicity is prerequisite for reliability.\n---\nIn a browser, every sandbox is a small universe.\n---\nA core can be simple, even when layered above a powerful kernel.\n");
    root.children.var.children.log.children.syslog = mkFile("[base] linux-x86_64 kernel/userspace ready (WebVM)\n[boot] helix core layer starting above linux base\n[boot] kernel initialized\n[boot] vfs mounted\n[boot] getty started on tty1\n");
    return root;
  }
  let state = null;
  function save() { try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch (e) {} }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) { state = JSON.parse(raw); return; }
    } catch (e) {}
    state = { root: defaultFS() };
    save();
  }
  function norm(path, cwd) {
    const user = (Helix.kernel && Helix.kernel.state && Helix.kernel.state.user) || "guest";
    if (!path || path === "~") path = "/home/" + user;
    if (path.startsWith("~/")) path = "/home/" + user + path.slice(1);
    if (!path.startsWith("/")) path = (cwd || "/") + "/" + path;
    const parts = path.split("/");
    const out = [];
    for (const p of parts) {
      if (!p || p === ".") continue;
      if (p === "..") out.pop(); else out.push(p);
    }
    return "/" + out.join("/") || "/";
  }
  function getNode(path, cwd) {
    const p = norm(path, cwd);
    if (p === "/") return { node: state.root, path: "/", parent: null, name: "" };
    const parts = p.split("/").filter(Boolean);
    let cur = state.root, parent = null;
    for (let i = 0; i < parts.length; i++) {
      if (!cur || cur.type !== "dir" || !cur.children[parts[i]]) return null;
      parent = cur;
      cur = cur.children[parts[i]];
    }
    return { node: cur, path: p, parent, name: parts[parts.length - 1] };
  }
  function ensureParent(path, cwd) {
    const p = norm(path, cwd);
    const i = p.lastIndexOf("/");
    const dir = i <= 0 ? "/" : p.slice(0, i);
    const name = p.slice(i + 1);
    const d = getNode(dir, "/");
    if (!d || d.node.type !== "dir") return null;
    return { parent: d.node, name, path: p };
  }
  function list(path, cwd) {
    const r = getNode(path, cwd);
    if (!r) throw new Error("No such file or directory: " + path);
    if (r.node.type !== "dir") return [r.name || r.path];
    return Object.keys(r.node.children).sort();
  }
  function read(path, cwd) {
    const r = getNode(path, cwd);
    if (!r) throw new Error("No such file or directory: " + path);
    if (r.node.type === "dir") throw new Error("Is a directory: " + path);
    return r.node.content || "";
  }
  function write(path, content, cwd, opts) {
    opts = opts || {};
    const r = getNode(path, cwd);
    if (r && r.node.type === "dir") throw new Error("Is a directory: " + path);
    if (r && r.node.type === "file") {
      r.node.content = content == null ? "" : String(content);
      r.node.size = opts.size != null ? opts.size : r.node.content.length;
      r.node.mtime = now();
      if (opts.mode) r.node.mode = opts.mode;
      if (opts.mime) r.node.mime = opts.mime; else if (opts.encoding !== "dataurl") delete r.node.mime;
      if (opts.encoding) r.node.encoding = opts.encoding; else delete r.node.encoding;
      save(); return;
    }
    const p = ensureParent(path, cwd);
    if (!p || !p.name) throw new Error("Cannot create: " + path);
    p.parent.children[p.name] = mkFile(content, opts.mode, (Helix.kernel && Helix.kernel.state && Helix.kernel.state.user) || "root", opts);
    save();
  }
  function mkdir(path, cwd, opts) {
    opts = opts || {};
    const r = getNode(path, cwd);
    if (r) { if (opts.p && r.node.type === "dir") return; throw new Error("File exists: " + path); }
    if (opts.p) {
      const parts = norm(path, cwd).split("/").filter(Boolean);
      let cur = "";
      for (const part of parts) {
        cur += "/" + part;
        if (!getNode(cur, "/")) mkdir(cur, "/", { p: false });
      }
      return;
    }
    const p = ensureParent(path, cwd);
    if (!p || !p.name) throw new Error("Cannot create: " + path);
    p.parent.children[p.name] = mkDir("755", (Helix.kernel && Helix.kernel.state && Helix.kernel.state.user) || "root");
    save();
  }
  function rm(path, cwd, recursive) {
    const p = norm(path, cwd);
    if (p === "/") throw new Error("refusing to remove /");
    const r = getNode(p, "/");
    if (!r) throw new Error("No such file or directory: " + path);
    if (r.node.type === "dir" && !recursive) throw new Error("Is a directory: " + path);
    delete r.parent.children[r.name];
    save();
  }
  function stat(path, cwd) {
    const r = getNode(path, cwd);
    if (!r) throw new Error("No such file or directory: " + path);
    return { path: r.path, type: r.node.type, mode: r.node.mode, owner: r.node.owner, mtime: r.node.mtime, size: r.node.size || 0 };
  }
  function exists(path, cwd) { return !!getNode(path, cwd); }
  function copy(src, dest, cwd, opts) {
    opts = opts || {};
    const s = getNode(src, cwd);
    if (!s) throw new Error("No such file or directory: " + src);
    if (s.node.type === "dir") {
      if (!opts.r) throw new Error("cp: -r not specified; omitting directory '" + src + "'");
      const d = getNode(dest, cwd);
      let target = norm(dest, cwd);
      if (d && d.node.type === "dir") target = target.replace(/\/$/, "") + "/" + s.name;
      mkdir(target, "/", { p: true });
      Helix.vfs.list(s.path, "/").forEach(name => copy(s.path + "/" + name, target + "/" + name, "/", { r: true }));
      return;
    }
    const d = getNode(dest, cwd);
    let outPath = norm(dest, cwd);
    if (d && d.node.type === "dir") outPath = outPath.replace(/\/$/, "") + "/" + s.name;
    write(outPath, read(src, cwd), "/", { mime: s.node.mime, encoding: s.node.encoding, mode: s.node.mode, size: s.node.size });
  }
  function move(src, dest, cwd) {
    const s = getNode(src, cwd);
    if (!s) throw new Error("No such file or directory: " + src);
    copy(src, dest, cwd, { r: true });
    rm(src, cwd, true);
  }
  function reset() { state = { root: defaultFS() }; save(); }
  window.Helix = window.Helix || {};
  load();
  Helix.vfs = { load, save, norm, getNode, list, read, write, mkdir, rm, stat, exists, copy, move, reset, _state: () => state };
})();