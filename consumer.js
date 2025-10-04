// ====================================
// NASA WEATHER FORECAST - CONSUMER OPTIMIZED
// With Open-Meteo API Integration (REAL DATA)
// ====================================

const OPEN_METEO_CONFIG = {
    geocodingUrl: 'https://geocoding-api.open-meteo.com/v1/search',
    forecastUrl: 'https://api.open-meteo.com/v1/forecast'
};

// Global State
let currentView = 'hourly';
let currentForecastDays = 7;
let currentLocation = null;
let dataCache = new Map();
const CACHE_DURATION = 1800000; // 30 minutes

// Quick Cities
const quickCities = [
    { name: 'Asunción', country: 'PY', lat: -25.2637, lon: -57.5759 },
    { name: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
    { name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
    { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
    { name: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 },
    { name: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
    { name: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 }
];

// Weather Icons Mapping
const weatherIcons = {
    0: '☀️',   // Clear sky
    1: '🌤️',   // Mainly clear
    2: '⛅',   // Partly cloudy
    3: '☁️',   // Overcast
    45: '🌫️',  // Foggy
    48: '🌫️',  // Depositing rime fog
    51: '🌦️',  // Light drizzle
    53: '🌦️',  // Moderate drizzle
    55: '🌦️',  // Dense drizzle
    61: '🌧️',  // Slight rain
    63: '🌧️',  // Moderate rain
    65: '🌧️',  // Heavy rain
    71: '❄️',  // Slight snow
    73: '❄️',  // Moderate snow
    75: '❄️',  // Heavy snow
    77: '❄️',  // Snow grains
    80: '🌦️',  // Slight rain showers
    81: '🌧️',  // Moderate rain showers
    82: '🌧️',  // Violent rain showers
    85: '❄️',  // Slight snow showers
    86: '❄️',  // Heavy snow showers
    95: '⛈️',  // Thunderstorm
    96: '⛈️',  // Thunderstorm with hail
    99: '⛈️'   // Thunderstorm with heavy hail
};

// Weather Descriptions
const weatherDescriptions = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Rime Fog', 51: 'Light Drizzle', 53: 'Drizzle',
    55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
    71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 77: 'Snow Grains',
    80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
    85: 'Snow Showers', 86: 'Heavy Snow Showers', 95: 'Thunderstorm',
    96: 'Thunderstorm with Hail', 99: 'Severe Thunderstorm'
};

// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Weather Forecast App - Initializing...');
    initQuickCities();
    setupEventListeners();
    loadCachedData();
    checkAPIStatus();
    console.log('✅ App ready with Open-Meteo API!');
});

// ====================================
// CACHE SYSTEM
// ====================================
async function getCachedData(key, fetchFunction) {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📦 Using cached data for:', key);
        return cached.data;
    }
    
    try {
        console.log('🔄 Fetching fresh data for:', key);
        const data = await fetchFunction();
        dataCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        saveCacheToStorage();
        return data;
    } catch (error) {
        console.error('❌ Fetch error:', error);
        if (cached) {
            console.log('⚠️ Using stale cache due to error');
            return cached.data;
        }
        throw error;
    }
}

function saveCacheToStorage() {
    try {
        const cacheData = Array.from(dataCache.entries()).slice(-5);
        localStorage.setItem('weatherForecastCache', JSON.stringify(cacheData));
    } catch (e) {
        console.warn('Cache save failed:', e);
    }
}

function loadCachedData() {
    try {
        const stored = localStorage.getItem('weatherForecastCache');
        if (stored) {
            const entries = JSON.parse(stored);
            entries.forEach(([key, value]) => dataCache.set(key, value));
            console.log(`📦 Loaded ${entries.length} cached entries`);
        }
    } catch (e) {
        console.warn('Cache load failed:', e);
    }
}

// ====================================
// API STATUS CHECK
// ====================================
async function checkAPIStatus() {
    try {
        const response = await fetch(OPEN_METEO_CONFIG.forecastUrl + '?latitude=0&longitude=0&current=temperature_2m');
        if (response.ok) {
            console.log('✅ Open-Meteo API is online');
        }
    } catch (error) {
        console.warn('⚠️ Open-Meteo API might be offline');
    }
}

