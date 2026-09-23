/* Galaxy Space — share buttons
   Builds a row of share links for a given url/title using each platform's
   public share-intent endpoint (the same mechanism every "share" button on
   the web uses — no SDK, no tracking script, no login required).
   Renders plain text-label pills rather than brand logos, so there's no
   dependency on any platform's icon assets.
*/
window.gsRenderShareButtons = function (container, { url, title }) {
  if (!container) return;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || "");

  const platforms = [
    { key: "telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
    { key: "whatsapp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { key: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { key: "x", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { key: "linkedin", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ];

  const labels = {
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    x: "X",
    linkedin: "LinkedIn",
  };

  container.innerHTML = "";

  platforms.forEach((p) => {
    const a = document.createElement("a");
    a.href = p.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "share-btn";
    a.textContent = labels[p.key];
    container.appendChild(a);
  });

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "share-btn share-btn-copy";
  copyBtn.textContent = window.__gsDict?.share?.copy_link || "Copy link";
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(url);
      const original = copyBtn.textContent;
      copyBtn.textContent = window.__gsDict?.share?.copied || "Copied!";
      setTimeout(() => (copyBtn.textContent = original), 1800);
    } catch (e) {
      /* clipboard API unavailable — silently ignore */
    }
  });
  container.appendChild(copyBtn);

  if (navigator.share) {
    const nativeBtn = document.createElement("button");
    nativeBtn.type = "button";
    nativeBtn.className = "share-btn share-btn-native";
    nativeBtn.textContent = window.__gsDict?.share?.more || "More…";
    nativeBtn.addEventListener("click", () => {
      navigator.share({ title, url }).catch(() => {});
    });
    container.appendChild(nativeBtn);
  }
};
