// ====================================
// DROPCHECK SCIENTIFIC - COMPLETE
// Flood Risk Integrated in Results
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
let isRangeMode = false, useRealAPI = true;
let searchHistory = [];
let selectedOperator = 'above';
let showFloodRisk = false;
let currentFloodRisk = null;

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
    console.log('🚀 DropCheck Scientific - Initializing...');
    initMap();
    initQuickLocations();
    setDefaultDate();
    setupEventListeners();
    loadHistory();
    await checkNASAAPI();
    console.log('✅ Ready!');
});

// ====================================
// FLOOD RISK ANALYSIS - INTEGRATED
// ====================================
async function getElevation(lat, lon) {
    try {
        const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
        const data = await response.json();
        return data.results[0].elevation;
    } catch (error) {
        console.warn('Elevation API error, using estimate');
        return Math.abs(lat) < 30 ? 10 : 100;
    }
}

async function analyzeFloodRisk(lat, lon) {
    try {
        console.log('🌊 Analyzing flood risk...');
        
        const elevation = await getElevation(lat, lon);
        
        // Get precipitation from NASA
        const currentYear = new Date().getFullYear();
        let avgPrecip = 50;
        let maxPrecip = 100;
        
        try {
            const precipData = await fetchNASAPowerData(lat, lon, 'PRECTOTCORR', 
                `${currentYear - 1}0101`, `${currentYear - 1}1231`);
            const precipValues = precipData.data.map(d => d.value);
            avgPrecip = precipValues.reduce((a, b) => a + b, 0) / precipValues.length;
            maxPrecip = Math.max(...precipValues);
        } catch (e) {
            console.warn('Using estimated precipitation');
        }
        
        // Calculate slope
        const nearbyElevations = await Promise.all([
            getElevation(lat + 0.01, lon).catch(() => elevation),
            getElevation(lat - 0.01, lon).catch(() => elevation),
            getElevation(lat, lon + 0.01).catch(() => elevation),
            getElevation(lat, lon - 0.01).catch(() => elevation)
        ]);
        
        const elevationDiff = Math.max(...nearbyElevations) - Math.min(...nearbyElevations);
        const slope = elevationDiff / 1.1;
        
        // Calculate risk score
        let riskScore = 0;
        
        if (elevation < 5) riskScore += 40;
        else if (elevation < 10) riskScore += 30;
        else if (elevation < 20) riskScore += 15;
        
        if (maxPrecip > 100) riskScore += 30;
        else if (maxPrecip > 50) riskScore += 20;
        
        if (slope < 2) riskScore += 20;
        else if (slope < 5) riskScore += 10;
        
        if (Math.abs(lat) < 45 && elevation < 30) riskScore += 10;
        
        riskScore = Math.min(riskScore, 100);
        
        // Get clear message
        let message, category, color;
        
        if (riskScore >= 80) {
            category = 'Muy Alto';
            message = 'Muy probable a inundarse';
            color = '#dc2626';
        } else if (riskScore >= 60) {
            category = 'Alto';
            message = 'Probable a inundarse';
            color = '#ef4444';
        } else if (riskScore >= 40) {
            category = 'Moderado';
            message = 'Posible riesgo de inundación';
            color = '#f59e0b';
        } else if (riskScore >= 20) {
            category = 'Bajo';
            message = 'Poco probable a inundarse';
            color = '#10b981';
        } else {
            category = 'Muy Bajo';
            message = 'Muy poco probable a inundarse';
            color = '#059669';
        }
        
        return {
            riskScore,
            category,
            message,
            color,
            elevation: elevation.toFixed(1),
            avgPrecip: avgPrecip.toFixed(1),
            maxPrecip: maxPrecip.toFixed(1),
            slope: slope.toFixed(1)
        };
        
    } catch (error) {
        console.error('Flood analysis error:', error);
        return {
            riskScore: 0,
            category: 'No disponible',
            message: 'No se pudo calcular',
            color: '#6b7280',
            elevation: 'N/A',
            avgPrecip: 'N/A',
            maxPrecip: 'N/A',
            slope: 'N/A'
        };
    }
}

