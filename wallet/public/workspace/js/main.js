(() => {
  function lockZoom() {
    document.addEventListener("wheel", (e) => {
      if (e.ctrlKey) e.preventDefault();
    }, { passive: false });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")) {
        e.preventDefault();
      }
    });
    document.addEventListener("gesturestart", (e) => e.preventDefault());
  }

  function tickClock() {
    const el = document.getElementById("clockStat");
    if (!el) return;
    el.textContent = new Date().toTimeString().slice(0, 8);
  }

  function tickStats() {
    const cpu = 2 + Math.floor(Math.random() * 9);
    const mem = 110 + Math.floor(Math.random() * 30);
    const cpuEl = document.getElementById("cpuStat");
    const memEl = document.getElementById("memStat");
    if (cpuEl) cpuEl.textContent = `cpu ${cpu}%`;
    if (memEl) memEl.textContent = `mem ${mem}M`;
    const proc = VFS.read("/proc/uptime");
    if (!proc.error) {
      const sec = ((Date.now() - Kernel.startedAt) / 1000).toFixed(2);
      VFS.write("/proc/uptime", `${sec} ${sec}\n`);
    }
  }

  function markTouch() {
    const coarse = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    document.documentElement.classList.toggle("touch", coarse);
    document.body.classList.toggle("touch", coarse);
  }

  lockZoom();
  markTouch();
  window.addEventListener("resize", markTouch);
  if (typeof XmlWin !== "undefined") XmlWin.load();
  Desktop.bind();
  Terminal.bindTty();
  tickClock();
  tickStats();
  setInterval(tickClock, 1000);
  setInterval(tickStats, 1800);
  Terminal.boot();
})();
