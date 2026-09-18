/* Galaxy Space — starfield + blog rendering (static JSON, no backend) */
(function () {
  function buildStarfield() {
    const field = document.getElementById("starfield");
    if (!field) return;
    const count = window.innerWidth < 600 ? 60 : 110;
    for (let i = 0; i < count; i++) {
      const star = document.createElement("div");
      star.className = "star";
      const size = Math.random() * 1.8 + 0.6;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 5}s`;
      field.appendChild(star);
    }
  }

  async function loadPosts() {
    const res = await fetch("data/blog-posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error("could not load posts");
    return res.json();
  }

  function lang() {
    return document.documentElement.lang === "uk" ? "ua" : "en";
  }

  function renderPreview(posts) {
    const wrap = document.getElementById("blog-preview-list");
    if (!wrap) return;
    const L = lang();
    wrap.innerHTML = "";
    posts.slice(0, 3).forEach((p) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <span class="tag">${p.tag[L]}</span>
        <h3>${p.title[L]}</h3>
        <p>${p.excerpt[L]}</p>
        <span class="meta">${p.date}</span>
      `;
      wrap.appendChild(card);
    });
  }

  function renderFullList(posts) {
    const wrap = document.getElementById("blog-full-list");
    if (!wrap) return;
    const L = lang();
    if (!posts.length) {
      wrap.innerHTML = `<div class="empty-state" data-i18n="blog_page.empty"></div>`;
      return;
    }
    wrap.innerHTML = "";
    posts.forEach((p) => {
      const row = document.createElement("article");
      row.className = "blog-row";
      row.innerHTML = `
        <div class="date">${p.date}</div>
        <div>
          <span class="tag">${p.tag[L]}</span>
          <h3 style="margin-top:8px">${p.title[L]}</h3>
          <p>${p.excerpt[L]}</p>
        </div>
      `;
      wrap.appendChild(row);
    });
  }

  async function initBlog() {
    if (!document.getElementById("blog-preview-list") && !document.getElementById("blog-full-list")) return;
    try {
      const posts = await loadPosts();
      renderPreview(posts);
      renderFullList(posts);
    } catch (e) {
      console.error(e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    buildStarfield();
    initBlog();
  });
  document.addEventListener("gs:lang-changed", initBlog);
})();
