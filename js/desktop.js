(function () {
  let started = false;
  let clockTimer = null;
  function setClock() {
    const el = document.getElementById("de-clock");
    if (el) el.textContent = new Date().toLocaleString();
  }
  function openTerminal() {
    const wrap = document.createElement("div");
    const out = document.createElement("pre");
    out.className = "win-term-out";
    const row = document.createElement("div");
    row.className = "win-term-row";
    const prompt = document.createElement("span");
    prompt.textContent = Helix.kernel.prompt();
    prompt.style.color = "var(--accent)";
    const input = document.createElement("input");
    input.type = "text"; input.spellcheck = false; input.autocomplete = "off";
    row.appendChild(prompt); row.appendChild(input);
    wrap.appendChild(out); wrap.appendChild(row);
    function print(t) { out.textContent += (t == null ? "" : String(t)) + "\n"; out.scrollTop = out.scrollHeight; }
    print("HelixDE terminal (hsh) - type 'help'");
    async function runLine() {
      const v = input.value; input.value = "";
      print(Helix.kernel.prompt() + v);
      if (!v.trim()) { prompt.textContent = Helix.kernel.prompt(); return; }
      Helix.kernel.state.history.push(v.trim());
      try {
        if (v.trim() === "clear") { out.textContent = ""; }
        else { const r = await Helix.shell.exec(v); if (r) print(r); }
      } catch (e) { print(e.message || String(e)); }
      prompt.textContent = Helix.kernel.prompt();
    }
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") runLine(); });
    const w = Helix.wm.createWindow({ title: "Terminal", body: wrap, x: 240 + Math.random()*40, y: 50 + Math.random()*30, w: 560, h: 360 });
    setTimeout(() => input.focus(), 0);
    return w;
  }
  function openViewer(path, name) {
    let content = "";
    try { content = Helix.vfs.read(path, "/"); } catch (e) { content = e.message; }
    const pre = document.createElement("pre");
    pre.className = "win-term-out";
    pre.textContent = content;
    Helix.wm.createWindow({ title: "View: " + name, body: pre, x: 340, y: 90, w: 520, h: 340 });
  }
  function openFiles() {
    const wrap = document.createElement("div");
    const list = document.createElement("ul");
    list.className = "win-list";
    function render(path) {
      list.innerHTML = "";
      const head = document.createElement("div");
      head.textContent = "Path: " + path;
      head.style.marginBottom = "6px";
      list.appendChild(head);
      try {
        const items = Helix.vfs.list(path, "/");
        if (path !== "/") {
          const up = document.createElement("li"); up.textContent = ".. (up)"; up.style.cursor="pointer";
          up.onclick = () => render(Helix.vfs.norm(path + "/..", "/")); list.appendChild(up);
        }
        items.forEach(name => {
          const full = path === "/" ? "/" + name : path + "/" + name;
          const n = Helix.vfs.getNode(full, "/");
          const li = document.createElement("li");
          li.style.cursor = "pointer";
          li.textContent = (n.node.type === "dir" ? "[DIR] " : "[FILE] ") + name + (n.node.type === "file" ? " (" + (n.node.size||0) + "b)" : "");
          li.onclick = () => n.node.type === "dir" ? render(n.path) : openViewer(n.path, name);
          list.appendChild(li);
        });
      } catch (e) {
        const li = document.createElement("li"); li.textContent = e.message; li.className = "err"; list.appendChild(li);
      }
    }
    render(Helix.kernel.state.cwd || "/home/" + Helix.kernel.state.user);
    wrap.appendChild(list);
    Helix.wm.createWindow({ title: "Files", body: wrap, x: 300, y: 80, w: 460, h: 340 });
  }
  function openSettings() {
    const wrap = document.createElement("div");
    const label = document.createElement("div");
    label.textContent = "Theme";
    label.style.marginBottom = "8px";
    wrap.appendChild(label);
    ["phosphor","amber","ice","rose"].forEach(t => {
      const b = document.createElement("button");
      b.className = "win-btn";
      b.style.width = "auto"; b.style.padding = "4px 10px"; b.style.margin = "0 6px 6px 0";
      b.textContent = t;
      b.onclick = () => { try { Helix.commands.cmds.theme([t]); } catch(e){} };
      wrap.appendChild(b);
    });
    const info = document.createElement("div");
    info.className = "dim";
    info.style.marginTop = "10px";
    info.textContent = "HelixOS MVP — Track A (JS simulation)";
    wrap.appendChild(info);
    Helix.wm.createWindow({ title: "Settings", body: wrap, x: 380, y: 120, w: 360, h: 200 });
  }
  function openAbout() {
    const pre = document.createElement("pre");
    pre.className = "win-term-out";
    pre.textContent = "HelixOS (JS kernel simulation)\nHelixDE + helixwm (MVP)\n\nKernel: helix 1.0.0-js (browser)\nShell: hsh\nUser: " + (Helix.kernel.state.user||"guest") + "\n\nGraphical session runs on top of tty1 console.";
    Helix.wm.createWindow({ title: "About", body: pre, x: 360, y: 100, w: 420, h: 240 });
  }
  const apps = [
    { id: "term", name: "Terminal", glyph: ">_", run: openTerminal },
    { id: "files", name: "Files", glyph: "[]", run: openFiles },
    { id: "settings", name: "Settings", glyph: "*", run: openSettings },
    { id: "about", name: "About", glyph: "i", run: openAbout },
    { id: "logout", name: "Logout", glyph: "x", run: () => logoutSession() }
  ];
  function renderIcons() {
    const c = document.getElementById("de-icons");
    c.innerHTML = "";
    apps.forEach(a => {
      const d = document.createElement("div");
      d.className = "de-icon";
      d.innerHTML = '<span class="glyph">'+a.glyph+'</span>' + a.name;
      d.onclick = () => a.run();
      c.appendChild(d);
    });
  }
  function start() {
    if (started) return "HelixDE already running on :0";
    if (!Helix.kernel.state.loggedIn) return "startx: not logged in";
    const k = Helix.kernel;
    if (!k.getProcByName("helixwm")) k.addProc("helixwm", { cmd: "helixwm :0", user: k.state.user, ppid: 1, tty: "tty1" });
    if (!k.getProcByName("helixde")) k.addProc("helixde", { cmd: "helixde", user: k.state.user, ppid: k.getProcByName("helixwm").pid, tty: "tty1" });
    Helix.terminal.hide();
    document.getElementById("de").classList.remove("hidden");
    document.getElementById("de-user").textContent = k.state.user + "@" + k.state.host;
    renderIcons();
    setClock();
    clockTimer = setInterval(setClock, 1000);
    started = true;
    openTerminal();
    return "HelixDE started on :0 (helixwm). Use Logout icon to end session.";
  }
  function stop(returnToTty) {
    if (!started) return;
    ["helixde","helixwm"].forEach(n => { const p = Helix.kernel.getProcByName(n); if (p) Helix.kernel.kill(p.pid); });
    document.getElementById("de-windows").innerHTML = "";
    document.getElementById("de").classList.add("hidden");
    if (clockTimer) clearInterval(clockTimer);
    started = false;
    if (returnToTty) {
      Helix.terminal.show();
      Helix.terminal.setPrompt();
    }
  }
  function logoutSession() {
    stop(false);
    Helix.kernel.logout();
    Helix.terminal.show();
    Helix.terminal.setLoginMode(true);
  }
  window.Helix = window.Helix || {};
  Helix.desktop = { start, stop, logoutSession, isStarted: () => started };
})();