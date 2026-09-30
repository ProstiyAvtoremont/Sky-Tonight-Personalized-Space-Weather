/**
 * Galaxy Space — builds the clean-URL pages that GitHub Pages can't create on its own.
 *
 * The weather, horoscope, tarot and geomagnetic blocks are sections of the home
 * page, but they should have their own addresses (/weather/, /horoscope/ ...).
 * GitHub Pages has no URL rewriting, so this script writes a copy of index.html
 * into weather/index.html, horoscope/index.html, etc. Each copy opens scrolled to
 * its section, gets its own <title>, canonical URL and highlighted menu item.
 * It also regenerates sitemap.xml and robots.txt.
 *
 * Run it after editing index.html or adding a blog post:  node scripts/build-clean-urls.js
 * (.github/workflows/clean-urls.yml runs it automatically on every push.)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DOMAIN = "https://galaxyspace.xyz";
const SECTIONS = ["weather", "horoscope", "tarot", "geomagnetic"];

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, p), s);
};

const dict = JSON.parse(read("assets/i18n/ua.json"));
const home = read("index.html");

for (const id of SECTIONS) {
  const label = (dict.nav && dict.nav[id]) || id;
  const url = `${DOMAIN}/${id}/`;
  let html = home;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${label} — Galaxy Space</title>`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  // only the real home page takes its title/description from ua.json
  html = html.replace(" data-i18n-meta", "");
  // this page is not the home page: highlight its own menu item instead of "Home"
  html = html.replace(/(<a href="\/" data-i18n="nav\.home") aria-current="page"/, "$1");
  html = html.replace(
    new RegExp(`(<a href="/${id}/" data-i18n="nav\\.${id}")`),
    '$1 aria-current="page"'
  );
  // open scrolled to the section (content loads late, so re-scroll once it has)
  const scroll = `<script>
/* Opens the page scrolled to the "${id}" block. */
(function(){function go(){var el=document.getElementById("${id}");if(el)el.scrollIntoView();}
window.addEventListener("load",function(){go();setTimeout(go,600);});
document.addEventListener("gs:lang-changed",go);})();
</script>
`;
  html = html.replace("</body>", scroll + "</body>");
  write(`${id}/index.html`, html);
  console.log(`wrote ${id}/index.html`);
}

// sitemap.xml + robots.txt
const posts = JSON.parse(read("data/blog-posts.json")).filter((p) => p.slug);
const urls = ["/", ...SECTIONS.map((s) => `/${s}/`), "/blog/", "/ads/", "/about/", "/terms/",
  ...posts.map((p) => `/blog/${p.slug}/`)];
write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${DOMAIN}${u}</loc></url>`).join("\n") +
    `\n</urlset>\n`
);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${DOMAIN}/sitemap.xml\n`);
console.log("wrote sitemap.xml and robots.txt");
