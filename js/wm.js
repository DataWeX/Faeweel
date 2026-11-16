(function () {
  let z = 10;
  function refresh() { if (window.Helix && Helix.xmlstyle && Helix.xmlstyle.refresh) Helix.xmlstyle.refresh(); }
  function focus(win) {
    document.querySelectorAll(".win").forEach(w => { w.dataset.focused = "0"; w.style.borderColor = ""; });
    win.dataset.focused = "1";
    win.style.zIndex = ++z;
    refresh();
  }
  function createWindow(opts) {
    opts = opts || {};
    const area = document.getElementById("de-windows");
    const win = document.createElement("div");
    win.className = "win";
    win.dataset.focused = "0";
    win.dataset.hidden = "0";
    win.style.position = "absolute";
    win.style.left = (opts.x || 260) + "px";
    win.style.top = (opts.y || 40) + "px";
    win.style.width = (opts.w || 520) + "px";
    win.style.height = (opts.h || 320) + "px";
    win.style.display = "flex";
    win.style.flexDirection = "column";
    win.style.boxSizing = "border-box";
    const title = document.createElement("div");
    title.className = "win-title";
    const t = document.createElement("span");
    t.className = "title-text";
    t.textContent = opts.title || "window";
    const close = document.createElement("button");
    close.className = "win-btn";
    close.textContent = "×";
    close.title = opts.hideOnClose ? "Hide" : "Close";
    close.style.width = "22px"; close.style.height = "22px"; close.style.lineHeight = "1"; close.style.cursor = "pointer";
    title.appendChild(t);
    title.appendChild(close);
    const body = document.createElement("div");
    body.className = "win-body";
    if (opts.body) body.appendChild(opts.body);
    win.appendChild(title);
    win.appendChild(body);
    area.appendChild(win);
    focus(win);
    win.addEventListener("pointerdown", () => focus(win));
    function show() { win.dataset.hidden = "0"; win.style.display = "flex"; focus(win); if (opts.onShow) opts.onShow(); refresh(); }
    function hide() { win.dataset.hidden = "1"; win.style.display = "none"; if (opts.onHide) opts.onHide(); }
    close.addEventListener("click", () => {
      if (opts.hideOnClose) { hide(); return; }
      if (opts.onClose) opts.onClose();
      win.remove();
      refresh();
    });
    let drag = null;
    title.style.touchAction = "none";
    title.addEventListener("pointerdown", (e) => {
      if (e.target === close) return;
      drag = { sx: e.clientX, sy: e.clientY, sl: win.offsetLeft, st: win.offsetTop };
      try { title.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    title.addEventListener("pointermove", (e) => {
      if (!drag) return;
      win.style.left = Math.max(0, drag.sl + e.clientX - drag.sx) + "px";
      win.style.top = Math.max(0, drag.st + e.clientY - drag.sy) + "px";
    });
    const endDrag = (e) => { drag = null; try { title.releasePointerCapture(e.pointerId); } catch (_) {} };
    title.addEventListener("pointerup", endDrag);
    title.addEventListener("pointercancel", () => { drag = null; });
    return { win, body, close, focus: () => focus(win), show, hide, setTitle: (s) => { t.textContent = s; } };
  }
  window.Helix = window.Helix || {};
  Helix.wm = { createWindow, focus, refresh };
})();
