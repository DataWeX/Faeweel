(function () {
  function applyTheme(name) {
    const map = { phosphor: ["#05080a","#7CFF7A","#9dff8a"], amber:["#0a0702","#ffbf5a","#ffd68a"], ice:["#04080c","#7fdcff","#b6ecff"], rose:["#0c0508","#ff7fa8","#ffb3cb"] };
    const t = map[name] || map.phosphor;
    const r = document.documentElement.style;
    r.setProperty("--bg", t[0]); r.setProperty("--fg", t[1]); r.setProperty("--accent", t[2]);
  }
  window.addEventListener("DOMContentLoaded", async () => {
    if (window.Helix && Helix.xmlstyle && Helix.xmlstyle.load) {
      await Helix.xmlstyle.load("xml/styles.xml");
    }
    if (Helix.kernel && Helix.kernel.state) applyTheme(Helix.kernel.state.theme);
    Helix.terminal.boot();
  });
})();