/* Galaxy Space — shared config for the ads system.
   Set these once here; ads.js and business-card.js both read from this file.
*/
window.GS_ADS_CONFIG = {
  SHEET_ID: "YOUR_GOOGLE_SHEET_ID", // from the sheet's URL
  APPROVED_TAB: "Approved",
  FORM_URL: "https://forms.google.com/YOUR_FORM_LINK", // your Google Form link
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

/* Maps the Google Sheet's column headers to the internal field names the
   site uses (title, description, category, link, plus optional price,
   link_label, slug).
   The sheet uses Ukrainian headers:
     назва → title
     опис → description
     категорія → category
     посилання на ваш вебсайт або профіль соціальних мереж → link
   Matching is case-insensitive and ignores extra spaces, and any header that
   starts with "посилання" is treated as the link column (so a slightly
   different wording of that long header still works). The old English
   headers keep working too, so an existing sheet won't break. */
window.gsNormalizeRow = function (row) {
  const out = {};
  const aliases = {
    "назва": "title",
    "title": "title",
    "опис": "description",
    "description": "description",
    "категорія": "category",
    "category": "category",
    "ціна": "price",
    "price": "price",
    "link": "link",
    "link_label": "link_label",
    "назва посилання": "link_label",
    "slug": "slug",
  };
  Object.keys(row || {}).forEach((key) => {
    const k = key.toString().replace(/\s+/g, " ").trim().toLowerCase();
    let field = aliases[k];
    if (!field && k.indexOf("посилання") === 0) field = "link";
    const value = row[key];
    if (field) {
      // don't let an empty duplicate column overwrite a filled one
      if (out[field] === undefined || out[field] === "") out[field] = value;
    } else {
      out[key] = value;
    }
  });
  return out;
};
