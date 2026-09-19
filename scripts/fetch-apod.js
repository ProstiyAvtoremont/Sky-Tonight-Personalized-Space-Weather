/**
 * Galaxy Space — fetch NASA's Astronomy Picture of the Day (APOD) and
 * translate it to Ukrainian, writing the result to data/apod.json.
 *
 * Run automatically once a day by .github/workflows/daily-content.yml, so
 * the live site never calls the NASA API directly — it just reads this
 * static JSON file. That means: no rate-limit risk for visitors, and no
 * API key exposed in the browser.
 *
 * NASA_API_KEY is optional — without it this uses NASA's public "DEMO_KEY",
 * which works but is limited to ~30 requests/hour, 50/day (plenty for one
 * run a day, but get your own free key at https://api.nasa.gov for safety
 * margin — see README.md).
 *
 * DEEPL_API_KEY is optional too — without it, the Ukrainian fields are left
 * empty and the site falls back to showing the English text.
 */
const fs = require("fs");
const path = require("path");
const { translateText } = require("./lib/deepl");

const OUT_PATH = path.join(__dirname, "..", "data", "apod.json");
const NASA_KEY = process.env.NASA_API_KEY || "DEMO_KEY";
const DEEPL_KEY = process.env.DEEPL_API_KEY;

async function main() {
  const res = await fetch(
    `https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&thumbs=true`
  );
  if (!res.ok) {
    throw new Error(`NASA APOD request failed: ${res.status} ${await res.text()}`);
  }
  const apod = await res.json();

  // Some APOD entries are videos; fall back to the provided thumbnail so the
  // homepage always has an image to show.
  const imageUrl =
    apod.media_type === "image" ? apod.url : apod.thumbnail_url || apod.url;

  let titleUa = "";
  let explanationUa = "";
  if (DEEPL_KEY) {
    titleUa = await translateText(apod.title, DEEPL_KEY);
    explanationUa = await translateText(apod.explanation, DEEPL_KEY);
  } else {
    console.log("No DEEPL_API_KEY set — saving APOD with English text only.");
  }

  const out = {
    date: apod.date,
    image_url: imageUrl,
    media_type: apod.media_type,
    source_url: apod.url,
    credit: apod.copyright ? apod.copyright.trim() : null,
    title: { en: apod.title, ua: titleUa },
    explanation: { en: apod.explanation, ua: explanationUa },
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`Saved APOD for ${apod.date}: "${apod.title}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
