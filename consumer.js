// ====================================
// DROPCHECK CONSUMER - FIXED VERSION
// ====================================

const OPENMETEO_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';

let map, marker;
let selectedLat = -25.2637, selectedLon = -57.5759;
let currentView = 'hourly';
let currentData = null;
let currentLang = 'en';
let dataCache = new Map();
const CACHE_DURATION = 1800000;
let tooltipTimer = null;
let activeTooltip = null;

const quickCities = [
    { name: 'Asunción', lat: -25.2637, lon: -57.5759, desc: { en: 'Capital of Paraguay', es: 'Capital de Paraguay' } },
    { name: 'New York', lat: 40.7128, lon: -74.0060, desc: { en: 'The Big Apple, USA', es: 'La Gran Manzana, EE.UU.' } },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, desc: { en: 'Capital of Japan', es: 'Capital de Japón' } },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, desc: { en: 'City of Light, France', es: 'Ciudad de la Luz, Francia' } },
    { name: 'London', lat: 51.5074, lon: -0.1278, desc: { en: 'Capital of UK', es: 'Capital del Reino Unido' } },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, desc: { en: 'Harbor City, Australia', es: 'Ciudad del Puerto, Australia' } }
];

const weatherIcons = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️', 51: '🌦️', 53: '🌦️', 55: '🌦️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '❄️', 73: '❄️', 75: '❄️', 77: '❄️',
    80: '🌦️', 81: '🌧️', 82: '🌧️',
    85: '❄️', 86: '❄️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
};

const weatherDesc = {
    0: { en: 'Clear Sky', es: 'Cielo Despejado' },
    1: { en: 'Mainly Clear', es: 'Principalmente Despejado' },
    2: { en: 'Partly Cloudy', es: 'Parcialmente Nublado' },
    3: { en: 'Overcast', es: 'Nublado' },
    45: { en: 'Foggy', es: 'Neblina' },
    48: { en: 'Rime Fog', es: 'Niebla Helada' },
    51: { en: 'Light Drizzle', es: 'Llovizna Ligera' },
    53: { en: 'Drizzle', es: 'Llovizna' },
    55: { en: 'Heavy Drizzle', es: 'Llovizna Fuerte' },
    61: { en: 'Light Rain', es: 'Lluvia Ligera' },
    63: { en: 'Rain', es: 'Lluvia' },
    65: { en: 'Heavy Rain', es: 'Lluvia Fuerte' },
    71: { en: 'Light Snow', es: 'Nieve Ligera' },
    73: { en: 'Snow', es: 'Nieve' },
    75: { en: 'Heavy Snow', es: 'Nieve Fuerte' },
    77: { en: 'Snow Grains', es: 'Granizo de Nieve' },
    80: { en: 'Light Showers', es: 'Chubascos Ligeros' },
    81: { en: 'Showers', es: 'Chubascos' },
    82: { en: 'Heavy Showers', es: 'Chubascos Fuertes' },
    85: { en: 'Snow Showers', es: 'Chubascos de Nieve' },
    86: { en: 'Heavy Snow', es: 'Nieve Fuerte' },
    95: { en: 'Thunderstorm', es: 'Tormenta' },
    96: { en: 'Thunderstorm + Hail', es: 'Tormenta + Granizo' },
    99: { en: 'Severe Thunderstorm', es: 'Tormenta Severa' }
};

const quickQuestions = {
    en: [
        { q: "Should I bring a jacket today?", type: "jacket" },
        { q: "Will it rain today?", type: "rain" },
        { q: "Is it a good day for outdoor activities?", type: "outdoor" },
        { q: "What's the UV index today?", type: "uv" },
        { q: "Will it be windy today?", type: "wind" }
    ],
    es: [
        { q: "¿Debería llevar una chaqueta hoy?", type: "jacket" },
        { q: "¿Lloverá hoy?", type: "rain" },
        { q: "¿Es un buen día para actividades al aire libre?", type: "outdoor" },
        { q: "¿Cuál es el índice UV hoy?", type: "uv" },
        { q: "¿Habrá viento hoy?", type: "wind" }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DropCheck Consumer - Initializing...');
    initMap();
    initQuickCities();
    setupEventListeners();
    loadSavedLanguage();
    loadCachedData();
    initTooltips();
    console.log('✅ App ready!');
});

