// docs/js/load-common.js

// いまのURLから「サイトルートへの相対プレフィックス」を計算
function getRelRoot() {
  // 末尾スラッシュを除去して分割
  const parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  // 最後がファイル名なら1つ上げる
  const last = parts[parts.length - 1] || '';
  const isFile = /\.[a-z0-9]+$/i.test(last);
  const depth = isFile ? (parts.length - 1) : parts.length; // ルート配下=0
  return '../'.repeat(Math.max(depth - 1, 0));
}

function loadDirLabelMap(callback) {
  const script = document.createElement('script');
  // breadcrumb-labels.js は docs/js/ 配下にある想定
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
      // 現在のURLを安全にパース
      const url = new URL(window.location.href);
      let path = url.pathname;

      // ドメイン部分に manual.noctics.net が含まれても無視（pathnameのみ使用）
      // また、ルート以外の末尾スラッシュを除去
      path = path.replace(/\/$/, '');

      // /から分割して空要素を除外
      let parts = path.split('/').filter(Boolean);

      // 最後がファイル名なら除去
      if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) {
        parts = parts.slice(0, -1);
      }

      // 念のため「manual.noctics.net」が紛れ込んでいたら除外
      parts = parts.filter(p => p !== 'manual.noctics.net');

      const dirLabelMap = window.dirLabelMap || {};
      const items = [];

      // ホーム
      items.push({ label: "ホーム", href: relRoot });

      // 階層リンク
      for (let i = 0; i < parts.length; i++) {
        const label = dirLabelMap[parts[i]] || parts[i];
        items.push({ label, href: relRoot + parts.slice(0, i + 1).join('/') });
      }

      // 最後の項目は「現在地」
      if (items.length > 1) {
        items[items.length - 1] = { label: items[items.length - 1].label };
      }

      breadcrumb.innerHTML = items
        .filter(item => item.label)
        .map((item, i, arr) => {
          if (i < arr.length - 1 && item.href)
            return `<a href="${item.href}">${item.label}</a> &gt; `;
          return `<span>${item.label}</span>`;
        })
        .join('');
    }
  });
});
