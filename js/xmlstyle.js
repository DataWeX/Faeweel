(function () {
  function textOf(node, name) {
    if (!node || !node.getElementsByTagName) return null;
    const items = node.getElementsByTagName("item");
    for (let i = 0; i < items.length; i++) {
      if (items[i].getAttribute("name") === name) return (items[i].textContent || "").trim();
    }
    return null;
  }
  function getStyle(doc, styleName) {
    const styles = doc.getElementsByTagName("style");
    for (let i = 0; i < styles.length; i++) {
      if (styles[i].getAttribute("name") === styleName) return styles[i];
    }
    return null;
  }
  function apply(doc) {
    const root = document.documentElement;
    const theme = getStyle(doc, "Theme.Helix");
    if (theme) {
      const map = { bg: "--bg", fg: "--fg", accent: "--accent", dim: "--dim", error: "--error", font: "--font" };
      Object.keys(map).forEach(k => { const v = textOf(theme, k); if (v) root.style.setProperty(map[k], v); });
    }
    const v = (n, k) => textOf(n, k);
    const desktop = getStyle(doc, "Desktop");
    const bar = getStyle(doc, "Desktop.Bar");
    const win = getStyle(doc, "Window");
    const title = getStyle(doc, "Window.TitleBar");
    const body = getStyle(doc, "Window.Body");
    const icon = getStyle(doc, "Desktop.Icon");
    const btn = getStyle(doc, "App.Button");
    const input = getStyle(doc, "App.Input");
    const term = getStyle(doc, "App.Terminal");
    const css = `
/* xmlstyle: applied from xml/styles.xml */
#de { background: ${v(desktop,"background") || ""}; }
#de-bar { height: ${v(bar,"height") || ""}; background: ${v(bar,"background") || ""}; border-bottom: ${v(bar,"borderBottom") || ""}; color: ${v(bar,"color") || ""}; }
.win { background: ${v(win,"background") || ""}; border: ${v(win,"border") || ""}; border-radius: ${v(win,"radius") || "0"}; box-shadow: ${v(win,"shadow") || ""}; }
.win.focused { border: ${v(win,"borderFocused") || ""}; }
.win-title { height: ${v(title,"height") || "30px"}; background: ${v(title,"background") || ""}; color: ${v(title,"color") || ""}; border-bottom: ${v(title,"borderBottom") || ""}; }
.win.focused .win-title { background: ${v(title,"backgroundFocused") || ""}; }
.win-body { background: ${v(body,"background") || ""}; padding: ${v(body,"padding") || "8px"}; color: ${v(body,"color") || ""}; }
.de-icon { background: ${v(icon,"background") || ""}; border: ${v(icon,"border") || ""}; color: ${v(icon,"color") || ""}; border-radius: ${v(icon,"radius") || "0"}; }
.win-btn { background: ${v(btn,"background") || ""}; border: ${v(btn,"border") || ""}; color: ${v(btn,"color") || ""}; }
.win-term-row input { background: ${v(input,"background") || ""}; border: ${v(input,"border") || ""}; color: ${v(input,"color") || ""}; }
.win-term-out { background: ${v(term,"background") || ""}; color: ${v(term,"color") || ""}; }
`.trim();
    let tag = document.getElementById("xml-style");
    if (!tag) { tag = document.createElement("style"); tag.id = "xml-style"; document.head.appendChild(tag); }
    tag.textContent = css;
  }
  async function load(url) {
    url = url || "xml/styles.xml";
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const txt = await res.text();
      const doc = new DOMParser().parseFromString(txt, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) throw new Error("xml parse error");
      apply(doc);
      return true;
    } catch (e) {
      console.warn("xmlstyle: failed to load", url, e);
      return false;
    }
  }
  window.Helix = window.Helix || {};
  Helix.xmlstyle = { load, apply };
})();