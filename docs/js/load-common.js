// docs/js/load-common.js

// ─────────────────────────────────────────────
// ルート絶対URLを作るヘルパ（常に https://manual.noctics.net/ を起点）
// ─────────────────────────────────────────────
function root(path = "") {
  const origin = window.location.origin.replace(/\/$/, ""); // e.g. https://manual.noctics.net
  const p = String(path).replace(/^\/+/, "");               // avoid double slashes
  return `${origin}/${p}`;
}

// ─────────────────────────────────────────────
// ラベルマップを読み込み（常にサイト直下 /js/... を参照）
// ─────────────────────────────────────────────
function loadDirLabelMap(callback) {
  const script = document.createElement("script");
  script.src = root("js/breadcrumb-labels.js");
  script.onload = callback;
  script.onerror = () => callback(); // 失敗しても後続は動かす
  document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", function () {
  loadDirLabelMap(function () {
    // ─────────────────────────────────────────
    // header / footer をサイト直下から取得
    // ─────────────────────────────────────────
    const header = document.getElementById("main-header");
    if (header) {
      fetch(root("header.html"))
        .then((res) => res.ok ? res.text() : Promise.reject(res))
        .then((html) => { header.innerHTML = html; })
        .catch(() => { /* 404時は無視 */ });
    }
    
    const sideMenu = document.getElementById("main-side-menu");
    if (sideMenu) {
      fetch(root("side-menu.html"))
        .then((res) => res.ok ? res.text() : Promise.reject(res))
        .then((html) => { sideMenu.innerHTML = html; })
        .catch(() => { /* 404時は無視 */ });
    }

    const footer = document.getElementById("main-footer");
    if (footer) {
      fetch(root("footer.html"))
        .then((res) => res.ok ? res.text() : Promise.reject(res))
        .then((html) => { footer.innerHTML = html; })
        .catch(() => { /* 404時は無視 */ });
    }

    // ─────────────────────────────────────────
    // パンくず（manual.noctics.net は表示しない）
    // ─────────────────────────────────────────
    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb) {
      // URLのパスだけを使う（ドメイン= manual.noctics.net は一切使わない）
      let path = window.location.pathname.replace(/\/$/, ""); // 末尾スラッシュ除去（ルートは "/" のままではない）
      let parts = path.split("/").filter(Boolean);            // ["master","girltype"] など

      // 最後がファイル名なら除去（index.html 等）
      if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) {
        parts = parts.slice(0, -1);
      }

      // 念のためドメイン名が紛れ込んだ要素は除外（通常は入らない）
      parts = parts.filter((seg) => seg !== "manual.noctics.net");

      const dirLabelMap = window.dirLabelMap || {};
      const items = [];

      // ホーム（サイトルート）
      items.push({ label: "ホーム", href: root("") });

      // 階層リンク（常に絶対URLで安全に）
      // e.g. ["master","girltype"] -> /master/ , /master/girltype/
      for (let i = 0; i < parts.length; i++) {
        const label = dirLabelMap[parts[i]] || parts[i];
        const subpath = parts.slice(0, i + 1).join("/") + "/"; // ディレクトリURLへ
        items.push({ label, href: root(subpath) });
      }

      // 最後の項目は現在地としてリンクを外す
      if (items.length > 1) {
        items[items.length - 1] = { label: items[items.length - 1].label };
      }

      breadcrumb.innerHTML = items
        .filter((item) => item.label)
        .map((item, i, arr) => {
          if (i < arr.length - 1 && item.href)
            return `<a href="${item.href}">${item.label}</a> &gt; `;
          return `<span>${item.label}</span>`;
        })
        .join("");
    }
  });
});
