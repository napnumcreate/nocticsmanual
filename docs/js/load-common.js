function root(path = "") {
  const origin = window.location.origin.replace(/\/$/, ""); 
  const p = String(path).replace(/^\/+/, "");               
  return `${origin}/${p}`;
}

function loadDirLabelMap(callback) {
  const script = document.createElement("script");
  script.src = root("js/breadcrumb-labels.js");
  script.onload = callback;
  script.onerror = () => callback(); // 失敗しても後続は動かす
  document.head.appendChild(script);
}

document.addEventListener("DOMContentLoaded", function () {

  document.title = "Noctics ユーザーズマニュアル";
  
  loadDirLabelMap(function () {
    // ─────────────────────────────────────────
    // header / side-menu / footer をサイト直下から取得
    // ─────────────────────────────────────────
    const header = document.getElementById("main-header");
    if (header) {
      fetch(root("header.html"))
        .then((res) => (res.ok ? res.text() : Promise.reject(res)))
        .then((html) => { header.innerHTML = html; })
        .catch(() => {});
    }

    const sideMenu = document.getElementById("main-side-menu");
    if (sideMenu) {
      fetch(root("side-menu.html"))
        .then((res) => (res.ok ? res.text() : Promise.reject(res)))
        .then((html) => { sideMenu.innerHTML = html; })
        .catch(() => {});
    }

    const footer = document.getElementById("main-footer");
    if (footer) {
      fetch(root("footer.html"))
        .then((res) => (res.ok ? res.text() : Promise.reject(res)))
        .then((html) => { footer.innerHTML = html; })
        .catch(() => {});
    }

    // ─────────────────────────────────────────
    // パンくず
    // ─────────────────────────────────────────
    const breadcrumb = document.getElementById("breadcrumb");
    if (breadcrumb) {
      // URLのパスを使う
      let path = window.location.pathname.replace(/\/$/, "");
      let parts = path.split("/").filter(Boolean);           

      if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) {
        parts = parts.slice(0, -1);
      }

      parts = parts.filter((seg) => seg !== "manual.noctics.net");

      const dirLabelMap = window.dirLabelMap || {};
      const items = [];

      // ホーム（サイトルート）
      items.push({ label: "ホーム", href: root("") });

      for (let i = 0; i < parts.length; i++) {
        const label = dirLabelMap[parts[i]] || parts[i];
        const subpath = parts.slice(0, i + 1).join("/") + "/";
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

    // ─────────────────────────────────────────
    // 自動STEP生成：同ディレクトリの 1.html, 2.html, ... を読み込み
    // 画像が無ければ .step-image を作らず、テキストが全幅に広がる
    // ─────────────────────────────────────────
    (async function generateSteps() {
      const container = document.getElementById("auto-steps");
      if (!container) return;

      // 現在ページと同じディレクトリ（/xxx/index.html → /xxx/）
      const basePath = window.location.pathname.replace(/\/[^/]*$/, "/");

      const MAX = 100;
      let count = 0;

      for (let i = 1; i <= MAX; i++) {
        const url = `${basePath}${i}.html`;
        let res;
        try {
          res = await fetch(url, { cache: "no-store" });
        } catch {
          break;
        }
        if (!res.ok) break;

        let html = await res.text();

        let title = `手順${i}`;
        const m = html.match(/<!--\s*title:\s*([\s\S]*?)\s*-->/i);
        if (m && m[1]) {
          title = m[1].trim();
          html = html.replace(m[0], "");
        }

        // セクションDOMを生成（テキストと画像を分離）
        const section = document.createElement("section");
        section.className = "step";

        const headerEl = document.createElement("div");
        headerEl.className = "step-header";
        headerEl.innerHTML = `
          <div class="step-number">手順${i}</div>
          <div class="step-title">${title}</div>
        `;

        const bodyEl = document.createElement("div");
        bodyEl.className = "step-body";

        // 取得した断片HTMLを一旦パース
        const wrapper = document.createElement("div");
        wrapper.innerHTML = html.trim();

        // 画像ノードを収集（オリジナルから）
        const imgs = Array.from(wrapper.querySelectorAll("img"));

        // テキスト用ラッパ（ここから <img> を除去）
        const textWrapper = wrapper.cloneNode(true);
        textWrapper.querySelectorAll("img").forEach((img) => img.remove());

        const textEl = document.createElement("div");
        textEl.className = "step-text";
        textEl.innerHTML = textWrapper.innerHTML || "";
        bodyEl.appendChild(textEl);

        // .step-image（画像があるときだけ作成）
        if (imgs.length > 0) {
          const imageEl = document.createElement("div");
          imageEl.className = "step-image";
          imgs.forEach((img) => imageEl.appendChild(img.cloneNode(true)));
          bodyEl.appendChild(imageEl);
        }

        section.appendChild(headerEl);
        section.appendChild(bodyEl);
        container.appendChild(section);

        count++;
      }

      if (count === 0) {
        container.innerHTML = `<p>このページの手順はまだありません。</p>`;
      }
    })();
  });
});
