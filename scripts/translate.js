/**
 * Galaxy Space — auto-translate blog posts EN -> UA
 *
 * Usage: write a new post in data/blog-posts.json with the English fields
 * filled in and the matching "ua" fields left as empty strings (""). This
 * script (run automatically by .github/workflows/translate.yml on every
 * push) finds those empty fields, translates them with the free DeepL API,
 * and writes the result back into the file.
 *
 * Requires the DEEPL_API_KEY secret (see README.md -> "Automatic translation").
 * Free DeepL accounts include 500,000 characters/month, which is far more
 * than a blog needs.
 */
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "blog-posts.json");
const API_KEY = process.env.DEEPL_API_KEY;

async function translate(text) {
  if (!text) return text;
  const isFreeKey = API_KEY.endsWith(":fx");
  const endpoint = isFreeKey
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: "EN",
      target_lang: "UK", // Ukrainian
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepL request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.translations[0].text;
}

async function main() {
  if (!API_KEY) {
    console.log("No DEEPL_API_KEY set — skipping auto-translation.");
    return;
  }

  const posts = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  let changed = false;

  for (const post of posts) {
    for (const field of ["title", "excerpt", "tag"]) {
      if (post[field] && post[field].en && !post[field].ua) {
        console.log(`Translating "${field}" for post dated ${post.date}...`);
        post[field].ua = await translate(post[field].en);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2) + "\n");
    console.log("Updated data/blog-posts.json with new translations.");
  } else {
    console.log("Nothing to translate.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
