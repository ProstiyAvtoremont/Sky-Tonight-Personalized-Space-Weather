/**
 * Shared TranslateAPI.ai helper — EN -> UK (Ukrainian).
 * Used by translate.js and fetch-apod.js. Replaces the old DeepL helper.
 *
 * Docs: https://translateapi.ai/api/
 * The API key is read from the TRANSLATEAPI_KEY environment variable
 * (a GitHub Actions secret) — never hard-code it in this repository.
 */
const ENDPOINT = "https://api.translateapi.ai/api/v1/translate/";

async function request(text, apiKey) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      source_language: "en",
      target_language: "uk", // Ukrainian (ISO 639-1 code is "uk", not "ua")
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (res.status === 402) {
    throw new Error(
      "TranslateAPI: character credits exhausted (HTTP 402). The free plan allows ~5,000 characters/day."
    );
  }
  if (!res.ok) {
    const err = new Error(`TranslateAPI request failed: ${res.status} ${await res.text()}`);
    err.retryable = res.status === 503 || res.status >= 500;
    throw err;
  }
  const data = await res.json();
  if (!data.translated_text) {
    throw new Error("TranslateAPI: response had no translated_text field");
  }
  return data.translated_text;
}

async function translateText(text, apiKey) {
  if (!text) return text;
  try {
    return await request(text, apiKey);
  } catch (err) {
    // One retry for temporary problems (engine down, timeout, network blip).
    const temporary = err.retryable || err.name === "TimeoutError" || err.name === "TypeError";
    if (!temporary) throw err;
    console.log(`Temporary error (${err.message}) — retrying in 10 seconds...`);
    await new Promise((r) => setTimeout(r, 10000));
    return request(text, apiKey);
  }
}

module.exports = { translateText };
