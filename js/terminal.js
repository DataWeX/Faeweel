(function () {
  const bootEl = document.getElementById("boot");
  const termEl = document.getElementById("terminal");
  const outEl = document.getElementById("output");
  const promptEl = document.getElementById("prompt");
  const inputEl = document.getElementById("input");
  let loginMode = false;
  let loginUser = null;
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
    if (loginMode) {
      if (!loginUser) {
        loginUser = line.trim();
        if (!loginUser) { setPrompt(); return; }
        print("Password: ", "dim");
        promptEl.textContent = "Password: ";
        inputEl.type = "password";
        return;
      } else {
        const pass = line;
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
    await Helix.shell.exec(line);
    setPrompt();
  }
  inputEl.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const val = inputEl.value;
      if (!(loginMode && loginUser)) print(Helix.kernel.prompt() + val);
      inputEl.value = "";
      await handle(val);
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault(); print("^C"); inputEl.value = ""; loginUser = null; setPrompt();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault(); clear();
    } else if (e.key === "u" && e.ctrlKey) {
      e.preventDefault(); inputEl.value = "";
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