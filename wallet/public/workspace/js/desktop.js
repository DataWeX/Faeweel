const Desktop = (() => {
  let on = false;
  let servicePids = [];

  function running() {
    return on;
  }

  function el(id) {
    return document.getElementById(id);
  }

  const launchers = [
    { id: "system", label: "System", app: "system" },
    { id: "term", label: "Terminal", app: "term" },
    { id: "files", label: "Files", app: "files" },
    { id: "media", label: "Media", app: "media" },
    { id: "edit", label: "Editor", app: "edit" },
    { id: "camera", label: "Camera", app: "camera" },
    { id: "wine", label: "Wine", app: "wine" },
    { id: "linux", label: "Linux", app: "linux" },
    { id: "settings", label: "Settings", app: "settings" },
    { id: "design", label: "Design", app: "design" },
    { id: "theme", label: "Theme", app: "theme" },
    { id: "wallpaper", label: "Wallpaper", app: "wallpaper" }
  ];

  function applyLook() {
    const crt = el("crt");
    const de = el("de");
    if (crt) crt.dataset.theme = Kernel.env.THEME || "fire";
    if (de) de.dataset.wall = Kernel.env.WALLPAPER || "ember";
    if (!crt) return;
    if (Kernel.env.ACCENT) {
      crt.style.setProperty("--accent", Kernel.env.ACCENT);
      crt.style.setProperty("--glow", "0 0 18px " + Kernel.env.ACCENT + "99");
    } else {
      crt.style.removeProperty("--accent");
      crt.style.removeProperty("--glow");
    }
  }

  function renderIcons() {
    const box = el("deskIcons");
    box.innerHTML = launchers.map((item) =>
      `<button type="button" class="desk-icon hue-${item.app}" data-app="${item.app}">
        <span class="desk-glyph">${item.label.slice(0, 2).toUpperCase()}</span>
        <span>${item.label}</span>
      </button>`
    ).join("");
  }

  function hideMenu() {
    el("startMenu").hidden = true;
    el("startBtn").classList.remove("on");
  }

  function toggleMenu() {
    const menu = el("startMenu");
    menu.hidden = !menu.hidden;
    el("startBtn").classList.toggle("on", !menu.hidden);
  }

  function bind() {
    renderIcons();
    applyLook();
    el("startBtn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    el("startMenu").addEventListener("click", (e) => {
      const app = e.target.closest("[data-app]");
      if (app) {
        hideMenu();
        Apps.launch(app.dataset.app, []);
        return;
      }
      const act = e.target.closest("[data-act]");
      if (act && act.dataset.act === "logout") stop();
    });
    el("deskIcons").addEventListener("click", (e) => {
      const icon = e.target.closest("[data-app]");
      if (icon) Apps.launch(icon.dataset.app, []);
    });
    el("de").addEventListener("click", (e) => {
      if (!e.target.closest("#startMenu") && !e.target.closest("#startBtn")) hideMenu();
    });
    bindDrop();
  }

  function bindDrop() {
    const overlay = el("dropOverlay");
    let depth = 0;
    function show() { overlay.hidden = false; }
    function hide() { depth = 0; overlay.hidden = true; }
    function overWin(t) { return !!(t && t.closest && t.closest(".win")); }

    window.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (!on || overWin(e.target)) return;
      depth += 1;
      show();
    });
    window.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    });
    window.addEventListener("dragleave", (e) => {
      e.preventDefault();
      depth -= 1;
      if (depth <= 0) hide();
    });
    window.addEventListener("drop", async (e) => {
      e.preventDefault();
      hide();
      if (!on || overWin(e.target)) return;
      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) return;
      const results = await FilesIO.ingestList(files, Kernel.env.HOME);
      const ok = results.filter((r) => !r.error);
      Apps.toast(ok.length ? `imported ${ok.length} file${ok.length === 1 ? "" : "s"}` : "upload failed");
    });
  }

  function start() {
    if (!Kernel.session.loggedIn) {
      if (Terminal.tty) Terminal.tty.printLine("startx: please log in first", "err");
      return;
    }
    if (on) {
      if (Terminal.tty) Terminal.tty.printLine("HelixDE is already running on :0", "warn");
      return;
    }
    on = true;
    applyLook();
    Kernel.env.DISPLAY = ":0";
    Kernel.env.DESKTOP = "HelixDE";
    Kernel.env.WM = "helixwm";
    servicePids = ["helixwm", "helixde"].map(name => Kernel.spawn(name, { kind: "service", protected: true }).pid);
    el("tty").hidden = true;
    el("de").hidden = false;
    hideMenu();
    WM.renderTaskbar();
    const phone = window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
    if (!phone) Apps.launch("term", []);
    Apps.toast(phone ? "HelixDE  ·  tap an icon" : "HelixDE  ·  helixwm on :0");
  }

  function stop() {
    if (!on) return;
    hideMenu();
    WM.closeAll();
    servicePids.forEach(pid => Kernel.release(pid));
    servicePids = [];
    on = false;
    delete Kernel.env.DISPLAY;
    delete Kernel.env.DESKTOP;
    delete Kernel.env.WM;
    el("de").hidden = true;
    el("tty").hidden = false;
    if (Terminal.tty) {
      Terminal.tty.printLine("HelixDE stopped. Back on tty1.", "info");
      Terminal.tty.refreshChrome();
      Terminal.tty.focus();
    }
  }

  return { start, stop, running, bind, applyLook };
})();