function initTooltips() {
    const elements = document.querySelectorAll('[data-tooltip-en]');
    elements.forEach(el => {
        let timer = null;
        
        el.addEventListener('mouseenter', (e) => {
            timer = setTimeout(() => showTooltip(el, e), 2000);
        });
        
        el.addEventListener('mouseleave', () => {
            clearTimeout(timer);
            hideTooltip();
        });
        
        el.addEventListener('touchstart', (e) => {
            timer = setTimeout(() => {
                showTooltip(el, e);
                if (navigator.vibrate) navigator.vibrate(50);
            }, 2000);
        });
        
        el.addEventListener('touchend', () => clearTimeout(timer));
    });
}

function showTooltip(element, event) {
    const text = currentLang === 'en' ? element.getAttribute('data-tooltip-en') : element.getAttribute('data-tooltip-es');
    if (!text) return;
    
    hideTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip show';
    tooltip.innerHTML = `<div class="tooltip-content">${text}</div>`;
    document.body.appendChild(tooltip);
    activeTooltip = tooltip;
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top = rect.bottom + 10;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    if (left + tooltipRect.width > window.innerWidth - 20) left = window.innerWidth - tooltipRect.width - 20;
    if (left < 20) left = 20;
    if (top + tooltipRect.height > window.innerHeight - 20) top = rect.top - tooltipRect.height - 10;
    
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
}

function hideTooltip() {
    if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
    }
}

function initMap() {
    map = L.map('map').setView([selectedLat, selectedLon], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    marker = L.marker([selectedLat, selectedLon], { draggable: true }).addTo(map);
    
    marker.on('dragend', async (e) => {
        const pos = marker.getLatLng();
        selectedLat = parseFloat(pos.lat.toFixed(4));
        selectedLon = parseFloat(pos.lng.toFixed(4));
        updateCoordinates();
        await getWeatherByCoords(selectedLat, selectedLon);
    });
    
    map.on('click', async (e) => {
        selectedLat = parseFloat(e.latlng.lat.toFixed(4));
        selectedLon = parseFloat(e.latlng.lng.toFixed(4));
        marker.setLatLng([selectedLat, selectedLon]);
        updateCoordinates();
        await getWeatherByCoords(selectedLat, selectedLon);
    });
    
    updateCoordinates();
}

function updateCoordinates() {
    const coordsDiv = document.getElementById('coordinates');
    if (coordsDiv) {
        const text = currentLang === 'en' ? `📍 Selected: ${selectedLat}, ${selectedLon}` : `📍 Seleccionado: ${selectedLat}, ${selectedLon}`;
        coordsDiv.textContent = text;
    }
}

function loadSavedLanguage() {
    const saved = localStorage.getItem('selectedLanguage') || 'en';
    currentLang = saved;
    document.getElementById('lang-select').value = saved;
    if (saved !== 'en') changeLanguage(saved);
}

function changeLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-en]').forEach(el => {
        const text = lang === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-es');
        if (text) el.textContent = text;
    });
    
    const input = document.getElementById('location-input');
    input.placeholder = lang === 'en' ? input.getAttribute('data-placeholder-en') : input.getAttribute('data-placeholder-es');
    
    updateCoordinates();
    updateQuickQuestions();
    localStorage.setItem('selectedLanguage', lang);
    
    if (currentData) {
        displayCurrentWeather();
        currentView === 'hourly' ? displayHourly() : displayDaily();
    }
}

function loadCachedData() {
    try {
        const stored = localStorage.getItem('weatherForecastCache');
        if (stored) {
            JSON.parse(stored).forEach(([key, value]) => dataCache.set(key, value));
        }
    } catch (e) {}
}

async function getCachedData(key, fetchFunction) {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
    
    try {
        const data = await fetchFunction();
        dataCache.set(key, { data, timestamp: Date.now() });
        localStorage.setItem('weatherForecastCache', JSON.stringify(Array.from(dataCache.entries()).slice(-5)));
        return data;
    } catch (error) {
        if (cached) return cached.data;
        throw error;
    }
}

