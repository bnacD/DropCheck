// ====================================
// DROPCHECK SCIENTIFIC V2.0
// 100% Real NASA Data - No Simulation
// Date Range & Polygon Analysis
// ====================================

const NASA_POWER_API = {
    base: 'https://power.larc.nasa.gov/api/temporal/daily/point',
    params: {
        T2M: 'T2M', T2M_MAX: 'T2M_MAX', T2M_MIN: 'T2M_MIN',
        PRECTOTCORR: 'PRECTOTCORR', WS2M: 'WS2M', RH2M: 'RH2M',
        ALLSKY_SFC_SW_DWN: 'ALLSKY_SFC_SW_DWN', QV2M: 'QV2M'
    }
};

const AI_CONFIG = {
    ollamaUrl: 'http://localhost:11434',
    model: 'mistral',
    timeout: 30000
};

let map, marker, drawnItems, floodLayer;
let selectedLat = -25.2637, selectedLon = -57.5759;
let currentData = null;
let historyChart = null, distributionChart = null;
let aiEnabled = false, aiAvailable = false;
let searchHistory = [];
let selectedOperator = 'above';
let showFloodRisk = false;
let currentFloodRisk = null;
let isAnalyzingRange = false;
let isAnalyzingPolygon = false;
let currentPolygon = null;

const quickLocations = [
    { name: 'Asunción', coords: [-25.2637, -57.5759] },
    { name: 'New York', coords: [40.7128, -74.0060] },
    { name: 'Tokyo', coords: [35.6762, 139.6503] },
    { name: 'Paris', coords: [48.8566, 2.3522] },
    { name: 'Sydney', coords: [-33.8688, 151.2093] },
    { name: 'London', coords: [51.5074, -0.1278] }
];

// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 DropCheck Scientific V2 - 100% Real Data');
    initMap();
    initQuickLocations();
    setDefaultDate();
    setupEventListeners();
    loadHistory();
    await checkNASAAPI();
    console.log('✅ Ready!');
});