// ====================================
// OPEN-METEO API FUNCTIONS
// ====================================
async function searchLocation(query) {
    const cacheKey = `geocoding_${query}`;
    
    return getCachedData(cacheKey, async () => {
        const url = `${OPEN_METEO_CONFIG.geocodingUrl}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Location not found');
        
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            throw new Error('Location not found');
        }
        
        return data.results[0];
    });
}

async function getWeatherForecast(lat, lon, days = 7) {
    const cacheKey = `forecast_${lat}_${lon}_${days}`;
    
    return getCachedData(cacheKey, async () => {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            hourly: [
                'temperature_2m',
                'relative_humidity_2m',
                'apparent_temperature',
                'precipitation_probability',
                'precipitation',
                'weathercode',
                'surface_pressure',
                'cloudcover',
                'windspeed_10m',
                'winddirection_10m',
                'uv_index'
            ].join(','),
            daily: [
                'weathercode',
                'temperature_2m_max',
                'temperature_2m_min',
                'apparent_temperature_max',
                'apparent_temperature_min',
                'sunrise',
                'sunset',
                'uv_index_max',
                'precipitation_sum',
                'rain_sum',
                'showers_sum',
                'snowfall_sum',
                'precipitation_hours',
                'precipitation_probability_max',
                'windspeed_10m_max',
                'windgusts_10m_max',
                'winddirection_10m_dominant'
            ].join(','),
            current: [
                'temperature_2m',
                'relative_humidity_2m',
                'apparent_temperature',
                'is_day',
                'precipitation',
                'rain',
                'showers',
                'snowfall',
                'weathercode',
                'cloudcover',
                'surface_pressure',
                'windspeed_10m',
                'winddirection_10m'
            ].join(','),
            forecast_days: days,
            timezone: 'auto'
        });
        
        const url = `${OPEN_METEO_CONFIG.forecastUrl}?${params}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch weather data');
        
        return response.json();
    });
}

// ====================================
// WEATHER DATA PROCESSING
// ====================================
function processWeatherData(data, location) {
    const { hourly, daily, current } = data;
    
    // Process hourly forecast (next 24 hours)
    const hourlyForecast = [];
    
    for (let i = 0; i < 24 && i < hourly.time.length; i++) {
        const time = new Date(hourly.time[i]);
        hourlyForecast.push({
            time: time,
            hour: time.getHours(),
            timeStr: time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
            weather: weatherDescriptions[hourly.weathercode[i]] || 'Unknown',
            weatherCode: hourly.weathercode[i],
            temp: Math.round(hourly.temperature_2m[i]),
            feelsLike: Math.round(hourly.apparent_temperature[i]),
            humidity: hourly.relative_humidity_2m[i],
            windSpeed: Math.round(hourly.windspeed_10m[i]),
            windDir: hourly.winddirection_10m[i],
            precipitation: hourly.precipitation[i],
            precipProb: hourly.precipitation_probability[i],
            cloudCover: hourly.cloudcover[i],
            uvIndex: hourly.uv_index[i],
            pressure: hourly.surface_pressure[i]
        });
    }
    
    // Process daily forecast
    const dailyForecast = daily.time.map((date, i) => ({
        date: new Date(date),
        dateStr: new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        }),
        dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        weather: weatherDescriptions[daily.weathercode[i]] || 'Unknown',
        weatherCode: daily.weathercode[i],
        temp: Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        tempMax: Math.round(daily.temperature_2m_max[i]),
        feelsLikeMin: Math.round(daily.apparent_temperature_min[i]),
        feelsLikeMax: Math.round(daily.apparent_temperature_max[i]),
        precipitation: daily.precipitation_sum[i],
        precipProb: daily.precipitation_probability_max[i],
        windSpeed: Math.round(daily.windspeed_10m_max[i]),
        windGusts: Math.round(daily.windgusts_10m_max[i]),
        windDir: daily.winddirection_10m_dominant[i],
        uvIndex: daily.uv_index_max[i],
        sunrise: daily.sunrise[i] ? new Date(daily.sunrise[i]).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        }) : 'N/A',
        sunset: daily.sunset[i] ? new Date(daily.sunset[i]).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        }) : 'N/A'
    }));
    
    return {
        location: location,
        current: {
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            weather: weatherDescriptions[current.weathercode] || 'Unknown',
            weatherCode: current.weathercode,
            windSpeed: Math.round(current.windspeed_10m),
            windDir: current.winddirection_10m,
            pressure: current.surface_pressure,
            cloudCover: current.cloudcover,
            precipitation: current.precipitation,
            isDay: current.is_day
        },
        hourlyForecast,
        dailyForecast,
        metadata: {
            timezone: data.timezone,
            elevation: data.elevation,
            generatedAt: new Date().toISOString()
        }
    };
}

