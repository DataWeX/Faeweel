(function () {
  const STORAGE = "helixos.vfs.v1";
  function now() { return new Date().toISOString(); }
  function mkDir(mode, owner) { return { type: "dir", mode: mode || "755", owner: owner || "root", mtime: now(), children: {} }; }
  function mkFile(content, mode, owner) {
    const c = content || "";
    return { type: "file", mode: mode || "644", owner: owner || "root", mtime: now(), content: c, size: c.length };
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
    root.children.etc.children.hostname = mkFile("helix\n");
    root.children.etc.children.motd = mkFile("Welcome to HelixOS (browser JS kernel simulation)\nType 'help' for commands. Type 'startx' for desktop placeholder.\n");
    root.children.etc.children.passwd = mkFile("root:root\nguest:guest\n");
    root.children.home.children.guest.children["README.txt"] = mkFile("HelixOS guest home.\nTry: ls, cat /etc/motd, neofetch, theme amber\n");
    root.children.var.children.log.children.syslog = mkFile("[boot] kernel initialized\n");
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
    if (!path || path === "~") path = "/home/" + (Helix.kernel && Helix.kernel.user || "guest");
    if (path.startsWith("~/")) path = "/home/" + (Helix.kernel && Helix.kernel.user || "guest") + path.slice(1);
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
      r.node.content = String(content);
      r.node.size = r.node.content.length;
      r.node.mtime = now();
      if (opts.mode) r.node.mode = opts.mode;
      save(); return;
    }
    const p = ensureParent(path, cwd);
    if (!p || !p.name) throw new Error("Cannot create: " + path);
    p.parent.children[p.name] = mkFile(String(content), opts.mode, (Helix.kernel && Helix.kernel.user) || "root");
    save();
  }
  function mkdir(path, cwd) {
    if (getNode(path, cwd)) throw new Error("File exists: " + path);
    const p = ensureParent(path, cwd);
    if (!p || !p.name) throw new Error("Cannot create: " + path);
    p.parent.children[p.name] = mkDir("755", (Helix.kernel && Helix.kernel.user) || "root");
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
  function reset() { state = { root: defaultFS() }; save(); }
  window.Helix = window.Helix || {};
  load();
  Helix.vfs = { load, save, norm, getNode, list, read, write, mkdir, rm, stat, exists, reset, _state: () => state };
})();