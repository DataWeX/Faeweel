(function () {
  const bootEl = document.getElementById("boot");
  const termEl = document.getElementById("terminal");
  const outEl = document.getElementById("output");
  const promptEl = document.getElementById("prompt");
  const inputEl = document.getElementById("input");
  let loginMode = false;
  let loginUser = null;
  let histIndex = -1;
  let histDraft = "";
  function print(text, cls) {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = String(text) + "\n";
    outEl.appendChild(span);
    outEl.scrollTop = outEl.scrollHeight;
  }
  function clear() { outEl.textContent = ""; }
  function setPrompt() { promptEl.textContent = Helix.kernel.prompt(); inputEl.type = loginMode && loginUser ? "password" : "text"; }
  function setLoginMode(v) { loginMode = v; loginUser = null; setPrompt(); if (v) print("HelixOS tty1", "dim"); }
  async function handle(line) {
    const raw = (line || "");
    if (loginMode) {
      if (!loginUser) {
        loginUser = raw.trim();
        if (!loginUser) { setPrompt(); return; }
        print("Password: ", "dim");
        promptEl.textContent = "Password: ";
        inputEl.type = "password";
        return;
      } else {
        const pass = raw;
        if (Helix.kernel.checkAuth(loginUser, pass)) {
          Helix.kernel.login(loginUser);
          loginMode = false;
          print("Login successful.\n", "dim");
          try { print(Helix.vfs.read("/etc/motd", "/").trimEnd()); } catch(e){}
        } else {
          print("Login incorrect", "err");
          loginUser = null;
        }
        setPrompt();
        return;
      }
    }
    const trimmed = raw.trim();
    if (trimmed) Helix.kernel.state.history.push(trimmed);
    try {
      const out = await Helix.shell.exec(raw);
      if (out) print(out);
    } catch (e) { print(e.message || String(e), "err"); }
    setPrompt();
  }
  function commonPrefix(arr) {
    if (!arr.length) return "";
    let p = arr[0];
    for (let i=1;i<arr.length;i++) while (!arr[i].startsWith(p)) p = p.slice(0,-1);
    return p;
  }
  function tabComplete() {
    if (loginMode) return;
    const v = inputEl.value;
    const parts = v.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const trailing = /\s$/.test(v);
    const completingArg = parts.length > 1 || (parts.length === 1 && trailing);
    const token = trailing ? "" : (parts[parts.length - 1] || "");
    if (!completingArg) {
      const names = Object.keys(Helix.commands.cmds).filter(n => n.startsWith(token));
      if (names.length === 1) inputEl.value = names[0] + " ";
      else if (names.length > 1) { print(Helix.kernel.prompt() + v); print(names.join("  ")); inputEl.value = commonPrefix(names); }
      return;
    }
    let dirPart = token, base = token;
    const i = token.lastIndexOf("/");
    if (i >= 0) { dirPart = token.slice(0, i+1); base = token.slice(i+1); }
    const dirPath = Helix.vfs.norm(dirPart || ".", Helix.kernel.state.cwd);
    const node = Helix.vfs.getNode(dirPath, "/");
    if (!node || node.node.type !== "dir") return;
    const matches = Object.keys(node.node.children).filter(n => n.startsWith(base));
    if (matches.length === 1) {
      const m = matches[0];
      const child = node.node.children[m];
      const rep = dirPart + m + (child.type === "dir" ? "/" : " ");
      parts[parts.length - 1 - (trailing?0:0)] = rep; // simplified
      if (trailing) parts.push(rep); else parts[parts.length - 1] = rep;
      inputEl.value = parts.join(" ");
    } else if (matches.length > 1) {
      print(Helix.kernel.prompt() + v);
      print(matches.join("  "));
      const cp = commonPrefix(matches);
      if (trailing) parts.push(dirPart + cp); else parts[parts.length - 1] = dirPart + cp;
      inputEl.value = parts.join(" ");
    }
  }
  inputEl.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const val = inputEl.value;
      if (!(loginMode && loginUser)) print(Helix.kernel.prompt() + val);
      inputEl.value = "";
      histIndex = -1; histDraft = "";
      await handle(val);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault(); print("^C"); inputEl.value = ""; loginUser = null; histIndex = -1; setPrompt();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault(); clear();
    } else if (e.key === "u" && e.ctrlKey) {
      e.preventDefault(); inputEl.value = "";
    } else if (e.key === "Tab") {
      e.preventDefault(); tabComplete();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const h = Helix.kernel.state.history;
      if (!h.length) return;
      if (histIndex === -1) { histDraft = inputEl.value; histIndex = h.length - 1; }
      else if (histIndex > 0) histIndex--;
      inputEl.value = h[histIndex] || "";
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const h = Helix.kernel.state.history;
      if (histIndex === -1) return;
      if (histIndex < h.length - 1) { histIndex++; inputEl.value = h[histIndex] || ""; }
      else { histIndex = -1; inputEl.value = histDraft; }
    }
  });
  document.addEventListener("click", () => { if (!termEl.classList.contains("hidden")) inputEl.focus(); });
  function showTerminal() {
    bootEl.classList.add("hidden");
    termEl.classList.remove("hidden");
    inputEl.focus();
  }
  async function boot() {
    const lines = [
      "Helix BIOS v1.0",
      "Memory test: 65536K OK",
      "Storage: browser-localstorage OK",
      "Loading kernel helix-1.0.0-js ...",
      "[    0.000001] HelixOS kernel (JavaScript simulation, wasm32/browser)",
      "[    0.003120] mounting virtual filesystem ... ok",
      "[    0.004210] initializing tty1 ... ok",
      "[    0.005002] starting getty on tty1",
      ""
    ];
    for (const l of lines) {
      bootEl.textContent += l + "\n";
      await new Promise(r => setTimeout(r, 120));
    }
    await new Promise(r => setTimeout(r, 250));
    showTerminal();
    setLoginMode(true);
  }
  window.Helix = window.Helix || {};
  Helix.terminal = { print, clear, setLoginMode, setPrompt, boot, inputEl };
})();