// ====================================
// NASA POWER API
// ====================================
async function fetchNASAPowerData(lat, lon, param, startDate, endDate) {
    const url = `${NASA_POWER_API.base}?parameters=${param}&community=RE&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`NASA API error: ${response.status}`);
        
        const data = await response.json();
        if (!data.properties?.parameter?.[param]) throw new Error('Invalid data');
        
        const paramData = data.properties.parameter[param];
        const values = Object.entries(paramData)
            .filter(([date, value]) => value !== -999)
            .map(([date, value]) => ({
                date: date,
                year: parseInt(date.substring(0, 4)),
                value: parseFloat(value.toFixed(2))
            }));
        
        return { data: values, source: 'NASA_POWER' };
        
    } catch (error) {
        throw error;
    }
}

async function checkNASAAPI() {
    try {
        const testUrl = `${NASA_POWER_API.base}?parameters=T2M&community=RE&longitude=-57.5759&latitude=-25.2637&start=20240101&end=20240102&format=JSON`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        
        if (response.ok) {
            useRealAPI = true;
            showAPIStatus('real', '✅ NASA POWER API Connected');
        } else throw new Error('API not available');
    } catch (error) {
        useRealAPI = false;
        showAPIStatus('simulated', '⚠️ Using Simulated Data');
    }
}

function showAPIStatus(type, message) {
    const status = document.getElementById('api-status');
    status.className = `api-status show ${type}`;
    status.textContent = message;
}

function getParamConfig(param) {
    const configs = {
        'T2M': { unit: '°C', name: 'Temperature', goodDirection: 'stable', suggestedThreshold: 30 },
        'T2M_MAX': { unit: '°C', name: 'Max Temperature', goodDirection: 'lower', suggestedThreshold: 35 },
        'T2M_MIN': { unit: '°C', name: 'Min Temperature', goodDirection: 'higher', suggestedThreshold: 10 },
        'PRECTOTCORR': { unit: 'mm', name: 'Precipitation', goodDirection: 'lower', suggestedThreshold: 10 },
        'WS2M': { unit: 'm/s', name: 'Wind Speed', goodDirection: 'lower', suggestedThreshold: 15 },
        'RH2M': { unit: '%', name: 'Humidity', goodDirection: 'stable', suggestedThreshold: 80 },
        'ALLSKY_SFC_SW_DWN': { unit: 'kWh/m²', name: 'Solar Radiation', goodDirection: 'higher', suggestedThreshold: 6 },
        'QV2M': { unit: 'g/kg', name: 'Specific Humidity', goodDirection: 'stable', suggestedThreshold: 15 }
    };
    return configs[param] || { unit: '', name: param, goodDirection: 'stable', suggestedThreshold: 0 };
}

// ====================================
// MAP WITH DRAWING TOOLS
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
    
    updateCoordinates();
}

// ====================================
// STATISTICS & CALCULATIONS
// ====================================
function calculateStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
    const mid = Math.floor(values.length / 2);
    const first = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const second = values.slice(mid).reduce((a, b) => a + b, 0) / Math.ceil(values.length / 2);
    
    return {
        mean, median: sorted[Math.floor(sorted.length / 2)], std,
        p10: sorted[Math.floor(sorted.length * 0.1)],
        p25: sorted[Math.floor(sorted.length * 0.25)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        trend: second > first ? 'Increasing' : 'Decreasing',
        trendPercent: Math.abs(((second - first) / first) * 100),
        min: sorted[0], max: sorted[sorted.length - 1]
    };
}

function calculateThresholdProbability(values, threshold, operator = 'above') {
    const count = operator === 'above' 
        ? values.filter(v => v > threshold).length
        : values.filter(v => v < threshold).length;
    
    return {
        probability: (count / values.length) * 100,
        count: count,
        total: values.length
    };
}

function analyzeExtremeEvents(data, config) {
    const { values, param } = data;
    const stats = calculateStats(values);
    
    const extremeHigh = stats.p90;
    const midPoint = Math.floor(values.length / 2);
    const firstDecade = values.slice(0, midPoint);
    const secondDecade = values.slice(midPoint);
    
    const extremeHighFirst = firstDecade.filter(v => v > extremeHigh).length;
    const extremeHighSecond = secondDecade.filter(v => v > extremeHigh).length;
    
    let changePercent = 0;
    if (extremeHighFirst === 0 && extremeHighSecond > 0) {
        changePercent = 100;
    } else if (extremeHighFirst > 0) {
        changePercent = ((extremeHighSecond - extremeHighFirst) / extremeHighFirst) * 100;
    }
    
    return {
        extremeThreshold: extremeHigh,
        firstDecadeCount: extremeHighFirst,
        secondDecadeCount: extremeHighSecond,
        change: changePercent,
        increasing: extremeHighSecond > extremeHighFirst
    };
}

// ====================================
// HISTORY SYSTEM
// ====================================
function saveToHistory(data) {
    const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        location: data.location || { lat: selectedLat, lon: selectedLon },
        param: data.param,
        date: data.date,
        stats: data.stats,
        config: data.config
    };
    
    searchHistory.unshift(historyItem);
    if (searchHistory.length > 20) searchHistory.pop();
    
    localStorage.setItem('dropcheck_history', JSON.stringify(searchHistory));
    updateHistoryDisplay();
}

function loadHistory() {
    const stored = localStorage.getItem('dropcheck_history');
    if (stored) {
        searchHistory = JSON.parse(stored);
        updateHistoryDisplay();
    }
}

function updateHistoryDisplay() {
    const list = document.getElementById('history-list');
    if (!list) return;
    
    if (searchHistory.length === 0) {
        list.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">No history yet</p>';
        return;
    }
    
    list.innerHTML = searchHistory.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-item-header">
                <span class="history-item-title">${item.config.name}</span>
                <span class="history-item-date">${new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
            <div class="history-item-details">
                📍 ${item.location.name || `${item.location.lat}, ${item.location.lon}`}<br>
                📅 ${item.date}<br>
                📊 Avg: ${item.stats.mean.toFixed(1)}${item.config.unit}
            </div>
        </div>
    `).join('');
    
    list.innerHTML += `<button class="history-clear" onclick="clearHistory()">🗑️ Clear History</button>`;
    
    document.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            loadHistoryItem(id);
        });
    });
}

