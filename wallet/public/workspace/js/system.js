const System = (() => {
  function open() {
    const { el } = WM.open('System — HelixOS', `
      <div class="system-panel">
        <span class="system-kicker">HELIXOS / BROWSER EDITION</span>
        <h1>A workspace, wherever you are.</h1>
        <p>The desktop, shell and files run locally in your browser. This is the foundation for an agentic OS—not an iOS replacement or a connected remote computer.</p>
        <dl><dt>Desktop shell</dt><dd>JavaScript · running locally</dd>
        <dt>File storage</dt><dd data-storage></dd>
        <dt>Remote agents</dt><dd>Not connected</dd>
        <dt>Linux guest</dt><dd>Experimental WebAssembly emulation · starts on demand</dd>
        <dt>Windows compatibility</dt><dd>App shortcuts only · does not execute Windows binaries</dd></dl>
        <h2>Quick start</h2><p>Open <b>Files</b> to browse your local home folder. Open a text file to edit it, then use <b>Save</b>. Use <b>Download</b> to back it up to your device. In Terminal, try <code>help</code>, <code>ls</code> or <code>cat notes.txt</code>.</p>
        <h2>Display</h2><label class="system-toggle"><input type="checkbox" data-crt> CRT visual effects</label>
        <p class="system-note">Local guest/root accounts organize this simulation; they are not secure authentication. Do not store passwords, private keys, or confidential files here. Browser data clearing removes local files.</p>
        <p class="system-note">On iPhone, use Safari’s Share → Add to Home Screen for a standalone window. Offline operation is not provided. Linux performance and memory limits vary by device.</p>
      </div>`, { width: 650, height: 580 });
    const status = VFS.getStorageStatus?.();
    el.querySelector('[data-storage]').textContent = status?.persistent === false ? 'In-memory only — export before leaving' : 'Browser local storage · not cloud synced';
    const toggle = el.querySelector('[data-crt]');
    toggle.checked = document.documentElement.classList.contains('crt-effects');
    toggle.addEventListener('change', () => {
      document.documentElement.classList.toggle('crt-effects', toggle.checked);
      try { localStorage.setItem('helix.crt', toggle.checked ? '1' : '0'); } catch { /* Session-only display preference. */ }
    });
  }
  try { document.documentElement.classList.toggle('crt-effects', localStorage.getItem('helix.crt') === '1'); } catch { /* Use accessible defaults. */ }
  return { open };
})();
