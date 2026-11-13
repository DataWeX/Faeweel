(function () {
  const SESS = "helixos.session.v1";
  const PREF = "helixos.pref.v1";
  const state = {
    booted: false,
    loggedIn: false,
    user: null,
    host: "helix",
    cwd: "/",
    history: [],
    theme: "phosphor",
    nextPid: 1,
    processes: {},
    base: { kernel: "Linux x86_64", env: "WebVM/CheerpX", url: "https://webvm.io/" }
  };
  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(PREF) || "null");
      if (p && p.theme) state.theme = p.theme;
      if (p && Array.isArray(p.history)) state.history = p.history.slice(-200);
    } catch (e) {}
  }
  function savePrefs() {
    try { localStorage.setItem(PREF, JSON.stringify({ theme: state.theme, history: state.history.slice(-200) })); } catch (e) {}
  }
  function now() { return Date.now(); }
  function addProc(name, opts) {
    const pid = state.nextPid++;
    const p = { pid, name, user: (opts && opts.user) || "root", state: (opts && opts.state) || "running", ppid: (opts && opts.ppid) || 0, tty: (opts && opts.tty) || "tty1", started: now(), cmd: (opts && opts.cmd) || name };
    state.processes[pid] = p;
    return p;
  }
  function kill(pid) { const p = state.processes[pid]; if (p) p.state = "stopped"; }
  function getProcByName(name) { return Object.values(state.processes).find(p => p.name === name && p.state !== "stopped"); }
  function initProcs() {
    state.processes = {}; state.nextPid = 1;
    addProc("init", { pid: 0, cmd: "/sbin/init" });
    state.nextPid = 2; // ensure init pid 1
    state.processes = {};
    state.nextPid = 1;
    addProc("init", { cmd: "/sbin/init", user: "root" });
    addProc("getty", { cmd: "/sbin/getty tty1", user: "root", ppid: 1 });
  }
  function loadSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESS) || "null");
      if (s && s.user) { state.user = s.user; state.loggedIn = false; }
    } catch (e) {}
  }
  function saveSession() { try { localStorage.setItem(SESS, JSON.stringify({ user: state.user })); } catch (e) {} }
  function checkAuth(user, pass) {
    try {
      const txt = Helix.vfs.read("/etc/passwd", "/");
      return txt.split("\n").some(l => {
        const [u, p] = l.split(":");
        return u === user && p === pass;
      });
    } catch (e) { return user === "guest" && pass === "guest"; }
  }
  function login(user) {
    const loginp = addProc("login", { cmd: "login -- " + user, user: "root", ppid: getProcByName("getty") ? getProcByName("getty").pid : 1 });
    state.user = user;
    state.loggedIn = true;
    state.cwd = user === "root" ? "/root" : "/home/" + user;
    try { Helix.vfs.mkdir(state.cwd, "/"); } catch (e) {}
    saveSession();
    kill(loginp.pid);
    addProc("hsh", { cmd: "-hsh", user: user, ppid: 1, tty: "tty1" });
    savePrefs();
  }
  function logout() {
    const h = getProcByName("hsh");
    if (h) kill(h.pid);
    savePrefs();
    state.loggedIn = false;
    state.user = null;
    state.cwd = "/";
    // respawn getty if missing
    if (!getProcByName("getty")) addProc("getty", { cmd: "/sbin/getty tty1", user: "root", ppid: 1 });
  }
  function prompt() {
    if (!state.loggedIn) return "login: ";
    const p = state.cwd.replace("/home/" + state.user, "~");
    return state.user + "@" + state.host + ":" + p + "$ ";
  }
  function ps() {
    const rows = [["PID","PPID","TTY","USER","STAT","CMD"]];
    const core = new Set(["init","getty","hsh"]);
    Object.values(state.processes).forEach(p => {
      let st = p.state==="running" ? "R" : "S";
      if (core.has(p.name)) st += " [core]";
      rows.push([String(p.pid), String(p.ppid||0), p.tty||"?", p.user, st, p.cmd]);
    });
    const w = rows[0].map((_,i)=>Math.max(...rows.map(r=>r[i].length)));
    return rows.map(r=>r.map((c,i)=>c.padEnd(w[i])).join("  ")).join("\n");
  }
  function getCoreShell() { return getProcByName("hsh"); }
  function isCoreProc(pid) {
    const p = state.processes[pid];
    return !!(p && ["init","getty","login","hsh"].indexOf(p.name) >= 0);
  }
  window.Helix = window.Helix || {};
  loadSession();
  loadPrefs();
  Helix.kernel = { state, checkAuth, login, logout, prompt, loadSession, addProc, kill, ps, initProcs, getProcByName, getCoreShell, isCoreProc, savePrefs, loadPrefs };
})();