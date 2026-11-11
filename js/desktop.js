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
    print("Terminal (tty app window) - core hsh runs as system process");
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
    const w = Helix.wm.createWindow({ title: "Terminal", body: wrap, x: 320 + Math.random()*40, y: 80 + Math.random()*30, w: 560, h: 340 });
    setTimeout(() => input.focus(), 0);
    return w;
  }
  function downloadText(name, text) {
    const blob = new Blob([text == null ? "" : String(text)], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name || "file.txt";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function pickUpload(onFile) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => onFile(f.name, String(r.result || ""));
      r.readAsText(f);
    };
    inp.click();
  }
  function openEditor(path, name) {
    let content = "";
    try { content = Helix.vfs.read(path, "/"); } catch (e) { content = ""; }
    const wrap = document.createElement("div");
    const ta = document.createElement("textarea");
    ta.value = content;
    ta.style.width = "100%"; ta.style.height = "220px"; ta.style.background = "var(--bg,#050a08)";
    ta.style.color = "var(--fg)"; ta.style.border = "1px solid rgba(124,255,122,0.25)";
    ta.style.font = "inherit"; ta.style.padding = "6px"; ta.spellcheck = false;
    const bar = document.createElement("div");
    bar.style.marginTop = "6px"; bar.style.display = "flex"; bar.style.gap = "6px"; bar.style.flexWrap = "wrap";
    function mkBtn(label, fn) { const b=document.createElement("button"); b.className="win-btn"; b.style.width="auto"; b.style.padding="4px 10px"; b.textContent=label; b.onclick=fn; return b; }
    const status = document.createElement("span"); status.className="dim"; status.style.marginLeft="4px";
    bar.appendChild(mkBtn("Save", () => { try { Helix.vfs.write(path, ta.value, "/"); status.textContent = "saved"; } catch(e){ status.textContent=e.message; status.className="err"; } }));
    bar.appendChild(mkBtn("Download", () => { downloadText(name||"file.txt", ta.value); status.textContent="downloaded"; status.className="dim"; }));
    bar.appendChild(status);
    wrap.appendChild(ta); wrap.appendChild(bar);
    Helix.wm.createWindow({ title: "Edit: " + (name||path), body: wrap, x: 320, y: 70, w: 560, h: 320 });
  }
  function openFiles() {
    const wrap = document.createElement("div");
    let curPath = Helix.vfs.norm(Helix.kernel.state.cwd || "/home/" + Helix.kernel.state.user, "/");
    const toolbar = document.createElement("div");
    toolbar.style.display = "flex"; toolbar.style.gap = "6px"; toolbar.style.flexWrap = "wrap"; toolbar.style.marginBottom = "6px";
    const head = document.createElement("div"); head.style.marginBottom = "6px"; head.className="dim";
    const list = document.createElement("ul"); list.className = "win-list";
    function mkBtn(label, fn) { const b=document.createElement("button"); b.className="win-btn"; b.style.width="auto"; b.style.padding="2px 8px"; b.textContent=label; b.onclick=fn; return b; }
    function render() {
      list.innerHTML = "";
      head.textContent = "Path: " + curPath;
      try {
        const items = Helix.vfs.list(curPath, "/");
        if (curPath !== "/") {
          const up = document.createElement("li"); up.textContent = ".. (up)"; up.style.cursor="pointer";
          up.onclick = () => { curPath = Helix.vfs.norm(curPath + "/..", "/"); render(); }; list.appendChild(up);
        }
        items.forEach(name => {
          const full = curPath === "/" ? "/" + name : curPath + "/" + name;
          const n = Helix.vfs.getNode(full, "/");
          const li = document.createElement("li");
          li.style.display = "flex"; li.style.gap = "8px"; li.style.alignItems = "center";
          const label = document.createElement("span");
          label.style.cursor = "pointer"; label.style.flex = "1";
          label.textContent = (n.node.type === "dir" ? "[DIR] " : "[FILE] ") + name + (n.node.type === "file" ? " (" + (n.node.size||0) + "b)" : "");
          label.onclick = () => { if (n.node.type === "dir") { curPath = n.path; render(); } else { openEditor(n.path, name); } };
          li.appendChild(label);
          if (n.node.type === "file") {
            const dl = document.createElement("button"); dl.className="win-btn"; dl.style.width="auto"; dl.style.padding="0 6px"; dl.textContent="↓";
            dl.title="Download to device"; dl.onclick = (e)=>{ e.stopPropagation(); try{ downloadText(name, Helix.vfs.read(n.path,"/")); }catch(err){} };
            li.appendChild(dl);
          }
          const del = document.createElement("button"); del.className="win-btn"; del.style.width="auto"; del.style.padding="0 6px"; del.textContent="x";
          del.title="Delete"; del.onclick = (e)=>{ e.stopPropagation(); try{ Helix.vfs.rm(n.path,"/", n.node.type==="dir"); render(); }catch(err){ alert(err.message); } };
          li.appendChild(del);
          list.appendChild(li);
        });
      } catch (e) {
        const li = document.createElement("li"); li.textContent = e.message; li.className = "err"; list.appendChild(li);
      }
    }
    toolbar.appendChild(mkBtn("Up", () => { curPath = Helix.vfs.norm(curPath + "/..", "/"); render(); }));
    toolbar.appendChild(mkBtn("Refresh", render));
    toolbar.appendChild(mkBtn("New File", () => { const name=prompt("File name:"); if(!name) return; try{ Helix.vfs.write((curPath==="/"?"":curPath)+"/"+name,"","/"); render(); }catch(e){ alert(e.message);} }));
    toolbar.appendChild(mkBtn("New Dir", () => { const name=prompt("Directory name:"); if(!name) return; try{ Helix.vfs.mkdir((curPath==="/"?"":curPath)+"/"+name,"/"); render(); }catch(e){ alert(e.message);} }));
    toolbar.appendChild(mkBtn("Upload", () => { pickUpload((name,data)=>{ try{ Helix.vfs.write((curPath==="/"?"":curPath)+"/"+name,data,"/"); render(); }catch(e){ alert(e.message);} }); }));
    wrap.appendChild(toolbar); wrap.appendChild(head); wrap.appendChild(list);
    render();
    Helix.wm.createWindow({ title: "Files", body: wrap, x: 260, y: 60, w: 560, h: 380 });
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
    const hr = document.createElement("div"); hr.style.margin = "10px 0 6px"; hr.className="dim"; hr.textContent="XML style (xml/styles.xml)"; wrap.appendChild(hr);
    const rb = document.createElement("button"); rb.className="win-btn"; rb.style.width="auto"; rb.style.padding="4px 10px"; rb.textContent="Reload styles";
    rb.onclick = async () => { if (Helix.xmlstyle && Helix.xmlstyle.load) { await Helix.xmlstyle.load("xml/styles.xml"); rb.textContent="Reloaded"; setTimeout(()=>rb.textContent="Reload styles",1200); } }; wrap.appendChild(rb);
    const info = document.createElement("div");
    info.className = "dim";
    info.style.marginTop = "10px";
    info.textContent = "HelixOS MVP — Track A (JS simulation). hsh is core process (ps).";
    wrap.appendChild(info);
    Helix.wm.createWindow({ title: "Settings", body: wrap, x: 380, y: 120, w: 360, h: 200 });
  }
  function openAbout() {
    const pre = document.createElement("pre");
    pre.className = "win-term-out";
    pre.textContent = "HelixOS (JS kernel simulation)\nHelixDE + helixwm (MVP)\n\nKernel: helix 1.0.0-js (browser)\nShell: hsh (core process: init→getty→login→hsh)\nUser: " + (Helix.kernel.state.user||"guest") + "\n\nGraphical session runs on top of tty1 console.";
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
    return "HelixDE started on :0 (helixwm). hsh is core process (ps). Terminal app opened.";
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
  Helix.desktop = { start, stop, logoutSession, isStarted: () => started, openTerminal };
})();