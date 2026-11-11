(function () {
  function textOf(node, name) {
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
    const win = getStyle(doc, "Window") || {};
    const title = getStyle(doc, "Window.TitleBar") || {};
    const body = getStyle(doc, "Window.Body") || {};
    const icon = getStyle(doc, "Desktop.Icon") || {};
    const btn = getStyle(doc, "App.Button") || {};
    const v = (n, k) => (n && n.getElementsByTagName ? textOf(n, k) : null);
    const css = `
/* xmlstyle: applied from xml/styles.xml */
.win { background: ${v(win,"background") || ""}; border: ${v(win,"border") || ""}; border-radius: ${v(win,"radius") || "0"}; box-shadow: ${v(win,"shadow") || ""}; }
.win.focused { border: ${v(win,"borderFocused") || ""}; }
.win-title { height: ${v(title,"height") || "30px"}; background: ${v(title,"background") || ""}; color: ${v(title,"color") || ""}; border-bottom: ${v(title,"borderBottom") || ""}; }
.win.focused .win-title { background: ${v(title,"backgroundFocused") || ""}; }
.win-body { background: ${v(body,"background") || ""}; padding: ${v(body,"padding") || "8px"}; color: ${v(body,"color") || ""}; }
.de-icon { background: ${v(icon,"background") || ""}; border: ${v(icon,"border") || ""}; color: ${v(icon,"color") || ""}; border-radius: ${v(icon,"radius") || "0"}; }
.win-btn { background: ${v(btn,"background") || ""}; border: ${v(btn,"border") || ""}; color: ${v(btn,"color") || ""}; }
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