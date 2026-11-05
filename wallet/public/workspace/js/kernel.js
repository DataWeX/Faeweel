const Kernel = (() => {
  const startedAt = Date.now();
  const env = {
    USER: "nobody",
    HOME: "/",
    PWD: "/",
    SHELL: "/bin/hsh",
    HOSTNAME: "helix",
    TERM: "helix-256color",
    PATH: "/bin:/usr/bin",
    EDITOR: "edit",
    THEME: "fire",
    WALLPAPER: "ember",
    ACCENT: "",
    LOGNAME: "nobody"
  };

  const AUTH_KEY = "helixos.shadow.v1";
  const session = { loggedIn: false, uid: -1 };

  function defaultShadow() {
    return {
      guest: { hash: "guest", uid: 1000, gid: 1000, home: "/home/guest", shell: "/bin/hsh" },
      root: { hash: "root", uid: 0, gid: 0, home: "/root", shell: "/bin/hsh" }
    };
  }

  let shadow = defaultShadow();

  function loadShadow() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) shadow = Object.assign(defaultShadow(), JSON.parse(raw));
    } catch {
      shadow = defaultShadow();
    }
  }

  function saveShadow() {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(shadow));
    } catch { /* ignore */ }
  }

  function ensureHome(user, home) {
    const st = VFS.stat(home);
    if (st.error) VFS.mkdir(home, { recursive: true });
    const rc = VFS.stat(home + "/.helixrc");
    if (rc.error) {
      VFS.write(home + "/.helixrc", "# ~/.helixrc\nexport EDITOR=edit\nalias ll='ls -la'\n");
    }
  }

  function login(user, password) {
    const acct = shadow[user];
    if (!acct) return { error: "Login incorrect" };
    if (acct.hash !== password) return { error: "Login incorrect" };
    session.loggedIn = true;
    session.uid = acct.uid;
    env.USER = user;
    env.LOGNAME = user;
    env.HOME = acct.home;
    env.PWD = acct.home;
    env.SHELL = acct.shell;
    env.PATH = user === "root" ? "/bin:/usr/bin:/root/bin" : "/bin:/usr/bin:/home/" + user + "/bin";
    ensureHome(user, acct.home);
    loadConfig();
    spawn("hsh");
    log("session opened for " + user + " on tty1");
    return { user, home: acct.home };
  }

  function logout() {
    if (session.loggedIn) log("session closed for " + env.USER);
    session.loggedIn = false;
    session.uid = -1;
    env.USER = "nobody";
    env.LOGNAME = "nobody";
    env.HOME = "/";
    env.PWD = "/";
    env.PATH = "/bin:/usr/bin";
    delete env.DISPLAY;
    delete env.DESKTOP;
    delete env.WM;
  }

  function setPassword(user, password) {
    if (!shadow[user]) shadow[user] = { hash: password, uid: 1001, gid: 1001, home: "/home/" + user, shell: "/bin/hsh" };
    else shadow[user].hash = password;
    saveShadow();
  }

  function users() {
    return Object.keys(shadow);
  }

  loadShadow();

  const history = [];
  let histIndex = 0;
  const aliases = {
    ll: "ls -la",
    la: "ls -a",
    "..": "cd ..",
    cls: "clear"
  };

  const processes = [
    { pid: 1, name: "init", user: "root", cpu: 0.1, mem: 4 },
    { pid: 42, name: "hsh", user: "guest", cpu: 0.4, mem: 12 },
    { pid: 108, name: "kerneld", user: "root", cpu: 0.2, mem: 8 }
  ];
  let nextPid = 200;

  function uptime() {
    const s = Math.floor((Date.now() - startedAt) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h) return `${h}h ${m}m ${sec}s`;
    if (m) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  function prompt() {
    if (!session.loggedIn) return "login:";
    const home = env.HOME;
    let cwd = env.PWD;
    if (cwd === home) cwd = "~";
    else if (cwd.startsWith(home + "/")) cwd = "~" + cwd.slice(home.length);
    const mark = session.uid === 0 ? "#" : "$";
    return `${env.USER}@${env.HOSTNAME}:${cwd}${mark}`;
  }

  function expand(text) {
    return text.replace(/\$([A-Z_][A-Z0-9_]*)/g, (_, k) => env[k] ?? "");
  }

  function tokenize(line) {
    const tokens = [];
    let cur = "";
    let quote = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quote) {
        if (c === quote) quote = null;
        else cur += c;
        continue;
      }
      if (c === "'" || c === '"') {
        quote = c;
        continue;
      }
      if (c === "\\") {
        cur += line[++i] || "";
        continue;
      }
      if (/\s/.test(c)) {
        if (cur) tokens.push(cur);
        cur = "";
        continue;
      }
      cur += c;
    }
    if (cur) tokens.push(cur);
    return tokens;
  }

  function resolvePath(p) {
    if (!p) return env.PWD;
    return VFS.normalize(p.startsWith("/") ? p : VFS.join(env.PWD, p));
  }

  function loadConfig() {
    const conf = VFS.read("/etc/helix.conf");
    if (!conf.error) {
      conf.content.split("\n").forEach((line) => {
        const m = line.match(/^([a-z]+)=(.*)$/i);
        if (!m) return;
        if (m[1] === "theme") env.THEME = m[2].trim();
        if (m[1] === "hostname") env.HOSTNAME = m[2].trim();
        if (m[1] === "wallpaper") env.WALLPAPER = m[2].trim();
        if (m[1] === "accent") env.ACCENT = m[2].trim();
      });
    }
    const rc = VFS.read(env.HOME + "/.helixrc");
    if (!rc.error) {
      rc.content.split("\n").forEach((line) => {
        const t = line.trim();
        if (!t || t.startsWith("#")) return;
        const am = t.match(/^alias\s+(\w+)=['"]?(.+?)['"]?$/);
        if (am) aliases[am[1]] = am[2];
        const em = t.match(/^export\s+([A-Z_]+)=(.*)$/);
        if (em) env[em[1]] = em[2].replace(/^['"]|['"]$/g, "");
      });
    }
  }

  function saveConfig() {
    VFS.write("/etc/helix.conf", `theme=${env.THEME}\nhostname=${env.HOSTNAME}\nwallpaper=${env.WALLPAPER || "ember"}\naccent=${env.ACCENT || ""}\n`);
  }

  function spawn(name) {
    const proc = { pid: nextPid++, name, user: env.USER, cpu: Math.random() * 3, mem: 4 + Math.random() * 20 };
    processes.push(proc);
    return proc;
  }

  function kill(pid) {
    const i = processes.findIndex((p) => p.pid === pid);
    if (i < 0) return false;
    if (processes[i].pid === 1) return false;
    processes.splice(i, 1);
    return true;
  }

  function log(msg) {
    const stamp = new Date().toISOString();
    const cur = VFS.read("/var/log/syslog");
    VFS.write("/var/log/syslog", (cur.error ? "" : cur.content) + `${stamp} ${msg}\n`);
  }

  function pushHistory(line) {
    if (!line.trim()) return;
    if (history[history.length - 1] !== line) history.push(line);
    histIndex = history.length;
    try {
      localStorage.setItem("helixos.history", JSON.stringify(history.slice(-200)));
    } catch { /* ignore */ }
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem("helixos.history");
      if (raw) {
        const arr = JSON.parse(raw);
        history.splice(0, history.length, ...arr);
        histIndex = history.length;
      }
    } catch { /* ignore */ }
  }

  function histPrev() {
    if (!history.length) return "";
    histIndex = Math.max(0, histIndex - 1);
    return history[histIndex] || "";
  }

  function histNext() {
    histIndex = Math.min(history.length, histIndex + 1);
    return history[histIndex] || "";
  }

  loadHistory();

  return {
    env, aliases, processes, history, session,
    uptime, prompt, expand, tokenize, resolvePath,
    loadConfig, saveConfig, spawn, kill, log,
    pushHistory, histPrev, histNext,
    login, logout, setPassword, users,
    startedAt
  };
})();