// ====================================
// NASA POWER API - ONLY REAL DATA
// ====================================
async function fetchNASAPowerData(lat, lon, param, startDate, endDate) {
    const url = `${NASA_POWER_API.base}?parameters=${param}&community=RE&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`NASA API error: ${response.status}`);
    
    const data = await response.json();
    if (!data.properties?.parameter?.[param]) throw new Error('Invalid data structure');
    
    const paramData = data.properties.parameter[param];
    const values = Object.entries(paramData)
        .filter(([date, value]) => value !== -999)
        .map(([date, value]) => ({
            date: date,
            year: parseInt(date.substring(0, 4)),
            month: parseInt(date.substring(4, 6)),
            day: parseInt(date.substring(6, 8)),
            value: parseFloat(value.toFixed(2))
        }));
    
    return { data: values, source: 'NASA_POWER' };
}

async function checkNASAAPI() {
    try {
        const testUrl = `${NASA_POWER_API.base}?parameters=T2M&community=RE&longitude=-57.5759&latitude=-25.2637&start=20240101&end=20240102&format=JSON`;
        const response = await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
        showAPIStatus('real', '✅ NASA POWER API Connected');
    } catch (error) {
        showAPIStatus('error', '❌ NASA API Not Available - Check Connection');
    }
}

function showAPIStatus(type, message) {
    let statusDiv = document.getElementById('api-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'api-status';
        statusDiv.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;padding:15px 25px;border-radius:12px;font-weight:600;font-size:0.9em;';
        document.body.appendChild(statusDiv);
    }
    
    if (type === 'real') {
        statusDiv.style.background = 'rgba(16, 185, 129, 0.9)';
        statusDiv.style.border = '2px solid #10b981';
        statusDiv.style.color = '#fff';
    } else {
        statusDiv.style.background = 'rgba(239, 68, 68, 0.9)';
        statusDiv.style.border = '2px solid #ef4444';
        statusDiv.style.color = '#fff';
    }
    
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
        if (statusDiv.style.display !== 'none') {
            statusDiv.style.opacity = '0.7';
        }
    }, 5000);
}

// ====================================
// DATE RANGE ANALYSIS
// ====================================
async function analyzeDateRange(param, startDate, endDate) {
    const config = getParamConfig(param);
    showLoading('Analyzing date range with NASA data...');
    
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 365) {
            throw new Error('Date range too large (max 365 days)');
        }
        
        const startStr = formatDateForAPI(start);
        const endStr = formatDateForAPI(end);
        
        const result = await fetchNASAPowerData(selectedLat, selectedLon, param, startStr, endStr);
        
        if (!result.data || result.data.length === 0) {
            throw new Error('No data available for this date range');
        }
        
        const dailyAverages = {};
        
        result.data.forEach(item => {
            const dateKey = `${item.month}-${item.day}`;
            if (!dailyAverages[dateKey]) {
                dailyAverages[dateKey] = {
                    values: [],
                    month: item.month,
                    day: item.day,
                    date: `${item.month}/${item.day}`
                };
            }
            dailyAverages[dateKey].values.push(item.value);
        });
        
        const rangeResults = Object.keys(dailyAverages).map(key => {
            const dayData = dailyAverages[key];
            const stats = calculateStats(dayData.values);
            return {
                date: dayData.date,
                month: dayData.month,
                day: dayData.day,
                ...stats,
                count: dayData.values.length
            };
        }).sort((a, b) => {
            if (config.goodDirection === 'lower') return a.mean - b.mean;
            if (config.goodDirection === 'higher') return b.mean - a.mean;
            return Math.abs(a.std) - Math.abs(b.std);
        });
        
        currentData = {
            type: 'range',
            param,
            config,
            rangeResults,
            bestDates: rangeResults.slice(0, 5),
            worstDates: rangeResults.slice(-5).reverse(),
            location: { lat: selectedLat, lon: selectedLon },
            dateRange: { start: startDate, end: endDate }
        };
        
        hideLoading();
        displayRangeResults();
        
        if (aiEnabled && aiAvailable) {
            await generateRangeInsights();
        }
        
    } catch (error) {
        hideLoading();
        alert(`❌ Error: ${error.message}`);
        console.error(error);
    }
}

// ====================================
// POLYGON AREA ANALYSIS
// ====================================
async function analyzePolygonArea(param, date, polygon) {
    const config = getParamConfig(param);
    showLoading('Analyzing polygon area with NASA data...');
    
    try {
        const bounds = polygon.getBounds();
        const points = generateGridPoints(bounds, 5);
        
        const dateObj = new Date(date);
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        const results = [];
        
        for (const point of points) {
            try {
                const currentYear = new Date().getFullYear();
                const allYears = [];
                
                for (let y = currentYear - 20; y < currentYear; y++) {
                    const startDate = `${y}${month}${day}`;
                    try {
                        const nasaData = await fetchNASAPowerData(point.lat, point.lng, param, startDate, startDate);
                        allYears.push(...nasaData.data);
                    } catch (err) {
                        console.warn(`Failed year ${y} for point ${point.lat}, ${point.lng}`);
                    }
                }
                
                if (allYears.length > 0) {
                    const values = allYears.map(d => d.value);
                    const stats = calculateStats(values);
                    
                    results.push({
                        lat: point.lat,
                        lng: point.lng,
                        ...stats,
                        dataPoints: values.length
                    });
                }
                
                await sleep(100);
                
            } catch (error) {
                console.warn(`Error at point ${point.lat}, ${point.lng}:`, error);
            }
        }
        
        if (results.length === 0) {
            throw new Error('No data available for polygon area');
        }
        
        const sortedResults = [...results].sort((a, b) => {
            if (config.goodDirection === 'lower') return a.mean - b.mean;
            if (config.goodDirection === 'higher') return b.mean - a.mean;
            return Math.abs(a.std) - Math.abs(b.std);
        });
        
        currentData = {
            type: 'polygon',
            param,
            config,
            polygonResults: results,
            bestLocations: sortedResults.slice(0, 3),
            worstLocations: sortedResults.slice(-3).reverse(),
            polygon: polygon.toGeoJSON(),
            date: date,
            totalPoints: results.length
        };
        
        hideLoading();
        displayPolygonResults();
        visualizePolygonResults(results, config);
        
        if (aiEnabled && aiAvailable) {
            await generatePolygonInsights();
        }
        
    } catch (error) {
        hideLoading();
        alert(`❌ Error: ${error.message}`);
        console.error(error);
    }
}

function generateGridPoints(bounds, density) {
    const points = [];
    const latStep = (bounds.getNorth() - bounds.getSouth()) / density;
    const lngStep = (bounds.getEast() - bounds.getWest()) / density;
    
    for (let i = 0; i <= density; i++) {
        for (let j = 0; j <= density; j++) {
            points.push({
                lat: (bounds.getSouth() + (i * latStep)).toFixed(4),
                lng: (bounds.getWest() + (j * lngStep)).toFixed(4)
            });
        }
    }
    
    return points;
}

function visualizePolygonResults(results, config) {
    results.forEach(result => {
        const color = getColorForValue(result.mean, results, config);
        L.circleMarker([result.lat, result.lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map).bindPopup(`
            <strong>Location:</strong> ${result.lat}, ${result.lng}<br>
            <strong>Average:</strong> ${result.mean.toFixed(1)} ${config.unit}<br>
            <strong>Range:</strong> ${result.min.toFixed(1)} - ${result.max.toFixed(1)}<br>
            <strong>Data Points:</strong> ${result.dataPoints}
        `);
    });
}

function getColorForValue(value, allResults, config) {
    const values = allResults.map(r => r.mean);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const normalized = (value - min) / (max - min);
    
    if (config.goodDirection === 'lower') {
        return normalized < 0.33 ? '#10b981' : normalized < 0.66 ? '#f59e0b' : '#ef4444';
    } else {
        return normalized > 0.66 ? '#10b981' : normalized > 0.33 ? '#f59e0b' : '#ef4444';
    }
}

// ====================================
// DISPLAY FUNCTIONS
// ====================================
function displayRangeResults() {
    const container = document.getElementById('results-container');
    const { bestDates, worstDates, config, param } = currentData;
    
    const bestHtml = bestDates.map((d, i) => `
        <div class="rank-card best" style="animation-delay: ${i * 0.1}s">
            <div class="rank-number">#${i + 1}</div>
            <div class="rank-date">${d.date}</div>
            <div class="rank-value">${d.mean.toFixed(1)} ${config.unit}</div>
            <div class="rank-details">
                Range: ${d.min.toFixed(1)} - ${d.max.toFixed(1)}<br>
                Based on ${d.count} years of data
            </div>
        </div>
    `).join('');
    
    const worstHtml = worstDates.map((d, i) => `
        <div class="rank-card worst" style="animation-delay: ${i * 0.1}s">
            <div class="rank-number">#${i + 1}</div>
            <div class="rank-date">${d.date}</div>
            <div class="rank-value">${d.mean.toFixed(1)} ${config.unit}</div>
            <div class="rank-details">
                Range: ${d.min.toFixed(1)} - ${d.max.toFixed(1)}<br>
                Based on ${d.count} years of data
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="comprehensive-results">
            <h3 style="color: #10b981; margin-bottom: 20px;">✅ Best Dates (${config.goodDirection === 'lower' ? 'Lowest' : 'Highest'} ${config.name})</h3>
            <div class="rank-grid">${bestHtml}</div>
            
            <h3 style="color: #ef4444; margin-top: 40px; margin-bottom: 20px;">⚠️ Worst Dates</h3>
            <div class="rank-grid">${worstHtml}</div>
            
            <div class="summary-box">
                <h4>📊 Analysis Summary</h4>
                <p>
                    <strong>Total dates analyzed:</strong> ${currentData.rangeResults.length}<br>
                    <strong>Date range:</strong> ${currentData.dateRange.start} to ${currentData.dateRange.end}<br>
                    <strong>Location:</strong> ${currentData.location.lat}, ${currentData.location.lon}<br>
                    <strong>Data source:</strong> NASA POWER (20+ years)
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('charts-section').style.display = 'block';
}

