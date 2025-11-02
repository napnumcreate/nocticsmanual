// docs/js/load-common.js

function getRelRoot() {
  const parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  const last = parts[parts.length - 1] || '';
  const isFile = /\.[a-z0-9]+$/i.test(last);
  const depth = isFile ? (parts.length - 1) : parts.length;
  return '../'.repeat(Math.max(depth - 1, 0));
}

function loadDirLabelMap(callback) {
  const script = document.createElement('script');
  script.src = getRelRoot() + 'js/breadcrumb-labels.js';
  script.onload = callback;
  document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", function() {
  loadDirLabelMap(function() {
    const relRoot = getRelRoot();

    // header
    const header = document.getElementById("main-header");
    if (header) {
      fetch(relRoot + "header.html")
        .then(res => res.text())
        .then(html => { header.innerHTML = html; });
    }

    // footer
    const footer = document.getElementById("main-footer");
    if (footer) {
      fetch(relRoot + "footer.html")
        .then(res => res.text())
        .then(html => { footer.innerHTML = html; });
    }

    // パンくず自動生成
    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb) {
      let parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);

      // 最後がファイル名なら除去
      if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) {
        parts = parts.slice(0, -1);
      }

      // manual.noctics.netの階層名を除外
      const host = window.location.host;
      let skipCount = 0;
      if (host.includes("manual.noctics.net")) {
        // 例: /manual/...
        if (parts[0] === "manual") skipCount = 1;
      }

      const dirLabelMap = window.dirLabelMap || [];
      const items = [];

      // ホーム
      items.push({ label: "ホーム", href: relRoot });

      // 階層リンク（不要な階層はスキップ）
      for (let i = skipCount; i < parts.length; i++) {
        const label = dirLabelMap[parts[i]] || parts[i];
        items.push({ label, href: relRoot + parts.slice(skipCount, i + 1).join('/') });
      }

      // 最後の項目はリンクを外す
      if (items.length > 1) {
        items[items.length - 1] = { label: items[items.length - 1].label };
      }

      breadcrumb.innerHTML = items
        .filter(item => item.label)
        .map((item, i, arr) => {
          if (i < arr.length - 1 && item.href) return `<a href="${item.href}">${item.label}</a> &gt; `;
          return `<span>${item.label}</span>`;
        })
        .join('');
    }
  });
});