async function getWeatherByCoords(lat, lon) {
    showLoading();
    try {
        const weatherData = await getWeatherForecast(lat, lon);
        const locationName = await reverseGeocode(lat, lon);
        currentData = processWeatherData(weatherData, locationName);
        
        hideLoading();
        displayCurrentWeather();
        document.getElementById('view-toggle').style.display = 'flex';
        document.getElementById('ai-questions').style.display = 'block';
        updateQuickQuestions();
        updateView();
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        alert(currentLang === 'en' ? 'Error loading weather data. Please try again.' : 'Error al cargar datos. Intenta de nuevo.');
    }
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        return data.address?.city || data.address?.town || data.address?.village || `${lat}, ${lon}`;
    } catch {
        return `${lat}, ${lon}`;
    }
}

async function searchLocation(query) {
    const res = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
        throw new Error(currentLang === 'en' ? 'City not found' : 'Ciudad no encontrada');
    }
    return data.results[0];
}

async function getWeatherForecast(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'weathercode', 'precipitation', 'windspeed_10m', 'uv_index'].join(','),
        hourly: ['temperature_2m', 'weathercode', 'precipitation_probability', 'windspeed_10m', 'uv_index', 'apparent_temperature'].join(','),
        daily: ['weathercode', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'windspeed_10m_max', 'uv_index_max', 'precipitation_probability_max'].join(','),
        timezone: 'auto',
        forecast_days: 7
    });
    
    const res = await fetch(`${OPENMETEO_API}?${params}`);
    if (!res.ok) throw new Error('API Error');
    return res.json();
}

function setupEventListeners() {
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('location-input').addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
    });
    
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            updateView();
        });
    });
    
    document.getElementById('lang-select').addEventListener('change', e => changeLanguage(e.target.value));
}

async function handleSearch() {
    const query = document.getElementById('location-input').value.trim();
    if (!query) {
        alert(currentLang === 'en' ? 'Please enter a city name' : 'Por favor ingresa un nombre de ciudad');
        return;
    }
    
    showLoading();
    try {
        const location = await searchLocation(query);
        selectedLat = parseFloat(location.latitude);
        selectedLon = parseFloat(location.longitude);
        
        map.setView([selectedLat, selectedLon], 8);
        marker.setLatLng([selectedLat, selectedLon]);
        updateCoordinates();
        
        await getWeatherByCoords(selectedLat, selectedLon);
    } catch (error) {
        hideLoading();
        alert((currentLang === 'en' ? 'Error: ' : 'Error: ') + error.message);
    }
}

function initQuickCities() {
    const container = document.getElementById('quick-cities');
    quickCities.forEach(city => {
        const chip = document.createElement('div');
        chip.className = 'city-chip';
        chip.textContent = city.name;
        chip.setAttribute('data-tooltip-en', city.desc.en);
        chip.setAttribute('data-tooltip-es', city.desc.es);
        chip.onclick = async () => {
            selectedLat = city.lat;
            selectedLon = city.lon;
            map.setView([selectedLat, selectedLon], 8);
            marker.setLatLng([selectedLat, selectedLon]);
            updateCoordinates();
            document.getElementById('location-input').value = city.name;
            await getWeatherByCoords(selectedLat, selectedLon);
        };
        container.appendChild(chip);
    });
    initTooltips();
}

function updateQuickQuestions() {
    const container = document.getElementById('question-buttons');
    if (!container) return;
    container.innerHTML = '';
    
    quickQuestions[currentLang].forEach(q => {
        const btn = document.createElement('button');
        btn.className = 'quick-question-btn';
        btn.textContent = q.q;
        btn.onclick = () => answerQuestion(q.type);
        container.appendChild(btn);
    });
}