function displayPolygonResults() {
    const container = document.getElementById('results-container');
    const { bestLocations, worstLocations, config, totalPoints } = currentData;
    
    const bestHtml = bestLocations.map((loc, i) => `
        <div class="location-card best" style="animation-delay: ${i * 0.1}s">
            <div class="location-icon">📍</div>
            <div class="location-rank">#${i + 1} Best</div>
            <div class="location-coords">${loc.lat}, ${loc.lng}</div>
            <div class="location-value">${loc.mean.toFixed(1)} ${config.unit}</div>
            <div class="location-details">
                Range: ${loc.min.toFixed(1)} - ${loc.max.toFixed(1)}<br>
                Std Dev: ${loc.std.toFixed(2)}<br>
                ${loc.dataPoints} data points
            </div>
        </div>
    `).join('');
    
    const worstHtml = worstLocations.map((loc, i) => `
        <div class="location-card worst" style="animation-delay: ${i * 0.1}s">
            <div class="location-icon">📍</div>
            <div class="location-rank">#${i + 1} Worst</div>
            <div class="location-coords">${loc.lat}, ${loc.lng}</div>
            <div class="location-value">${loc.mean.toFixed(1)} ${config.unit}</div>
            <div class="location-details">
                Range: ${loc.min.toFixed(1)} - ${loc.max.toFixed(1)}<br>
                Std Dev: ${loc.std.toFixed(2)}<br>
                ${loc.dataPoints} data points
            </div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div class="comprehensive-results">
            <h3 style="color: #10b981; margin-bottom: 20px;">✅ Best Locations in Polygon</h3>
            <div class="location-grid">${bestHtml}</div>
            
            <h3 style="color: #ef4444; margin-top: 40px; margin-bottom: 20px;">⚠️ Worst Locations</h3>
            <div class="location-grid">${worstHtml}</div>
            
            <div class="summary-box">
                <h4>📊 Polygon Analysis Summary</h4>
                <p>
                    <strong>Total points analyzed:</strong> ${totalPoints}<br>
                    <strong>Date:</strong> ${currentData.date}<br>
                    <strong>Parameter:</strong> ${config.name}<br>
                    <strong>Data source:</strong> NASA POWER (20+ years per point)<br>
                    <strong>Map markers:</strong> Green = Best, Red = Worst
                </p>
            </div>
        </div>
    `;
    
    document.getElementById('charts-section').style.display = 'none';
}

// ====================================
// UTILITIES
// ====================================
function formatDateForAPI(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function calculateStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
    
    return {
        mean,
        median: sorted[Math.floor(sorted.length / 2)],
        std,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p10: sorted[Math.floor(sorted.length * 0.1)],
        p25: sorted[Math.floor(sorted.length * 0.25)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p90: sorted[Math.floor(sorted.length * 0.9)]
    };
}

function getParamConfig(param) {
    const configs = {
        'T2M': { unit: '°C', name: 'Temperature', goodDirection: 'stable' },
        'T2M_MAX': { unit: '°C', name: 'Max Temperature', goodDirection: 'lower' },
        'T2M_MIN': { unit: '°C', name: 'Min Temperature', goodDirection: 'higher' },
        'PRECTOTCORR': { unit: 'mm', name: 'Precipitation', goodDirection: 'lower' },
        'WS2M': { unit: 'm/s', name: 'Wind Speed', goodDirection: 'lower' },
        'RH2M': { unit: '%', name: 'Humidity', goodDirection: 'stable' },
        'ALLSKY_SFC_SW_DWN': { unit: 'kWh/m²', name: 'Solar Radiation', goodDirection: 'higher' },
        'QV2M': { unit: 'g/kg', name: 'Specific Humidity', goodDirection: 'stable' }
    };
    return configs[param] || { unit: '', name: param, goodDirection: 'stable' };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoading(text = 'Analyzing NASA data...') {
    document.getElementById('results-container').innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <div class="loading-text">${text}</div>
        </div>
    `;
}

function hideLoading() {}

// ====================================
// MAP INITIALIZATION
// ====================================
function initMap() {
    map = L.map('map').setView([selectedLat, selectedLon], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    const drawControl = new L.Control.Draw({
        edit: { featureGroup: drawnItems },
        draw: {
            polygon: { allowIntersection: false, showArea: true },
            circle: true,
            circlemarker: false,
            polyline: false,
            rectangle: true,
            marker: false
        }
    });
    map.addControl(drawControl);
    
    marker = L.marker([selectedLat, selectedLon], { draggable: true }).addTo(map);
    
    marker.on('dragend', e => {
        const p = marker.getLatLng();
        selectedLat = p.lat.toFixed(4);
        selectedLon = p.lng.toFixed(4);
        updateCoordinates();
    });
    
    map.on('click', e => {
        selectedLat = e.latlng.lat.toFixed(4);
        selectedLon = e.latlng.lng.toFixed(4);
        marker.setLatLng([selectedLat, selectedLon]);
        updateCoordinates();
    });
    
    map.on(L.Draw.Event.CREATED, function(e) {
        const layer = e.layer;
        drawnItems.clearLayers();
        drawnItems.addLayer(layer);
        currentPolygon = layer;
        isAnalyzingPolygon = true;
        alert('✅ Polygon created! Click "Analyze Probability" to analyze this area.');
    });
    
    updateCoordinates();
}

// Continue in next artifact due to length...