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
  let tinyStartAttempted = false;
  let servicePid = 0;
  let serialLog = "";
  let serialTail = "";
  let linuxReady = false;
  const listeners = new Set();
  let runtimeWait = null;
  let startPromise = null;

  function status() {
    return {
      running,
      runtimeActive: running,
      starting,
      linuxReady,
      servicePid: servicePid || null,
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
    serialTail = (serialTail + ch).slice(-256);
    if (/(?:^|\n)[^\n]*\blogin:\s*$|(?:^|\n)(?:\/ #|# |\$ )$/.test(serialTail)) {
      linuxReady = true;
    }
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

  function createService() {
    const process = Kernel.spawn("vmm", { kind: "service", state: "starting", protected: true });
    if (!process || !process.pid) throw new Error("could not register VMM service");
    servicePid = process.pid;
  }

  function activateService() {
    Kernel.updateProcess(servicePid, "running");
    Kernel.env.VMM = backend;
    Kernel.env.GUEST_ARCH = backend === "tinyemu" ? "x86_64" : "i686";
    running = true;
  }

  function releaseService() {
    if (servicePid) Kernel.release(servicePid);
    servicePid = 0;
    delete Kernel.env.VMM;
    delete Kernel.env.GUEST_ARCH;
  }

  async function discardV86() {
    const failedEmu = emu;
    emu = null;
    if (!failedEmu) return;
    try { await failedEmu.stop(); } catch { /* startup already failed */ }
    try { await failedEmu.destroy(); } catch { /* startup already failed */ }
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
      backend = "tinyemu";
      return { ok: true, already: true };
    }
    if (tinyStartAttempted) throw new Error("TinyEMU start state is uncertain; reload the page before retrying");
    const url = new URL(TINY.cfg, window.location.href).href;
    tinyStartAttempted = true;
    Module.ccall(
      "vm_start",
      null,
      ["string", "number", "string", "string", "number", "number", "number", "string"],
      [url, TINY.mem, "", null, 0, 0, 0, ""]
    );
    tinyStarted = true;
    backend = "tinyemu";
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
    await new Promise((resolve, reject) => {
      emu.add_listener("emulator-ready", resolve);
      emu.add_listener("download-error", (event) => {
        reject(new Error("v86 failed to load " + (event.file_name || "a runtime image")));
      });
    });
    backend = "v86";
    return { ok: true, fallback: true };
  }

  async function doStart() {
    starting = true;
    serialLog = "";
    serialTail = "";
    linuxReady = false;
    try {
      createService();
      if (tinyStartAttempted && !tinyStarted) {
        throw new Error("TinyEMU start state is uncertain; reload the page before retrying");
      }
      try {
        const r = await startTiny();
        activateService();
        Kernel.log("vmm: TinyEMU + Linux x86_64 guest started");
        starting = false;
        return r;
      } catch (tinyErr) {
        if (tinyStartAttempted) throw tinyErr;
        Kernel.log("vmm: tinyemu failed: " + (tinyErr.message || tinyErr));
        const r = await startV86();
        if (r.error) throw new Error(r.error);
        activateService();
        Kernel.log("vmm: SeaBIOS + Linux i686 guest started (fallback)");
        starting = false;
        return r;
      }
    } catch (e) {
      await discardV86();
      starting = false;
      running = false;
      backend = "none";
      releaseService();
      return { error: String(e.message || e) };
    }
  }

  function start() {
    if (startPromise) return startPromise;
    if (running) return Promise.resolve({ ok: true, already: true });
    starting = true;
    startPromise = Promise.resolve().then(doStart).finally(() => {
      starting = false;
      startPromise = null;
    });
    return startPromise;
  }

  async function stop() {
    if (backend === "tinyemu") {
      return { error: "TinyEMU cannot be stopped; reload the page to stop it." };
    }
    if (starting) return { error: "VMM is still starting." };
    if (backend === "v86" && emu) {
      try {
        await emu.stop();
        await emu.destroy();
      } catch (e) {
        return { error: String(e.message || e) };
      }
      emu = null;
      backend = "none";
    }
    running = false;
    linuxReady = false;
    releaseService();
    Kernel.log("vmm: guest stopped");
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
