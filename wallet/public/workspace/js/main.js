(async () => {
  function tick() {
    document.getElementById('clockStat').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('userStat').textContent = Kernel.session.loggedIn ? Kernel.env.USER : 'login';
    document.getElementById('cpuStat').textContent = `${WM.list().length} windows`;
    const storage = VFS.getStorageStatus?.();
    document.getElementById('memStat').textContent = storage?.persistent === false ? 'unsaved' : 'local files';
  }

  function markTouch() {
    const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    document.documentElement.classList.toggle('touch', touch);
    document.body.classList.toggle('touch', touch);
  }

  function storageNotice(event) {
    const state = event?.detail || VFS.getStorageStatus?.();
    const banner = document.getElementById('storageNotice');
    banner.hidden = state?.persistent !== false;
    if (!banner.hidden) banner.textContent = 'Files are only in memory: browser storage is unavailable or full. Export important files before leaving.';
    tick();
  }

  const welcome = document.getElementById('welcome');
  const enter = document.getElementById('enterDesktop');
  const tty = document.getElementById('tty');
  const message = document.getElementById('welcomeMessage');
  function enterDesktop() {
    if (Kernel.login('guest', 'guest').error) {
      message.textContent = 'The local guest password has changed. Choose Terminal login to use your credentials.';
      return;
    }
    welcome.hidden = true;
    Desktop.start();
    tick();
  }

  try {
    markTouch();
    window.addEventListener('resize', markTouch);
    await XmlWin.load();
    Desktop.bind();
    Terminal.bindTty();
    tty.hidden = true;
    enter.disabled = false;
    message.textContent = 'Ready. Everything stays in this browser unless you explicitly export a file or use a network feature.';
    enter.addEventListener('click', enterDesktop);
    document.getElementById('terminalLogin').addEventListener('click', () => {
      welcome.hidden = true;
      tty.hidden = false;
      Terminal.boot();
    });
    document.getElementById('backToWelcome').addEventListener('click', () => {
      tty.hidden = true;
      welcome.hidden = false;
    });
    document.getElementById('systemButton').addEventListener('click', () => System.open());
    window.addEventListener('helix:storage', storageNotice);
    storageNotice();
    tick();
    setInterval(() => { if (!document.hidden) tick(); }, 1000);
  } catch (error) {
    message.textContent = `Startup failed: ${error.message}. Reload to retry. Your stored files have not been reset.`;
  }
})();
