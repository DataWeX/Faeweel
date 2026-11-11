(function () {
  let z = 10;
  function focus(win) {
    document.querySelectorAll(".win").forEach(w => w.classList.remove("focused"));
    win.classList.add("focused");
    win.style.zIndex = ++z;
  }
  function createWindow(opts) {
    opts = opts || {};
    const area = document.getElementById("de-windows");
    const win = document.createElement("div");
    win.className = "win";
    win.style.left = (opts.x || 260) + "px";
    win.style.top = (opts.y || 40) + "px";
    win.style.width = (opts.w || 520) + "px";
    win.style.height = (opts.h || 320) + "px";
    const title = document.createElement("div");
    title.className = "win-title";
    const t = document.createElement("span");
    t.className = "title-text";
    t.textContent = opts.title || "window";
    const close = document.createElement("button");
    close.className = "win-btn";
    close.textContent = "×";
    close.title = "Close";
    title.appendChild(t);
    title.appendChild(close);
    const body = document.createElement("div");
    body.className = "win-body";
    if (opts.body) body.appendChild(opts.body);
    win.appendChild(title);
    win.appendChild(body);
    area.appendChild(win);
    focus(win);
    win.addEventListener("mousedown", () => focus(win));
    close.addEventListener("click", () => { if (opts.onClose) opts.onClose(); win.remove(); });
    let drag = null;
    title.addEventListener("mousedown", (e) => {
      if (e.target === close) return;
      drag = { sx: e.clientX, sy: e.clientY, sl: win.offsetLeft, st: win.offsetTop };
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!drag) return;
      win.style.left = (drag.sl + e.clientX - drag.sx) + "px";
      win.style.top = (drag.st + e.clientY - drag.sy) + "px";
    });
    window.addEventListener("mouseup", () => { drag = null; });
    return { win, body, close, focus: () => focus(win) };
  }
  window.Helix = window.Helix || {};
  Helix.wm = { createWindow, focus };
})();