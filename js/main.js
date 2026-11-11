(function () {
  window.addEventListener("DOMContentLoaded", async () => {
    if (window.Helix && Helix.xmlstyle && Helix.xmlstyle.load) {
      await Helix.xmlstyle.load("xml/styles.xml");
    }
    Helix.terminal.boot();
  });
})();