function loadHistoryItem(id) {
    const item = searchHistory.find(h => h.id === id);
    if (!item) return;
    
    currentData = item;
    displayResults(item.stats, item.config, item.param, null);
}

function clearHistory() {
    if (confirm('Clear all search history?')) {
        searchHistory = [];
        localStorage.removeItem('dropcheck_history');
        updateHistoryDisplay();
    }
}

// ====================================
// ANALYSIS FUNCTIONS
// ====================================
async function analyzeWeather() {
    const param = document.getElementById('weather-param').value;
    await analyzeSingle(param);
}

async function analyzeSingle(param) {
    const dateInput = document.getElementById('date-input').value;
    if (!dateInput) { alert('Select date'); return; }
    
    const date = new Date(dateInput);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    showLoading();
    
    // Analyze flood risk in parallel if enabled
    let floodRiskPromise = null;
    if (showFloodRisk) {
        floodRiskPromise = analyzeFloodRisk(selectedLat, selectedLon);
    }
    
    try {
        let result;
        const config = getParamConfig(param);
        
        if (useRealAPI) {
            const currentYear = new Date().getFullYear();
            const years = [];
            
            for (let y = currentYear - 20; y < currentYear; y++) {
                const startDate = `${y}${month}${day}`;
                try {
                    const nasaData = await fetchNASAPowerData(selectedLat, selectedLon, param, startDate, startDate);
                    years.push(...nasaData.data);
                } catch (err) {
                    console.warn(`Failed year ${y}`);
                }
            }
            
            if (years.length > 0) {
                result = { data: years, config, source: 'NASA_POWER' };
            } else {
                throw new Error('No data');
            }
        } else {
            result = generateHistoricalData(param, date.getMonth() + 1, date.getDate());
            result.source = 'SIMULATED';
        }
        
        const values = result.data.map(d => d.value);
        const stats = calculateStats(values);
        
        const thresholdValue = parseFloat(document.getElementById('threshold-value').value);
        let thresholdProb = null;
        
        if (!isNaN(thresholdValue)) {
            thresholdProb = calculateThresholdProbability(values, thresholdValue, selectedOperator);
        }
        
        const extremeAnalysis = analyzeExtremeEvents({ values, param }, config);
        
        // Wait for flood risk if analyzing
        if (floodRiskPromise) {
            currentFloodRisk = await floodRiskPromise;
        }
        
        currentData = { 
            data: result.data, config, stats, param, date: dateInput, 
            isRange: false, thresholdProb, thresholdValue,
            thresholdOperator: selectedOperator, extremeAnalysis,
            source: result.source, values,
            location: { lat: selectedLat, lon: selectedLon }
        };
        
        hideLoading();
        displayResults(stats, config, param, thresholdProb);
        displayChart(result.data, config, stats);
        displayDistributionChart(values, stats, config);
        displayExtremeAnalysis(extremeAnalysis, config);
        document.getElementById('charts-section').style.display = 'block';
        
        saveToHistory(currentData);
        
        if (aiEnabled && aiAvailable) {
            await generateAndDisplayInsights();
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        hideLoading();
        alert('Error analyzing data');
    }
}

// ====================================
// DISPLAY FUNCTIONS - INTEGRATED FLOOD
// ====================================
function showLoading() {
    document.getElementById('results-container').innerHTML = `
        <div class="loading"><div class="loading-spinner"></div><div class="loading-text">Analyzing NASA data...</div></div>
    `;
}

function hideLoading() {}

function displayResults(stats, config, param, thresholdProb) {
    const names = {
        'T2M': 'Temperature', 'T2M_MAX': 'Max Temp', 'T2M_MIN': 'Min Temp',
        'PRECTOTCORR': 'Precipitation', 'WS2M': 'Wind', 'RH2M': 'Humidity',
        'ALLSKY_SFC_SW_DWN': 'Solar', 'QV2M': 'Specific Humidity'
    };
    
    let thresholdHtml = '';
    if (thresholdProb) {
        const op = selectedOperator === 'above' ? '>' : '<';
        const val = document.getElementById('threshold-value').value;
        thresholdHtml = `
            <div class="metric-card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));">
                <h3>🎯 Custom Threshold</h3>
                <div class="value">${thresholdProb.probability.toFixed(1)}%</div>
                <div class="unit">Probability ${op} ${val}${config.unit}</div>
            </div>
        `;
    }
    
    // INTEGRATED FLOOD RISK CARD
    let floodHtml = '';
    if (showFloodRisk && currentFloodRisk) {
        floodHtml = `
            <div class="metric-card" style="background: linear-gradient(135deg, ${currentFloodRisk.color}22, ${currentFloodRisk.color}11); border: 2px solid ${currentFloodRisk.color}55;">
                <h3>🌊 Flood Risk</h3>
                <div class="value" style="color: ${currentFloodRisk.color};">${currentFloodRisk.riskScore}</div>
                <div class="unit" style="color: ${currentFloodRisk.color}; font-weight: 700; font-size: 1.1em;">
                    ${currentFloodRisk.message}
                </div>
                <div style="margin-top: 10px; font-size: 0.85em; color: rgba(255,255,255,0.7); line-height: 1.4;">
                    Elevación: ${currentFloodRisk.elevation}m<br>
                    Precip. máx: ${currentFloodRisk.maxPrecip}mm<br>
                    Categoría: ${currentFloodRisk.category}
                </div>
            </div>
        `;
    }
    
    document.getElementById('results-container').innerHTML = `
        <div class="results-grid">
            <div class="metric-card"><h3>Average</h3><div class="value">${stats.mean.toFixed(1)}</div><div class="unit">${config.unit}</div></div>
            <div class="metric-card"><h3>Median</h3><div class="value">${stats.median.toFixed(1)}</div><div class="unit">${config.unit}</div></div>
            <div class="metric-card"><h3>10th %</h3><div class="value">${stats.p10.toFixed(1)}</div><div class="unit">${config.unit}</div></div>
            <div class="metric-card"><h3>90th %</h3><div class="value">${stats.p90.toFixed(1)}</div><div class="unit">${config.unit}</div></div>
            ${thresholdHtml}
            ${floodHtml}
        </div>
        <div class="info-box">
            <h3>🎯 Analysis (${currentData.source})</h3>
            <p>Based on NASA POWER data for ${names[param]}:<br><br>
            • 80% probability: ${stats.p10.toFixed(1)}-${stats.p90.toFixed(1)} ${config.unit}<br>
            • Most likely: ${stats.mean.toFixed(1)} ${config.unit}<br>
            • Trend: ${stats.trend} ${stats.trendPercent.toFixed(1)}%</p>
        </div>
    `;
}

function displayDistributionChart(values, stats, config) {
    const ctx = document.getElementById('distributionChart');
    if (distributionChart) distributionChart.destroy();
    
    const binCount = 15;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / binCount;
    const bins = Array(binCount).fill(0);
    const binLabels = [];
    
    for (let i = 0; i < binCount; i++) {
        binLabels.push((min + i * binSize).toFixed(1));
    }
    
    values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binSize), binCount - 1);
        bins[binIndex]++;
    });
    
    const percentages = bins.map(count => (count / values.length) * 100);
    
    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: binLabels,
            datasets: [{
                label: 'Probability Distribution (%)',
                data: percentages,
                backgroundColor: 'rgba(88, 166, 255, 0.6)',
                borderColor: '#58a6ff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: '#fff' } },
                title: { display: true, text: `Distribution (${config.unit})`, color: '#fff', font: { size: 16, weight: 'bold' } }
            },
            scales: {
                y: { title: { display: true, text: 'Probability (%)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                x: { title: { display: true, text: `Value (${config.unit})`, color: '#fff' }, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#fff' } }
            }
        }
    });
}

