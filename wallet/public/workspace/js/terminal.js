const Terminal = (() => {
  const sessions = [];

  function mount(root, { graphical = false } = {}) {
    const output = root.querySelector(".term-out");
    const stdin = root.querySelector(".term-in");
    const ghost = root.querySelector(".term-ghost");
    const promptLabel = root.querySelector(".term-prompt");
    const form = root.querySelector(".term-form");
    const submit = document.createElement("button");
    submit.type = "submit";
    submit.className = "term-submit";
    submit.textContent = "Enter";
    form.appendChild(submit);
    ghost.setAttribute("aria-hidden", "true");
    let busy = false;
    let mode = graphical ? "shell" : "getty-user";
    let pendingUser = "";
    stdin.setAttribute("aria-label", graphical ? "Terminal command" : "Console login or command");
    stdin.setAttribute("autocapitalize", "off");
    stdin.setAttribute("autocorrect", "off");
    stdin.setAttribute("enterkeyhint", "send");
    if (graphical) {
      const tools = document.createElement("div");
      tools.className = "terminal-tools";
      for (const [label, key, ctrlKey] of [["Tab", "Tab", false], ["↑", "ArrowUp", false], ["↓", "ArrowDown", false], ["Ctrl+C", "c", true], ["Clear", "l", true]]) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.setAttribute("aria-label", key === "ArrowUp" ? "Previous command" : key === "ArrowDown" ? "Next command" : label);
        button.addEventListener("click", () => {
          stdin.focus();
          stdin.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey, bubbles: true, cancelable: true }));
        });
        tools.appendChild(button);
      }
      form.before(tools);
    }

    function scrollBottom() {
      output.scrollTop = output.scrollHeight;
    }

    function printLine(text, cls = "out") {
      const div = document.createElement("div");
      div.className = `line ${cls}`;
      div.textContent = text;
      output.appendChild(div);
      scrollBottom();
      return div;
    }

    function printHtml(markup, cls = "out") {
      const div = document.createElement("div");
      div.className = `line ${cls}`;
      div.innerHTML = markup;
      output.appendChild(div);
      scrollBottom();
      return div;
    }

    function echoCommand(line) {
      const div = document.createElement("div");
      div.className = "line cmd";
      div.innerHTML = `<span class="prompt-echo">${Commands.esc(Kernel.prompt())}</span> <span class="cmd-text">${Commands.esc(line)}</span>`;
      output.appendChild(div);
    }

    function refreshChrome() {
      if (promptLabel) {
        if (mode === "getty-user") promptLabel.textContent = Kernel.env.HOSTNAME + " login:";
        else if (mode === "getty-pass") promptLabel.textContent = "Password:";
        else if (mode === "linux") promptLabel.textContent = "linux#";
        else promptLabel.textContent = Kernel.prompt();
      }
      stdin.type = mode === "getty-pass" ? "password" : "text";
      stdin.placeholder = mode === "getty-user" ? "Username" : mode === "getty-pass" ? "Password" : "Type a command…";
      stdin.setAttribute("aria-label", mode === "getty-user" ? "Username" : mode === "getty-pass" ? "Password" : "Terminal command");
      const user = document.getElementById("userStat");
      if (user) user.textContent = Kernel.session.loggedIn ? Kernel.env.USER : "login";
      if (typeof Desktop !== "undefined" && Desktop.applyLook) Desktop.applyLook();
      else document.getElementById("crt").dataset.theme = Kernel.env.THEME;
    }

    function enterShell() {
      mode = "shell";
      const motd = VFS.read("/etc/motd");
      if (!motd.error) printLine(motd.content.replace(/\n$/, ""), "info");
      printLine("Logged in on tty1. Type startx for HelixDE, or help.", "muted");
      printLine("", "out");
      refreshChrome();
    }

    function enterGetty() {
      mode = "getty-user";
      pendingUser = "";
      stdin.type = "text";
      printLine("");
      refreshChrome();
    }

    function applyResult(res) {
      if (!res || res.silent) return Promise.resolve();
      if (res.clear) {
        output.innerHTML = "";
        return Promise.resolve();
      }
      if (res.reboot) return boot();
      if (res.startx) {
        if (typeof Desktop !== "undefined") Desktop.start();
        return Promise.resolve();
      }
      if (res.logout) {
        if (typeof Desktop !== "undefined" && Desktop.running()) {
          Desktop.stop();
          printLine("HelixDE stopped. Still logged in on tty1.", "info");
          return Promise.resolve();
        }
        Kernel.logout();
        enterGetty();
        return Promise.resolve();
      }
      if (res.app) {
        if (typeof Desktop === "undefined" || !Desktop.running()) {
          printLine("hsh: DISPLAY not set — run startx to launch HelixDE", "err");
          return Promise.resolve();
        }
        Apps.launch(res.app, res.args || []);
        return Promise.resolve();
      }
      if (res.vmmStart) {
        printLine("vmm: starting TinyEMU + Linux x86_64 guest ...", "info");
        return VMM.start().then((r) => {
          if (r.error) printLine("vmm: " + r.error, "err");
          else if (r.already) printLine("vmm: guest already running", "warn");
          else if (r.fallback) printLine("vmm: tinyemu failed, i686 v86 fallback. type linux", "warn");
          else printLine("vmm: linux pid attached. type linux to open console", "ok");
        });
      }
      if (res.vmmStop) {
        return VMM.stop().then((r) => printLine(r.error ? "vmm: " + r.error : "vmm: guest stopped", r.error ? "err" : "info"));
      }
      if (res.linux) {
        if (typeof Desktop !== "undefined" && Desktop.running()) {
          Apps.launch("linux", []);
          return Promise.resolve();
        }
        return attachLinux();
      }
      if (res.upload) {
        return FilesIO.pickFiles({ multiple: true }).then((picked) => {
          if (!picked.length) {
            printLine("upload cancelled", "muted");
            return;
          }
          return FilesIO.ingestList(picked, res.upload).then((results) => {
            results.forEach((r) => {
              if (r.error) printLine(`upload: ${r.name}: ${r.error}`, "err");
              else printLine(`uploaded ${r.path} (${FilesIO.fmtSize(r.size)})`, "ok");
            });
          });
        });
      }
      if (res.sleep) {
        busy = true;
        return new Promise((resolve) => {
          setTimeout(() => {
            busy = false;
            resolve();
          }, res.sleep);
        });
      }
      if (res.script) {
        const lines = res.script.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
        return lines.reduce(
          (p, line) => p.then(() => exec(line, { echo: true })),
          Promise.resolve()
        );
      }
      if (res.html) printHtml(res.html, res.cls || "out");
      if (res.lines) {
        res.lines.forEach((l) => {
          if (l.text === "" && res.lines.length === 1) return;
          printLine(l.text, l.cls);
        });
      }
      return Promise.resolve();
    }

    function handleGetty(line) {
      if (mode === "getty-user") {
        pendingUser = (line || "").trim();
        if (!pendingUser) {
          refreshChrome();
          return;
        }
        mode = "getty-pass";
        refreshChrome();
        return;
      }
      const password = line || "";
      const r = Kernel.login(pendingUser, password);
      pendingUser = "";
      if (r.error) {
        printLine("Login incorrect", "err");
        mode = "getty-user";
        refreshChrome();
        return;
      }
      enterShell();
    }

    let linuxOff = null;

    function detachLinux() {
      if (linuxOff) {
        linuxOff();
        linuxOff = null;
      }
      if (mode === "linux") {
        mode = "shell";
        printLine("detached from linux serial0. helix shell.", "info");
        refreshChrome();
      }
    }

    function attachLinux() {
      printLine("vmm: attaching linux console (x86_64 / hvc0) ...", "info");
      return VMM.start().then((r) => {
        if (r.error) {
          printLine("vmm: " + r.error, "err");
          return;
        }
        mode = "linux";
        refreshChrome();
        const dump = VMM.dmesg();
        if (dump) printLine(dump.replace(/\n$/, ""), "out");
        if (linuxOff) linuxOff();
        let buf = "";
        linuxOff = VMM.onSerial((ch) => {
          if (ch === "\n") {
            printLine(buf, "out");
            buf = "";
          } else buf += ch;
        });
        printLine("linux console. detach with: exit", "muted");
      });
    }

    function exec(line, { echo = true } = {}) {
      if (busy) return Promise.resolve();
      if (mode === "linux") {
        const t = line.trim();
        if (t === "exit" || t === "detach" || t === "logout") {
          detachLinux();
          return Promise.resolve();
        }
        if (echo) echoCommand(line);
        VMM.send(line + "\n");
        return Promise.resolve();
      }
      if (mode !== "shell") {
        handleGetty(line);
        return Promise.resolve();
      }
      const trimmed = line.trim();
      if (!trimmed) return Promise.resolve();
      if (echo) echoCommand(trimmed);
      Kernel.pushHistory(trimmed);
      Kernel.log(`cmd: ${trimmed}`);
      const parts = trimmed.split(/\s*;\s*/);
      let chain = Promise.resolve();
      parts.forEach((part) => {
        chain = chain.then(() => applyResult(Commands.dispatch(part)));
      });
      return chain.then(refreshChrome);
    }

    function updateGhost() {
      if (mode !== "shell") {
        ghost.textContent = "";
        return;
      }
      const val = stdin.value;
      const last = val.split(/\s+/).pop() || "";
      const hits = Commands.complete(last);
      if (hits.length === 1 && hits[0] !== last) {
        const prefix = val.slice(0, val.length - last.length);
        ghost.textContent = "Tab → " + prefix + hits[0];
      } else ghost.textContent = "";
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const line = stdin.value;
      stdin.value = "";
      ghost.textContent = "";
      exec(line);
    });

    stdin.addEventListener("keydown", (e) => {
      if (mode === "linux") {
        if (e.key === "c" && e.ctrlKey) {
          e.preventDefault();
          VMM.send("\x03");
        }
        return;
      }
      if (mode !== "shell") return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        stdin.value = Kernel.histPrev();
        updateGhost();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        stdin.value = Kernel.histNext();
        updateGhost();
      } else if (e.key === "Tab") {
        e.preventDefault();
        const val = stdin.value;
        const last = val.split(/\s+/).pop() || "";
        const hits = Commands.complete(last);
        if (hits.length === 1) {
          stdin.value = val.slice(0, val.length - last.length) + hits[0] + " ";
          ghost.textContent = "";
        } else if (hits.length > 1) {
          printLine(hits.join("  "), "muted");
        }
      } else if (e.key === "c" && e.ctrlKey) {
        e.preventDefault();
        printLine("^C", "muted");
        stdin.value = "";
        ghost.textContent = "";
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        output.innerHTML = "";
      }
    });

    stdin.addEventListener("input", updateGhost);

    const session = {
      graphical,
      printLine,
      printHtml,
      exec,
      refreshChrome,
      enterGetty,
      enterShell,
      focus: () => stdin.focus(),
      clear: () => { output.innerHTML = ""; },
      setBusy: (v) => { busy = v; stdin.disabled = !!v; submit.disabled = !!v; },
      root
    };
    sessions.push(session);
    refreshChrome();
    return session;
  }

  let tty = null;

  function bindTty() {
    tty = mount(document.getElementById("tty"), { graphical: false });
    return tty;
  }

  function boot() {
    if (!tty) bindTty();
    Kernel.logout();
    tty.clear();
    tty.root.querySelector(".term-in").value = "";
    tty.root.querySelector(".term-ghost").textContent = "";
    tty.printLine("HelixOS browser console · tty1", "info");
    tty.printLine("Local simulated accounts, not secure authentication.", "muted");
    tty.printLine("accounts: guest / guest    root / root", "muted");
    tty.printLine("Linux is separate and starts only on request.", "muted");
    tty.printLine("", "out");
    tty.setBusy(false);
    tty.enterGetty();
    tty.focus();
  }

  return { mount, bindTty, boot, get tty() { return tty; } };
})();
