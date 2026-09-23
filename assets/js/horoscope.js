/* Galaxy Space — daily horoscope
   Readings are composed from an opener + closer phrase pool plus a
   per-sign offset, so each sign gets a different, changing reading every
   day without needing hundreds of hand-written entries or a third-party
   API that could go down. Lucky color/number are derived the same way.
*/
(function () {
  const STORAGE_KEY = "gs_horoscope_sign";

  function lang() {
    return document.documentElement.lang === "uk" ? "ua" : "en";
  }

  function dayOfYear() {
    const d = new Date();
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000);
  }

  async function loadContent() {
    const res = await fetch("data/horoscope-content.json", { cache: "no-store" });
    if (!res.ok) throw new Error("could not load horoscope content");
    return res.json();
  }

  function buildReading(content, signIndex) {
    const doy = dayOfYear();
    const openerIdx = (doy + signIndex * 5) % content.openers.length;
    const closerIdx = (doy * 3 + signIndex * 7 + 2) % content.closers.length;
    const colorIdx = (doy + signIndex * 3) % content.colors.length;
    const luckyNumber = ((doy + signIndex * 11) % 9) + 1;
    const L = lang();
    const cats = content.categories || {};
    const catText = (name, mult) => {
      const pool = cats[name];
      if (!pool || !pool.length) return "";
      const idx = (doy * mult + signIndex * 13) % pool.length;
      return pool[idx][L];
    };
    return {
      text: `${content.openers[openerIdx][L]} ${content.closers[closerIdx][L]}`,
      color: content.colors[colorIdx][L],
      number: luckyNumber,
      love: catText("love", 2),
      career: catText("career", 5),
      wellness: catText("wellness", 7),
    };
  }

  function renderPicker(content) {
    const picker = document.getElementById("horoscope-picker");
    if (!picker) return;
    const L = lang();
    picker.innerHTML = "";
    content.signs.forEach((sign, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sign-btn";
      btn.dataset.sign = sign.id;
      btn.innerHTML = `<span class="sign-symbol">${sign.symbol}</span><span>${sign.name[L]}</span>`;
      btn.addEventListener("click", () => selectSign(content, sign.id));
      picker.appendChild(btn);
    });
  }

  function selectSign(content, signId) {
    localStorage.setItem(STORAGE_KEY, signId);
    const picker = document.getElementById("horoscope-picker");
    if (picker) {
      picker.querySelectorAll(".sign-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.sign === signId);
      });
    }
    const signIndex = content.signs.findIndex((s) => s.id === signId);
    if (signIndex === -1) return;
    const sign = content.signs[signIndex];
    const reading = buildReading(content, signIndex);
    const L = lang();

    const nameEl = document.getElementById("horoscope-sign-name");
    const rangeEl = document.getElementById("horoscope-sign-range");
    const textEl = document.getElementById("horoscope-text");
    const colorEl = document.getElementById("horoscope-color");
    const numberEl = document.getElementById("horoscope-number");
    const resultWrap = document.getElementById("horoscope-result");
    const loveEl = document.getElementById("horoscope-love");
    const careerEl = document.getElementById("horoscope-career");
    const wellnessEl = document.getElementById("horoscope-wellness");

    if (nameEl) nameEl.textContent = `${sign.symbol} ${sign.name[L]}`;
    if (rangeEl) rangeEl.textContent = sign.range;
    if (textEl) textEl.textContent = reading.text;
    if (colorEl) colorEl.textContent = reading.color;
    if (numberEl) numberEl.textContent = reading.number;
    if (loveEl) loveEl.textContent = reading.love;
    if (careerEl) careerEl.textContent = reading.career;
    if (wellnessEl) wellnessEl.textContent = reading.wellness;
    if (resultWrap) resultWrap.style.display = "block";
  }

  async function initHoroscope() {
    const widget = document.getElementById("horoscope-widget");
    if (!widget) return;
    try {
      const content = await loadContent();
      renderPicker(content);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && content.signs.some((s) => s.id === saved)) {
        selectSign(content, saved);
      }
    } catch (e) {
      console.error(e);
    }
  }

  document.addEventListener("DOMContentLoaded", initHoroscope);
  document.addEventListener("gs:lang-changed", initHoroscope);
})();