function displayExtremeAnalysis(analysis, config) {
    const container = document.getElementById('extreme-analysis');
    const color = analysis.increasing ? '#ef4444' : '#10b981';
    const direction = analysis.increasing ? 'increased' : 'decreased';
    
    let changeText = '';
    if (analysis.firstDecadeCount === 0 && analysis.secondDecadeCount === 0) {
        changeText = '<span style="color: #10b981;">NO EXTREME EVENTS detected in either decade</span>';
    } else if (analysis.firstDecadeCount === 0) {
        changeText = `<span style="color: ${color};">NEW EVENTS appeared (${analysis.secondDecadeCount} in 2nd decade)</span>`;
    } else {
        changeText = `<span style="color: ${color}; font-size: 1.2em; font-weight: bold;">
            ${direction.toUpperCase()} by ${Math.abs(analysis.change).toFixed(1)}%
        </span>`;
    }
    
    container.innerHTML = `
        <h4 style="color: #ef4444; margin-bottom: 15px;">🔥 Extreme Events Analysis</h4>
        <p style="color: rgba(255,255,255,0.9); line-height: 1.6;">
            <strong>Extreme Threshold:</strong> ${analysis.extremeThreshold.toFixed(1)} ${config.unit} (90th percentile)<br><br>
            <strong>First Decade:</strong> ${analysis.firstDecadeCount} events<br>
            <strong>Second Decade:</strong> ${analysis.secondDecadeCount} events<br><br>
            ${changeText}
        </p>
    `;
    container.style.display = 'block';
}

