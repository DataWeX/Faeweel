const Apps = (() => {
  function open(title, bodyHtml, { onClose, width, height } = {}) {
    const el = WM.open(title, bodyHtml, { onClose, width, height });
    const extras = el.querySelector(".app-bar");
    extras.hidden = true;
    return el;
  }

  function addBarAction(el, label, handler) {
    const extras = el.querySelector(".app-bar");
    extras.hidden = false;
    const btn = document.createElement("button");
    btn.className = "app-close";
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", handler);
    extras.appendChild(btn);
    return btn;
  }

  function edit(args) {
    const path = Kernel.resolvePath(args[0] || "untitled.txt");
    const existing = VFS.read(path);
    const content = existing.error ? "" : existing.content;
    const el = open(`EDIT  ${path}`, `<textarea id="editor">${Commands.esc(content)}</textarea>`, { width: 620, height: 400 });
    const ta = el.querySelector("#editor");
    ta.setAttribute("aria-label", `Edit ${path}`);
    ta.spellcheck = false;
    ta.focus();
    const save = () => {
      const r = VFS.write(path, ta.value);
      toast(r.error ? r.error : VFS.getStorageStatus?.().persistent === false ? `In memory only: export ${path} before leaving` : `saved ${path}`);
    };
    ta.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
      if (e.key === "Escape") el._close();
    });
    addBarAction(el, "save", save);
    addBarAction(el, "save to device", () => {
      save();
      const r = FilesIO.downloadPath(path);
      toast(r.error ? r.error : `saved ${r.name} to your device`);
    });
  }

  function snake() {
    const W = 28;
    const H = 16;
    let dir = { x: 1, y: 0 };
    let pending = dir;
    let snake = [
      { x: 6, y: 8 },
      { x: 5, y: 8 },
      { x: 4, y: 8 }
    ];
    let food;
    let score = 0;
    let dead = false;
    let tick;
    let cleanup = () => {};

    function spawnFood() {
      let p;
      do {
        p = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) };
      } while (snake.some((s) => s.x === p.x && s.y === p.y));
      return p;
    }
    food = spawnFood();

    function render() {
      const rows = [];
      for (let y = 0; y < H; y++) {
        let row = "";
        for (let x = 0; x < W; x++) {
          if (food.x === x && food.y === y) row += "*";
          else if (snake[0].x === x && snake[0].y === y) row += "@";
          else if (snake.some((s) => s.x === x && s.y === y)) row += "o";
          else row += ".";
        }
        rows.push(row);
      }
      const status = dead ? `GAME OVER  score ${score}  — press q` : `score ${score}   wasd/arrows  q quit`;
      board.textContent = status + "\n" + "┌" + "─".repeat(W) + "┐\n" + rows.map((r) => "│" + r + "│").join("\n") + "\n└" + "─".repeat(W) + "┘";
    }

    const el = open("SNAKE", `<pre class="snake-board" id="snakeBoard"></pre>`, {
      width: 520,
      height: 380,
      onClose: () => cleanup()
    });
    const board = el.querySelector("#snakeBoard");

    function step() {
      if (dead) return;
      dir = pending;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= W || head.y >= H || snake.some((s) => s.x === head.x && s.y === head.y)) {
        dead = true;
        render();
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        food = spawnFood();
      } else snake.pop();
      render();
    }

    function onKey(e) {
      const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 }
      };
      if (!el.classList.contains("focused")) return;
      if (e.key === "q" || e.key === "Escape") {
        cleanup();
        el._close();
        return;
      }
      const n = map[e.key];
      if (!n) return;
      if (n.x === -dir.x && n.y === -dir.y) return;
      pending = n;
      e.preventDefault();
    }

    window.addEventListener("keydown", onKey);
    tick = setInterval(step, 140);
    render();
    cleanup = () => {
      clearInterval(tick);
      window.removeEventListener("keydown", onKey);
    };
  }

  function matrix() {
    let running = true;
    let stopMatrix = () => {};
    const el = open("MATRIX", `<canvas class="matrix-canvas" id="mx"></canvas>`, {
      width: 560,
      height: 380,
      onClose: () => stopMatrix()
    });
    const canvas = el.querySelector("#mx");
    const ctx = canvas.getContext("2d");
    const glyphs = "01アイウエオカキクケコHELIX01";
    const fontSize = 14;
    let cols = 1;
    let drops = [1];

    function resize() {
      const body = el.querySelector(".app-body");
      canvas.width = body.clientWidth;
      canvas.height = body.clientHeight;
      cols = Math.floor(canvas.width / fontSize);
      drops = Array(Math.max(1, cols)).fill(1);
    }
    resize();
    el.addEventListener("helixresize", resize);
    const color = getComputedStyle(document.getElementById("crt")).getPropertyValue("--accent").trim() || "#38fca5";

    function draw() {
      if (!running) return;
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.font = fontSize + "px monospace";
      for (let i = 0; i < drops.length; i++) {
        const text = glyphs[Math.floor(Math.random() * glyphs.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(draw);
    }
    draw();

    function onKey(e) {
      if (!el.classList.contains("focused")) return;
      if (e.key === "q" || e.key === "Escape") {
        running = false;
        window.removeEventListener("keydown", onKey);
        el._close();
      }
    }
    window.addEventListener("keydown", onKey);
    stopMatrix = () => {
      running = false;
      window.removeEventListener("keydown", onKey);
    };
  }

  function toast(msg) {
    const t = document.getElementById("toast");
    t.hidden = false;
    t.textContent = msg;
    clearTimeout(t._tid);
    t._tid = setTimeout(() => {
      t.hidden = true;
    }, 1600);
  }

  function files(args) {
    let cwd = Kernel.resolvePath(args[0] || Kernel.env.PWD);
    let selected = new Set();
    let lastClicked = null;

    const el = open("FILES", `
      <div class="fm">
        <div class="fm-toolbar">
          <button type="button" data-act="up">up</button>
          <button type="button" data-act="home">home</button>
          <button type="button" data-act="refresh">refresh</button>
          <span class="fm-path" id="fmPath"></span>
          <span class="fm-spacer"></span>
          <button type="button" data-act="upload">upload</button>
          <button type="button" data-act="download">save to device</button>
          <button type="button" data-act="newfile">new file</button>
          <button type="button" data-act="newdir">new folder</button>
          <button type="button" data-act="rename">rename</button>
          <button type="button" data-act="delete">delete</button>
        </div>
        <div class="fm-drop" id="fmDrop">drop files here to upload</div>
        <div class="fm-cols">
          <span class="fm-icon">type</span>
          <span>name</span>
          <span>size</span>
          <span>modified</span>
        </div>
        <div class="fm-list" id="fmList"></div>
        <div class="fm-status" id="fmStatus"></div>
      </div>
    `, { width: 720, height: 460 });

    const listEl = el.querySelector("#fmList");
    const pathEl = el.querySelector("#fmPath");
    const statusEl = el.querySelector("#fmStatus");
    const dropEl = el.querySelector("#fmDrop");

    function fmtDate(ts) {
      const d = new Date(ts);
      const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, " ")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }

    function render() {
      const res = VFS.ls(cwd);
      pathEl.textContent = cwd;
      selected.clear();
      lastClicked = null;
      if (res.error) {
        listEl.innerHTML = `<div class="fm-empty">cannot open ${Commands.esc(cwd)}: ${Commands.esc(res.error)}</div>`;
        statusEl.textContent = res.error;
        return;
      }
      const entries = res.entries.slice().sort((a, b) => {
        if (a.type === "dir" && b.type !== "dir") return -1;
        if (a.type !== "dir" && b.type === "dir") return 1;
        return a.name.localeCompare(b.name);
      });
      if (!entries.length) {
        listEl.innerHTML = `<div class="fm-empty">empty directory</div>`;
        statusEl.textContent = "0 items";
        return;
      }
      listEl.innerHTML = entries.map((e) => {
        const path = VFS.join(cwd, e.name);
        const cls = e.type === "dir" ? "dir" : e.exec ? "exec" : e.binary ? "bin" : "file";
        const size = e.type === "dir" ? `${e.size} items` : FilesIO.fmtSize(e.size);
        return `<button type="button" class="fm-row" data-path="${Commands.esc(path)}" data-type="${e.type}" data-name="${Commands.esc(e.name)}">
          <span class="fm-icon ${cls}">${FilesIO.iconFor(e)}</span>
          <span class="fm-name ${cls}">${Commands.esc(e.name)}${e.type === "dir" ? "/" : ""}</span>
          <span class="fm-size">${Commands.esc(size)}</span>
          <span class="fm-mtime">${fmtDate(e.mtime)}</span>
        </button>`;
      }).join("");
      statusEl.textContent = `${entries.length} item${entries.length === 1 ? "" : "s"}`;
    }

    function selectedPaths() {
      return Array.from(selected);
    }

    function oneSelected() {
      const paths = selectedPaths();
      return paths.length === 1 ? paths[0] : null;
    }

    function markSelected() {
      listEl.querySelectorAll(".fm-row").forEach((row) => {
        row.classList.toggle("selected", selected.has(row.dataset.path));
      });
      const n = selected.size;
      statusEl.textContent = n ? `${n} selected` : `${listEl.querySelectorAll(".fm-row").length} items`;
    }

    function openEntry(row) {
      if (!row) return;
      if (row.dataset.type === "dir") {
        cwd = row.dataset.path;
        render();
        return;
      }
      const st = VFS.stat(row.dataset.path);
      const kind = FilesIO.mediaKind({ mime: st.mime, name: row.dataset.name });
      const name = row.dataset.name || "";
      if (typeof Wine !== "undefined" && Wine.handles(name, st)) {
        const res = Wine.open(row.dataset.path);
        if (res.app) Apps.launch(res.app, res.args || []);
        else if (res.lines) toast(res.lines.map((l) => l.text).join(" "));
      } else if (kind) Apps.launch("media", [cwd]);
      else Apps.launch("edit", [row.dataset.path]);
    }

    listEl.addEventListener("click", (e) => {
      const row = e.target.closest(".fm-row");
      if (!row) return;
      const path = row.dataset.path;
      if (window.matchMedia("(pointer: coarse)").matches && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        if (selected.has(path) && selected.size === 1) {
          openEntry(row);
          return;
        }
      }
      if (e.shiftKey && lastClicked) {
        const rows = Array.from(listEl.querySelectorAll(".fm-row"));
        const a = rows.findIndex((r) => r.dataset.path === lastClicked);
        const b = rows.findIndex((r) => r.dataset.path === path);
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          if (!e.ctrlKey && !e.metaKey) selected.clear();
          for (let i = lo; i <= hi; i++) selected.add(rows[i].dataset.path);
        }
      } else if (e.ctrlKey || e.metaKey) {
        if (selected.has(path)) selected.delete(path);
        else selected.add(path);
        lastClicked = path;
      } else {
        selected.clear();
        selected.add(path);
        lastClicked = path;
      }
      markSelected();
    });

    listEl.addEventListener("dblclick", (e) => {
      const row = e.target.closest(".fm-row");
      if (row) openEntry(row);
    });

    async function doUpload() {
      const picked = await FilesIO.pickFiles({ multiple: true });
      if (!picked.length) return;
      const results = await FilesIO.ingestList(picked, cwd);
      const ok = results.filter((r) => !r.error);
      const bad = results.filter((r) => r.error);
      toast(ok.length ? `uploaded ${ok.length} file${ok.length === 1 ? "" : "s"}` : "upload failed");
      if (bad.length) statusEl.textContent = bad.map((b) => `${b.name}: ${b.error}`).join(" · ");
      render();
    }

    function doDownload() {
      const paths = selectedPaths();
      const files = paths.filter((p) => {
        const st = VFS.stat(p);
        return !st.error && st.type !== "dir";
      });
      if (!files.length) {
        toast("select a file to save");
        return;
      }
      files.forEach((p) => FilesIO.downloadPath(p));
      toast(files.length === 1 ? `saved ${VFS.split(files[0]).pop()}` : `saved ${files.length} files`);
    }

    function doNewFile() {
      const name = window.prompt("new file name", "untitled.txt");
      if (!name) return;
      const dest = VFS.join(cwd, FilesIO.safeName(name));
      const st = VFS.stat(dest);
      if (!st.error) {
        toast("file exists");
        return;
      }
      const w = VFS.write(dest, "");
      toast(w.error ? w.error : `created ${dest}`);
      render();
    }

    function doNewDir() {
      const name = window.prompt("new folder name", "folder");
      if (!name) return;
      const dest = VFS.join(cwd, FilesIO.safeName(name));
      const r = VFS.mkdir(dest);
      toast(r.error ? r.error : `created ${dest}`);
      render();
    }

    function doRename() {
      const path = oneSelected();
      if (!path) {
        toast("select one item");
        return;
      }
      const old = VFS.split(path).pop();
      const name = window.prompt("rename to", old);
      if (!name || name === old) return;
      const dest = VFS.join(cwd, FilesIO.safeName(name));
      const r = VFS.mv(path, dest);
      toast(r.error ? r.error : `renamed to ${name}`);
      render();
    }

    function doDelete() {
      const paths = selectedPaths();
      if (!paths.length) {
        toast("select an item");
        return;
      }
      if (!window.confirm(`delete ${paths.length} item${paths.length === 1 ? "" : "s"}?`)) return;
      paths.forEach((p) => VFS.rm(p, { recursive: true }));
      toast("deleted");
      render();
    }

    el.querySelector(".fm-toolbar").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "up") {
        if (cwd !== "/") {
          const parts = VFS.split(cwd);
          parts.pop();
          cwd = "/" + parts.join("/");
          render();
        }
      } else if (act === "home") {
        cwd = Kernel.env.HOME;
        render();
      } else if (act === "refresh") render();
      else if (act === "upload") doUpload();
      else if (act === "download") doDownload();
      else if (act === "newfile") doNewFile();
      else if (act === "newdir") doNewDir();
      else if (act === "rename") doRename();
      else if (act === "delete") doDelete();
    });

    function highlight(on) {
      dropEl.classList.toggle("active", on);
    }

    ["dragenter", "dragover"].forEach((ev) => {
      el.addEventListener(ev, (e) => {
        e.preventDefault();
        highlight(true);
      });
    });
    ["dragleave", "drop"].forEach((ev) => {
      el.addEventListener(ev, (e) => {
        e.preventDefault();
        if (ev === "dragleave" && el.contains(e.relatedTarget)) return;
        highlight(false);
      });
    });
    el.addEventListener("drop", async (e) => {
      e.preventDefault();
      highlight(false);
      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) return;
      const results = await FilesIO.ingestList(files, cwd);
      const ok = results.filter((r) => !r.error);
      toast(ok.length ? `uploaded ${ok.length} file${ok.length === 1 ? "" : "s"}` : "upload failed");
      render();
    });

    el.addEventListener("keydown", (e) => {
      if (e.key === "Escape") return;
      if (e.key === "Backspace" && !e.target.closest("input,textarea")) {
        e.preventDefault();
        if (cwd !== "/") {
          const parts = VFS.split(cwd);
          parts.pop();
          cwd = "/" + parts.join("/");
          render();
        }
      }
      if (e.key === "Delete") doDelete();
      if (e.key === "Enter") {
        const path = oneSelected();
        if (!path) return;
        const st = VFS.stat(path);
        if (st.error) return;
        if (st.type === "dir") {
          cwd = path;
          render();
        } else {
          const name = path.split("/").pop() || "";
          if (typeof Wine !== "undefined" && Wine.handles(name, st)) {
            const res = Wine.open(path);
            if (res.app) Apps.launch(res.app, res.args || []);
            else if (res.lines) toast(res.lines.map((l) => l.text).join(" "));
          } else {
            const kind = FilesIO.mediaKind({ mime: st.mime, name: path });
            if (kind) Apps.launch("media", [cwd]);
            else Apps.launch("edit", [path]);
          }
        }
      }
    });

    render();
  }

  function mediaHome() {
    const dir = VFS.join(Kernel.env.HOME, "media");
    VFS.mkdir(dir, { recursive: true });
    VFS.mkdir(VFS.join(dir, "photos"), { recursive: true });
    VFS.mkdir(VFS.join(dir, "videos"), { recursive: true });
    VFS.mkdir(VFS.join(dir, "audio"), { recursive: true });
    return dir;
  }

  function collectMedia(root) {
    const items = [];
    VFS.find(root, (p, n) => {
      if (n.type !== "file") return false;
      const kind = FilesIO.mediaKind({ mime: n.mime, name: p });
      if (!kind) return false;
      items.push({
        path: p,
        name: VFS.split(p).pop(),
        kind,
        mime: n.mime || "",
        size: VFS.fileSize(n),
        mtime: n.mtime
      });
      return false;
    });
    items.sort((a, b) => b.mtime - a.mtime);
    return items;
  }

  function media(args) {
    const root = args[0] ? Kernel.resolvePath(args[0]) : mediaHome();
    mediaHome();
    let filter = "all";
    let current = null;
    let objectUrls = [];

    const el = open("MEDIA", `
      <div class="mm">
        <div class="mm-toolbar">
          <button type="button" data-filter="all" class="on">all</button>
          <button type="button" data-filter="image">photos</button>
          <button type="button" data-filter="video">video</button>
          <button type="button" data-filter="audio">audio</button>
          <span class="fm-spacer"></span>
          <button type="button" data-act="camera">camera</button>
          <button type="button" data-act="import">import</button>
          <button type="button" data-act="download">save to device</button>
          <button type="button" data-act="rename">rename</button>
          <button type="button" data-act="delete">delete</button>
        </div>
        <div class="mm-layout">
          <div class="mm-grid" id="mmGrid"></div>
          <div class="mm-preview" id="mmPreview">
            <div class="mm-empty">select media or open camera</div>
          </div>
        </div>
        <div class="fm-status" id="mmStatus"></div>
      </div>
    `, { width: 760, height: 480, onClose: () => revoke() });

    const grid = el.querySelector("#mmGrid");
    const preview = el.querySelector("#mmPreview");
    const status = el.querySelector("#mmStatus");

    function revoke() {
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
      objectUrls = [];
    }

    function items() {
      const all = collectMedia(root);
      return filter === "all" ? all : all.filter((i) => i.kind === filter);
    }

    function thumbSrc(item) {
      if (item.kind === "image") return FilesIO.dataUrl(item.path);
      return "";
    }

    function renderGrid() {
      const list = items();
      if (!list.length) {
        grid.innerHTML = `<div class="fm-empty">no media yet — import, drop, or use camera</div>`;
        status.textContent = "0 items";
        return;
      }
      grid.innerHTML = list.map((item) => {
        const src = item.kind === "image" ? thumbSrc(item) : "";
        const sel = current && current.path === item.path ? " selected" : "";
        const body = src
          ? `<img src="${src}" alt="${Commands.esc(item.name)}">`
          : `<span class="mm-kind">${item.kind === "video" ? "VID" : "AUD"}</span>`;
        return `<button type="button" class="mm-card${sel}" data-path="${Commands.esc(item.path)}">
          <div class="mm-thumb mm-${item.kind}">${body}</div>
          <div class="mm-card-name">${Commands.esc(item.name)}</div>
          <div class="mm-card-meta">${FilesIO.fmtSize(item.size)}</div>
        </button>`;
      }).join("");
      status.textContent = `${list.length} item${list.length === 1 ? "" : "s"} in ${root}`;
    }

    function showPreview(item) {
      current = item;
      revoke();
      if (!item) {
        preview.innerHTML = `<div class="mm-empty">select media or open camera</div>`;
        return;
      }
      const url = FilesIO.objectUrl(item.path);
      if (url) objectUrls.push(url);
      const meta = `${item.kind} · ${FilesIO.fmtSize(item.size)} · ${item.path}`;
      if (item.kind === "image") {
        preview.innerHTML = `<img class="mm-full" src="${url}" alt="${Commands.esc(item.name)}"><div class="mm-meta">${Commands.esc(meta)}</div>`;
      } else if (item.kind === "video") {
        preview.innerHTML = `<video class="mm-full" src="${url}" controls></video><div class="mm-meta">${Commands.esc(meta)}</div>`;
      } else {
        preview.innerHTML = `<div class="mm-audio-wrap"><div class="mm-kind big">AUD</div><div class="mm-card-name">${Commands.esc(item.name)}</div><audio src="${url}" controls></audio></div><div class="mm-meta">${Commands.esc(meta)}</div>`;
      }
      grid.querySelectorAll(".mm-card").forEach((c) => c.classList.toggle("selected", c.dataset.path === item.path));
    }

    function destFor(kind) {
      if (kind === "video") return VFS.join(root, "videos");
      if (kind === "audio") return VFS.join(root, "audio");
      return VFS.join(root, "photos");
    }

    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".mm-card");
      if (!card) return;
      const item = collectMedia(root).find((i) => i.path === card.dataset.path);
      if (item) showPreview(item);
    });

    el.querySelectorAll("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        filter = btn.dataset.filter;
        el.querySelectorAll("[data-filter]").forEach((b) => b.classList.toggle("on", b === btn));
        renderGrid();
      });
    });

    el.querySelector(".mm-toolbar").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "camera") {
        camera([]);
        return;
      }
      if (act === "import") {
        const picked = await FilesIO.pickFiles({ multiple: true, accept: "image/*,video/*,audio/*" });
        if (!picked.length) return;
        for (const file of picked) {
          const kind = FilesIO.mediaKind({ mime: file.type, name: file.name }) || "image";
          await FilesIO.ingestFile(file, destFor(kind));
        }
        toast("imported");
        renderGrid();
        return;
      }
      if (!current) {
        toast("select an item");
        return;
      }
      if (act === "download") {
        const r = FilesIO.downloadPath(current.path);
        toast(r.error ? r.error : `saved ${r.name}`);
      } else if (act === "rename") {
        const name = window.prompt("rename to", current.name);
        if (!name || name === current.name) return;
        const dest = VFS.join(VFS.normalize(current.path.replace(/\/[^/]+$/, "") || "/"), FilesIO.safeName(name));
        const r = VFS.mv(current.path, dest);
        if (r.error) toast(r.error);
        else {
          current = null;
          toast("renamed");
          renderGrid();
          showPreview(null);
        }
      } else if (act === "delete") {
        if (!window.confirm(`delete ${current.name}?`)) return;
        VFS.rm(current.path, { recursive: true });
        current = null;
        toast("deleted");
        renderGrid();
        showPreview(null);
      }
    });

    ["dragenter", "dragover"].forEach((ev) => {
      el.addEventListener(ev, (e) => e.preventDefault());
    });
    el.addEventListener("drop", async (e) => {
      e.preventDefault();
      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) return;
      for (const file of Array.from(files)) {
        const kind = FilesIO.mediaKind({ mime: file.type, name: file.name }) || "image";
        await FilesIO.ingestFile(file, destFor(kind));
      }
      toast("imported");
      renderGrid();
    });

    renderGrid();
  }

  function camera() {
    mediaHome();
    let stream = null;
    let recorder = null;
    let chunks = [];
    let recording = false;
    let facing = "user";

    const el = open("CAMERA", `
      <div class="cam">
        <div class="cam-stage">
          <video id="camLive" autoplay playsinline muted></video>
          <canvas id="camShot" hidden></canvas>
          <div class="cam-rec" id="camRec" hidden>REC</div>
        </div>
        <div class="mm-toolbar cam-bar">
          <button type="button" data-act="snap">snap photo</button>
          <button type="button" data-act="record" id="camRecordBtn">record</button>
          <button type="button" data-act="flip">flip</button>
          <button type="button" data-act="library">library</button>
        </div>
        <div class="fm-status" id="camStatus">requesting camera...</div>
      </div>
    `, {
      onClose: () => stopCam(),
      width: 640,
      height: 480
    });

    const video = el.querySelector("#camLive");
    const canvas = el.querySelector("#camShot");
    const recLed = el.querySelector("#camRec");
    const status = el.querySelector("#camStatus");
    const recBtn = el.querySelector("#camRecordBtn");

    function stopCam() {
      if (recorder && recording) {
        try { recorder.stop(); } catch { /* ignore */ }
      }
      recording = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
    }

    async function startCam() {
      stopCam();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        status.textContent = "camera API not available in this browser";
        return;
      }
      status.textContent = "starting camera...";
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e) {
          status.textContent = "camera denied: " + (e.message || e);
          return;
        }
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      status.textContent = "live · snap photo or record video";
    }

    async function snap() {
      if (!stream) {
        toast("camera not ready");
        return;
      }
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, w, h);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
      if (!blob) {
        toast("capture failed");
        return;
      }
      const dest = VFS.join(mediaHome(), "photos", FilesIO.stamp("snap", "jpg"));
      const r = await FilesIO.writeBlob(dest, blob, "image/jpeg");
      toast(r.error ? r.error : `saved ${dest}`);
      status.textContent = r.error ? r.error : `photo saved ${dest}`;
    }

    function toggleRecord() {
      if (!stream) {
        toast("camera not ready");
        return;
      }
      if (recording) {
        recorder.stop();
        return;
      }
      if (typeof MediaRecorder === "undefined") {
        toast("recording not supported");
        return;
      }
      chunks = [];
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
      try {
        recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch (e) {
        toast("recording not supported");
        status.textContent = String(e.message || e);
        return;
      }
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      recorder.onstop = async () => {
        recording = false;
        recLed.hidden = true;
        recBtn.textContent = "record";
        const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
        chunks = [];
        const dest = VFS.join(mediaHome(), "videos", FilesIO.stamp("clip", "webm"));
        const r = await FilesIO.writeBlob(dest, blob, blob.type || "video/webm");
        toast(r.error ? r.error : `saved ${dest}`);
        status.textContent = r.error ? r.error : `video saved ${dest}`;
      };
      recorder.start();
      recording = true;
      recLed.hidden = false;
      recBtn.textContent = "stop";
      status.textContent = "recording...";
    }

    el.querySelector(".cam-bar").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "snap") snap();
      else if (act === "record") toggleRecord();
      else if (act === "flip") {
        facing = facing === "user" ? "environment" : "user";
        startCam();
      } else if (act === "library") {
        media([]);
      }
    });

    startCam();
  }

  function term() {
    const el = open("hsh — tty", `
      <div class="term-session">
        <div class="term-out"></div>
        <form class="term-form" autocomplete="off">
          <label class="term-prompt">guest@helix:~$</label>
          <div class="input-wrap">
            <input class="term-in" type="text" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off">
            <span class="term-ghost"></span>
          </div>
        </form>
      </div>
    `, { width: 620, height: 380 });
    const session = Terminal.mount(el.querySelector(".term-session"), { graphical: true });
    session.printLine("hsh 1.0 on HelixDE / helixwm", "muted");
    session.printLine("This is a terminal window. The desktop and WM are separate.", "muted");
    session.printLine("", "out");
    session.refreshChrome();
    session.focus();
    el.addEventListener("mousedown", () => setTimeout(() => session.focus(), 0));
  }

  function wine(args) {
    const runPath = args && args[0] === "--run" ? args[1] : "";
    const info = runPath ? Wine.peInfo(runPath) : null;
    const banner = runPath ? "WINE COMPAT RUNNER" : "WINE 9.0-helix";
    const lead = runPath
      ? "This file opened through the Helix Wine compatibility layer. Native Win32/PE cannot execute in the browser kernel. Associated types still launch Helix apps."
      : "Helix Wine is the OS compatibility layer. Windows files (.exe .bat .cmd .msi .dll .txt .bmp ...) open through it. Mapped names launch Helix apps. Unknown PE binaries open in this runner.";
    const el = open(runPath ? ("wine — " + (info && info.name || "program")) : "winecfg — Helix Wine 9.0", `
      <div class="wine-app">
        <div class="wine-banner">${Commands.esc(banner)}</div>
        <p class="wine-lead">${Commands.esc(lead)}</p>
        <table class="wine-table">
          <tr><td>Host</td><td>browser / wasm32</td></tr>
          <tr><td>Kernel</td><td>helix 1.0.0-js (userspace)</td></tr>
          <tr><td>Prefix</td><td>~/.wine</td></tr>
          <tr><td>Layer</td><td>file associations + mapped apps</td></tr>
          ${runPath ? `<tr><td>File</td><td>${Commands.esc(runPath)}</td></tr>
          <tr><td>PE</td><td>${info && info.pe ? "MZ / PE (cannot execute)" : "no"}</td></tr>
          <tr><td>Size</td><td>${info ? FilesIO.fmtSize(info.size) : "-"}</td></tr>` : ""}
        </table>
        <div class="wine-maps">
          <button type="button" data-wine="edit">notepad.exe</button>
          <button type="button" data-wine="files">explorer.exe</button>
          <button type="button" data-wine="term">cmd.exe</button>
          <button type="button" data-wine="media">mspaint.exe</button>
          <button type="button" data-wine="camera">webcam.exe</button>
          <button type="button" data-wine="snake">winmine.exe</button>
        </div>
        <p class="wine-foot">Drop or open any Windows file. Wine routes it. Native PE still cannot run.</p>
      </div>
    `, { width: 540, height: runPath ? 460 : 420 });
    el.querySelector(".wine-maps").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-wine]");
      if (btn) launch(btn.dataset.wine, []);
    });
  }

  function linux() {
    const el = open("linux — hvc0 (x86_64)", `
      <div class="linux-app">
        <div class="linux-meta">TinyEMU + Linux x86_64 guest  ·  busybox  ·  type exit to detach</div>
        <div class="linux-out"></div>
        <form class="linux-form" autocomplete="off">
          <label>linux#</label>
          <input class="linux-in" type="text" spellcheck="false" autocapitalize="off" autocomplete="off">
        </form>
      </div>
    `, {
      width: 640,
      height: 420,
      onClose: () => { if (off) off(); }
    });
    const outEl = el.querySelector(".linux-out");
    const form = el.querySelector(".linux-form");
    const input = el.querySelector(".linux-in");
    let off = null;

    function write(text) {
      outEl.textContent += text;
      outEl.scrollTop = outEl.scrollHeight;
    }

    write("vmm: starting TinyEMU + Linux x86_64 ...\n");
    VMM.start().then((r) => {
      if (r.error) {
        write("vmm: " + r.error + "\n");
        return;
      }
      const dump = VMM.dmesg();
      if (dump) write(dump);
      off = VMM.onSerial((ch) => write(ch));
      write("\nExperimental console attached; wait for a guest prompt before typing. Closing this window does not stop the emulator.\n");
      input.focus();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const line = input.value;
      input.value = "";
      if (line.trim() === "exit" || line.trim() === "detach") {
        el._close();
        return;
      }
      VMM.send(line + "\n");
    });
    el.addEventListener("mousedown", () => setTimeout(() => input.focus(), 0));
  }

  function lookApply() {
    if (typeof Desktop !== "undefined" && Desktop.applyLook) Desktop.applyLook();
    else document.getElementById("crt").dataset.theme = Kernel.env.THEME;
    Kernel.saveConfig();
  }

  const THEMES = ["fire", "phosphor", "amber", "ice", "rose", "ultraviolet"];
  const WALLS = [
    { id: "ember", label: "Ember" },
    { id: "ash", label: "Ash" },
    { id: "coal", label: "Coal" },
    { id: "plasma", label: "Plasma" },
    { id: "grid", label: "Grid" },
    { id: "none", label: "None" }
  ];
  const ACCENTS = ["", "#ff6a1a", "#38fca5", "#ffb347", "#7ec8ff", "#ff7aa2", "#b388ff", "#ff3d2e", "#ffe08a"];

  function setTheme(name) {
    Kernel.env.THEME = name;
    lookApply();
    toast("theme " + name);
  }

  function setWall(id) {
    Kernel.env.WALLPAPER = id;
    lookApply();
    toast("wallpaper " + id);
  }

  function setAccent(hex) {
    Kernel.env.ACCENT = hex || "";
    lookApply();
    toast(hex ? "accent " + hex : "accent reset");
  }

  function theme() {
    const el = open("theme", `
      <div class="set-app">
        <div class="set-banner">CRT THEME</div>
        <p class="set-lead">Phosphor color for the tube. Saved in /etc/helix.conf.</p>
        <div class="set-grid">
          ${THEMES.map((t) => `<button type="button" class="set-swatch t-${t}" data-theme="${t}">${t}</button>`).join("")}
        </div>
      </div>
    `, { width: 440, height: 320 });
    el.querySelector(".set-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-theme]");
      if (btn) setTheme(btn.dataset.theme);
    });
  }

  function wallpaper() {
    const el = open("wallpaper", `
      <div class="set-app">
        <div class="set-banner">DESKTOP BACKGROUND</div>
        <p class="set-lead">HelixDE wallpaper. Independent of CRT theme.</p>
        <div class="set-grid">
          ${WALLS.map((w) => `<button type="button" class="set-wall w-${w.id}" data-wall="${w.id}">${w.label}</button>`).join("")}
        </div>
      </div>
    `, { width: 460, height: 340 });
    el.querySelector(".set-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-wall]");
      if (btn) setWall(btn.dataset.wall);
    });
  }

  function color() {
    const el = open("color", `
      <div class="set-app">
        <div class="set-banner">ACCENT COLOR</div>
        <p class="set-lead">Override phosphor accent. Empty restores the theme default.</p>
        <div class="set-grid">
          ${ACCENTS.map((c) => `<button type="button" class="set-swatch" data-accent="${c}" style="${c ? "background:" + c : ""}">${c || "reset"}</button>`).join("")}
        </div>
        <form class="set-row">
          <input class="set-in" type="text" spellcheck="false" placeholder="#ff6a1a" value="${Commands.esc(Kernel.env.ACCENT || "")}">
          <button type="submit">apply</button>
        </form>
      </div>
    `, { width: 440, height: 340 });
    el.querySelector(".set-grid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-accent]");
      if (btn) setAccent(btn.dataset.accent);
    });
    el.querySelector(".set-row").addEventListener("submit", (e) => {
      e.preventDefault();
      setAccent(el.querySelector(".set-in").value.trim());
    });
  }

  function kernel() {
    const st = typeof VMM !== "undefined" ? VMM.status() : { running: false };
    const el = open("kernel", `
      <div class="set-app">
        <div class="set-banner">HELIX KERNEL</div>
        <table class="wine-table">
          <tr><td>Kernel</td><td>C/Wasm process core + JavaScript host</td></tr>
          <tr><td>Host</td><td>browser / wasm32</td></tr>
          <tr><td>User</td><td>${Commands.esc(Kernel.env.USER)}</td></tr>
          <tr><td>Hostname</td><td>${Commands.esc(Kernel.env.HOSTNAME)}</td></tr>
          <tr><td>Uptime</td><td>${Math.floor((Date.now() - Kernel.startedAt) / 1000)}s</td></tr>
          <tr><td>Processes</td><td>${Kernel.processes.length}</td></tr>
          <tr><td>VMM</td><td>${st.running ? (st.arch || "guest") : "stopped"}</td></tr>
        </table>
        <div class="wine-maps">
          <button type="button" data-k="dmesg">dmesg</button>
          <button type="button" data-k="ps">processes</button>
          <button type="button" data-k="linux">linux</button>
        </div>
      </div>
    `, { width: 480, height: 400 });
    el.querySelector(".wine-maps").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-k]");
      if (!btn) return;
      if (btn.dataset.k === "linux") return launch("linux", []);
      if (btn.dataset.k === "ps") return CoreMonitor.open();
      launch("edit", ["/var/log/syslog"]);
    });
  }

  function filesystem() {
    const df = Commands.dispatch("df");
    const text = (df.lines || []).map((l) => l.text).join("\n");
    const el = open("filesystem", `
      <div class="set-app">
        <div class="set-banner">VFS</div>
        <pre class="set-pre">${Commands.esc(text || "vfs ready")}</pre>
        <div class="wine-maps">
          <button type="button" data-fs="files">browse</button>
          <button type="button" data-fs="home">home</button>
          <button type="button" data-fs="reset">resetfs</button>
        </div>
      </div>
    `, { width: 480, height: 360 });
    el.querySelector(".wine-maps").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-fs]");
      if (!btn) return;
      if (btn.dataset.fs === "files") return launch("files", []);
      if (btn.dataset.fs === "home") return launch("files", [Kernel.env.HOME]);
      if (btn.dataset.fs === "reset") {
        VFS.reset();
        Kernel.env.PWD = Kernel.env.HOME;
        Kernel.loadConfig();
        lookApply();
        toast("filesystem restored");
      }
    });
  }

  function config() {
    const path = "/etc/helix.conf";
    const r = VFS.read(path);
    const el = open("config", `
      <div class="set-app">
        <div class="set-banner">HELIX.CONF</div>
        <textarea class="set-ta">${Commands.esc(r.error ? "" : r.content)}</textarea>
        <div class="wine-maps">
          <button type="button" data-cfg="save">save</button>
          <button type="button" data-cfg="rc">.helixrc</button>
        </div>
      </div>
    `, { width: 500, height: 380 });
    el.querySelector("[data-cfg='save']").addEventListener("click", () => {
      VFS.write(path, el.querySelector(".set-ta").value);
      Kernel.loadConfig();
      lookApply();
      toast("saved " + path);
    });
    el.querySelector("[data-cfg='rc']").addEventListener("click", () => launch("edit", [Kernel.env.HOME + "/.helixrc"]));
  }

  function warnings() {
    const log = VFS.read("/var/log/syslog");
    const el = open("warnings", `
      <div class="set-app">
        <div class="set-banner">WARNINGS</div>
        <p class="set-lead">Kernel log and session notices. Native PE still cannot execute.</p>
        <pre class="set-pre">${Commands.esc(log.error ? "(empty)" : log.content)}</pre>
      </div>
    `, { width: 520, height: 360 });
  }

  function wmctl() {
    function rows() {
      const list = WM.list();
      if (!list.length) return "<p class=\"set-lead\">no open windows</p>";
      return "<table class=\"wine-table\">" + list.map((w) =>
        `<tr><td>${Commands.esc(w.id)}</td><td>${w.minimized ? "min" : "fg"}</td><td>${Commands.esc(w.title)}</td></tr>`
      ).join("") + "</table>";
    }
    const el = open("helixwm", `
      <div class="set-app">
        <div class="set-banner">HELIXWM</div>
        <div class="wm-list">${rows()}</div>
        <div class="wine-maps">
          <button type="button" data-wm="refresh">refresh</button>
          <button type="button" data-wm="closeall">close all</button>
        </div>
      </div>
    `, { width: 460, height: 340 });
    el.querySelector(".wine-maps").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-wm]");
      if (!btn) return;
      if (btn.dataset.wm === "closeall") WM.closeAll();
      const box = el.querySelector(".wm-list");
      if (box) box.innerHTML = rows();
    });
  }

  function settings() {
    const el = open("settings", `
      <div class="set-app">
        <div class="set-banner">HELIXDE CONTROL</div>
        <p class="set-lead">GUI for look, kernel, filesystem, and helixwm.</p>
        <div class="wine-maps">
          <button type="button" data-set="design">design</button>
          <button type="button" data-set="theme">theme</button>
          <button type="button" data-set="wallpaper">wallpaper</button>
          <button type="button" data-set="color">color</button>
          <button type="button" data-set="kernel">kernel</button>
          <button type="button" data-set="filesystem">filesystem</button>
          <button type="button" data-set="config">config</button>
          <button type="button" data-set="warnings">warnings</button>
          <button type="button" data-set="wm">helixwm</button>
        </div>
      </div>
    `, { width: 480, height: 340 });
    el.querySelector(".wine-maps").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-set]");
      if (btn) launch(btn.dataset.set, []);
    });
  }

  function design() {
    const el = open("design", `
      <div class="set-app">
        <div class="set-banner">DESIGN STUDIO</div>
        <p class="set-lead">Look of HelixDE. Theme, wallpaper, and accent in one window.</p>
        <p class="set-lead">theme ${Commands.esc(Kernel.env.THEME || "fire")}  ·  wall ${Commands.esc(Kernel.env.WALLPAPER || "ember")}  ·  accent ${Commands.esc(Kernel.env.ACCENT || "default")}</p>
        <div class="set-banner">THEME</div>
        <div class="set-grid" data-kind="theme">
          ${THEMES.map((t) => `<button type="button" class="set-swatch t-${t}" data-theme="${t}">${t}</button>`).join("")}
        </div>
        <div class="set-banner">WALLPAPER</div>
        <div class="set-grid" data-kind="wall">
          ${WALLS.map((w) => `<button type="button" class="set-wall w-${w.id}" data-wall="${w.id}">${w.label}</button>`).join("")}
        </div>
        <div class="set-banner">COLOR</div>
        <div class="set-grid" data-kind="accent">
          ${ACCENTS.map((c) => `<button type="button" class="set-swatch" data-accent="${c}" style="${c ? "background:" + c : ""}">${c || "reset"}</button>`).join("")}
        </div>
      </div>
    `, { width: 540, height: 520 });
    el.addEventListener("click", (e) => {
      const t = e.target.closest("[data-theme]");
      if (t) return setTheme(t.dataset.theme);
      const w = e.target.closest("[data-wall]");
      if (w) return setWall(w.dataset.wall);
      const a = e.target.closest("[data-accent]");
      if (a) return setAccent(a.dataset.accent);
    });
  }

  function launch(name, args = []) {
    if (name === "system") return System.open();
    if (name === "core") return CoreMonitor.open();
    if (name === "wallet") return WalletApp.open();
    if (name === "term" || name === "terminal" || name === "hsh") return term(args);
    if (name === "edit") return edit(args);
    if (name === "snake") return snake();
    if (name === "matrix") return matrix();
    if (name === "files") return files(args);
    if (name === "media") return media(args);
    if (name === "camera") return camera(args);
    if (name === "wine" || name === "winecfg") return wine(args);
    if (name === "linux" || name === "vmm") return linux(args);
    if (name === "settings" || name === "control") return settings(args);
    if (name === "design" || name === "look" || name === "appearance") return design(args);
    if (name === "theme") return theme(args);
    if (name === "wallpaper" || name === "background") return wallpaper(args);
    if (name === "color" || name === "colours" || name === "accent") return color(args);
    if (name === "kernel") return kernel(args);
    if (name === "filesystem" || name === "vfs") return filesystem(args);
    if (name === "config") return config(args);
    if (name === "warnings" || name === "dmesg") return warnings(args);
    if (name === "wm" || name === "helixwm") return wmctl(args);
  }

  return { launch, toast, open, files, media, camera, term, wine, linux, settings, design, theme, wallpaper, color, kernel, filesystem, config, warnings };
})();