// ====================================
// MAIN FORECAST FUNCTIONS
// ====================================
async function getForecast(cityName) {
    console.log('🔍 Searching for:', cityName);
    
    showLoading();
    
    try {
        const location = await searchLocation(cityName);
        const weatherData = await getWeatherForecast(
            location.latitude, 
            location.longitude, 
            currentForecastDays
        );
        
        const processedData = processWeatherData(weatherData, {
            name: location.name,
            country: location.country,
            lat: location.latitude,
            lon: location.longitude,
            admin1: location.admin1,
            timezone: location.timezone
        });
        
        currentLocation = processedData;
        
        hideLoading();
        displayLocationInfo(currentLocation);
        document.getElementById('view-toggle').style.display = 'flex';
        
        if (currentView === 'hourly') {
            showHourlyView();
        } else {
            showDailyView();
        }
        
        console.log('✅ Real weather data loaded from Open-Meteo');
        
    } catch (error) {
        console.error('Open-Meteo API error:', error);
        hideLoading();
        alert('❌ Error loading weather data. Please try again.');
    }
}

// ====================================
// EVENT LISTENERS
// ====================================
function setupEventListeners() {
    const searchBtn = document.getElementById('search-btn');
    const locationInput = document.getElementById('location-input');
    const viewButtons = document.querySelectorAll('[data-view]');
    const daysButtons = document.querySelectorAll('[data-days]');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (locationInput) {
        locationInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            viewButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentView = this.dataset.view;
            
            if (currentLocation) {
                if (currentView === 'hourly') {
                    showHourlyView();
                } else {
                    showDailyView();
                }
            }
        });
    });

    daysButtons.forEach(btn => {
        btn.addEventListener('click', async function() {
            daysButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentForecastDays = parseInt(this.dataset.days);
            
            if (currentLocation && currentView === 'daily') {
                if (currentLocation.location && currentLocation.location.name) {
                    await getForecast(currentLocation.location.name);
                }
            }
        });
    });
}

function handleSearch() {
    const input = document.getElementById('location-input');
    if (!input) return;
    
    const city = input.value.trim();
    if (!city) {
        alert('⚠️ Please enter a city name');
        return;
    }
    getForecast(city);
}

// ====================================
// QUICK CITIES
// ====================================
function initQuickCities() {
    const container = document.getElementById('quick-cities');
    if (!container) return;
    
    quickCities.forEach(city => {
        const chip = document.createElement('div');
        chip.className = 'city-chip';
        chip.textContent = city.name;
        chip.addEventListener('click', async () => {
            const input = document.getElementById('location-input');
            if (input) {
                input.value = city.name;
            }
            
            showLoading();
            try {
                const weatherData = await getWeatherForecast(city.lat, city.lon, currentForecastDays);
                const processedData = processWeatherData(weatherData, {
                    name: city.name,
                    country: city.country,
                    lat: city.lat,
                    lon: city.lon
                });
                
                currentLocation = processedData;
                hideLoading();
                displayLocationInfo(currentLocation);
                
                const viewToggle = document.getElementById('view-toggle');
                if (viewToggle) {
                    viewToggle.style.display = 'flex';
                }
                
                if (currentView === 'hourly') {
                    showHourlyView();
                } else {
                    showDailyView();
                }
            } catch (error) {
                console.error('Error fetching weather:', error);
                hideLoading();
                alert('❌ Error loading weather data');
            }
        });
        container.appendChild(chip);
    });
}

