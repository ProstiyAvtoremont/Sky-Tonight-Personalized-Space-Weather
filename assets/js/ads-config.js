/* Galaxy Space — shared config for the ads system.
   Set these once here; ads.js and business-card.js both read from this file.
*/
window.GS_ADS_CONFIG = {
  SHEET_ID: "e/2PACX-1vS3qI546wzNxYpZTW9OMT3FFtDz2ENXRQ9rthJc6ZGBWwgYqdRRlqZP3Gr0grHYj37hSFGrmV9FxJs5", // from the sheet's URL
  APPROVED_TAB: "Approved",
  FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSexuhqt2SMtQS6ZuMFjoaQFJEC7HDX9Ig25AxbmkTscbkE7lA/viewform?usp=publish-editor", // your Google Form link
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
