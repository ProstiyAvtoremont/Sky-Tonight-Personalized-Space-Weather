/* Galaxy Space — shared config for the ads system.
   Set these once here; ads.js and business-card.js both read from this file.
*/
window.GS_ADS_CONFIG = {
  SHEET_ID: "1GCqkoBJmyadfBFGlAYDdw29nUETdX83IgNgNzXLp5b4", // from the sheet's URL
  APPROVED_TAB: "Approved",
  FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSexuhqt2SMtQS6ZuMFjoaQFJEC7HDX9Ig25AxbmkTscbkE7lA/viewform?usp=publish-editor", // your Google Form link
};

/* Turns text into a URL-safe slug, used as a fallback when a listing has no
   explicit "slug" column filled in. Unicode-aware, so Ukrainian (Cyrillic)
   titles produce a real slug instead of an empty string — e.g.
   "Таро від Оксани" becomes "таро-від-оксани" rather than being stripped
   down to nothing. */
window.gsSlugify = function (text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};
