/* Galaxy Space — business card page
   Reads ?id=<slug> from the URL, finds the matching row in the Approved
   sheet (same data source as the Ads page), and renders it as a designed,
   shareable card with Galaxy Space branding and social share buttons.
*/
(function () {
  const CFG = window.GS_ADS_CONFIG || {};

  function lang() {
    return document.documentElement.lang === "uk" ? "ua" : "en";
  }

  function getSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function cardSlug(row) {
    return row.slug && row.slug.trim() ? row.slug.trim() : window.gsSlugify(row.title);
  }

  async function fetchApprovedAds() {
    if (!CFG.SHEET_ID || CFG.SHEET_ID === "YOUR_GOOGLE_SHEET_ID") return null;
    const url = `https://opensheet.elk.sh/${CFG.SHEET_ID}/${encodeURIComponent(CFG.APPROVED_TAB)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("could not load ads");
    return res.json();
  }

  function render(row) {
    const wrap = document.getElementById("biz-card");
    const notFound = document.getElementById("biz-card-not-found");
    if (!wrap) return;

    if (!row) {
      wrap.style.display = "none";
      if (notFound) notFound.style.display = "block";
      return;
    }
    wrap.style.display = "";
    if (notFound) notFound.style.display = "none";

    document.getElementById("biz-category").textContent = row.category || "";
    document.getElementById("biz-name").textContent = row.title || "";
    document.getElementById("biz-desc").textContent = row.description || "";

    const priceEl = document.getElementById("biz-price");
    if (row.price) {
      priceEl.textContent = row.price;
      priceEl.style.display = "";
    } else {
      priceEl.style.display = "none";
    }

    const linkEl = document.getElementById("biz-link");
    if (row.link) {
      linkEl.href = row.link;
      linkEl.textContent = row.link_label || row.link;
      linkEl.style.display = "";
    } else {
      linkEl.style.display = "none";
    }

    document.title = `${row.title} — Galaxy Space`;

    const shareUrl = window.location.href;
    const shareContainer = document.getElementById("biz-share");
    if (window.gsRenderShareButtons) {
      window.gsRenderShareButtons(shareContainer, {
        url: shareUrl,
        title: `${row.title} — Galaxy Space`,
      });
    }
  }

  async function init() {
    const slug = getSlugFromUrl();
    const wrap = document.getElementById("biz-card");
    const notFound = document.getElementById("biz-card-not-found");
    if (!wrap) return;

    if (!slug) {
      wrap.style.display = "none";
      if (notFound) notFound.style.display = "block";
      return;
    }

    try {
      const rows = await fetchApprovedAds();
      const match = (rows || []).find((r) => cardSlug(r) === slug);
      render(match || null);
    } catch (e) {
      console.error(e);
      render(null);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("gs:lang-changed", init);
})();