function answerQuestion(type) {
    if (!currentData) return;
    
    const responseDiv = document.getElementById('ai-response');
    const responseText = document.getElementById('ai-response-text');
    const today = currentData.daily[0];
    const current = currentData.current;
    
    let answer = '';
    
    if (type === 'jacket') {
        answer = current.temp < 18 
            ? (currentLang === 'en' ? `Yes, bring a jacket! Current temperature is ${current.temp}°C and it feels like ${current.feels}°C.` : `¡Sí, lleva chaqueta! La temperatura actual es ${current.temp}°C y se siente como ${current.feels}°C.`)
            : (currentLang === 'en' ? `No jacket needed. It's ${current.temp}°C with pleasant weather.` : `No necesitas chaqueta. Hace ${current.temp}°C con clima agradable.`);
    } else if (type === 'rain') {
        const rainProb = today.precipProb || 0;
        answer = rainProb > 50 
            ? (currentLang === 'en' ? `Yes, likely to rain today with ${rainProb}% probability. Total: ${today.precip.toFixed(1)}mm expected.` : `Sí, es probable que llueva hoy con ${rainProb}% de probabilidad. Total: ${today.precip.toFixed(1)}mm esperados.`)
            : (currentLang === 'en' ? `Low chance of rain (${rainProb}%). Expected precipitation: ${today.precip.toFixed(1)}mm.` : `Baja probabilidad de lluvia (${rainProb}%). Precipitación esperada: ${today.precip.toFixed(1)}mm.`);
    } else if (type === 'outdoor') {
        const isGood = current.temp >= 15 && current.temp <= 28 && (today.precipProb || 0) < 40;
        answer = isGood
            ? (currentLang === 'en' ? `Great day for outdoor activities! Temperature: ${current.temp}°C, low rain chance.` : `¡Excelente día para actividades al aire libre! Temperatura: ${current.temp}°C, baja probabilidad de lluvia.`)
            : (currentLang === 'en' ? `Consider indoor activities. Temperature: ${current.temp}°C, rain probability: ${today.precipProb || 0}%.` : `Considera actividades bajo techo. Temperatura: ${current.temp}°C, probabilidad de lluvia: ${today.precipProb || 0}%.`);
    } else if (type === 'uv') {
        const uvIndex = today.uvMax || 0;
        answer = uvIndex > 7 
            ? (currentLang === 'en' ? `High UV index today (${uvIndex}). Use sunscreen and protective clothing!` : `Índice UV alto hoy (${uvIndex}). ¡Usa protector solar y ropa protectora!`)
            : uvIndex > 4
            ? (currentLang === 'en' ? `Moderate UV index (${uvIndex}). Sun protection recommended.` : `Índice UV moderado (${uvIndex}). Se recomienda protección solar.`)
            : (currentLang === 'en' ? `Low UV index (${uvIndex}). Minimal sun protection needed.` : `Índice UV bajo (${uvIndex}). Mínima protección solar necesaria.`);
    } else if (type === 'wind') {
        const windSpeed = today.wind;
        answer = windSpeed > 30
            ? (currentLang === 'en' ? `Very windy today! Wind speed: ${windSpeed} km/h. Secure loose items.` : `¡Muy ventoso hoy! Velocidad del viento: ${windSpeed} km/h. Asegura objetos sueltos.`)
            : windSpeed > 15
            ? (currentLang === 'en' ? `Moderate wind expected: ${windSpeed} km/h.` : `Viento moderado esperado: ${windSpeed} km/h.`)
            : (currentLang === 'en' ? `Calm day with light winds: ${windSpeed} km/h.` : `Día tranquilo con vientos ligeros: ${windSpeed} km/h.`);
    }
    
    responseText.textContent = answer;
    responseDiv.style.display = 'block';
}

