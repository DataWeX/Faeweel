const VFS = (() => {
  const STORAGE_KEY = "helixos.vfs.v1";
  const MAX_TREE_DEPTH = 128;
  const MAX_TREE_NODES = 50000;

  const now = () => Date.now();

  let storageStatus = { persistent: true, error: null };

  function setStorageStatus(persistent, error = null) {
    const changed = storageStatus.persistent !== persistent || storageStatus.error !== error;
    storageStatus = { persistent, error };
    if (!changed) return;
    try {
      if (typeof window !== "undefined" && typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
        window.dispatchEvent(new CustomEvent("helix:storage", { detail: { ...storageStatus } }));
      }
    } catch {
      // Storage reporting must not interfere with filesystem operations.
    }
  }

  function getStorageStatus() {
    return { ...storageStatus };
  }

  function validTree(value) {
    let count = 0;

    function validNode(current, depth) {
      if (!current || typeof current !== "object" || Array.isArray(current) || depth > MAX_TREE_DEPTH || ++count > MAX_TREE_NODES) return false;
      if (!["dir", "file", "link"].includes(current.type)) return false;
      if (!Number.isFinite(current.mode) || typeof current.owner !== "string" || typeof current.group !== "string" ||
          !Number.isFinite(current.mtime) || !Number.isFinite(current.ctime)) return false;
      if (current.exec !== undefined && typeof current.exec !== "boolean") return false;
      if (current.binary !== undefined && typeof current.binary !== "boolean") return false;
      if (current.mime !== undefined && typeof current.mime !== "string") return false;
      if (current.encoding !== undefined && typeof current.encoding !== "string") return false;

      if (current.type === "dir") {
        const children = current.children;
        if (!children || typeof children !== "object" || Array.isArray(children) ||
            (Object.getPrototypeOf(children) !== Object.prototype && Object.getPrototypeOf(children) !== null)) return false;
        const names = Object.keys(children);
        if (names.length > MAX_TREE_NODES - count) return false;
        return names.every(name => name && name !== "__proto__" && name !== "constructor" && name !== "prototype" &&
          !name.includes("/") && name !== "." && name !== ".." && validNode(children[name], depth + 1));
      }
      if (current.type === "file") return typeof current.content === "string";
      return typeof current.target === "string";
    }

    return validNode(value, 0);
  }

  const node = (type, extra = {}) => ({
    type,
    mode: extra.mode || (type === "dir" ? 0o755 : 0o644),
    owner: extra.owner || "root",
    group: extra.group || "staff",
    mtime: extra.mtime || now(),
    ctime: extra.ctime || now(),
    children: type === "dir" ? extra.children || {} : undefined,
    content: type === "file" ? extra.content || "" : undefined,
    target: type === "link" ? extra.target || "" : undefined,
    exec: extra.exec || false,
    binary: extra.binary || false,
    mime: extra.mime || "",
    encoding: extra.encoding || ""
  });

  function seed() {
    const readme = `# HelixOS
A browser-native shell operating system.

Try:
  help
  startx
  wine notepad.exe
  ls -la
  cat /etc/motd
  fortune
  neofetch
  theme amber

HelixOS is not Linux. wine is the OS compatibility layer for Windows files.
`;

    const motd = `Welcome to HelixOS 1.0 (browser-native)
Kernel helix 1.0.0 #1 SMP WebAssembly
Last login: just now from localhost

This is tty1. Type 'startx' to launch HelixDE.
Type 'vmm start' then 'linux' for a real Linux x86_64 guest (TinyEMU + busybox).
Type 'help' for a list of commands.
`;

    const hosts = `127.0.0.1 localhost helix
::1       localhost
`;

    const passwd = `root:x:0:0:root:/root:/bin/hsh
guest:x:1000:1000:Guest User:/home/guest:/bin/hsh
`;

    const helixrc = `# ~/.helixrc
export EDITOR=edit
alias ll='ls -la'
alias ..='cd ..'
`;

    const poem = `the cursor blinks
like a small green star
waiting for a name
`;

    const todo = `- [x] boot kernel
- [x] mount vfs
- [ ] write a poem
- [ ] beat snake high score
`;

    const licenses = `HelixOS is a fictional operating system running in your browser.
No actual hardware was harmed in the making of this demo.
`;

    return {
      type: "dir",
      mode: 0o755,
      owner: "root",
      group: "staff",
      mtime: now(),
      ctime: now(),
      children: {
        bin: node("dir", {
          children: {
            hsh: node("file", { content: "#!/bin/hsh\n# helix shell binary\n", exec: true, mode: 0o755 }),
            cat: node("file", { content: "builtin", exec: true, mode: 0o755 }),
            ls: node("file", { content: "builtin", exec: true, mode: 0o755 }),
            echo: node("file", { content: "builtin", exec: true, mode: 0o755 })
          }
        }),
        boot: node("dir", {
          children: {
            "vmlinuz": node("file", { content: "[helix js kernel]\n", mode: 0o644 }),
            "vmlinuz-linux": node("file", { content: "firmware/vmlinuz.bin\n", mode: 0o644 }),
            "vmlinuz-x86_64": node("file", { content: "firmware/kernel-x86_64.bin\n", mode: 0o644 }),
            "seabios.bin": node("file", { content: "firmware/seabios.bin\n", mode: 0o644 }),
            "initrd.img": node("file", { content: "[init ramdisk]\n" })
          }
        }),
        dev: node("dir", {
          children: {
            null: node("file", { content: "" }),
            zero: node("file", { content: "" }),
            tty: node("file", { content: "" }),
            random: node("file", { content: "4\n" })
          }
        }),
        etc: node("dir", {
          children: {
            hostname: node("file", { content: "helix\n" }),
            motd: node("file", { content: motd }),
            hosts: node("file", { content: hosts }),
            passwd: node("file", { content: passwd }),
            issue: node("file", { content: "HelixOS 1.0 \\n \\l\n" }),
            osrelease: node("file", { content: "NAME=HelixOS\nVERSION=1.0\nID=helix\n" }),
            "helix.conf": node("file", { content: "theme=fire\nhostname=helix\nwallpaper=ember\naccent=\n" })
          }
        }),
        home: node("dir", {
          children: {
            guest: node("dir", {
              owner: "guest",
              children: {
                "README.md": node("file", { content: readme, owner: "guest" }),
                "notes.txt": node("file", { content: "scratch pad.\n", owner: "guest" }),
                "todo.md": node("file", { content: todo, owner: "guest" }),
                ".helixrc": node("file", { content: helixrc, owner: "guest", mode: 0o600 }),
                docs: node("dir", {
                  owner: "guest",
                  children: {
                    "poem.txt": node("file", { content: poem, owner: "guest" }),
                    "LICENSE": node("file", { content: licenses, owner: "guest" })
                  }
                }),
                bin: node("dir", {
                  owner: "guest",
                  children: {
                    hello: node("file", {
                      owner: "guest",
                      exec: true,
                      mode: 0o755,
                      content: "echo Hello from a user script.\necho You can run scripts with: run hello"
                    })
                  }
                }),
                ".wine": node("dir", {
                  owner: "guest",
                  children: {
                    "system.reg": node("file", {
                      owner: "guest",
                      content: "WINE REGISTRY Version 2\n;; Helix wine prefix (compat shim, not real Wine)\n[Software\\\\Wine]\n\"Version\"=\"9.0-helix\"\n"
                    }),
                    drive_c: node("dir", {
                      owner: "guest",
                      children: {
                        windows: node("dir", {
                          owner: "guest",
                          children: {
                            system32: node("dir", {
                              owner: "guest",
                              children: {
                                "notepad.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:edit\n" }),
                                "wordpad.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:edit\n" }),
                                "write.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:edit\n" }),
                                "explorer.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:files\n" }),
                                "cmd.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:term\n" }),
                                "powershell.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:term\n" }),
                                "mspaint.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:media\n" }),
                                "winmine.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:snake\n" }),
                                "sol.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:snake\n" }),
                                "winecfg.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:wine\n" }),
                                "regedit.exe": node("file", { owner: "guest", exec: true, mode: 0o755, content: "helix-wine:edit\n" })
                              }
                            })
                          }
                        }),
                        users: node("dir", {
                          owner: "guest",
                          children: {
                            guest: node("dir", { owner: "guest", children: {} })
                          }
                        })
                      }
                    })
                  }
                }),
                media: node("dir", {
                  owner: "guest",
                  children: {
                    photos: node("dir", { owner: "guest", children: {} }),
                    videos: node("dir", { owner: "guest", children: {} }),
                    audio: node("dir", { owner: "guest", children: {} })
                  }
                })
              }
            })
          }
        }),
        proc: node("dir", {
          children: {
            version: node("file", { content: "HelixOS version 1.0 (browser)\n" }),
            cpuinfo: node("file", { content: "processor : 0\nmodel name : Helix Virtual CPU\n" }),
            meminfo: node("file", { content: "MemTotal: 262144 kB\nMemFree: 184320 kB\n" }),
            uptime: node("file", { content: "0.00 0.00\n" })
          }
        }),
        root: node("dir", { mode: 0o700 }),
        tmp: node("dir", { mode: 0o1777, children: {} }),
        usr: node("dir", {
          children: {
            bin: node("dir", {
              children: {
                wine: node("file", { content: "builtin", exec: true, mode: 0o755 })
              }
            }),
            share: node("dir", {
              children: {
                fortune: node("file", { content: [
                  "There is no cloud, only someone else's computer.",
                  "Have you tried turning it off and on again?",
                  "rm -rf / is a love language. Do not use it.",
                  "The best code is the code you never wrote.",
                  "In HelixOS, every file is a story waiting to be cat'd.",
                  "Permission denied is just the universe setting boundaries.",
                  "A watched progress bar never completes.",
                  "sudo make me a sandwich — okay.",
                  "It's not a bug, it's an undocumented feature.",
                  "The shell is the soul of the machine."
                ].join("\n---\n") }),
                wine: node("dir", {
                  children: {
                     "README": node("file", { content: `Helix Wine 9.0 (OS compatibility layer)
Windows files open through this layer.

Mapped names:
  notepad.exe / wordpad.exe  -> edit
  explorer.exe / cmd.exe     -> files / term
  mspaint.exe / snippingtool.exe -> media
  webcam.exe                 -> camera
  winmine.exe / sol.exe      -> snake
  matrix.exe                 -> matrix

Other types:
  .bat .cmd .ps1  scripts
  .txt .rtf .doc  notepad
  .bmp .png .jpg  paint / media
  .exe .dll .msi  Wine runner (PE cannot execute natively)
` })
                  }
                })
              }
            })
          }
        }),
        var: node("dir", {
          children: {
            log: node("dir", {
              children: {
                "syslog": node("file", { content: "" }),
                "boot.log": node("file", { content: "" })
              }
            })
          }
        })
      }
    };
  }

  let root = seed();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(root));
      setStorageStatus(true);
    } catch {
      setStorageStatus(false, "Unable to save filesystem to browser storage");
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        if (!validTree(loaded)) {
          root = seed();
          setStorageStatus(false, "Saved filesystem is corrupt; using an in-memory copy");
          return false;
        }
        root = loaded;
        setStorageStatus(true);
        return true;
      }
      setStorageStatus(true);
    } catch {
      root = seed();
      setStorageStatus(false, "Unable to load filesystem from browser storage");
    }
    return false;
  }

  function reset() {
    root = seed();
    persist();
  }

  function split(path) {
    return path.split("/").filter(Boolean);
  }

  function join(base, rel) {
    if (!rel) return base;
    if (rel.startsWith("/")) return normalize(rel);
    return normalize(base.replace(/\/+$/, "") + "/" + rel);
  }

  function normalize(path) {
    const parts = [];
    const abs = path.startsWith("/");
    for (const p of split(path)) {
      if (p === "." || p === "") continue;
      if (p === "..") parts.pop();
      else parts.push(p);
    }
    return (abs ? "/" : "") + parts.join("/") || (abs ? "/" : ".");
  }

  function walk(path, { createDirs = false, untilParent = false } = {}) {
    const npath = normalize(path);
    const parts = split(npath);
    if (untilParent && parts.length) parts.pop();
    let cur = root;
    let trail = "/";
    for (const p of parts) {
      if (!cur || cur.type !== "dir") return { error: "not a directory", path: trail };
      if (!cur.children[p]) {
        if (createDirs) {
          cur.children[p] = node("dir");
          cur.mtime = now();
        } else {
          return { error: "no such file or directory", path: join(trail, p) };
        }
      }
      cur = cur.children[p];
      trail = join(trail, p);
    }
    return { node: cur, path: npath === "" ? "/" : npath };
  }

  function parentAndName(path) {
    const npath = normalize(path);
    const parts = split(npath);
    const name = parts.pop();
    const parentPath = "/" + parts.join("/");
    const parent = walk(parentPath);
    return { parent: parent.node, parentPath, name, error: parent.error };
  }

  function stat(path) {
    const r = walk(path);
    if (r.error) return r;
    const n = r.node;
    return {
      path: r.path,
      type: n.type,
      mode: n.mode,
      owner: n.owner,
      group: n.group,
      mtime: n.mtime,
      size: n.type === "file" ? fileSize(n) : n.type === "dir" ? Object.keys(n.children || {}).length : 0,
      exec: !!n.exec,
      target: n.target,
      binary: !!n.binary,
      mime: n.mime || "",
      node: n
    };
  }

  function read(path) {
    const r = walk(path);
    if (r.error) return r;
    if (r.node.type === "dir") return { error: "is a directory", path: r.path };
    if (r.node.type === "link") return read(r.node.target);
    return {
      content: r.node.content || "",
      path: r.path,
      binary: !!r.node.binary,
      mime: r.node.mime || "",
      encoding: r.node.encoding || ""
    };
  }

  function fileSize(n) {
    if (!n || n.type !== "file") return 0;
    if (n.binary && n.encoding === "base64") {
      const len = (n.content || "").length;
      return Math.floor(len * 0.75);
    }
    return (n.content || "").length;
  }

  function write(path, content, { append = false, exec = false, binary = false, mime = "", encoding = "" } = {}) {
    const npath = normalize(path);
    const existing = walk(npath);
    if (!existing.error) {
      if (existing.node.type === "dir") return { error: "is a directory", path: npath };
      if (append && !binary && !existing.node.binary) {
        existing.node.content = (existing.node.content || "") + content;
      } else {
        existing.node.content = content;
        existing.node.binary = !!binary;
        existing.node.mime = mime || existing.node.mime || "";
        existing.node.encoding = encoding || (binary ? "base64" : "");
      }
      existing.node.mtime = now();
      if (exec) existing.node.exec = true;
      persist();
      return { path: npath };
    }
    const { parent, name, error } = parentAndName(npath);
    if (error) return { error };
    if (!parent || parent.type !== "dir") return { error: "no such file or directory" };
    parent.children[name] = node("file", { content, exec, binary, mime, encoding: encoding || (binary ? "base64" : "") });
    parent.mtime = now();
    persist();
    return { path: npath };
  }

  function mkdir(path, { recursive = false } = {}) {
    const npath = normalize(path);
    const existing = walk(npath);
    if (!existing.error) {
      if (existing.node.type === "dir" && recursive) return { path: npath };
      return { error: "file exists", path: npath };
    }
    if (recursive) {
      const r = walk(npath, { createDirs: true });
      persist();
      return r.error ? r : { path: npath };
    }
    const { parent, name, error } = parentAndName(npath);
    if (error) return { error };
    parent.children[name] = node("dir");
    parent.mtime = now();
    persist();
    return { path: npath };
  }

  function rm(path, { recursive = false } = {}) {
    const npath = normalize(path);
    if (npath === "/") return { error: "cannot remove root" };
    const st = stat(npath);
    if (st.error) return st;
    if (st.type === "dir" && !recursive) return { error: "is a directory" };
    if (st.type === "dir" && Object.keys(st.node.children).length && !recursive) {
      return { error: "directory not empty" };
    }
    const { parent, name, error } = parentAndName(npath);
    if (error) return { error };
    delete parent.children[name];
    parent.mtime = now();
    persist();
    return { path: npath };
  }

  function mv(src, dst) {
    const from = stat(src);
    if (from.error) return from;
    const nsrc = normalize(src);
    let ndst = normalize(dst);
    const dstStat = walk(ndst);
    if (!dstStat.error && dstStat.node.type === "dir") {
      const name = split(nsrc).pop();
      ndst = join(ndst, name);
    }
    const { parent: sp, name: sn, error: se } = parentAndName(nsrc);
    if (se) return { error: se };
    const { parent: dp, name: dn, error: de } = parentAndName(ndst);
    if (de) return { error: de };
    const cloned = JSON.parse(JSON.stringify(from.node));
    cloned.mtime = now();
    dp.children[dn] = cloned;
    delete sp.children[sn];
    persist();
    return { path: ndst };
  }

  function cp(src, dst) {
    const from = stat(src);
    if (from.error) return from;
    const nsrc = normalize(src);
    let ndst = normalize(dst);
    const dstStat = walk(ndst);
    if (!dstStat.error && dstStat.node.type === "dir") {
      ndst = join(ndst, split(nsrc).pop());
    }
    const { parent: dp, name: dn, error: de } = parentAndName(ndst);
    if (de) return { error: de };
    dp.children[dn] = JSON.parse(JSON.stringify(from.node));
    dp.children[dn].mtime = now();
    persist();
    return { path: ndst };
  }

  function ls(path) {
    const r = walk(path);
    if (r.error) return r;
    if (r.node.type !== "dir") {
      return { entries: [{ name: split(r.path).pop(), ...stat(r.path) }] };
    }
    const entries = Object.keys(r.node.children).sort().map((name) => {
      const child = r.node.children[name];
      return {
        name,
        type: child.type,
        mode: child.mode,
        owner: child.owner,
        group: child.group,
        mtime: child.mtime,
        size: child.type === "file" ? fileSize(child) : Object.keys(child.children || {}).length,
        exec: !!child.exec,
        binary: !!child.binary,
        mime: child.mime || ""
      };
    });
    return { entries, path: r.path };
  }

  function tree(path, depth = 3) {
    function rec(p, d, prefix) {
      const r = walk(p);
      if (r.error || r.node.type !== "dir") return [];
      const names = Object.keys(r.node.children).sort();
      const lines = [];
      names.forEach((name, i) => {
        const last = i === names.length - 1;
        const branch = last ? "└── " : "├── ";
        const child = r.node.children[name];
        const mark = child.type === "dir" ? name + "/" : name;
        lines.push(prefix + branch + mark);
        if (child.type === "dir" && d > 0) {
          lines.push(...rec(join(p, name), d - 1, prefix + (last ? "    " : "│   ")));
        }
      });
      return lines;
    }
    const npath = normalize(path);
    return [npath, ...rec(npath, depth, "")];
  }

  function find(path, predicate) {
    const hits = [];
    function rec(p, n) {
      if (predicate(p, n)) hits.push(p);
      if (n.type === "dir") {
        for (const [name, child] of Object.entries(n.children)) rec(join(p, name), child);
      }
    }
    const r = walk(path);
    if (!r.error) rec(r.path, r.node);
    return hits;
  }

  load();

  return {
    root: () => root,
    load, persist, reset, seed, fileSize, getStorageStatus,
    split, join, normalize, walk, stat, read, write, mkdir, rm, mv, cp, ls, tree, find
  };
})();
