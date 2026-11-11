(function () {
  function splitSemi(line) {
    const out = []; let cur = ""; let q = null;
    for (let i=0;i<line.length;i++) {
      const c = line[i];
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === '"' || c === "'") { q = c; cur += c; continue; }
      if (c === ';') { if (cur.trim()) out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function parseRedirect(seg) {
    let append = false, target = null, cmd = seg;
    const m2 = seg.match(/^(.*)>>\s*(\S+)\s*$/);
    const m1 = seg.match(/^(.*)>\s*(\S+)\s*$/);
    if (m2) { cmd = m2[1].trim(); target = m2[2]; append = true; }
    else if (m1) { cmd = m1[1].trim(); target = m1[2]; append = false; }
    return { cmd, target, append };
  }
  async function exec(line) {
    const parts = splitSemi(line);
    let last = "";
    for (const seg of parts) {
      const { cmd, target, append } = parseRedirect(seg);
      if (!cmd) continue;
      const out = await Helix.commands.run(cmd);
      if (target) {
        const prev = append && Helix.vfs.exists(target, Helix.kernel.state.cwd) ? Helix.vfs.read(target, Helix.kernel.state.cwd) : "";
        const data = (append && prev && !prev.endsWith("\n") && out ? prev + "\n" : prev) + (out || "");
        Helix.vfs.write(target, data, Helix.kernel.state.cwd);
        last = "";
      } else {
        last = out || "";
      }
    }
    return last;
  }
  window.Helix = window.Helix || {};
  Helix.shell = { exec, splitSemi, parseRedirect };
})();