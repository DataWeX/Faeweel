const CoreMonitor = (() => {
  function open() {
    let timer;
    let closed = false;
    const el = WM.open('Core — HelixOS', `
      <div class="system-panel core-panel">
        <span class="system-kicker">HELIX CORE / C + WEBASSEMBLY</span>
        <h1>One core. One runtime service.</h1>
        <p>The C process registry tracks browser services and app windows. These records are not Linux PIDs or an OS scheduler. HelixOS remains the browser app; TinyEMU provides one optional Linux runtime, not a nested VM.</p>
        <div class="core-actions">
          <button type="button" data-core-start>Start runtime</button>
          <button type="button" data-core-console>Open Linux console</button>
          <button type="button" data-core-stop>Stop runtime</button>
        </div>
        <p data-core-runtime></p><p role="status" data-core-message></p>
        <p class="system-note">Runtime active does not prove Linux booted. Check the console for a guest prompt. TinyEMU requires a page reload to stop; close its console to detach without stopping it.</p>
        <h2>Core process registry</h2>
        <p class="system-note">CPU and memory measurements are not collected. Managed services close through their owning app or runtime controls.</p>
        <div class="core-process-table"><table class="wine-table"><thead><tr><th>PID</th><th>Name</th><th>Kind</th><th>State</th><th>Owner</th></tr></thead><tbody data-core-processes></tbody></table></div>
      </div>`, {
      width: 760, height: 620,
      onClose: () => { closed = true; clearInterval(timer); }
    });
    const start = el.querySelector('[data-core-start]');
    const stop = el.querySelector('[data-core-stop]');
    const message = el.querySelector('[data-core-message]');
    let busy = false;
    function render() {
      const runtime = VMM.status();
      el.querySelector('[data-core-runtime]').textContent = `Process core: ${CoreProcess.status().implementation} · Runtime: ${runtime.starting ? 'starting' : runtime.running ? 'active' : 'stopped'} · Backend: ${runtime.backend} · Guest prompt: ${runtime.linuxReady ? "observed" : "not yet observed"}`;
      start.disabled = busy || runtime.running || runtime.starting;
      stop.disabled = busy || !runtime.running || runtime.starting;
      el.querySelector('[data-core-processes]').innerHTML = Kernel.processes.map(p => `<tr><td>${p.pid}</td><td>${Commands.esc(p.name)}</td><td>${p.kind}</td><td>${p.state}</td><td>${Commands.esc(p.user)}</td></tr>`).join('');
    }
    async function action(operation) {
      busy = true;
      message.textContent = 'Working…';
      render();
      try {
        const result = await operation();
        if (!closed) message.textContent = result.error || 'Runtime request completed. Check the console for guest readiness.';
      } catch (error) {
        if (!closed) message.textContent = error.message;
      } finally {
        busy = false;
        if (!closed) render();
      }
    }
    start.addEventListener('click', () => action(() => VMM.start()));
    stop.addEventListener('click', () => action(() => VMM.stop()));
    el.querySelector('[data-core-console]').addEventListener('click', () => Apps.launch('linux', []));
    render();
    timer = setInterval(() => { if (!document.hidden) render(); }, 500);
  }
  return { open };
})();
