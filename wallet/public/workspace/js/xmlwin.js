const XmlWin = (() => {
  const PATH = "xml/window.xml";
  let cached = "";

  const FALLBACK = `<?xml version="1.0" encoding="UTF-8"?>
<helixwm>
  <window class="win">
    <titlebar class="win-titlebar">
      <title class="win-title"/>
      <controls class="win-controls">
        <button class="win-btn" action="min" title="minimize">_</button>
        <button class="win-btn win-x" action="close" title="close">x</button>
      </controls>
    </titlebar>
    <bar class="app-bar"/>
    <body class="app-body"/>
    <resize class="win-resize" action="resize"/>
  </window>
</helixwm>`;

  function load() {
    if (cached) return Promise.resolve(cached);
    return fetch(PATH).then((r) => {
      if (!r.ok) throw new Error("xml missing");
      return r.text();
    }).then((t) => {
      cached = t;
      return t;
    }).catch(() => {
      cached = FALLBACK;
      return cached;
    });
  }

  function attr(el, name, fallback) {
    if (!el || !el.getAttribute) return fallback || "";
    return el.getAttribute(name) || fallback || "";
  }

  function text(el) {
    return el && el.textContent ? el.textContent.trim() : "";
  }

  function parse(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    if (doc.querySelector("parsererror")) return parse(FALLBACK);
    return doc.querySelector("window") || doc.documentElement;
  }

  function build(title, bodyHtml, xmlText) {
    const root = parse(xmlText || FALLBACK);
    const win = document.createElement("section");
    win.className = attr(root, "class", "win");

    const titlebarSrc = root.querySelector("titlebar");
    const titlebar = document.createElement("div");
    titlebar.className = attr(titlebarSrc, "class", "win-titlebar");

    const titleSrc = root.querySelector("title");
    const titleEl = document.createElement("span");
    titleEl.className = attr(titleSrc, "class", "win-title");
    titleEl.textContent = title;
    titlebar.appendChild(titleEl);

    const controlsSrc = root.querySelector("controls");
    const controls = document.createElement("div");
    controls.className = attr(controlsSrc, "class", "win-controls");
    const buttons = controlsSrc ? controlsSrc.querySelectorAll("button") : [];
    if (buttons.length) {
      buttons.forEach((btnSrc) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = attr(btnSrc, "class", "win-btn");
        const action = attr(btnSrc, "action", "");
        if (action === "min") btn.setAttribute("data-min", "");
        if (action === "close") btn.setAttribute("data-close", "");
        if (action === "resize") btn.setAttribute("data-resize", "");
        const t = attr(btnSrc, "title", "");
        if (t) btn.title = t;
        btn.textContent = text(btnSrc) || "";
        controls.appendChild(btn);
      });
    } else {
      controls.innerHTML = '<button type="button" class="win-btn" data-min title="minimize">_</button><button type="button" class="win-btn win-x" data-close title="close">x</button>';
    }
    titlebar.appendChild(controls);
    win.appendChild(titlebar);

    const barSrc = root.querySelector("bar");
    const bar = document.createElement("div");
    bar.className = attr(barSrc, "class", "app-bar");
    win.appendChild(bar);

    const bodySrc = root.querySelector("body");
    const body = document.createElement("div");
    body.className = attr(bodySrc, "class", "app-body");
    body.innerHTML = bodyHtml || "";
    win.appendChild(body);

    const resizeSrc = root.querySelector("resize");
    const grip = document.createElement("div");
    grip.className = attr(resizeSrc, "class", "win-resize");
    grip.setAttribute("data-resize", "");
    win.appendChild(grip);

    return win;
  }

  return { load, build, PATH };
})();