function displayChart(data, config, stats) {
    const ctx = document.getElementById('historyChart');
    if (historyChart) historyChart.destroy();
    
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.year || d.date.substring(0, 4)),
            datasets: [{
                label: `Values (${config.unit})`,
                data: data.map(d => d.value),
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88,166,255,0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }, {
                label: 'Average',
                data: Array(data.length).fill(stats.mean),
                borderColor: '#a371f7',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, labels: { color: '#fff' } },
                title: { display: true, text: 'Historical Trend (NASA Data)', color: '#fff', font: { size: 16, weight: 'bold' } }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#fff' } }
            }
        }
    });
}

// ====================================
// AI ASSISTANT
// ====================================
async function checkAIAvailable() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(`${AI_CONFIG.ollamaUrl}/api/tags`, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function generateAIResponse(prompt) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeout);
        
        const response = await fetch(`${AI_CONFIG.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: AI_CONFIG.model,
                prompt: prompt,
                stream: false,
                options: { temperature: 0.7, num_predict: 200 }
            })
        });
        
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('AI error');
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        throw error;
    }
}

async function handleAIQuestion() {
    const input = document.getElementById('ai-input');
    const question = input.value.trim();
    if (!question || !aiEnabled || !aiAvailable) return;
    
    addChatMessage(question, 'user');
    input.value = '';
    
    const messages = document.getElementById('ai-messages');
    const loading = document.createElement('div');
    loading.className = 'ai-loading';
    loading.innerHTML = '<div class="ai-loading-spinner"></div><div>Thinking...</div>';
    messages.appendChild(loading);
    
    try {
        if (!currentData) {
            throw new Error('Run analysis first');
        }
        
        const context = `Data: ${currentData.config.name} at ${currentData.location.lat}, ${currentData.location.lon}. 
Average: ${currentData.stats.mean.toFixed(1)}${currentData.config.unit}. 
Trend: ${currentData.stats.trend} ${currentData.stats.trendPercent.toFixed(1)}%.
Question: ${question}
Answer in 2-3 sentences:`;
        
        const answer = await generateAIResponse(context);
        loading.remove();
        addChatMessage(answer, 'assistant');
    } catch (error) {
        loading.remove();
        addChatMessage(`Error: ${error.message}`, 'assistant');
    }
}

function addChatMessage(text, type) {
    const msgs = document.getElementById('ai-messages');
    const msg = document.createElement('div');
    msg.className = `ai-message ${type}`;
    msg.textContent = text;
    msgs.appendChild(msg);
    msgs.scrollTop = msgs.scrollHeight;
}

async function generateAndDisplayInsights() {
    // Placeholder
}

function updateAIStatus() {
    const statusEl = document.getElementById('ai-status-panel');
    const floatingBtn = document.getElementById('ai-floating-btn');
    
    if (aiEnabled) {
        floatingBtn.classList.add('show');
        statusEl.textContent = aiAvailable ? '✅ AI Online' : '⚠️ AI Offline (Install Ollama)';
        statusEl.className = aiAvailable ? 'ai-status' : 'ai-status offline';
        document.getElementById('ai-input').disabled = !aiAvailable;
        document.getElementById('ai-send').disabled = !aiAvailable;
    } else {
        floatingBtn.classList.remove('show');
        document.getElementById('ai-panel').classList.remove('open');
    }
}

// ====================================
// EVENT LISTENERS
// ====================================
function setupEventListeners() {
    document.getElementById('analyze-btn').addEventListener('click', analyzeWeather);
    document.getElementById('export-csv').addEventListener('click', exportCSV);
    document.getElementById('export-json').addEventListener('click', exportJSON);
    
    const floodToggle = document.getElementById('flood-risk-toggle');
    if (floodToggle) {
        floodToggle.addEventListener('change', function(e) {
            showFloodRisk = e.target.checked;
            currentFloodRisk = null; // Reset
        });
    }
    
    document.querySelectorAll('.operator-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.operator-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedOperator = this.dataset.op;
        });
    });
    
    document.getElementById('history-toggle').addEventListener('change', function(e) {
        document.getElementById('history-panel').style.display = e.target.checked ? 'block' : 'none';
    });
    
    document.getElementById('ai-enable').addEventListener('change', async function(e) {
        aiEnabled = e.target.checked;
        if (aiEnabled && !aiAvailable) {
            aiAvailable = await checkAIAvailable();
        }
        updateAIStatus();
    });
    
    document.getElementById('ai-floating-btn').addEventListener('click', () => {
        document.getElementById('ai-panel').classList.add('open');
    });
    
    document.getElementById('ai-close').addEventListener('click', () => {
        document.getElementById('ai-panel').classList.remove('open');
    });
    
    document.getElementById('ai-send').addEventListener('click', handleAIQuestion);
    document.getElementById('ai-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAIQuestion();
    });
}

// ====================================
// EXPORT & UTILITIES
// ====================================
function exportCSV() {
    if (!currentData) { alert('No data'); return; }
    
    let csv = `# DropCheck Scientific Platform\n`;
    csv += `# Generated: ${new Date().toISOString()}\n`;
    csv += `# Location: ${selectedLat}, ${selectedLon}\n`;
    csv += `# Variable: ${currentData.config.name}\n#\n`;
    csv += `Year,Value,Unit\n`;
    currentData.data.forEach(d => {
        csv += `${d.year || d.date},${d.value},${currentData.config.unit}\n`;
    });
    
    downloadFile(csv, 'dropcheck-data.csv', 'text/csv');
}

