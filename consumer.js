// ====================================
// DROPCHECK CONSUMER - FIXED VERSION
// ====================================

const OPENMETEO_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';

let map, marker;
let selectedLat = -25.2637, selectedLon = -57.5759;
let currentView = 'hourly';
let currentData = null;
let dataCache = new Map();
const CACHE_DURATION = 1800000;

const quickCities = [
    { name: 'Asunción', lat: -25.2637, lon: -57.5759 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'London', lat: 51.5074, lon: -0.1278 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 }
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
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
    61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
    80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
    85: 'Snow Showers', 86: 'Heavy Snow',
    95: 'Thunderstorm', 96: 'Thunderstorm + Hail', 99: 'Severe Thunderstorm'
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DropCheck Consumer - Initializing...');
    initMap();
    initQuickCities();
    setupEventListeners();
    loadCachedData();
    console.log('✅ App ready!');
});

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
        coordsDiv.textContent = `📍 Selected: ${selectedLat}, ${selectedLon}`;
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
        updateView();
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
        alert('Error loading weather data. Please try again.');
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
        throw new Error('City not found');
    }
    return data.results[0];
}

async function getWeatherForecast(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: ['temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'weathercode', 'precipitation', 'windspeed_10m'].join(','),
        hourly: ['temperature_2m', 'weathercode', 'precipitation_probability', 'windspeed_10m', 'apparent_temperature'].join(','),
        daily: ['weathercode', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum', 'windspeed_10m_max', 'precipitation_probability_max'].join(','),
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
}

async function handleSearch() {
    const query = document.getElementById('location-input').value.trim();
    if (!query) {
        alert('Please enter a city name');
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
        alert('Error: ' + error.message);
    }
}

function initQuickCities() {
    const container = document.getElementById('quick-cities');
    quickCities.forEach(city => {
        const chip = document.createElement('div');
        chip.className = 'city-chip';
        chip.textContent = city.name;
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
            wind: Math.round(hourly.windspeed_10m[i])
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
        wind: Math.round(daily.windspeed_10m_max[i])
    }));
    
    return {
        location: locationName,
        current: {
            temp: Math.round(current.temperature_2m),
            feels: Math.round(current.apparent_temperature),
            code: current.weathercode,
            humidity: current.relative_humidity_2m,
            wind: Math.round(current.windspeed_10m),
            precipitation: current.precipitation
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
    document.getElementById('current-desc').textContent = weatherDesc[current.code] || weatherDesc[0];
    document.getElementById('current-temp').textContent = current.temp + '°';
    document.getElementById('feels-like').textContent = 'Feels like ' + current.feels + '°';
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
        const timeLabel = i === 0 ? 'Now' : hour.time;
        
        card.innerHTML = `
            <div class="hourly-time">${timeLabel}</div>
            <div class="hourly-icon">${weatherIcons[hour.code] || '☀️'}</div>
            <div class="hourly-temp">${hour.temp}°</div>
            <div class="hourly-details">
                <div>💧 ${hour.precip || 0}%</div>
                <div>💨 ${hour.wind} km/h</div>
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
        const dateLabel = i === 0 ? 'Today' : day.date;
        
        card.innerHTML = `
            <div class="card-date">${dateLabel}</div>
            <div class="card-day">${day.day}</div>
            <div class="card-icon-big">${weatherIcons[day.code] || '☀️'}</div>
            <div class="temp-main-big">${Math.round((day.tempMax + day.tempMin) / 2)}°</div>
            <div class="temp-range">${day.tempMin}° / ${day.tempMax}°</div>
            <div class="card-description">${weatherDesc[day.code] || weatherDesc[0]}</div>
            <div class="card-details">
                <div class="detail-item">
                    <span class="detail-icon">🌧</span>
                    <span class="detail-value">${day.precip.toFixed(1)}mm (${day.precipProb || 0}%)</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">💨</span>
                    <span class="detail-value">${day.wind} km/h</span>
                </div>
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
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

console.log('🌤 DropCheck Consumer Ready!');