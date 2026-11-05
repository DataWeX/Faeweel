const VMM = (() => {
  const TINY = {
    js: "vendor/x86_64emu-wasm.js",
    wasm: "vendor/x86_64emu-wasm.wasm",
    cfg: "firmware/helix-x86_64.cfg",
    mem: 128
  };
  const V86A = {
    wasm: "vendor/v86.wasm",
    bios: "firmware/seabios.bin",
    vga: "firmware/vgabios.bin",
    kernel: "firmware/vmlinuz.bin",
    cmdline: "console=ttyS0,115200n8 tsc=reliable mitigations=off random.trust_cpu=on"
  };

  let backend = "none";
  let emu = null;
  let running = false;
  let starting = false;
  let tinyReady = false;
  let tinyStarted = false;
  let pids = { vmm: 0, linux: 0 };
  let serialLog = "";
  const listeners = new Set();
  let runtimeWait = null;

  function status() {
    return {
      running,
      starting,
      backend,
      arch: backend === "tinyemu" ? "x86_64" : backend === "v86" ? "i686" : "none",
      bios: backend === "tinyemu" ? "TinyEMU" : backend === "v86" ? "SeaBIOS" : "-",
      kernel: backend === "none" ? null : backend === "tinyemu" ? "linux-x86_64" : "linux",
      root: backend === "tinyemu" ? "busybox-9p" : backend === "v86" ? "none" : "-",
      bytes: serialLog.length
    };
  }

  function onSerial(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function emit(ch) {
    serialLog += ch;
    if (serialLog.length > 240000) serialLog = serialLog.slice(-160000);
    listeners.forEach((fn) => {
      try { fn(ch); } catch { /* ignore */ }
    });
  }

  function handleByte(byte) {
    if (byte === 13) return;
    emit(String.fromCharCode(byte));
  }

  function handleText(str) {
    for (let i = 0; i < str.length; i++) {
      const ch = str.charAt(i);
      if (ch === "\r") continue;
      emit(ch);
    }
  }

  function attachHelix() {
    if (!pids.vmm) pids.vmm = Kernel.spawn("vmm").pid;
    if (!pids.linux) pids.linux = Kernel.spawn("linux").pid;
    Kernel.env.VMM = backend;
    Kernel.env.GUEST_ARCH = backend === "tinyemu" ? "x86_64" : "i686";
  }

  function detachHelix() {
    if (pids.vmm) Kernel.kill(pids.vmm);
    if (pids.linux) Kernel.kill(pids.linux);
    pids = { vmm: 0, linux: 0 };
    delete Kernel.env.VMM;
    delete Kernel.env.GUEST_ARCH;
  }

  function setupTinyGlobals() {
    window.update_downloading = function () {};
    window.net_state = null;
    window.graphic_display = null;
    window.term = {
      write: handleText,
      getSize: function () { return [80, 24]; }
    };
    window.Module = window.Module || {};
    Module.locateFile = function (path) {
      return new URL("vendor/" + path, window.location.href).href;
    };
    if (!runtimeWait) {
      runtimeWait = new Promise((resolve) => {
        const prev = Module.onRuntimeInitialized;
        Module.onRuntimeInitialized = function () {
          if (typeof prev === "function") prev();
          resolve();
        };
        if (Module.calledRun) resolve();
      });
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (tinyReady) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("tinyemu runtime missing"));
      document.head.appendChild(s);
    });
  }

  function waitTinyRuntime() {
    if (typeof Module !== "undefined" && Module.calledRun) return Promise.resolve();
    return runtimeWait || Promise.reject(new Error("tinyemu runtime not initialized"));
  }

  async function startTiny() {
    setupTinyGlobals();
    await loadScript(TINY.js);
    await waitTinyRuntime();
    tinyReady = true;
    if (tinyStarted) {
      running = true;
      backend = "tinyemu";
      attachHelix();
      return { ok: true, already: true };
    }
    const url = new URL(TINY.cfg, window.location.href).href;
    Module.ccall(
      "vm_start",
      null,
      ["string", "number", "string", "string", "number", "number", "number", "string"],
      [url, TINY.mem, "", null, 0, 0, 0, ""]
    );
    tinyStarted = true;
    backend = "tinyemu";
    running = true;
    attachHelix();
    Kernel.log("vmm: TinyEMU + Linux x86_64 guest started");
    return { ok: true };
  }

  async function startV86() {
    if (typeof V86 === "undefined") return { error: "v86 runtime missing" };
    emu = new V86({
      wasm_path: V86A.wasm,
      memory_size: 32 * 1024 * 1024,
      bios: { url: V86A.bios },
      vga_bios: { url: V86A.vga },
      bzimage: { url: V86A.kernel },
      cmdline: V86A.cmdline,
      filesystem: {},
      autostart: true,
      disable_keyboard: true,
      disable_mouse: true,
      disable_speaker: true
    });
    emu.add_listener("serial0-output-byte", handleByte);
    backend = "v86";
    running = true;
    attachHelix();
    Kernel.log("vmm: SeaBIOS + Linux i686 guest started (fallback)");
    return { ok: true, fallback: true };
  }

  async function start() {
    if (running) return { ok: true, already: true };
    if (starting) return { ok: true, already: true, starting: true };
    starting = true;
    if (!tinyStarted) serialLog = "";
    try {
      try {
        const r = await startTiny();
        starting = false;
        return r;
      } catch (tinyErr) {
        Kernel.log("vmm: tinyemu failed: " + (tinyErr.message || tinyErr));
        const r = await startV86();
        starting = false;
        if (r.error) return r;
        return r;
      }
    } catch (e) {
      starting = false;
      running = false;
      backend = "none";
      emu = null;
      return { error: String(e.message || e) };
    }
  }

  async function stop() {
    if (backend === "tinyemu") {
      return { error: "TinyEMU cannot be stopped; reload the page to stop it." };
    }
    starting = false;
    if (backend === "v86" && emu) {
      try { await emu.stop(); } catch { /* ignore */ }
      try { await emu.destroy(); } catch { /* ignore */ }
      emu = null;
      backend = "none";
    }
    running = false;
    detachHelix();
    Kernel.log("vmm: guest detached (tinyemu keeps running until reload)");
    return { ok: true };
  }

  function send(text) {
    if (!running) return false;
    if (backend === "tinyemu" && typeof Module !== "undefined" && Module._console_queue_char) {
      for (let i = 0; i < text.length; i++) {
        Module._console_queue_char(text.charCodeAt(i) & 255);
      }
      return true;
    }
    if (backend === "v86" && emu) {
      emu.serial0_send(text);
      return true;
    }
    return false;
  }

  function dmesg() {
    return serialLog;
  }

  function isRunning() {
    return running;
  }

  return { start, stop, send, dmesg, status, onSerial, running: isRunning };
})();
