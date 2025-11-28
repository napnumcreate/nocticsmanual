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
      // 現在のパスからセクション（例: /master/cast/... → master）を抽出
      let p = window.location.pathname.replace(/\/$/, "");
      let parts = p.split("/").filter(Boolean);
      if (parts.length && /\.[a-z0-9]+$/i.test(parts[parts.length - 1])) {
        parts = parts.slice(0, -1);
      }
      parts = parts.filter(seg => seg !== "manual.noctics.net");

      const section = parts[0];
      if (section) {
        // docsRoot をこのスクリプトの場所から逆算
        const thisScript = document.currentScript || Array.from(document.scripts).find(s => (s?.src || "").includes("load-common.js"));
        const docsRoot = thisScript ? new URL("../", thisScript.src) : new URL("../../", window.location.href);
        const cardUrl = new URL(`card/${section}.html`, docsRoot).toString();
        const sectionBase = root(`${section}/`);

        fetch(cardUrl)
          .then((res) => (res.ok ? res.text() : Promise.reject(res)))
          .then((html) => {
            const wrap = document.createElement('div');
            wrap.innerHTML = html;
            const links = Array.from(wrap.querySelectorAll('.card-list a'))
              .filter(a => a.getAttribute('href'));

            const items = links.map(a => {
              const hrefRaw = a.getAttribute('href') || '';
              let hrefAbs;
              try { hrefAbs = new URL(hrefRaw, sectionBase).toString(); } catch { hrefAbs = hrefRaw; }
              const label = (a.textContent || '').trim();
              return { href: hrefAbs, label };
            }).filter(x => x.label);

            const nav = document.createElement('nav');
            const h3 = document.createElement('h3');
            const headerEl = wrap.querySelector('.card-header');
            const titleText = (headerEl?.textContent || 'サイドメニュー').trim();
            h3.textContent = titleText;
            const hr = document.createElement('hr');
            nav.appendChild(h3);
            nav.appendChild(hr);

            items.forEach(({ href, label }) => {
              const aa = document.createElement('a');
              aa.className = 'menu-btn';
              aa.href = href;
              aa.textContent = label;
              nav.appendChild(aa);
            });

            sideMenu.innerHTML = '';
            sideMenu.appendChild(nav);
          })
          .catch(() => {
            // 取得失敗時は何もしない（フォールバック無し）
          });
      }
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

      // ドキュメントルートURLを load-common.js の場所から逆算
      const thisScript = document.currentScript || Array.from(document.scripts).find(s => (s?.src || "").includes("load-common.js"));
      const docsRoot = thisScript ? new URL("../", thisScript.src) : new URL("../../", window.location.href);
      // 現在ページのディレクトリ（ドキュメントルート相対パス）
      const pageDirUrl = new URL(".", window.location.href);
      let pageDirRel = pageDirUrl.pathname;
      // 先頭の docsRoot.pathname を取り除いて相対に
      if (pageDirRel.startsWith(new URL(docsRoot).pathname)) {
        pageDirRel = pageDirRel.slice(new URL(docsRoot).pathname.length);
      }
      if (!pageDirRel.endsWith("/")) pageDirRel += "/";

      const MAX = 100;
      let count = 0;

      for (let i = 1; i <= MAX; i++) {
        // ルール固定: /{i}/index.html のみを読む（フォールバック無し）
        const indexUrl = new URL(`${pageDirRel}${i}/index.html`, docsRoot).toString();
        let res;
        try {
          res = await fetch(indexUrl, { cache: "no-store" });
        } catch {
          res = undefined;
        }
        if (!res || !res.ok) {
          if (i === 1) {
            console.warn("[manual] Step 1 not found.", {
              location: window.location.pathname,
              docsRoot: docsRoot.toString(),
              pageDirRel,
              tried: [indexUrl]
            });
          }
          break; // フォールバック無し
        }

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

        // 相対リンク補正: <a href> と <img/srcset>, <source/srcset>
        (function fixRelativeLinks(rootEl) {
          const assetBase = new URL(`${pageDirRel}${i}/`, docsRoot).toString();
          const isSkippable = (v) => !v || v.startsWith("#") || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(v);
          const toFixedHref = (v) => {
            const href = String(v || "").trim();
            if (isSkippable(href)) return href;
            const m = href.match(/^(\d+)\.html$/);
            if (m) {
              const n = m[1];
              try {
                return new URL(`../${n}/index.html`, assetBase).toString();
              } catch {
                return `../${n}/index.html`;
              }
            }
            try {
              return new URL(href, assetBase).toString();
            } catch {
              return href;
            }
          };

          const toFixedSrc = (v) => {
            const src = String(v || "").trim();
            if (!src || /^(https?:|data:)/i.test(src) || src.startsWith("/")) return src ? new URL(src, assetBase).toString() : src;
            try { return new URL(src, assetBase).toString(); } catch { return src; }
          };

          const fixSrcset = (v) => {
            const s = String(v || "").trim();
            if (!s) return s;
            return s.split(",").map(part => {
              const t = part.trim();
              if (!t) return t;
              const pieces = t.split(/\s+/);
              const url = pieces.shift();
              let fixed = url;
              try { fixed = new URL(url || "", assetBase).toString(); } catch {}
              return [fixed, ...pieces].join(" ");
            }).join(", ");
          };

          // <a href>
          rootEl.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href');
            const fixed = toFixedHref(href);
            if (fixed) a.setAttribute('href', fixed);
          });

          // <img srcset>
          rootEl.querySelectorAll('img[srcset]').forEach((img) => {
            const ss = img.getAttribute('srcset');
            if (ss) img.setAttribute('srcset', fixSrcset(ss));
          });

          // <source srcset> (picture等)
          rootEl.querySelectorAll('source[srcset]').forEach((srcEl) => {
            const ss = srcEl.getAttribute('srcset');
            if (ss) srcEl.setAttribute('srcset', fixSrcset(ss));
          });
        })(textWrapper);

        const textEl = document.createElement("div");
        textEl.className = "step-text";
        textEl.innerHTML = textWrapper.innerHTML || "";
        bodyEl.appendChild(textEl);

        // .step-image（画像があるときだけ作成）
        if (imgs.length > 0) {
          const imageEl = document.createElement("div");
          imageEl.className = "step-image";
          // 画像の相対パスは /{i}/ を基準に補正
          const assetBase = new URL(`${pageDirRel}${i}/`, docsRoot).toString();
          imgs.forEach((img) => {
            const clone = img.cloneNode(true);
            let rawSrc = clone.getAttribute("src") || "";
            // 誤って ./i/xxx と書かれているケースを補正（例: ./1/1.png → 1.png）
            const prefix1 = `./${i}/`;
            const prefix2 = `${i}/`;
            if (rawSrc.startsWith(prefix1)) rawSrc = rawSrc.slice(prefix1.length);
            else if (rawSrc.startsWith(prefix2)) rawSrc = rawSrc.slice(prefix2.length);
            try {
              const fixed = new URL(rawSrc, assetBase).toString();
              clone.setAttribute("src", fixed);
            } catch {}
            // srcset も補正
            const rawSet = clone.getAttribute('srcset');
            if (rawSet) {
              const fixedSet = rawSet.split(',').map(part => {
                const t = part.trim();
                if (!t) return t;
                const pieces = t.split(/\s+/);
                let url = pieces.shift() || "";
                if (url.startsWith(prefix1)) url = url.slice(prefix1.length);
                else if (url.startsWith(prefix2)) url = url.slice(prefix2.length);
                let fixedUrl = url;
                try { fixedUrl = new URL(url || "", assetBase).toString(); } catch {}
                return [fixedUrl, ...pieces].join(' ');
              }).join(', ');
              clone.setAttribute('srcset', fixedSet);
            }
            imageEl.appendChild(clone);
          });
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
