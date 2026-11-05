const Terminal = (() => {
  const sessions = [];

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function mount(root, { graphical = false } = {}) {
    const output = root.querySelector(".term-out");
    const stdin = root.querySelector(".term-in");
    const ghost = root.querySelector(".term-ghost");
    const promptLabel = root.querySelector(".term-prompt");
    const form = root.querySelector(".term-form");
    let busy = false;
    let mode = graphical ? "shell" : "getty-user";
    let pendingUser = "";

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
        return VMM.stop().then(() => printLine("vmm: guest stopped", "info"));
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
        ghost.textContent = prefix + hits[0];
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
      setBusy: (v) => { busy = v; stdin.disabled = !!v; },
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

  async function boot() {
    if (!tty) bindTty();
    tty.clear();
    tty.setBusy(true);
    const steps = [
      ["HelixBIOS 1.04  Release", "boot-line"],
      ["CPU: Helix Virtual @ 1 thread (host wasm32)", "boot-line"],
      ["VMM: TinyEMU x86_64  ·  busybox root", "boot-ok"],
      ["Memory test .............. 262144K OK", "boot-ok"],
      ["", "out"],
      ["Loading helix 1.0.0-web ...", "boot-line"],
      ["[    0.000000] helix: command line: root=/dev/vfs ro quiet", "boot-line"],
      ["[    0.041002] vfs: mounted localStorage as root", "boot-ok"],
      ["[    0.088110] initrd: unpacked", "boot-ok"],
      ["[    0.120440] printk: console [tty1] enabled", "boot-ok"],
      ["[    0.201882] pid 1 (init) started", "boot-ok"],
      ["[    0.244001] vmm: linux x86_64 guest available (TinyEMU)", "boot-ok"],
      ["[    0.250001] getty: tty1", "boot-ok"],
      ["", "out"]
    ];
    for (const [text, cls] of steps) {
      tty.printLine(text, cls);
      await wait(55 + Math.random() * 55);
    }
    Kernel.logout();
    tty.printLine("HelixOS 1.0 (helix 1.0.0-web) tty1", "info");
    tty.printLine("accounts: guest / guest    root / root", "muted");
    tty.printLine("", "out");
    tty.setBusy(false);
    tty.enterGetty();
    tty.focus();
  }

  return { mount, bindTty, boot, get tty() { return tty; } };
})();
