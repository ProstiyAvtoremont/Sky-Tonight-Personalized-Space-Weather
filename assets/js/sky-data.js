/* Galaxy Space — live sky panel
   All data sources are free and require no API key:
   - Moon phase: calculated locally (Conway's algorithm variant), no API needed
   - Sunrise/sunset: sunrise-sunset.org (free, no key, CORS-enabled)
   - ISS position: wheretheiss.at (free, no key, CORS-enabled)
   - Geomagnetic (aurora proxy): NOAA SWPC planetary Kp-index (free, no key)
*/
(function () {
  const DEFAULT_COORDS = { lat: 50.45, lon: 30.52, label: "Kyiv" }; // fallback

  function moonPhase(date) {
    // Days since a known new moon (2000-01-06), synodic month ~29.53059 days
    const synodic = 29.53058867;
    const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
    const diffDays = (date.getTime() - knownNewMoon) / 86400000;
    let phase = (diffDays % synodic) / synodic;
    if (phase < 0) phase += 1;
    return phase; // 0 = new, 0.5 = full
  }

  function phaseInfo(phase, dict) {
    const names = dict?.moon_names || {};
    const pct = Math.round((phase <= 0.5 ? phase * 2 : (1 - phase) * 2) * 100);
    let key;
    if (phase < 0.03 || phase > 0.97) key = "new";
    else if (phase < 0.22) key = "waxingCrescent";
    else if (phase < 0.28) key = "firstQuarter";
    else if (phase < 0.47) key = "waxingGibbous";
    else if (phase < 0.53) key = "full";
    else if (phase < 0.72) key = "waningGibbous";
    else if (phase < 0.78) key = "lastQuarter";
    else key = "waningCrescent";
    const labelsEn = {
      new: "New moon", waxingCrescent: "Waxing crescent", firstQuarter: "First quarter",
      waxingGibbous: "Waxing gibbous", full: "Full moon", waningGibbous: "Waning gibbous",
      lastQuarter: "Last quarter", waningCrescent: "Waning crescent"
    };
    const labelsUa = {
      new: "Молодик", waxingCrescent: "Зростаючий серп", firstQuarter: "Перша чверть",
      waxingGibbous: "Зростаючий місяць", full: "Повний місяць", waningGibbous: "Спадаючий місяць",
      lastQuarter: "Остання чверть", waningCrescent: "Спадаючий серп"
    };
    const lang = document.documentElement.lang === "uk" ? "ua" : "en";
    const label = lang === "ua" ? labelsUa[key] : labelsEn[key];
    return { label, pct };
  }

  function fmtTime(iso) {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "—";
    }
  }

  async function fetchSunTimes(lat, lon) {
    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&formatted=0`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK") throw new Error("sun api error");
    return { sunrise: data.results.sunrise, sunset: data.results.sunset };
  }

  async function fetchISS() {
    const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!res.ok) throw new Error("iss api error");
    return res.json();
  }

  async function fetchKp() {
    const res = await fetch("https://services.swpc.noaa.gov/json/planetary_k_index_1m.json");
    if (!res.ok) throw new Error("kp api error");
    const rows = await res.json();
    const last = rows[rows.length - 1];
    return parseFloat(last.kp_index);
  }

  function kpMessage(kp, dict) {
    if (kp === null || Number.isNaN(kp)) return "—";
    if (kp < 4) return dict?.sky?.kp_low || "Low";
    if (kp < 6) return dict?.sky?.kp_moderate || "Moderate";
    return dict?.sky?.kp_high || "Elevated";
  }

  async function reverseLocLabel(lat, lon) {
    // Best-effort, silently falls back to coordinates if it fails or is blocked
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=8`,
        { headers: { Accept: "application/json" } }
      );
      const data = await res.json();
      return data?.address?.city || data?.address?.town || data?.address?.state || null;
    } catch (e) {
      return null;
    }
  }

  async function render(lat, lon, locLabel) {
    const dict = window.__gsDict || {};
    const moonEl = document.getElementById("moon-value");
    const moonSub = document.getElementById("moon-sub");
    const sunEl = document.getElementById("sun-value");
    const sunSub = document.getElementById("sun-sub");
    const issEl = document.getElementById("iss-value");
    const issSub = document.getElementById("iss-sub");
    const kpEl = document.getElementById("kp-value");
    const kpSub = document.getElementById("kp-sub");
    if (!moonEl) return; // sky panel not on this page

    const now = new Date();
    const phase = moonPhase(now);
    const info = phaseInfo(phase, dict);
    moonEl.textContent = info.label;
    moonSub.textContent = `${info.pct}%`;

    try {
      const sun = await fetchSunTimes(lat, lon);
      sunEl.textContent = `${fmtTime(sun.sunset)} / ${fmtTime(sun.sunrise)}`;
      sunSub.textContent = locLabel || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    } catch (e) {
      sunEl.textContent = "—";
      sunSub.textContent = "";
    }

    try {
      const iss = await fetchISS();
      issEl.textContent = `${iss.latitude.toFixed(1)}°, ${iss.longitude.toFixed(1)}°`;
      const label = await reverseLocLabel(iss.latitude, iss.longitude);
      issSub.textContent = label ? `${dict?.sky?.iss_over || "over"} ${label}` : (dict?.sky?.iss_over || "in orbit");
    } catch (e) {
      issEl.textContent = "—";
    }

    try {
      const kp = await fetchKp();
      kpEl.textContent = `Kp ${kp.toFixed(1)}`;
      kpSub.textContent = kpMessage(kp, dict);
    } catch (e) {
      kpEl.textContent = "—";
    }
  }

  function initLocationForm() {
    const form = document.getElementById("sky-loc-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("sky-loc-input");
      const val = input.value.trim();
      const coordMatch = val.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
      if (coordMatch) {
        render(parseFloat(coordMatch[1]), parseFloat(coordMatch[3]), val);
        return;
      }
      if (val.length > 1) {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(val)}&limit=1`
          );
          const results = await res.json();
          if (results[0]) {
            render(parseFloat(results[0].lat), parseFloat(results[0].lon), results[0].display_name.split(",")[0]);
            return;
          }
        } catch (err) { /* fall through */ }
      }
      render(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.label);
    });
  }

  function initGeolocation() {
    if (!document.getElementById("moon-value")) return;
    initLocationForm();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => render(pos.coords.latitude, pos.coords.longitude, null),
        () => render(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.label),
        { timeout: 4000 }
      );
    } else {
      render(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.label);
    }
  }

  document.addEventListener("DOMContentLoaded", initGeolocation);
  document.addEventListener("gs:lang-changed", () => {
    // re-render labels in the new language without re-fetching everything
    initGeolocation();
  });
})();