function processWeatherData(data, locationName) {
    const { hourly, daily, current } = data;
    
    const hourlyForecast = [];
    for (let i = 0; i < 24 && i < hourly.time.length; i++) {
        hourlyForecast.push({
            time: new Date(hourly.time[i]).getHours() + ':00',
            temp: Math.round(hourly.temperature_2m[i]),
            feels: Math.round(hourly.apparent_temperature[i]),
            code: hourly.weathercode[i],
            precip: hourly.precipitation_probability[i],
            wind: Math.round(hourly.windspeed_10m[i]),
            uv: hourly.uv_index[i]
        });
    }
    
    const dailyForecast = daily.time.map((date, i) => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
        code: daily.weathercode[i],
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        precip: daily.precipitation_sum[i],
        precipProb: daily.precipitation_probability_max[i],
        wind: Math.round(daily.windspeed_10m_max[i]),
        uvMax: daily.uv_index_max[i]
    }));
    
    return {
        location: locationName,
        current: {
            temp: Math.round(current.temperature_2m),
            feels: Math.round(current.apparent_temperature),
            code: current.weathercode,
            humidity: current.relative_humidity_2m,
            wind: Math.round(current.windspeed_10m),
            precipitation: current.precipitation,
            uv: current.uv_index
        },
        hourly: hourlyForecast,
        daily: dailyForecast
    };
}

function displayCurrentWeather() {
    const { location, current } = currentData;
    document.getElementById('current-weather').style.display = 'block';
    document.getElementById('location-name').textContent = location;
    document.getElementById('current-icon').textContent = weatherIcons[current.code] || '☀️';
    document.getElementById('current-desc').textContent = weatherDesc[current.code]?.[currentLang] || weatherDesc[0][currentLang];
    document.getElementById('current-temp').textContent = current.temp + '°';
    document.getElementById('feels-like').textContent = (currentLang === 'en' ? 'Feels like ' : 'Sensación de ') + current.feels + '°';
}

function updateView() {
    if (currentView === 'hourly') {
        document.getElementById('hourly-section').style.display = 'block';
        document.getElementById('daily-section').style.display = 'none';
        displayHourly();
    } else {
        document.getElementById('hourly-section').style.display = 'none';
        document.getElementById('daily-section').style.display = 'block';
        displayDaily();
    }
}

function displayHourly() {
    const container = document.getElementById('hourly-scroll');
    container.innerHTML = '';
    
    currentData.hourly.forEach((hour, i) => {
        const card = document.createElement('div');
        card.className = 'hourly-card';
        const timeLabel = i === 0 ? (currentLang === 'en' ? 'Now' : 'Ahora') : hour.time;
        
        card.innerHTML = `
            <div class="hourly-time">${timeLabel}</div>
            <div class="hourly-icon">${weatherIcons[hour.code] || '☀️'}</div>
            <div class="hourly-temp">${hour.temp}°</div>
            <div class="hourly-details">
                <div>💧 ${hour.precip || 0}%</div>
                <div>💨 ${hour.wind} km/h</div>
                ${hour.uv > 5 ? `<div>☀️ UV ${hour.uv}</div>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

function displayDaily() {
    const container = document.getElementById('forecast-grid');
    container.innerHTML = '';
    
    currentData.daily.forEach((day, i) => {
        const card = document.createElement('div');
        card.className = 'weather-card';
        const dateLabel = i === 0 ? (currentLang === 'en' ? 'Today' : 'Hoy') : day.date;
        
        card.innerHTML = `
            <div class="card-date">${dateLabel}</div>
            <div class="card-day">${day.day}</div>
            <div class="card-icon-big">${weatherIcons[day.code] || '☀️'}</div>
            <div class="temp-main-big">${Math.round((day.tempMax + day.tempMin) / 2)}°</div>
            <div class="temp-range">${day.tempMin}° / ${day.tempMax}°</div>
            <div class="card-description">${weatherDesc[day.code]?.[currentLang] || weatherDesc[0][currentLang]}</div>
            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-icon">🌧</span>
                    <span class="detail-value">${day.precip.toFixed(1)}mm (${day.precipProb || 0}%)</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">💨</span>
                    <span class="detail-value">${day.wind} km/h</span>
                </div>
                ${day.uvMax > 5 ? `
                <div class="detail-item">
                    <span class="detail-icon">☀️</span>
                    <span class="detail-value">UV ${day.uvMax}</span>
                </div>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('current-weather').style.display = 'none';
    document.getElementById('hourly-section').style.display = 'none';
    document.getElementById('daily-section').style.display = 'none';
    document.getElementById('view-toggle').style.display = 'none';
    document.getElementById('ai-questions').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

console.log('🌤 DropCheck Consumer Ready!');