// ====================================
// DISPLAY FUNCTIONS
// ====================================
function showLoading() {
    const loading = document.getElementById('loading');
    const currentLocationDiv = document.getElementById('current-location');
    const hourlySection = document.getElementById('hourly-section');
    const dailySection = document.getElementById('daily-section');
    const forecastToggle = document.getElementById('forecast-toggle');
    const viewToggle = document.getElementById('view-toggle');
    
    if (loading) loading.style.display = 'block';
    if (currentLocationDiv) currentLocationDiv.style.display = 'none';
    if (hourlySection) hourlySection.style.display = 'none';
    if (dailySection) dailySection.style.display = 'none';
    if (forecastToggle) forecastToggle.style.display = 'none';
    if (viewToggle) viewToggle.style.display = 'none';
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

function displayLocationInfo(data) {
    if (!data || !data.location) return;
    
    const location = data.location;
    const current = data.current;
    
    const locationNameEl = document.getElementById('location-name');
    const locationCoordsEl = document.getElementById('location-coords');
    const currentTempEl = document.getElementById('current-temp');
    const currentConditionEl = document.getElementById('current-condition');
    const lastUpdatedEl = document.getElementById('last-updated');
    const currentLocationDiv = document.getElementById('current-location');
    
    if (locationNameEl) {
        locationNameEl.textContent = location.name + (location.country ? `, ${location.country}` : '');
    }
    
    if (locationCoordsEl) {
        locationCoordsEl.textContent = `Lat: ${location.lat}, Lon: ${location.lon}`;
    }
    
    if (current && currentTempEl) {
        currentTempEl.textContent = `${current.temp}°`;
    }
    
    if (current && currentConditionEl) {
        currentConditionEl.textContent = current.weather || 'N/A';
    }
    
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }
    
    if (currentLocationDiv) {
        currentLocationDiv.style.display = 'grid';
    }
}

function showHourlyView() {
    const hourlySection = document.getElementById('hourly-section');
    const dailySection = document.getElementById('daily-section');
    const forecastToggle = document.getElementById('forecast-toggle');
    
    if (hourlySection) hourlySection.style.display = 'block';
    if (dailySection) dailySection.style.display = 'none';
    if (forecastToggle) forecastToggle.style.display = 'none';
    
    if (currentLocation && currentLocation.hourlyForecast) {
        displayHourlyForecast(currentLocation.hourlyForecast);
    }
}

function showDailyView() {
    const hourlySection = document.getElementById('hourly-section');
    const dailySection = document.getElementById('daily-section');
    const forecastToggle = document.getElementById('forecast-toggle');
    
    if (hourlySection) hourlySection.style.display = 'none';
    if (dailySection) dailySection.style.display = 'block';
    if (forecastToggle) forecastToggle.style.display = 'flex';
    
    if (currentLocation && currentLocation.dailyForecast) {
        displayDailyForecast(currentLocation.dailyForecast, currentForecastDays);
    }
}

// ====================================
// HOURLY FORECAST DISPLAY
// ====================================
function displayHourlyForecast(hourlyData) {
    const grid = document.getElementById('hourly-grid');
    if (!grid || !hourlyData) return;
    
    grid.innerHTML = '';
    
    hourlyData.forEach((hour, index) => {
        const card = createHourlyCard(hour, index);
        grid.appendChild(card);
    });
    
    setTimeout(() => {
        grid.scrollTo({ left: 0, behavior: 'smooth' });
    }, 100);
}

