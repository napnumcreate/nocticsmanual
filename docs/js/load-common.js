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
      // 例: /username/repo/master/01_login.html または /master/01_login.html
      let parts = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);

      // 最後がファイル名なら除去して「ディレクトリ配列」に
      if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) {
        parts = parts.slice(0, -1);
      }

      // GitHub Pagesの“ユーザー名/リポジトリ名”を含む場合に備え、
      // サイトのルート（relRoot で決まる深さ）に合わせて末尾側から使う
      // ここでは単純化して「現在のディレクトリ階層のみ」を対象にする
      const dirLabelMap = window.dirLabelMap || [];
      const items = [];

      // ホーム
      items.push({ label: "ホーム", href: relRoot + "index.html" });

      // 階層リンク（相対リンクで安全に）
      // 例: master/ -> relRoot + "master/index.html"
      for (let i = 0; i < parts.length; i++) {
        const label = dirLabelMap[parts[i]] || parts[i];
        items.push({ label, href: relRoot + parts.slice(0, i + 1).join('/') + "/index.html" });
      }

      // 最後の項目は「現在地」扱いでリンクを外す
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
