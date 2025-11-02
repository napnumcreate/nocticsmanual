// docs/js/load-common.js
document.addEventListener("DOMContentLoaded", function() {
  // header
  const header = document.getElementById("main-header");
  if (header) {
    fetch("./header.html")
      .then(res => res.text())
      .then(html => { header.innerHTML = html; });
  }
  // footer
  const footer = document.getElementById("main-footer");
  if (footer) {
    fetch("./footer.html")
      .then(res => res.text())
      .then(html => { footer.innerHTML = html; });
  }

  // パンくず自動生成
  const breadcrumb = document.getElementById("breadcrumb");
  if (breadcrumb) {
    let pathParts = window.location.pathname.split('/').filter(Boolean);
    // "docs"を除外
    if (pathParts[0] === "docs") pathParts = pathParts.slice(1);

    // ルートからの相対パスを計算
    let relPath = "";
    for (let i = 0; i < pathParts.length - 1; i++) {
      relPath += "../";
    }
    // ディレクトリ名→日本語ラベルのマップ
    const dirLabelMap = {
      "master": "設定する",
      "cast": "キャストの追加/登録/削除",
      "customer": "顧客の追加/登録/削除",
      "type": "女の子タイプ管理",
      "option": "オプション管理",
      // 必要に応じて追加
    };

    // パンくずリスト生成
    const items = [];
    // ホーム
    items.push({ label: "ホーム", href: relPath + "00_toppage.html" });

    // 階層ごとにリンクを生成
    let accumulatedPath = "";
    for (let i = 0; i < pathParts.length - 1; i++) { // 最後はファイル名
      accumulatedPath += "/" + pathParts[i];
      const dir = pathParts[i];
      const label = dirLabelMap[dir] || dir;
      if (label) {
        items.push({
          label: label,
          href: accumulatedPath + "/index.html"
        });
      }
    }
    // 最後はファイル名（index.htmlなど）→ラベルはディレクトリ名のラベル
    const lastDir = pathParts[pathParts.length - 2];
    const lastLabel = dirLabelMap[lastDir] || lastDir;
    if (items.length > 1) {
      // 最後の項目はリンクなし
      items[items.length - 1] = { label: lastLabel };
    }

    // パンくずHTML出力
    breadcrumb.innerHTML = items
      .filter(item => item.label)
      .map((item, i, arr) => {
        if (i < arr.length - 1 && item.href) {
          return `<a href="${item.href}">${item.label}</a> &gt; `;
        } else {
          return `<span>${item.label}</span>`;
        }
      }).join('');
  }
});