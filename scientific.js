// ====================================
// DROPCHECK SCIENTIFIC - FIXED VERSION
// ====================================

const NASA_API_BASE = 'https://power.larc.nasa.gov/api/temporal/daily/point';

let map = null;
let marker = null;
let drawnItems = null;
let currentPolygon = null;
let selectedLat = -25.2637;
let selectedLon = -57.5759;
let currentMode = 'single';
let currentData = null;
let currentChart = null;
let comparisonHistory = [];

const quickLocations = [
    { name: 'Asunción', lat: -25.2637, lon: -57.5759 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'London', lat: 51.5074, lon: -0.1278 }
];

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Scientific Analysis - Initializing...');
    initializeApp();
});

function initializeApp() {
    try {
        if (typeof L === 'undefined') {
            console.error('❌ Leaflet not loaded!');
            showNotification('Map library failed to load. Please refresh the page.', 'error');
            return;
        }
        
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not loaded - charts disabled');
        }
        
        initializeMap();
        initializeQuickLocations();
        setDefaultDates();
        setupEventListeners();
        loadComparisonHistory();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showNotification('Failed to initialize: ' + error.message, 'error');
    }
}

// MAP INITIALIZATION
function initializeMap() {
    console.log('🗺️ Initializing map...');
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container not found');
        return;
    }
    
    if (map !== null) {
        try {
            map.remove();
        } catch (e) {
            console.warn('Error removing old map:', e);
        }
        map = null;
    }
    
    try {
        map = L.map('map', {
            center: [selectedLat, selectedLon],
            zoom: 4,
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            dragging: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
            minZoom: 2
        }).addTo(map);
        
        drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        
        if (typeof L.Control.Draw !== 'undefined') {
            const drawControl = new L.Control.Draw({
                position: 'topright',
                draw: {
                    polygon: {
                        allowIntersection: false,
                        showArea: true,
                        shapeOptions: { color: '#3388ff' }
                    },
                    rectangle: { shapeOptions: { color: '#3388ff' } },
                    circle: false,
                    circlemarker: false,
                    polyline: false,
                    marker: false
                },
                edit: {
                    featureGroup: drawnItems,
                    remove: true
                }
            });
            
            map.addControl(drawControl);
            
            map.on(L.Draw.Event.CREATED, function(event) {
                drawnItems.clearLayers();
                drawnItems.addLayer(event.layer);
                currentPolygon = event.layer;
                showNotification('Area created! Ready to analyze.', 'success');
            });
            
            map.on(L.Draw.Event.DELETED, function() {
                currentPolygon = null;
            });
        }
        
        marker = L.marker([selectedLat, selectedLon], {
            draggable: true,
            title: 'Drag to move location'
        }).addTo(map);
        
        marker.on('dragend', function() {
            const pos = marker.getLatLng();
            selectedLat = parseFloat(pos.lat.toFixed(4));
            selectedLon = parseFloat(pos.lng.toFixed(4));
            updateCoordinatesDisplay();
        });
        
        map.on('click', function(e) {
            selectedLat = parseFloat(e.latlng.lat.toFixed(4));
            selectedLon = parseFloat(e.latlng.lng.toFixed(4));
            marker.setLatLng([selectedLat, selectedLon]);
            updateCoordinatesDisplay();
        });
        
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 200);
        
        updateCoordinatesDisplay();
        console.log('✅ Map initialized');
        
    } catch (error) {
        console.error('Map creation error:', error);
        showNotification('Failed to create map: ' + error.message, 'error');
    }
}

function initializeQuickLocations() {
    const container = document.getElementById('quick-locations');
    if (!container) return;
    
    container.innerHTML = '';
    quickLocations.forEach(location => {
        const chip = document.createElement('div');
        chip.className = 'location-chip';
        chip.textContent = location.name;
        chip.style.cursor = 'pointer';
        
        chip.addEventListener('click', function() {
            selectedLat = location.lat;
            selectedLon = location.lon;
            
            if (map && marker) {
                map.flyTo([location.lat, location.lon], 6, { duration: 1.5 });
                marker.setLatLng([location.lat, location.lon]);
                updateCoordinatesDisplay();
            }
        });
        
        container.appendChild(chip);
    });
}

function updateCoordinatesDisplay() {
    const el = document.getElementById('coordinates');
    if (el) el.textContent = `📍 ${selectedLat}, ${selectedLon}`;
}

