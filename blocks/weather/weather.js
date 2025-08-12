/**
 * Fetch JSON once with basic error handling.
 */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

/**
 * Show loading placeholder.
 */
function renderSkeleton(block) {
  block.innerHTML = `
    <div class="weather-skeleton" aria-hidden="true">
      <div class="bar"></div>
      <div class="bar short"></div>
    </div>
  `;
}

/**
 * Show error message in the block.
 */
function renderError(block, message = 'Unable to load weather right now.') {
  block.innerHTML = `<div class="weather-error" role="alert">${message}</div>`;
}

/**
 * Show final weather card with data.
 */
function renderWeatherCard(block, { city, tempC, condition }) {
  block.innerHTML = `
    <article class="weather-card" aria-live="polite">
      <header class="weather-city">${city}</header>
      <div class="weather-temp">${Math.round(tempC)}°C</div>
      <div class="weather-cond">${condition}</div>
    </article>
  `;
}

/**
 * Get city name from the block.
 * Reads the second paragraph's text or defaults to "Varanasi".
 */
function getCityFromBlock(block) {
  const paragraphs = block.querySelectorAll('p');
  if (paragraphs[1]) {
    const cityText = paragraphs[1].textContent?.trim();
    if (cityText) return cityText;
  }
  return 'Varanasi';
}

/**
 * Convert weather code to one of the top 4 messages.
 */
function mapWeatherCodeToText(code) {
  const topCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast'
  };
  return topCodes[code] || 'Other';
}

/**
 * Fetch current weather for a city.
 */
async function getWeatherForCity(cityName) {
  // Step 1: Get lat/lon for the city
  const geo = await fetchJson(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1`
  );
  if (!geo?.results?.length) throw new Error('City not found');

  const { latitude, longitude, name } = geo.results[0];

  // Step 2: Get weather data for those coordinates
  const weather = await fetchJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`,
    { cache: 'no-store' }
  );

  const code = weather?.current?.weather_code;
  return {
    city: name || cityName,
    tempC: weather?.current?.temperature_2m,
    condition: mapWeatherCodeToText(code),
  };
}

/**
 * Main block initializer.
 */
export default async function decorate(block) {
  const city = getCityFromBlock(block);
  renderSkeleton(block);

  try {
    const data = await getWeatherForCity(city);
    renderWeatherCard(block, data);
  } catch (err) {
    console.error('Weather block failed:', err);
    renderError(block);
  }
}
