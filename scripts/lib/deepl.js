/** Shared DeepL helper — free tier, EN -> UK. Used by translate.js and fetch-apod.js. */
async function translateText(text, apiKey) {
  if (!text) return text;
  const isFreeKey = apiKey.endsWith(":fx");
  const endpoint = isFreeKey
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: [text], source_lang: "EN", target_lang: "UK" }),
  });

  if (!res.ok) {
    throw new Error(`DeepL request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.translations[0].text;
}

module.exports = { translateText };
