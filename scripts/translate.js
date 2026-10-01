/**
 * Galaxy Space — auto-translate blog posts EN -> UA
 *
 * Usage: write a new post in data/blog-posts.json with the English fields
 * filled in and the matching "ua" fields left as empty strings (""). This
 * script (run automatically by .github/workflows/translate.yml on every
 * push) finds those empty fields, translates them with the TranslateAPI.ai API,
 * and writes the result back into the file.
 *
 * Requires the TRANSLATEAPI_KEY secret (see README.md -> "Automatic translation").
 * The free TranslateAPI.ai plan includes ~150,000 characters/month
 * (5,000/day), which is plenty for a blog.
 */
const fs = require("fs");
const path = require("path");
const { translateText } = require("./lib/translateapi");

const DATA_PATH = path.join(__dirname, "..", "data", "blog-posts.json");
const API_KEY = process.env.TRANSLATEAPI_KEY;

async function translate(text) {
  return translateText(text, API_KEY);
}

async function main() {
  if (!API_KEY) {
    console.log("No TRANSLATEAPI_KEY set — skipping auto-translation.");
    return;
  }

  const posts = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  let changed = false;

  for (const post of posts) {
    for (const field of ["title", "excerpt", "tag"]) {
      if (post[field] && post[field].en && !post[field].ua) {
        console.log(`Translating "${field}" for post dated ${post.date}...`);
        try {
          post[field].ua = await translate(post[field].en);
          changed = true;
        } catch (err) {
          // Leave the field empty so the next run retries it.
          console.log(`::warning::Could not translate "${field}" (${post.date}): ${err.message}`);
        }
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
