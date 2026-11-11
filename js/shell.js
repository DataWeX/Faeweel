(function () {
  async function exec(line) { await Helix.commands.run(line); }
  window.Helix = window.Helix || {};
  Helix.shell = { exec };
})();