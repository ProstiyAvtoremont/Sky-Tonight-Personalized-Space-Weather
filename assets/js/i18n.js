/* Galaxy Space — i18n loader (no build step, no backend) */
(function () {
  const SUPPORTED = ["en", "ua"];
  const STORAGE_KEY = "gs_lang";

  // Ukrainian is this site's primary language and the default for every
  // visitor unless they've explicitly switched before. English is a
  // secondary option for non-Ukrainian-speaking visitors, so it's only
  // shown if the person's browser is clearly set to English and they
  // haven't visited before — it never overrides an existing choice.
  function detectDefaultLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || "").toLowerCase();
    return nav.startsWith("en") ? "en" : "ua";
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  async function loadDict(lang) {
    const res = await fetch(`assets/i18n/${lang}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load ${lang}.json`);
    return res.json();
  }

  function applyDict(dict) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = getByPath(dict, el.getAttribute("data-i18n"));
      if (val !== undefined) el.textContent = val;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const val = getByPath(dict, el.getAttribute("data-i18n-placeholder"));
      if (val !== undefined) el.setAttribute("placeholder", val);
    });
    const title = getByPath(dict, "meta.title");
    const desc = getByPath(dict, "meta.description");
    if (title) document.title = title;
    if (desc) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
      }
      m.setAttribute("content", desc);
    }
    document.documentElement.lang = dict.__lang === "ua" ? "uk" : "en";
  }

  function applyLangBlocks(lang) {
    document.querySelectorAll("[data-lang-block]").forEach((el) => {
      el.style.display = el.getAttribute("data-lang-block") === lang ? "" : "none";
    });
  }

  function setActiveButtons(lang) {
    document.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    });
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = "en";
    localStorage.setItem(STORAGE_KEY, lang);
    try {
      const dict = await loadDict(lang);
      dict.__lang = lang;
      applyDict(dict);
      applyLangBlocks(lang);
      setActiveButtons(lang);
      window.__gsDict = dict;
      document.dispatchEvent(new CustomEvent("gs:lang-changed", { detail: { lang, dict } }));
    } catch (e) {
      console.error(e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const lang = detectDefaultLang();
    setLang(lang);
    document.querySelectorAll(".lang-toggle button").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
    });
    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");
    if (navToggle && navLinks) {
      navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
    }
  });

  window.gsSetLang = setLang;
})();