function setupEventListeners() {
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', handleAnalyze);
    }
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.getAttribute('data-mode');
            updateDateContainers(currentMode);
        });
    });
    
    const aiToggle = document.getElementById('ai-toggle');
    const aiClose = document.getElementById('ai-close');
    const aiChat = document.getElementById('ai-chat');
    
    if (aiToggle && aiChat) {
        aiToggle.addEventListener('click', function() {
            aiChat.style.display = aiChat.style.display === 'none' ? 'flex' : 'none';
        });
    }
    
    if (aiClose && aiChat) {
        aiClose.addEventListener('click', function() {
            aiChat.style.display = 'none';
        });
    }
    
    const aiInput = document.getElementById('ai-input');
    const aiSend = document.getElementById('ai-send');
    
    if (aiInput && aiSend) {
        aiSend.addEventListener('click', handleAIQuery);
        aiInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAIQuery();
            }
        });
    }
    
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn) {
        compareBtn.addEventListener('click', showComparisonModal);
    }
}

function updateDateContainers(mode) {
    const single = document.getElementById('date-container-single');
    const range = document.getElementById('date-container-range');
    
    if (single) single.style.display = mode === 'range' ? 'none' : 'block';
    if (range) range.style.display = mode === 'range' ? 'block' : 'none';
}