function exportJSON() {
    if (!currentData) { alert('No data'); return; }
    
    const exportData = {
        metadata: {
            platform: 'DropCheck',
            generated: new Date().toISOString(),
            location: { latitude: selectedLat, longitude: selectedLon },
            variable: { code: currentData.param, name: currentData.config.name, unit: currentData.config.unit },
            source: currentData.source
        },
        statistics: currentData.stats,
        floodRisk: currentFloodRisk,
        data: currentData.data
    };
    
    downloadFile(JSON.stringify(exportData, null, 2), 'dropcheck-data.json', 'application/json');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function updateCoordinates() {
    document.getElementById('coordinates').textContent = `📍 Lat: ${selectedLat}, Lon: ${selectedLon}`;
}

function initQuickLocations() {
    const container = document.getElementById('quick-locations');
    quickLocations.forEach((loc, i) => {
        const chip = document.createElement('div');
        chip.className = 'location-chip';
        if (i === 0) chip.classList.add('active');
        chip.textContent = loc.name;
        chip.addEventListener('click', () => {
            document.querySelectorAll('.location-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedLat = loc.coords[0];
            selectedLon = loc.coords[1];
            map.setView([selectedLat, selectedLon], 6);
            marker.setLatLng([selectedLat, selectedLon]);
            updateCoordinates();
        });
        container.appendChild(chip);
    });
}

function setDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('date-input').valueAsDate = tomorrow;
}

function generateHistoricalData(param, month, day) {
    const configs = {
        'T2M': { base: 25, variance: 8, unit: '°C' },
        'T2M_MAX': { base: 30, variance: 10, unit: '°C' },
        'T2M_MIN': { base: 18, variance: 6, unit: '°C' },
        'PRECTOTCORR': { base: 5, variance: 10, unit: 'mm' },
        'WS2M': { base: 3, variance: 2, unit: 'm/s' },
        'RH2M': { base: 65, variance: 15, unit: '%' },
        'ALLSKY_SFC_SW_DWN': { base: 5, variance: 2, unit: 'kWh/m²' },
        'QV2M': { base: 12, variance: 4, unit: 'g/kg' }
    };
    
    const cfg = configs[param];
    const data = [];
    const now = new Date().getFullYear();
    
    for (let y = now - 20; y < now; y++) {
        const val = cfg.base + (cfg.variance * Math.sin((month / 12) * Math.PI * 2)) + (Math.random() - 0.5) * cfg.variance;
        data.push({ year: y, value: Math.max(0, parseFloat(val.toFixed(2))), date: `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` });
    }
    
    return { data, config: cfg };
}

console.log('%c🌊 DropCheck Scientific Platform', 'color:#58a6ff;font-size:20px;font-weight:bold');
console.log('%c✅ NASA API + Integrated Flood Analysis', 'color:#10b981;font-size:14px');