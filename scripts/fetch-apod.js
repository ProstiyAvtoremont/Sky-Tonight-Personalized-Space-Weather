/**
 * Galaxy Space — fetch NASA's Astronomy Picture of the Day (APOD) and
 * translate it to Ukrainian, writing the result to data/apod.json.
 *
 * Run automatically once a day by .github/workflows/daily-content.yml, so
 * the live site never calls the NASA API directly — it just reads this
 * static JSON file.
 *
 * As of September 2026, APOD moved off the old api.nasa.gov proxy onto
 * NASA's own WordPress REST API. This endpoint needs NO API key at all —
 * NASA_API_KEY is accepted but unused, kept only in case a future source
 * needs it again. The old api.nasa.gov/planetary/apod endpoint is
 * scheduled for archival on December 1, 2026.
 *
 * The new endpoint returns an array of recent entries (newest first), and
 * its field meanings differ from the old API: "url" is now the article
 * page (not the image), the actual image lives in "hdurl", and
 * "explanation"/"credit" contain HTML markup rather than plain text.
 *
 * DEEPL_API_KEY is optional — without it, the Ukrainian fields are left
 * empty and the site falls back to showing the English text.
 */
const fs = require("fs");
const path = require("path");
const { translateText } = require("./lib/deepl");

const OUT_PATH = path.join(__dirname, "..", "data", "apod.json");
const DEEPL_KEY = process.env.DEEPL_API_KEY;
const APOD_ENDPOINT = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

// Strip HTML tags and decode the handful of entities NASA's feed actually
// uses, then trim the boilerplate "APOD's main site is moving..." notice
// and the redundant leading "Explanation:" label that the feed embeds in
// every entry's text.
function cleanText(html) {
  if (!html) return "";
  let text = html
    .replace(/<[^>]+>/g, "")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  text = text.replace(/^Explanation:\s*/i, "");
  text = text.replace(/APOD'?s main NASA site is moving:?.*$/i, "").trim();
  return text;
}

async function main() {
  const res = await fetch(APOD_ENDPOINT);
  if (!res.ok) {
    throw new Error(`NASA APOD request failed: ${res.status} ${await res.text()}`);
  }
  const entries = await res.json();
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error("NASA APOD response was empty or not an array");
  }
  const apod = entries[0]; // newest first

  const imageUrl = apod.media_type === "image" ? apod.hdurl || "" : "";
  const title = apod.title || "";
  const explanation = cleanText(apod.explanation);
  const credit = cleanText(apod.credit || apod.copyright);

  let titleUa = "";
  let explanationUa = "";
  if (DEEPL_KEY) {
    titleUa = await translateText(title, DEEPL_KEY);
    explanationUa = await translateText(explanation, DEEPL_KEY);
  } else {
    console.log("No DEEPL_API_KEY set — saving APOD with English text only.");
  }

  const out = {
    date: apod.date,
    image_url: imageUrl,
    media_type: apod.media_type,
    source_url: apod.permalink || apod.url,
    credit: credit || null,
    title: { en: title, ua: titleUa },
    explanation: { en: explanation, ua: explanationUa },
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Saved APOD for ${apod.date}: "${title}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
