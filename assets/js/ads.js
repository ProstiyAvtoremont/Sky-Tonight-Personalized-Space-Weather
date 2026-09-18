/* Galaxy Space — community ads
   How this works without a server or database:
   1. People submit listings through a Google Form (link below).
   2. Submissions land in a Google Sheet tab called "Pending" automatically.
   3. You (the moderator) review each one and copy approved rows into a tab called "Approved".
   4. This script reads ONLY the "Approved" tab, via the free opensheet.elk.sh proxy,
      which turns any published Google Sheet into a read-only JSON API. No key, no signup.
   Full setup steps are in README.md → "Setting up ad moderation".
*/
(function () {
  // --- CONFIGURE THESE TWO VALUES after you set up your Google Sheet ---
  const SHEET_ID = "YOUR_GOOGLE_SHEET_ID"; // from the sheet's URL
  const APPROVED_TAB = "Approved";
  const FORM_URL = "https://forms.google.com/YOUR_FORM_LINK"; // your Google Form link
  // -----------------------------------------------------------------------

  function lang() {
    return document.documentElement.lang === "uk" ? "ua" : "en";
  }

  async function fetchApprovedAds() {
    if (SHEET_ID === "YOUR_GOOGLE_SHEET_ID") return null; // not configured yet
    const url = `https://opensheet.elk.sh/${SHEET_ID}/${encodeURIComponent(APPROVED_TAB)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("could not load ads");
    return res.json();
  }

  function adCard(row) {
    const el = document.createElement("article");
    el.className = "card ad-card";
    el.innerHTML = `
      <span class="tag">${row.category || ""}</span>
      <h3>${row.title || ""}</h3>
      <p>${row.description || ""}</p>
      ${row.price ? `<span class="price">${row.price}</span>` : ""}
      ${row.link ? `<a href="${row.link}" target="_blank" rel="noopener noreferrer">${row.link_label || row.link}</a>` : ""}
    `;
    return el;
  }

  async function renderAdsPage() {
    const wrap = document.getElementById("ads-full-list");
    if (!wrap) return;
    try {
      const rows = await fetchApprovedAds();
      if (!rows || !rows.length) {
        wrap.innerHTML = `<div class="empty-state" data-i18n="ads_page.empty"></div>`;
        return;
      }
      wrap.innerHTML = "";
      rows.forEach((r) => wrap.appendChild(adCard(r)));
    } catch (e) {
      wrap.innerHTML = `<div class="empty-state" data-i18n="ads_page.empty"></div>`;
    }
  }

  async function renderAdsPreview() {
    const wrap = document.getElementById("ads-preview-list");
    if (!wrap) return;
    try {
      const rows = await fetchApprovedAds();
      if (!rows || !rows.length) {
        wrap.parentElement.style.display = "none";
        return;
      }
      wrap.innerHTML = "";
      rows.slice(0, 3).forEach((r) => wrap.appendChild(adCard(r)));
    } catch (e) {
      if (wrap.parentElement) wrap.parentElement.style.display = "none";
    }
  }

  function wireSubmitButtons() {
    document.querySelectorAll("[data-ads-submit]").forEach((btn) => {
      btn.setAttribute("href", FORM_URL);
      btn.setAttribute("target", "_blank");
      btn.setAttribute("rel", "noopener noreferrer");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireSubmitButtons();
    renderAdsPage();
    renderAdsPreview();
  });
  document.addEventListener("gs:lang-changed", () => {
    renderAdsPage();
    renderAdsPreview();
  });
})();
