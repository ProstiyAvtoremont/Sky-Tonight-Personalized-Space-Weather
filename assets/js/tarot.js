/* Galaxy Space — daily tarot card
   The card is chosen deterministically from today's date, so every visitor
   sees the same card on the same day (like a real daily draw) — no server,
   no randomness that needs storing anywhere.
*/
(function () {
  function todayKey() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }

  function dayOfYear() {
    const d = new Date();
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    return Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000);
  }

  function lang() {
    return document.documentElement.lang === "uk" ? "ua" : "en";
  }

  async function loadDeck() {
    const res = await fetch("data/tarot-cards.json", { cache: "no-store" });
    if (!res.ok) throw new Error("could not load tarot deck");
    return res.json();
  }

  function renderCard(card) {
    const L = lang();
    const nameEl = document.getElementById("tarot-name");
    const meaningEl = document.getElementById("tarot-meaning");
    if (nameEl) nameEl.textContent = card.name[L];
    if (meaningEl) meaningEl.textContent = card.meaning[L];
  }

  async function initTarot() {
    const widget = document.getElementById("tarot-widget");
    if (!widget) return;
    try {
      const deck = await loadDeck();
      const idx = dayOfYear() % deck.length;
      const card = deck[idx];
      renderCard(card);

      const revealBtn = document.getElementById("tarot-reveal");
      const revealedKey = `gs_tarot_revealed_${todayKey()}`;
      const alreadyRevealed = localStorage.getItem(revealedKey) === "1";

      function reveal() {
        widget.classList.add("revealed");
        localStorage.setItem(revealedKey, "1");
      }

      if (alreadyRevealed) {
        reveal();
      }
      if (revealBtn) {
        revealBtn.addEventListener("click", reveal);
      }
    } catch (e) {
      console.error(e);
    }
  }

  document.addEventListener("DOMContentLoaded", initTarot);
  document.addEventListener("gs:lang-changed", initTarot);
})();
