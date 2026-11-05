const WM = (() => {
  const windows = new Map();
  let z = 40;
  let seq = 1;
  let cascade = 0;

  function desktop() {
    return document.getElementById("desktop");
  }

  function taskbar() {
    return document.getElementById("taskbar");
  }

  function renderTaskbar() {
    const bar = taskbar();
    if (!bar) return;
    bar.innerHTML = "";
    windows.forEach((rec) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "task-btn";
      if (rec.el.classList.contains("focused") && !rec.el.classList.contains("minimized")) b.classList.add("active");
      if (rec.el.classList.contains("minimized")) b.classList.add("min");
      b.textContent = rec.title;
      b.addEventListener("click", () => {
        if (rec.el.classList.contains("minimized")) {
          rec.el.classList.remove("minimized");
          focus(rec.el);
        } else if (rec.el.classList.contains("focused")) {
          rec.el.classList.add("minimized");
          rec.el.classList.remove("focused");
        } else {
          rec.el.classList.remove("minimized");
          focus(rec.el);
        }
        renderTaskbar();
      });
      bar.appendChild(b);
    });
  }

  function focus(win) {
    if (!win) return;
    z += 1;
    win.style.zIndex = String(z);
    const desk = desktop();
    desk.querySelectorAll(".win").forEach((w) => w.classList.remove("focused"));
    win.classList.add("focused");
    win.classList.remove("minimized");
    renderTaskbar();
  }

  function close(id) {
    const rec = windows.get(id);
    if (!rec) return;
    if (typeof rec.onClose === "function") {
      try { rec.onClose(); } catch { /* ignore */ }
    }
    rec.el.remove();
    windows.delete(id);
    const last = Array.from(desktop().querySelectorAll(".win:not(.minimized)")).pop();
    if (last) focus(last);
    else renderTaskbar();
  }

  function closeAll() {
    Array.from(windows.keys()).forEach(close);
  }

  function compact() {
    return window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
  }

  function clampPos(win, x, y) {
    const desk = desktop();
    const maxX = Math.max(0, desk.clientWidth - 96);
    const maxY = Math.max(0, desk.clientHeight - 28);
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY))
    };
  }

  function bindPointerDrag(handle, onMove, onStart) {
    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      if (onStart) onStart(e);
      handle.setPointerCapture(e.pointerId);
      function move(ev) {
        onMove(ev);
      }
      function up() {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
      }
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    });
  }

  function open(title, bodyHtml, { onClose, width, height } = {}) {
    const desk = desktop();
    const id = "w" + seq++;
    const win = document.createElement("section");
    win.className = "win";
    win.dataset.id = id;
    const phone = compact();
    const w = phone
      ? Math.max(240, desk.clientWidth - 10)
      : Math.min(width || 640, Math.max(280, desk.clientWidth - 24));
    const h = phone
      ? Math.max(180, desk.clientHeight - 10)
      : Math.min(height || 420, Math.max(200, desk.clientHeight - 24));
    const offset = phone ? (cascade++ % 3) * 10 : (cascade++ % 7) * 26;
    const pos = clampPos(win, phone ? 4 + offset : 110 + offset, phone ? 4 + offset : 18 + offset);
    win.style.width = w + "px";
    win.style.height = h + "px";
    win.style.left = pos.x + "px";
    win.style.top = pos.y + "px";
    if (typeof XmlWin !== "undefined") {
      const built = XmlWin.build(title, bodyHtml);
      win.className = built.className || "win";
      win.innerHTML = built.innerHTML;
    } else {
      win.innerHTML = `
        <div class="win-titlebar">
          <span class="win-title">${Commands.esc(title)}</span>
          <div class="win-controls">
            <button type="button" class="win-btn" data-min title="minimize">_</button>
            <button type="button" class="win-btn win-x" data-close title="close">x</button>
          </div>
        </div>
        <div class="app-bar"></div>
        <div class="app-body">${bodyHtml}</div>
        <div class="win-resize" data-resize></div>
      `;
    }
    desk.appendChild(win);

    const rec = { el: win, title, onClose: onClose || null };
    windows.set(id, rec);

    const closeFn = () => close(id);
    win._close = closeFn;
    win._id = id;

    win.querySelector("[data-close]").addEventListener("click", (e) => {
      e.stopPropagation();
      closeFn();
    });
    win.querySelector("[data-min]").addEventListener("click", (e) => {
      e.stopPropagation();
      win.classList.add("minimized");
      win.classList.remove("focused");
      renderTaskbar();
    });

    win.addEventListener("pointerdown", () => focus(win));

    const bar = win.querySelector(".win-titlebar");
    let ox = 0;
    let oy = 0;
    bindPointerDrag(bar, (ev) => {
      const deskR = desk.getBoundingClientRect();
      const next = clampPos(win, ev.clientX - deskR.left - ox, ev.clientY - deskR.top - oy);
      win.style.left = next.x + "px";
      win.style.top = next.y + "px";
    }, (e) => {
      focus(win);
      const r = win.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
    });

    const grip = win.querySelector("[data-resize]");
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;
    bindPointerDrag(grip, (ev) => {
      const minW = compact() ? 220 : 280;
      const minH = compact() ? 160 : 180;
      const nw = Math.max(minW, Math.min(desk.clientWidth - 8, startW + (ev.clientX - startX)));
      const nh = Math.max(minH, Math.min(desk.clientHeight - 8, startH + (ev.clientY - startY)));
      win.style.width = nw + "px";
      win.style.height = nh + "px";
      win.dispatchEvent(new Event("helixresize"));
    }, (e) => {
      focus(win);
      startX = e.clientX;
      startY = e.clientY;
      startW = win.offsetWidth;
      startH = win.offsetHeight;
    });

    focus(win);
    return win;
  }

  function list() {
    return Array.from(windows.values()).map((r) => ({
      id: r.el.dataset.id,
      title: r.title,
      minimized: r.el.classList.contains("minimized")
    }));
  }

  return { open, close, closeAll, focus, list, renderTaskbar };
})();
