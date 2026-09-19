/* Galaxy Space — Astronomy Picture of the Day
   Reads data/apod.json, which .github/workflows/daily-content.yml refreshes
   once a day. The live site never calls the NASA API directly.
*/
(function () {
  function lang() {
    return document.documentElement.lang === "uk" ? "ua" : "en";
  }

  async function loadApod() {
    const res = await fetch("data/apod.json", { cache: "no-store" });
    if (!res.ok) throw new Error("could not load apod data");
    return res.json();
  }

  function render(data) {
    const L = lang();
    const img = document.getElementById("apod-image");
    const title = document.getElementById("apod-title");
    const text = document.getElementById("apod-text");
    const credit = document.getElementById("apod-credit");
    const link = document.getElementById("apod-link");
    if (!img) return;

    if (data.image_url) {
      img.src = data.image_url;
      img.alt = (data.title && data.title[L]) || "";
      img.style.display = "block";
    } else {
      img.style.display = "none";
    }
    if (title) title.textContent = (data.title && (data.title[L] || data.title.en)) || "";
    if (text) text.textContent = (data.explanation && (data.explanation[L] || data.explanation.en)) || "";
    if (credit) {
      credit.textContent = data.credit ? `${window.__gsDict?.apod?.credit_label || "Credit"}: ${data.credit}` : "";
      credit.style.display = data.credit ? "block" : "none";
    }
    if (link) {
      if (data.source_url) {
        link.href = data.source_url;
        link.style.display = "inline";
      } else {
        link.style.display = "none";
      }
    }
  }

  async function initApod() {
    const widget = document.getElementById("apod-widget");
    if (!widget) return;
    try {
      const data = await loadApod();
      render(data);
    } catch (e) {
      console.error(e);
    }
  }

  document.addEventListener("DOMContentLoaded", initApod);
  document.addEventListener("gs:lang-changed", initApod);
})();
