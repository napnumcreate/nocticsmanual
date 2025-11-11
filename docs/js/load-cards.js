// /js/load-cards.js
(() => {
  // --- 基準パスの決定（このJSファイルの場所を基準にする） ---
  const thisScript =
    document.currentScript ||
    Array.from(document.scripts).find(s => (s?.src || "").includes("load-cards.js"));

  // このJSのURL → ディレクトリURL
  const scriptBase = thisScript ? new URL(".", thisScript.src) : new URL(location.href);

  // カード格納ディレクトリ（デフォルト: このJSと同階層の ./card/）
  // 例）/assets/js/load-cards.js → /assets/js/card/
  const CARD_DIR = new URL(thisScript?.dataset.cardRoot || "card/", scriptBase);

  // 遅延読み込みのON/OFF（デフォルトtrue、<script data-lazy="false"> で無効）
  const USE_LAZY = (thisScript?.dataset.lazy ?? "true") !== "false";

  // スコープセレクタ（デフォルト .cards。<script data-scope=".cards,.more"> で変更可）
  const SCOPE = thisScript?.dataset.scope || ".cards";

  // --- fetch with basic error handling ---
  async function fetchFragment(url) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      console.error(`[cards] Failed to load ${url}`, err);
      return `<div style="color:#c00;font-size:.9em;">読み込みに失敗しました: ${String(url)}</div>`;
    }
  }

  // URL解決（絶対/相対どちらでもOK）
  function resolveUrl(file) {
    try {
      // new URL は絶対URLも相対URLも扱える（/ で始まるルート相対もOK）
      return new URL(file, CARD_DIR).toString();
    } catch {
      return new URL(String(file || ""), CARD_DIR).toString();
    }
  }

  // 一枚読み込み
  async function loadOneCard(el) {
    if (el.dataset.loaded === "1") return; // 二重ロード防止

    // data-card="prep" -> prep.html を暗黙補完 / data-src="prep.html" を優先
    const name = (el.getAttribute("data-card") || "").trim();
    const src  = (el.getAttribute("data-src")  || "").trim();
    const file = src || (name ? `${name}.html` : "");

    if (!file) {
      el.innerHTML = `<div style="color:#c00;font-size:.9em;">data-card か data-src が必要です</div>`;
      return;
    }

    const url = resolveUrl(file);

    // ローディング表示（任意）
    el.classList.add("is-loading");
    if (!el.innerHTML) {
      el.innerHTML = `<div style="opacity:.6;font-size:.9em;">読み込み中...</div>`;
    }

    const html = await fetchFragment(url);
    el.innerHTML = html;
    el.classList.remove("is-loading");
    el.dataset.loaded = "1";
  }

  function collectTargets(root = document) {
    // .cards [data-card], .cards [data-src]（SCOPEはカンマ区切り対応）
    const scopes = SCOPE.split(",").map(s => s.trim()).filter(Boolean);
    const sel = scopes.map(s => `${s} [data-card], ${s} [data-src]`).join(", ");
    return root.querySelectorAll(sel);
  }

  function loadAllNow(root = document) {
    collectTargets(root).forEach(loadOneCard);
  }

  function loadWithLazy(root = document) {
    const targets = collectTargets(root);
    if (!("IntersectionObserver" in window)) {
      targets.forEach(loadOneCard);
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          obs.unobserve(e.target);
          loadOneCard(e.target);
        }
      });
    }, { rootMargin: "200px 0px" });
    targets.forEach((el) => io.observe(el));
  }

  // DOM準備後に実行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      USE_LAZY ? loadWithLazy() : loadAllNow();
    });
  } else {
    USE_LAZY ? loadWithLazy() : loadAllNow();
  }
})();