function setDefaultDates() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateInput = document.getElementById('date-input');
    const startDate = document.getElementById('start-date');
    const endDate = document.getElementById('end-date');
    
    if (dateInput) dateInput.valueAsDate = tomorrow;
    if (startDate) startDate.valueAsDate = tomorrow;
    if (endDate) {
        const end = new Date(tomorrow);
        end.setDate(end.getDate() + 30);
        endDate.valueAsDate = end;
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white; border-radius: 8px; z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-weight: 600;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function handleAnalyze() {
    console.log('📊 Analyze clicked, mode:', currentMode);
    
    if (currentMode === 'single') analyzeSinglePoint();
    else if (currentMode === 'range') analyzeDateRange();
    else if (currentMode === 'polygon') analyzePolygon();
    else if (currentMode === 'flood') analyzeFloodRisk();
}

async function analyzeSinglePoint() {
    const dateInput = document.getElementById('date-input');
    if (!dateInput || !dateInput.value) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    showLoading('Analyzing NASA data...');
    
    try {
        const dateObj = new Date(dateInput.value);
        const currentYear = new Date().getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        const allYears = [];
        const years = [];
        
        for (let y = currentYear - 20; y < currentYear; y++) {
            const dateStr = y + month + day;
            try {
                const data = await fetchNASAData('T2M', selectedLat, selectedLon, dateStr, dateStr);
                if (data.length > 0) {
                    allYears.push(data[0].value);
                    years.push(y);
                }
                await sleep(100);
            } catch (err) {
                console.warn('Failed year', y);
            }
        }
        
        if (allYears.length === 0) throw new Error('No data available');
        
        const stats = calculateStats(allYears);
        
        currentData = {
            type: 'single',
            stats: stats,
            values: allYears,
            years: years,
            location: { lat: selectedLat, lon: selectedLon },
            date: dateInput.value,
            dataPoints: allYears.length
        };
        
        saveToHistory(currentData);
        
        hideLoading();
        displaySingleResults();
        createChart(years, allYears);
        showNotification('Analysis complete!', 'success');
        
    } catch (error) {
        hideLoading();
        showNotification('Error: ' + error.message, 'error');
    }
}

async function analyzeDateRange() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    
    if (!startInput || !endInput || !startInput.value || !endInput.value) {
        showNotification('Please select date range', 'error');
        return;
    }
    
    showLoading('Analyzing date range...');
    
    try {
        const startDate = new Date(startInput.value);
        const endDate = new Date(endInput.value);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 90) {
            showNotification('Maximum range is 90 days', 'error');
            hideLoading();
            return;
        }
        
        const currentYear = new Date().getFullYear();
        const allData = [];
        
        for (let y = currentYear - 5; y < currentYear; y++) {
            const yearStart = new Date(startDate);
            yearStart.setFullYear(y);
            const yearEnd = new Date(endDate);
            yearEnd.setFullYear(y);
            
            const startStr = formatDate(yearStart);
            const endStr = formatDate(yearEnd);
            
            try {
                const data = await fetchNASAData('T2M', selectedLat, selectedLon, startStr, endStr);
                allData.push(...data);
                await sleep(200);
            } catch (err) {
                console.warn('Failed year', y);
            }
        }
        
        if (allData.length === 0) throw new Error('No data available');
        
        const dailyAvg = {};
        allData.forEach(item => {
            const key = item.month + '-' + item.day;
            if (!dailyAvg[key]) {
                dailyAvg[key] = { values: [], date: item.month + '/' + item.day };
            }
            dailyAvg[key].values.push(item.value);
        });
        
        const results = Object.values(dailyAvg).map(d => {
            const stats = calculateStats(d.values);
            return {
                date: d.date,
                mean: parseFloat(stats.mean),
                min: parseFloat(stats.min),
                max: parseFloat(stats.max),
                count: d.values.length
            };
        }).sort((a, b) => a.mean - b.mean);
        
        currentData = {
            type: 'range',
            results: results,
            best: results.slice(0, 5),
            worst: results.slice(-5).reverse()
        };
        
        hideLoading();
        displayRangeResults();
        showNotification('Analysis complete!', 'success');
        
    } catch (error) {
        hideLoading();
        showNotification('Error: ' + error.message, 'error');
    }
}
async function analyzePolygon() {
    if (!currentPolygon) {
        showNotification('Please draw an area first', 'error');
        return;
    }
    
    const dateInput = document.getElementById('date-input');
    if (!dateInput || !dateInput.value) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    showLoading('Analyzing polygon area...');
    
    try {
        const bounds = currentPolygon.getBounds();
        const points = generateGridPoints(bounds, 3);
        
        const dateObj = new Date(dateInput.value);
        const currentYear = new Date().getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        const results = [];
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const allYears = [];
            
            for (let y = currentYear - 5; y < currentYear; y++) {
                const dateStr = y + month + day;
                try {
                    const data = await fetchNASAData('T2M', point.lat, point.lng, dateStr, dateStr);
                    if (data.length > 0) allYears.push(data[0].value);
                    await sleep(100);
                } catch (err) {
                    console.warn('Failed fetch:', err);
                }
            }
            
            if (allYears.length > 0) {
                const stats = calculateStats(allYears);
                results.push({
                    lat: parseFloat(point.lat),
                    lng: parseFloat(point.lng),
                    mean: parseFloat(stats.mean),
                    min: parseFloat(stats.min),
                    max: parseFloat(stats.max),
                    dataPoints: allYears.length
                });
            }
            
            await sleep(200);
        }
        
        if (results.length === 0) throw new Error('No data available');
        
        const sorted = results.slice().sort((a, b) => a.mean - b.mean);
        
        currentData = {
            type: 'polygon',
            results: results,
            best: sorted.slice(0, 3),
            worst: sorted.slice(-3).reverse(),
            total: results.length
        };
        
        hideLoading();
        displayPolygonResults();
        visualizePolygon(results);
        showNotification('Analysis complete!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('Polygon analysis error:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

async function analyzeFloodRisk() {
    const dateInput = document.getElementById('date-input');
    if (!dateInput || !dateInput.value) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    showLoading('Analyzing flood risk...');
    
    try {
        const dateObj = new Date(dateInput.value);
        const currentYear = new Date().getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        const precipData = [];
        const humidityData = [];
        
        for (let y = currentYear - 10; y < currentYear; y++) {
            const dateStr = y + month + day;
            try {
                const precip = await fetchNASAData('PRECTOTCORR', selectedLat, selectedLon, dateStr, dateStr);
                const humidity = await fetchNASAData('RH2M', selectedLat, selectedLon, dateStr, dateStr);
                
                if (precip.length > 0) precipData.push(precip[0].value);
                if (humidity.length > 0) humidityData.push(humidity[0].value);
                
                await sleep(150);
            } catch (err) {
                console.warn('Failed year', y);
            }
        }
        
        if (precipData.length === 0) throw new Error('No data available');
        
        const precipStats = calculateStats(precipData);
        const humidityStats = calculateStats(humidityData);
        
        const avgPrecip = parseFloat(precipStats.mean);
        const avgHumidity = parseFloat(humidityStats.mean);
        
        let riskLevel = 'Low';
        let riskPercent = 15;
        
        if (avgPrecip > 100 && avgHumidity > 80) {
            riskLevel = 'High';
            riskPercent = 75;
        } else if (avgPrecip > 50 && avgHumidity > 70) {
            riskLevel = 'Medium';
            riskPercent = 45;
        }
        
        currentData = {
            type: 'flood',
            riskLevel,
            riskPercent,
            precipStats,
            humidityStats,
            precipData,
            humidityData
        };
        
        hideLoading();
        displayFloodResults();
        showNotification('Analysis complete!', 'success');
        
    } catch (error) {
        hideLoading();
        showNotification('Error: ' + error.message, 'error');
    }
}

async function fetchNASAData(param, lat, lon, startDate, endDate) {
    const url = `${NASA_API_BASE}?parameters=${param}&community=RE&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('NASA API error');
    
    const data = await response.json();
    if (!data.properties?.parameter?.[param]) throw new Error('Invalid data');
    
    const paramData = data.properties.parameter[param];
    const values = [];
    
    for (let date in paramData) {
        const value = paramData[date];
        if (value !== -999) {
            values.push({
                date,
                year: parseInt(date.substring(0, 4)),
                month: parseInt(date.substring(4, 6)),
                day: parseInt(date.substring(6, 8)),
                value: parseFloat(value.toFixed(2))
            });
        }
    }
    
    return values;
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

function visualizePolygon(results) {
    const values = results.map(r => r.mean);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    results.forEach(result => {
        const norm = (result.mean - min) / (max - min);
        const color = norm < 0.33 ? '#10b981' : norm < 0.66 ? '#f59e0b' : '#ef4444';
        
        L.circleMarker([result.lat, result.lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            fillOpacity: 0.8
        }).addTo(map).bindPopup(`Temp: ${result.mean.toFixed(1)}°C`);
    });
}

function calculateStats(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return {
        mean: mean.toFixed(1),
        median: sorted[Math.floor(sorted.length / 2)].toFixed(1),
        std: std.toFixed(2),
        min: sorted[0].toFixed(1),
        max: sorted[sorted.length - 1].toFixed(1)
    };
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + m + d;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function saveToHistory(data) {
    if (data.type !== 'single') return;
    
    const entry = {
        date: data.date,
        location: data.location,
        stats: data.stats,
        timestamp: Date.now()
    };
    
    comparisonHistory.unshift(entry);
    if (comparisonHistory.length > 10) comparisonHistory.pop();
    
    try {
        localStorage.setItem('scientificHistory', JSON.stringify(comparisonHistory));
    } catch (e) {
        console.warn('Failed to save history');
    }
    
    const compareBtn = document.getElementById('compare-btn');
    if (compareBtn && comparisonHistory.length > 0) {
        compareBtn.style.display = 'block';
    }
}

function loadComparisonHistory() {
    try {
        const stored = localStorage.getItem('scientificHistory');
        if (stored) {
            comparisonHistory = JSON.parse(stored);
            const compareBtn = document.getElementById('compare-btn');
            if (compareBtn && comparisonHistory.length > 0) {
                compareBtn.style.display = 'block';
            }
        }
    } catch (e) {
        console.warn('Failed to load history');
    }
}

function showComparisonModal() {
    if (comparisonHistory.length < 2) {
        showNotification('Need at least 2 analyses to compare', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8); z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
    `;
    
    let html = '<div style="background: white; padding: 40px; border-radius: 20px; max-width: 800px; max-height: 80vh; overflow-y: auto;">';
    html += '<h2 style="color: #00C4FF; margin-bottom: 20px; font-family: Orbitron, sans-serif;">Date Comparison History</h2>';
    html += '<div style="display: grid; gap: 15px;">';
    
    comparisonHistory.forEach((entry, i) => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        html += `
            <div style="background: rgba(0, 196, 255, 0.1); padding: 20px; border-radius: 12px; border: 2px solid rgba(0, 196, 255, 0.3);">
                <div style="color: #1E1E2F; font-weight: 700; margin-bottom: 10px;">
                    ${entry.date} - ${entry.location.lat}, ${entry.location.lon}
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 0.9em;">
                    <div><strong>Avg:</strong> ${entry.stats.mean}°C</div>
                    <div><strong>Min:</strong> ${entry.stats.min}°C</div>
                    <div><strong>Max:</strong> ${entry.stats.max}°C</div>
                    <div><strong>Std:</strong> ${entry.stats.std}</div>
                </div>
                <div style="font-size: 0.8em; color: rgba(30, 30, 47, 0.6); margin-top: 8px;">Analyzed: ${date}</div>
            </div>
        `;
    });
    
    html += '</div>';
    html += '<button onclick="this.closest(\'.comparison-modal\').remove()" style="margin-top: 20px; background: #00C4FF; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 700;">Close</button>';
    html += '</div>';
    
    modal.className = 'comparison-modal';
    modal.innerHTML = html;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

function showLoading(text) {
    const container = document.getElementById('results-container');
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading-ring"></div>
                <div class="loading-text">${text}</div>
            </div>
        `;
    }
}

function hideLoading() {}

function displaySingleResults() {
    const stats = currentData.stats;
    const html = `
        <div class="result-card">
            <h3 style="color: #00C4FF; margin-bottom: 20px;">Single Point Analysis</h3>
            <div class="result-grid">
                <div class="metric-box">
                    <div class="metric-label">Average</div>
                    <div class="metric-value">${stats.mean}</div>
                    <div class="metric-unit">°C</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">Minimum</div>
                    <div class="metric-value">${stats.min}</div>
                    <div class="metric-unit">°C</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">Maximum</div>
                    <div class="metric-value">${stats.max}</div>
                    <div class="metric-unit">°C</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">Std Dev</div>
                    <div class="metric-value">${stats.std}</div>
                </div>
            </div>
            <div style="background: rgba(0, 196, 255, 0.1); border: 2px solid rgba(0, 196, 255, 0.3); border-radius: 14px; padding: 20px; margin-top: 20px;">
                <p><strong>Location:</strong> ${currentData.location.lat}, ${currentData.location.lon}<br>
                <strong>Data points:</strong> ${currentData.dataPoints} years<br>
                <strong>Date:</strong> ${currentData.date}</p>
            </div>
        </div>
    `;
    
    document.getElementById('results-container').innerHTML = html;
}

function displayRangeResults() {
    let bestHtml = '';
    currentData.best.forEach((d, i) => {
        bestHtml += `
            <div class="metric-box">
                <div class="metric-label">#${i + 1} - ${d.date}</div>
                <div class="metric-value">${d.mean.toFixed(1)}</div>
                <div class="metric-unit">°C</div>
            </div>
        `;
    });
    
    let worstHtml = '';
    currentData.worst.forEach((d, i) => {
        worstHtml += `
            <div class="metric-box" style="border-color: rgba(239, 68, 68, 0.3);">
                <div class="metric-label">#${i + 1} - ${d.date}</div>
                <div class="metric-value">${d.mean.toFixed(1)}</div>
                <div class="metric-unit">°C</div>
            </div>
        `;
    });
    
    const html = `
        <div class="result-card">
            <h3 style="color: #00C4FF; margin-bottom: 20px;">Date Range Analysis</h3>
            <h4 style="color: #10b981; margin-bottom: 15px;">Best Dates (Lowest Temperature)</h4>
            <div class="result-grid">${bestHtml}</div>
            <h4 style="color: #ef4444; margin: 30px 0 15px 0;">Worst Dates (Highest Temperature)</h4>
            <div class="result-grid">${worstHtml}</div>
        </div>
    `;
    
    document.getElementById('results-container').innerHTML = html;
}

function displayPolygonResults() {
    let bestHtml = '';
    currentData.best.forEach((loc, i) => {
        bestHtml += `
            <div class="metric-box">
                <div class="metric-label">#${i + 1} Best</div>
                <div class="metric-value">${loc.mean.toFixed(1)}</div>
                <div class="metric-unit">°C</div>
                <div style="font-size: 0.75em; margin-top: 8px;">${loc.lat}, ${loc.lng}</div>
            </div>
        `;
    });
    
    let worstHtml = '';
    currentData.worst.forEach((loc, i) => {
        worstHtml += `
            <div class="metric-box" style="border-color: rgba(239, 68, 68, 0.3);">
                <div class="metric-label">#${i + 1} Worst</div>
                <div class="metric-value">${loc.mean.toFixed(1)}</div>
                <div class="metric-unit">°C</div>
                <div style="font-size: 0.75em; margin-top: 8px;">${loc.lat}, ${loc.lng}</div>
            </div>
        `;
    });
    
    const html = `
        <div class="result-card">
            <h3 style="color: #00C4FF; margin-bottom: 20px;">Polygon Area Analysis</h3>
            <h4 style="color: #10b981; margin-bottom: 15px;">Best Locations</h4>
            <div class="result-grid">${bestHtml}</div>
            <h4 style="color: #ef4444; margin: 30px 0 15px 0;">Worst Locations</h4>
            <div class="result-grid">${worstHtml}</div>
            <p style="margin-top: 20px;"><strong>Total points analyzed:</strong> ${currentData.total}</p>
        </div>
    `;
    
    document.getElementById('results-container').innerHTML = html;
}

function displayFloodResults() {
    const color = currentData.riskLevel === 'High' ? '#ef4444' : 
                  currentData.riskLevel === 'Medium' ? '#f59e0b' : '#10b981';
    
    const html = `
        <div class="result-card">
            <h3 style="color: #00C4FF; margin-bottom: 20px;">Flood Risk Assessment</h3>
            <div class="result-grid">
                <div class="metric-box" style="border-color: ${color};">
                    <div class="metric-label">Risk Level</div>
                    <div class="metric-value" style="color: ${color};">${currentData.riskLevel}</div>
                    <div class="metric-unit">${currentData.riskPercent}%</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">Avg Precipitation</div>
                    <div class="metric-value">${currentData.precipStats.mean}</div>
                    <div class="metric-unit">mm</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">Avg Humidity</div>
                    <div class="metric-value">${currentData.humidityStats.mean}</div>
                    <div class="metric-unit">%</div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('results-container').innerHTML = html;
}

function createChart(years, values) {
    if (typeof Chart === 'undefined') return;
    
    const html = `
        <div class="chart-container">
            <h3 style="color: #00C4FF; margin-bottom: 18px;">Historical Temperature Trend</h3>
            <canvas id="hist-chart"></canvas>
        </div>
    `;
    
    document.getElementById('results-container').insertAdjacentHTML('beforeend', html);
    
    const canvas = document.getElementById('hist-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Temperature (°C)',
                data: values,
                borderColor: '#00C4FF',
                backgroundColor: 'rgba(0, 196, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#1E1E2F',
                        font: { size: 14 }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#1E1E2F',
                        callback: value => value + '°C'
                    },
                    grid: { color: 'rgba(0, 196, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#1E1E2F' },
                    grid: { color: 'rgba(0, 196, 255, 0.1)' }
                }
            }
        }
    });
}

