/* Galaxy Space — weather forecast
   Uses Open-Meteo (open-meteo.com): completely free, no API key, no signup,
   generous rate limits, CORS-enabled — same "no backend needed" pattern as
   the rest of the sky panel. Geocoding (turning a typed city name into
   coordinates) uses Open-Meteo's own free geocoding endpoint, kept separate
   from the Nominatim calls used elsewhere on the site so neither service
   gets overloaded.
*/
(function () {
  const DEFAULT_COORDS = { lat: 50.45, lon: 30.52, label: "Kyiv" };
  let CODES = null;

  function lang() {
    return document.documentElement.lang === "uk" ? "ua" : "en";
  }

  async function loadCodes() {
    if (CODES) return CODES;
    const res = await fetch("data/weather-codes.json", { cache: "no-store" });
    CODES = await res.json();
    return CODES;
  }

  function describeCode(code, codes) {
    const entry = codes[String(code)];
    const L = lang();
    if (!entry) return { text: "—", icon: "❔" };
    return { text: entry[L] || entry.en, icon: entry.icon };
  }

  async function geocode(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=${lang() === "ua" ? "uk" : "en"}&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results[0]) {
      const r = data.results[0];
      return { lat: r.latitude, lon: r.longitude, label: r.name };
    }
    return null;
  }

  async function fetchWeather(lat, lon) {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=auto&forecast_days=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather api error");
    return res.json();
  }

  function fmtDay(dateStr) {
    const L = lang();
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(L === "ua" ? "uk-UA" : "en-US", { weekday: "short" });
  }

  async function render(lat, lon, label) {
    const widget = document.getElementById("weather-widget");
    if (!widget) return;
    const codes = await loadCodes();

    const locEl = document.getElementById("weather-loc");
    const iconEl = document.getElementById("weather-icon");
    const tempEl = document.getElementById("weather-temp");
    const descEl = document.getElementById("weather-desc");
    const feelsEl = document.getElementById("weather-feels");
    const humidityEl = document.getElementById("weather-humidity");
    const windEl = document.getElementById("weather-wind");
    const precipEl = document.getElementById("weather-precip");
    const daysWrap = document.getElementById("weather-days");

    try {
      const data = await fetchWeather(lat, lon);
      const cur = data.current;
      const curDesc = describeCode(cur.weather_code, codes);

      if (locEl) locEl.textContent = label || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
      if (iconEl) iconEl.textContent = curDesc.icon;
      if (tempEl) tempEl.textContent = `${Math.round(cur.temperature_2m)}°C`;
      if (descEl) descEl.textContent = curDesc.text;
      if (feelsEl) feelsEl.textContent = `${Math.round(cur.apparent_temperature)}°C`;
      if (humidityEl) humidityEl.textContent = `${Math.round(cur.relative_humidity_2m)}%`;
      if (windEl) windEl.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
      if (precipEl) {
        const pop = data.daily.precipitation_probability_max[0];
        precipEl.textContent = pop !== undefined && pop !== null ? `${pop}%` : "—";
      }

      if (daysWrap) {
        daysWrap.innerHTML = "";
        const days = data.daily.time;
        days.forEach((d, i) => {
          const desc = describeCode(data.daily.weather_code[i], codes);
          const hi = Math.round(data.daily.temperature_2m_max[i]);
          const lo = Math.round(data.daily.temperature_2m_min[i]);
          const card = document.createElement("div");
          card.className = "weather-day";
          card.innerHTML = `
            <span class="weather-day-name">${i === 0 ? (window.__gsDict?.weather?.today || "Today") : fmtDay(d)}</span>
            <span class="weather-day-icon">${desc.icon}</span>
            <span class="weather-day-temps"><strong>${hi}°</strong> <span>${lo}°</span></span>
          `;
          daysWrap.appendChild(card);
        });
      }
    } catch (e) {
      console.error(e);
      if (descEl) descEl.textContent = "—";
    }
  }

  function initLocationForm() {
    const form = document.getElementById("weather-loc-form");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("weather-loc-input");
      const val = input.value.trim();
      if (!val) return;
      const coordMatch = val.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
      if (coordMatch) {
        render(parseFloat(coordMatch[1]), parseFloat(coordMatch[3]), val);
        return;
      }
      try {
        const found = await geocode(val);
        if (found) {
          render(found.lat, found.lon, found.label);
        } else {
          render(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.label);
        }
      } catch (err) {
        render(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.label);
      }
    });
  }

  function init() {
    if (!document.getElementById("weather-widget")) return;
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

  document.addEventListener("DOMContentLoaded", init);
  document.addEventListener("gs:lang-changed", init);
})();
