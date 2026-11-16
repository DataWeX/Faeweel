(function () {
  let currentDoc = null;
  function textOf(node, name) {
    if (!node || !node.getElementsByTagName) return null;
    const items = node.getElementsByTagName("item");
    for (let i = 0; i < items.length; i++) {
      if (items[i].getAttribute("name") === name) return (items[i].textContent || "").trim();
    }
    return null;
  }
  function getStyle(doc, styleName) {
    if (!doc) return null;
    const styles = doc.getElementsByTagName("style");
    for (let i = 0; i < styles.length; i++) {
      if (styles[i].getAttribute("name") === styleName) return styles[i];
    }
    return null;
  }
  function v(n, k) { return textOf(n, k); }
  function setProps(el, props) {
    if (!el || !props) return;
    Object.keys(props).forEach(k => { if (props[k] != null && props[k] !== "") el.style[k] = props[k]; });
  }
  function resolveVars(str) { return str || ""; } // keep var(...) for root vars

  function applyBase(doc) {
    const root = document.documentElement;
    const theme = getStyle(doc, "Theme.Helix");
    if (theme) {
      const map = { bg: "--bg", fg: "--fg", accent: "--accent", dim: "--dim", error: "--error", font: "--font" };
      Object.keys(map).forEach(k => { const val = textOf(theme, k); if (val) root.style.setProperty(map[k], val); });
    }
    const base = getStyle(doc, "Base");
    const crt = getStyle(doc, "CRT");
    const term = getStyle(doc, "TerminalLayer");
    setProps(document.body, {
      margin: "0", height: "100%", background: v(base,"bodyBackground") || "#000",
      color: v(base,"color") || "var(--fg)", fontFamily: v(base,"fontFamily") || "var(--font)"
    });
    setProps(document.documentElement, { height: "100%" });
    const screen = document.getElementById("screen");
    if (screen) setProps(screen, { position: "relative", height: "100%", overflow: "hidden", background: v(base,"screenBackground") || "", boxSizing: "border-box" });
    const crtEl = document.getElementById("crt");
    if (crtEl) setProps(crtEl, { position: "absolute", inset: "0", pointerEvents: "none", zIndex: "10", background: v(crt,"background") || "", boxShadow: v(crt,"boxShadow") || "", opacity: v(crt,"opacity") || "0.35" });
    ["boot","terminal"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      setProps(el, { position: "absolute", inset: "0", padding: "16px", overflow: "auto", boxSizing: "border-box" });
    });
    const boot = document.getElementById("boot");
    if (boot) setProps(boot, { whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: v(term,"lineHeight") || "1.35", fontSize: v(term,"fontSize") || "14px" });
    const termEl = document.getElementById("terminal");
    if (termEl) setProps(termEl, { display: termEl.dataset.visible === "1" ? "flex" : "none", flexDirection: "column" });
    const out = document.getElementById("output");
    if (out) setProps(out, { flex: "1", margin: "0", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: v(term,"lineHeight") || "1.35", fontSize: v(term,"fontSize") || "14px" });
    const pl = document.getElementById("prompt-line");
    if (pl) setProps(pl, { display: "flex", gap: "8px", alignItems: "center" });
    const prompt = document.getElementById("prompt");
    if (prompt) setProps(prompt, { color: "var(--accent)", whiteSpace: "pre" });
    const input = document.getElementById("input");
    if (input) setProps(input, { flex: "1", background: "transparent", color: "var(--fg)", border: "none", outline: "none", font: "inherit", padding: "0", margin: "0" });
  }

  function applyDesktop(doc) {
    const desktop = getStyle(doc, "Desktop");
    const bar = getStyle(doc, "Desktop.Bar");
    const icons = getStyle(doc, "Desktop.Icons");
    const icon = getStyle(doc, "Desktop.Icon");
    const de = document.getElementById("de");
    if (de) setProps(de, { position: "absolute", inset: "0", zIndex: "5", display: de.dataset.visible === "1" ? "flex" : "none", flexDirection: "column", background: v(desktop,"background") || "", color: "var(--fg)" });
    const barEl = document.getElementById("de-bar");
    if (barEl) setProps(barEl, { height: v(bar,"height") || "28px", display: "flex", alignItems: "center", gap: "12px", padding: "0 10px", background: v(bar,"background") || "", borderBottom: v(bar,"borderBottom") || "", fontSize: v(bar,"fontSize") || "13px", color: v(bar,"color") || "var(--fg)", boxSizing: "border-box" });
    const brand = document.querySelector(".de-brand");
    if (brand) setProps(brand, { fontWeight: "700", color: "var(--accent)", marginRight: "8px" });
    const clock = document.getElementById("de-clock");
    if (clock) setProps(clock, { marginLeft: "auto", color: "var(--dim)" });
    const desk = document.getElementById("de-desktop");
    if (desk) setProps(desk, { position: "relative", flex: "1", overflow: "hidden" });
    const ic = document.getElementById("de-icons");
    if (ic) setProps(ic, { position: "absolute", inset: "10px auto 10px 10px", width: v(icons,"width") || "220px", display: "grid", gridTemplateColumns: v(icons,"columns") || "repeat(2, 100px)", gap: v(icons,"gap") || "8px", alignContent: "start" });
    document.querySelectorAll(".de-icon").forEach(el => {
      setProps(el, { padding: v(icon,"padding") || "8px 6px", border: v(icon,"border") || "", background: v(icon,"background") || "", cursor: "pointer", textAlign: "center", fontSize: v(icon,"fontSize") || "12px", userSelect: "none", color: v(icon,"color") || "var(--fg)", borderRadius: v(icon,"radius") || "0", boxSizing: "border-box" });
      const g = el.querySelector(".glyph");
      if (g) setProps(g, { fontSize: "18px", display: "block", marginBottom: "4px", color: "var(--accent)" });
    });
    const wins = document.getElementById("de-windows");
    if (wins) setProps(wins, { position: "absolute", inset: "0" });
  }

  function applyWindows(doc) {
    const win = getStyle(doc, "Window");
    const title = getStyle(doc, "Window.TitleBar");
    const body = getStyle(doc, "Window.Body");
    const btn = getStyle(doc, "App.Button");
    const input = getStyle(doc, "App.Input");
    const term = getStyle(doc, "App.Terminal");
    document.querySelectorAll(".win").forEach(w => {
      const focused = w.dataset.focused === "1";
      setProps(w, { position: "absolute", minWidth: "260px", minHeight: "140px", background: v(win,"background") || "", border: focused ? (v(win,"borderFocused") || v(win,"border")) : (v(win,"border") || ""), borderRadius: v(win,"radius") || "0", boxShadow: v(win,"shadow") || "", display: w.dataset.hidden === "1" ? "none" : "flex", flexDirection: "column", boxSizing: "border-box" });
      const t = w.querySelector(".win-title");
      if (t) setProps(t, { height: v(title,"height") || "30px", display: "flex", alignItems: "center", padding: "0 8px", background: focused ? (v(title,"backgroundFocused") || v(title,"background")) : (v(title,"background") || ""), color: v(title,"color") || "var(--fg)", borderBottom: v(title,"borderBottom") || "", cursor: "move", userSelect: "none", fontWeight: "600", boxSizing: "border-box", touchAction: "none" });
      const tt = w.querySelector(".title-text");
      if (tt) setProps(tt, { flex: "1" });
      const b = w.querySelector(".win-body");
      if (b) setProps(b, { flex: "1", padding: v(body,"padding") || "8px", overflow: "auto", background: v(body,"background") || "", color: v(body,"color") || "var(--fg)", borderTop: "1px solid rgba(0,0,0,0.4)", boxSizing: "border-box" });
      w.querySelectorAll(".win-btn, button").forEach(el => setProps(el, { background: v(btn,"background") || "", border: v(btn,"border") || "", color: v(btn,"color") || "", cursor: "pointer", font: "inherit", boxSizing: "border-box" }));
      w.querySelectorAll("input, textarea").forEach(el => { if (el.type === "file") return; setProps(el, { background: v(input,"background") || "", border: v(input,"border") || "", color: v(input,"color") || "", font: "inherit", boxSizing: "border-box" }); });
      w.querySelectorAll(".win-term-out, pre").forEach(el => setProps(el, { margin: "0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "13px", lineHeight: "1.35", background: v(term,"background") || "transparent", color: v(term,"color") || "var(--fg)" }));
      w.querySelectorAll(".win-term-row").forEach(el => setProps(el, { display: "flex", gap: "6px", marginTop: "6px", alignItems: "center" }));
      w.querySelectorAll(".win-term-row input").forEach(el => setProps(el, { flex: "1", padding: "4px 6px", outline: "none" }));
      w.querySelectorAll(".win-list").forEach(el => setProps(el, { margin: "0", paddingLeft: "0", listStyle: "none", fontSize: "13px" }));
    });
  }

  function applySemantic() {
    document.querySelectorAll(".dim").forEach(el => { if (!el.style.color) el.style.color = "var(--dim)"; });
    document.querySelectorAll(".err").forEach(el => { el.style.color = "var(--error)"; });
  }

  function applyAll(doc) {
    if (!doc) return;
    applyBase(doc);
    applyDesktop(doc);
    applyWindows(doc);
    applySemantic();
  }

  async function load(url) {
    url = url || "xml/styles.xml";
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const txt = await res.text();
      const doc = new DOMParser().parseFromString(txt, "application/xml");
      if (doc.getElementsByTagName("parsererror").length) throw new Error("xml parse error");
      currentDoc = doc;
      applyAll(doc);
      return true;
    } catch (e) {
      console.warn("xmlstyle: failed to load", url, e);
      // still apply minimal base so UI is usable
      try { applyFallback(); } catch(_){}
      return false;
    }
  }

  function applyFallback() {
    const r = document.documentElement.style;
    [["--bg","#05080a"],["--fg","#7CFF7A"],["--dim","#3fae43"],["--accent","#9dff8a"],["--error","#ff6b6b"],["--font","ui-monospace, monospace"]].forEach(p=>r.setProperty(p[0],p[1]));
  }

  function refresh() { if (currentDoc) applyAll(currentDoc); }
  function getDoc() { return currentDoc; }

  // auto refresh on DOM changes (new windows/icons)
  const mo = new MutationObserver(() => { if (currentDoc) { clearTimeout(refresh._t); refresh._t = setTimeout(refresh, 20); } });
  if (document.documentElement) mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class","data-focused","data-hidden","data-visible","style"] });

  window.Helix = window.Helix || {};
  Helix.xmlstyle = { load, applyAll, refresh, getDoc };
})();