function handleAIQuery() {
    const input = document.getElementById('ai-input');
    if (!input) return;
    
    const query = input.value.trim();
    if (!query) return;
    
    const messages = document.getElementById('ai-messages');
    if (!messages) return;
    
    const userMsg = document.createElement('div');
    userMsg.className = 'ai-message ai-message-user';
    userMsg.innerHTML = `
        <div class="ai-avatar">👤</div>
        <div class="ai-bubble">${query}</div>
    `;
    messages.appendChild(userMsg);
    
    input.value = '';
    
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'ai-message';
        
        let response = '';
        
        if (currentData) {
            if (currentData.type === 'single') {
                response = `Based on ${currentData.dataPoints} years of NASA data, the historical average temperature for this date is ${currentData.stats.mean}°C, ranging from ${currentData.stats.min}°C to ${currentData.stats.max}°C. The standard deviation of ${currentData.stats.std} indicates moderate variability in temperature for this location and date.`;
            } else if (currentData.type === 'range') {
                response = `I've analyzed the date range and identified optimal dates. The best date is ${currentData.best[0].date} with an average temperature of ${currentData.best[0].mean.toFixed(1)}°C. The worst date is ${currentData.worst[0].date} with ${currentData.worst[0].mean.toFixed(1)}°C.`;
            } else if (currentData.type === 'polygon') {
                response = `In the analyzed area, I found ${currentData.total} points. The optimal location has an average temperature of ${currentData.best[0].mean.toFixed(1)}°C at coordinates ${currentData.best[0].lat}, ${currentData.best[0].lng}.`;
            } else if (currentData.type === 'flood') {
                response = `The flood risk assessment shows a ${currentData.riskLevel} risk level (${currentData.riskPercent}%) based on average precipitation of ${currentData.precipStats.mean}mm and humidity of ${currentData.humidityStats.mean}%.`;
            }
        } else {
            response = 'Please run an analysis first so I can help you interpret the data. Select a mode, location, and date, then click "Analyze with NASA Data".';
        }
        
        aiMsg.innerHTML = `
            <div class="ai-avatar">🤖</div>
            <div class="ai-bubble"><p>${response}</p></div>
        `;
        messages.appendChild(aiMsg);
        messages.scrollTop = messages.scrollHeight;
    }, 800);
}

console.log('✅ DropCheck Scientific v2.0 - Ready!');