/* Galaxy Space — shared config for the ads system.
   Set these once here; ads.js and business-card.js both read from this file.
*/
window.GS_ADS_CONFIG = {
  SHEET_ID: "YOUR_GOOGLE_SHEET_ID", // from the sheet's URL
  APPROVED_TAB: "Approved",
  FORM_URL: "https://forms.google.com/YOUR_FORM_LINK", // your Google Form link
};

/* Turns text into a URL-safe slug, used as a fallback when a listing has no
   explicit "slug" column filled in. */
window.gsSlugify = function (text) {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};
