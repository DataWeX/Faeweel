(function () {
  function applyTheme(name) {
    const map = { phosphor: ["#05080a","#7CFF7A","#9dff8a","#3fae43"], amber:["#0a0702","#ffbf5a","#ffd68a","#b8842a"], ice:["#04080c","#7fdcff","#b6ecff","#3a8fb0"], rose:["#0c0508","#ff7fa8","#ffb3cb","#b34d72"] };
    const t = map[name] || map.phosphor;
    const r = document.documentElement.style;
    r.setProperty("--bg", t[0]); r.setProperty("--fg", t[1]); r.setProperty("--accent", t[2]); r.setProperty("--dim", t[3] || t[1]);
  }
  window.addEventListener("DOMContentLoaded", async () => {
    if (window.Helix && Helix.xmlstyle && Helix.xmlstyle.load) {
      await Helix.xmlstyle.load("xml/styles.xml");
    }
    if (Helix.kernel && Helix.kernel.state) applyTheme(Helix.kernel.state.theme);
    if (window.Helix && Helix.xmlstyle && Helix.xmlstyle.refresh) Helix.xmlstyle.refresh();
    Helix.terminal.boot();
  });
})();