function createHourlyCard(hour, index) {
    const card = document.createElement('div');
    card.className = 'hourly-card';
    
    const isNow = index === 0;
    const timeLabel = isNow ? 'Now' : hour.timeStr;
    const weatherIcon = weatherIcons[hour.weatherCode] || '☁️';
    
    card.innerHTML = `
        <div class="hourly-time">${timeLabel}</div>
        <div class="hourly-icon">${weatherIcon}</div>
        <div class="hourly-temp">${hour.temp}°</div>
        <div class="hourly-details">
            <div>💧 ${hour.humidity || 0}%</div>
            <div>💨 ${hour.windSpeed || 0} km/h</div>
            ${hour.precipProb && hour.precipProb > 0 ? `<div>🌧️ ${hour.precipProb}%</div>` : ''}
            ${hour.uvIndex && hour.uvIndex > 5 ? `<div>☀️ UV ${hour.uvIndex}</div>` : ''}
        </div>
    `;
    
    card.style.animation = 'slideIn 0.5s ease-out';
    card.style.animationDelay = `${index * 0.05}s`;
    
    return card;
}

// ====================================
// DAILY FORECAST DISPLAY
// ====================================
function displayDailyForecast(dailyData, days) {
    const grid = document.getElementById('forecast-grid');
    if (!grid || !dailyData) return;
    
    grid.innerHTML = '';
    
    const forecastToShow = dailyData.slice(0, days);
    
    forecastToShow.forEach((day, index) => {
        const card = createDailyCard(day, index);
        grid.appendChild(card);
    });
}

function createDailyCard(day, index) {
    const card = document.createElement('div');
    card.className = 'weather-card';
    
    const isToday = index === 0;
    const dateLabel = isToday ? 'Today' : day.dayName;
    const weatherIcon = weatherIcons[day.weatherCode] || '☁️';
    
    const uvWarning = day.uvIndex > 7 ? 'high' : day.uvIndex > 5 ? 'moderate' : 'low';
    const showUvWarning = day.uvIndex && day.uvIndex > 5;
    
    const precipitationHtml = day.precipitation && day.precipitation > 0 
        ? `<div class="detail-item">
            <span class="detail-icon">🌧️</span>
            <span class="detail-value">${day.precipitation.toFixed(1)}mm</span>
          </div>` 
        : '';
    
    const sunTimesHtml = day.sunrise && day.sunrise !== 'N/A' 
        ? `<div class="detail-item">
            <span class="detail-icon">🌅</span>
            <span class="detail-value">${day.sunrise}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">🌇</span>
            <span class="detail-value">${day.sunset}</span>
          </div>` 
        : '';
    
    card.innerHTML = `
        <div class="card-date">${dateLabel}</div>
        <div class="card-day">${day.dateStr}</div>
        
        <div class="card-weather-icon">
            ${weatherIcon}
        </div>
        
        <div class="card-temp">
            <span class="temp-main">${day.temp}°</span>
            <div class="temp-range">
                ${day.tempMin}° / ${day.tempMax}°
            </div>
        </div>
        
        <div class="card-description">
            ${day.weather}
        </div>
        
        <div class="card-details">
            <div class="detail-item">
                <span class="detail-icon">💧</span>
                <span class="detail-value">${day.precipProb || 0}%</span>
            </div>
            <div class="detail-item">
                <span class="detail-icon">💨</span>
                <span class="detail-value">${day.windSpeed} km/h</span>
            </div>
            ${precipitationHtml}
            <div class="detail-item">
                <span class="detail-icon">☀️</span>
                <span class="detail-value">UV ${day.uvIndex || 'N/A'}</span>
            </div>
            ${sunTimesHtml}
        </div>
    `;
    
    card.style.animation = 'fadeInUp 0.6s ease-out';
    card.style.animationDelay = `${index * 0.1}s`;
    
    return card;
}

// ====================================
// CONSOLE MESSAGES
// ====================================
console.log('%c☀️ Weather Forecast v2.0', 'color: #58a6ff; font-size: 20px; font-weight: bold;');
console.log('%cPowered by Open-Meteo API', 'color: #10b981; font-size: 12px;');
console.log('%cReal-time weather data!', 'color: #a371f7; font-size: 12px;');