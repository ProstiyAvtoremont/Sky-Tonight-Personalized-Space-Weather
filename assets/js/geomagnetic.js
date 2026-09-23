/* Galaxy Space — "how today might feel"
   Pairs the real Kp-index (same public NOAA data as the sky panel) with a
   short, rotating folk-tradition note. Deliberately NOT framed as medical
   or scientific claims — see README for why.
*/
(function () {
  function lang() {
    return document.documentElement.lang === "uk" ? "ua" : "en";
  }

  function dayOfYear() {
    const d = new Date();
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000);
  }

  async function fetchKp() {
    const res = await fetch("https://services.swpc.noaa.gov/json/planetary_k_index_1m.json");
    if (!res.ok) throw new Error("kp api error");
    const rows = await res.json();
    return parseFloat(rows[rows.length - 1].kp_index);
  }

  function tierFor(kp) {
    if (kp < 4) return "low";
    if (kp < 6) return "moderate";
    return "high";
  }

  async function loadContent() {
    const res = await fetch("data/geomagnetic-content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("could not load geomagnetic content");
    return res.json();
  }

  async function init() {
    const widget = document.getElementById("geomagnetic-widget");
    if (!widget) return;
    const badge = document.getElementById("geo-tier-badge");
    const text = document.getElementById("geo-text");
    const kpEl = document.getElementById("geo-kp-value");
    const L = lang();

    try {
      const [kp, content] = await Promise.all([fetchKp(), loadContent()]);
      const tier = tierFor(kp);
      const pool = content.tiers[tier];
      const idx = dayOfYear() % pool.length;

      if (kpEl) kpEl.textContent = `Kp ${kp.toFixed(1)}`;
      if (badge) {
        badge.textContent = window.__gsDict?.sky?.[`kp_${tier}`] || tier;
        badge.className = `geo-badge geo-badge-${tier}`;
      }
      if (text) text.textContent = pool[idx][L];
    } catch (e) {
      console.error(e);
      if (text) text.textContent = "—";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("gs:lang-changed", init);
})();
