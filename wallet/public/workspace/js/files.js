const FilesIO = (() => {
  const MAX_BYTES = 4 * 1024 * 1024;
  const TEXT_EXT = new Set([
    "txt", "md", "json", "js", "css", "html", "htm", "xml", "csv", "log",
    "sh", "py", "c", "h", "cpp", "rs", "go", "ts", "yml", "yaml", "ini",
    "conf", "cfg", "toml", "svg", "map", "rc"
  ]);

  function extOf(name) {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
  }

  function isTextFile(file) {
    if (file.type && file.type.startsWith("text/")) return true;
    if (file.type === "application/json" || file.type === "application/javascript") return true;
    return TEXT_EXT.has(extOf(file.name || ""));
  }

  function safeName(name) {
    return String(name || "untitled").replace(/[/\\]/g, "_") || "untitled";
  }

  function readAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("read failed"));
      reader.readAsText(file);
    });
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function ingestFile(file, destDir) {
    if (file.size > MAX_BYTES) {
      return { error: `too large (${fmtSize(file.size)}). max ${fmtSize(MAX_BYTES)}`, name: file.name };
    }
    const name = safeName(file.name);
    const dest = VFS.join(destDir, name);
    if (isTextFile(file)) {
      const text = await readAsText(file);
      const w = VFS.write(dest, text, { binary: false, mime: file.type || "text/plain" });
      if (w.error) return { error: w.error, name };
      return { path: dest, size: file.size, binary: false, name };
    }
    const dataUrl = await readAsDataUrl(file);
    const comma = dataUrl.indexOf(",");
    const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    const w = VFS.write(dest, b64, {
      binary: true,
      mime: file.type || "application/octet-stream",
      encoding: "base64"
    });
    if (w.error) return { error: w.error, name };
    return { path: dest, size: file.size, binary: true, name };
  }

  async function ingestList(fileList, destDir) {
    const results = [];
    for (const file of Array.from(fileList || [])) {
      try {
        results.push(await ingestFile(file, destDir));
      } catch (e) {
        results.push({ error: String(e.message || e), name: file.name });
      }
    }
    return results;
  }

  function pickFiles({ multiple = true, accept = "" } = {}) {
    return new Promise((resolve) => {
      const input = document.getElementById("filePicker");
      if (!input) {
        resolve([]);
        return;
      }
      input.multiple = multiple;
      input.accept = accept || "";
      input.value = "";
      const done = () => {
        input.removeEventListener("change", done);
        input.accept = "";
        resolve(Array.from(input.files || []));
      };
      input.addEventListener("change", done, { once: true });
      input.click();
    });
  }

  function mediaKind(entry) {
    const mime = (entry && entry.mime) || "";
    const name = (entry && (entry.name || entry.path)) || "";
    const ext = extOf(name);
    if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
    if (mime.startsWith("video/") || ["mp4", "webm", "ogv", "mov", "mkv"].includes(ext)) return "video";
    if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "flac", "opus"].includes(ext)) return "audio";
    return null;
  }

  function dataUrl(path) {
    const r = VFS.read(path);
    if (r.error) return null;
    const mime = r.mime || "application/octet-stream";
    if (r.binary) return `data:${mime};base64,${r.content || ""}`;
    if (mime.startsWith("image/") || mime.startsWith("text/")) {
      return `data:${mime};charset=utf-8,${encodeURIComponent(r.content || "")}`;
    }
    return null;
  }

  function objectUrl(path) {
    const r = VFS.read(path);
    if (r.error) return null;
    let blob;
    if (r.binary) {
      const bin = atob(r.content || "");
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      blob = new Blob([bytes], { type: r.mime || "application/octet-stream" });
    } else {
      blob = new Blob([r.content || ""], { type: r.mime || "text/plain" });
    }
    return URL.createObjectURL(blob);
  }

  function stamp(prefix, ext) {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${prefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
  }

  async function writeBlob(dest, blob, mime) {
    if (blob.size > MAX_BYTES) return { error: `too large (${fmtSize(blob.size)}). max ${fmtSize(MAX_BYTES)}` };
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return VFS.write(dest, btoa(bin), {
      binary: true,
      mime: mime || blob.type || "application/octet-stream",
      encoding: "base64"
    });
  }

  function downloadPath(path) {
    const st = VFS.stat(path);
    if (st.error) return st;
    if (st.type === "dir") return { error: "is a directory" };
    const r = VFS.read(path);
    if (r.error) return r;
    const name = VFS.split(path).pop() || "download";
    let blob;
    if (r.binary) {
      const bin = atob(r.content || "");
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      blob = new Blob([bytes], { type: r.mime || "application/octet-stream" });
    } else {
      blob = new Blob([r.content || ""], { type: r.mime || "text/plain;charset=utf-8" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return { path, name, size: blob.size };
  }

  function fmtSize(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + "K";
    return (n / (1024 * 1024)).toFixed(1) + "M";
  }

  function iconFor(entry) {
    if (entry.type === "dir") return "DIR";
    if (entry.binary) {
      const mime = entry.mime || "";
      if (mime.startsWith("image/")) return "IMG";
      if (mime.startsWith("audio/")) return "AUD";
      if (mime.startsWith("video/")) return "VID";
      return "BIN";
    }
    if (typeof Wine !== "undefined" && Wine.isWinName(entry.name)) return "WIN";
    if (entry.exec) return "EXE";
    const ext = extOf(entry.name);
    if (["md", "txt", "log"].includes(ext)) return "TXT";
    if (["js", "ts", "py", "sh", "c", "h", "rs", "go"].includes(ext)) return "SRC";
    if (["json", "yml", "yaml", "toml", "ini", "conf"].includes(ext)) return "CFG";
    if (["html", "css", "svg"].includes(ext)) return "WEB";
    return "FILE";
  }

  return {
    ingestFile, ingestList, pickFiles, downloadPath, fmtSize, iconFor,
    MAX_BYTES, safeName, mediaKind, dataUrl, objectUrl, stamp, writeBlob, extOf
  };
})();
