/* Galaxy Space — content loader (Ukrainian-only)
   The site used to support an EN/UA toggle; it's now Ukrainian-only, so
   this simply loads the Ukrainian text once and fills in every
   data-i18n element. Other scripts on the site (sky-data.js, weather.js,
   horoscope.js, etc.) key their own language-specific arrays off
   document.documentElement.lang, which every page now hardcodes to "uk",
   so they continue to work correctly without any changes.
*/
(function () {
  function getByPath(obj, path) {
    return path.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  async function loadDict() {
    const res = await fetch(`/assets/i18n/ua.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load ua.json`);
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
    // Only the home page (html[data-i18n-meta]) takes its title/description from the dictionary;
    // every other page keeps the title and description written in its own <head>.
    if (!document.documentElement.hasAttribute("data-i18n-meta")) return;
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
  }

  async function init() {
    try {
      const dict = await loadDict();
      applyDict(dict);
      window.__gsDict = dict;
      document.dispatchEvent(new CustomEvent("gs:lang-changed", { detail: { lang: "ua", dict } }));
    } catch (e) {
      console.error(e);
    }

    const navToggle = document.querySelector(".nav-toggle");
    const navLinks = document.querySelector(".nav-links");
    if (navToggle && navLinks) {
      navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
