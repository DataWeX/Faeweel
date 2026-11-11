(function () {
  const SESS = "helixos.session.v1";
  const state = {
    booted: false,
    loggedIn: false,
    user: null,
    host: "helix",
    cwd: "/",
    history: [],
    theme: "phosphor",
  };
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
    state.user = user;
    state.loggedIn = true;
    state.cwd = user === "root" ? "/root" : "/home/" + user;
    try { Helix.vfs.mkdir(state.cwd, "/"); } catch (e) {}
    saveSession();
  }
  function logout() {
    state.loggedIn = false;
    state.user = null;
    state.cwd = "/";
  }
  function prompt() {
    if (!state.loggedIn) return "login: ";
    const p = state.cwd.replace("/home/" + state.user, "~");
    return state.user + "@" + state.host + ":" + p + "$ ";
  }
  window.Helix = window.Helix || {};
  loadSession();
  Helix.kernel = { state, checkAuth, login, logout, prompt, loadSession };
})();