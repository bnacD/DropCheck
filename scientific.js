// ====================================
// DROPCHECK SCIENTIFIC - ENHANCED VERSION
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
let polygonMarkers = [];

// Parameter metadata
const parameterInfo = {
    'T2M': { name: 'Temperature (2m)', unit: '°C', decimals: 1 },
    'T2M_MAX': { name: 'Temperature Max', unit: '°C', decimals: 1 },
    'T2M_MIN': { name: 'Temperature Min', unit: '°C', decimals: 1 },
    'PRECTOTCORR': { name: 'Precipitation', unit: 'mm', decimals: 2 },
    'WS2M': { name: 'Wind Speed (2m)', unit: 'm/s', decimals: 1 },
    'WS10M': { name: 'Wind Speed (10m)', unit: 'm/s', decimals: 1 },
    'RH2M': { name: 'Relative Humidity', unit: '%', decimals: 1 },
    'PS': { name: 'Surface Pressure', unit: 'kPa', decimals: 2 },
    'ALLSKY_SFC_SW_DWN': { name: 'Solar Radiation', unit: 'kW/m²', decimals: 2 }
};

const quickLocations = [
    { name: 'Asunción', lat: -25.2637, lon: -57.5759 },
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
    { name: 'Paris', lat: 48.8566, lon: 2.3522 },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
    { name: 'London', lat: 51.5074, lon: -0.1278 }
];

// Chatbot questions by mode
const chatbotQuestions = {
    single: [
        'Will it rain today?',
        'Should I bring a coat?',
        'Is there high UV radiation?',
        'Will it be windy?',
        'What is the temperature trend?'
    ],
    range: [
        'Which is the best date for an outdoor event?',
        'Which dates have least rain?',
        'Which days have optimal temperature?',
        'When should I avoid outdoor activities?',
        'What is the weather pattern?'
    ],
    polygon: [
        'Which area is best to relax?',
        'Which zones have lowest wind?',
        'Which region has ideal temperature?',
        'Where should I avoid?',
        'What are the best locations?'
    ],
    flood: [
        'What is the flood risk level?',
        'Should I be concerned?',
        'What precautions should I take?',
        'Is this area safe?',
        'What does the data show?'
    ]
};

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
        setupChatbot();
        checkFirstTimePolygon();
        
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
                clearPolygonMarkers();
                showNotification('Area created! Ready to analyze.', 'success');
            });
            
            map.on(L.Draw.Event.DELETED, function() {
                currentPolygon = null;
                clearPolygonMarkers();
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

function clearPolygonMarkers() {
    polygonMarkers.forEach(m => {
        if (map) map.removeLayer(m);
    });
    polygonMarkers = [];
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
            updateChatbotQuestions(currentMode);
        });
    });
    
    // Export buttons
    const exportCSV = document.getElementById('export-csv');
    const exportJSON = document.getElementById('export-json');
    
    if (exportCSV) {
        exportCSV.addEventListener('click', exportToCSV);
    }
    
    if (exportJSON) {
        exportJSON.addEventListener('click', exportToJSON);
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

// CHATBOT SETUP
function setupChatbot() {
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotWindow = document.getElementById('chatbot-window');
    
    if (chatbotToggle && chatbotWindow) {
        chatbotToggle.addEventListener('click', function() {
            chatbotWindow.style.display = chatbotWindow.style.display === 'none' ? 'flex' : 'none';
        });
    }
    
    if (chatbotClose && chatbotWindow) {
        chatbotClose.addEventListener('click', function() {
            chatbotWindow.style.display = 'none';
        });
    }
    
    updateChatbotQuestions('single');
}

function updateChatbotQuestions(mode) {
    const container = document.getElementById('chatbot-questions');
    if (!container) return;
    
    container.innerHTML = '';
    const questions = chatbotQuestions[mode] || chatbotQuestions.single;
    
    questions.forEach(question => {
        const btn = document.createElement('button');
        btn.className = 'chatbot-question-btn';
        btn.textContent = question;
        btn.addEventListener('click', () => handleChatbotQuestion(question));
        container.appendChild(btn);
    });
}

function handleChatbotQuestion(question) {
    const messages = document.getElementById('chatbot-messages');
    if (!messages) return;
    
    // Add user message
    const userMsg = document.createElement('div');
    userMsg.className = 'chatbot-message chatbot-message-user';
    userMsg.innerHTML = `
        <div class="chatbot-avatar">👤</div>
        <div class="chatbot-bubble">${question}</div>
    `;
    messages.appendChild(userMsg);
    
    // Generate response
    setTimeout(() => {
        const response = generateChatbotResponse(question);
        const botMsg = document.createElement('div');
        botMsg.className = 'chatbot-message';
        botMsg.innerHTML = `
            <div class="chatbot-avatar">🤖</div>
            <div class="chatbot-bubble"><p>${response}</p></div>
        `;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
    }, 800);
}

function generateChatbotResponse(question) {
    if (!currentData) {
        return 'Please run an analysis first so I can help you interpret the data. Select a mode, location, and date, then click "Analyze with NASA Data".';
    }
    
    const q = question.toLowerCase();
    
    if (currentData.type === 'single') {
        if (q.includes('rain')) {
            return `Based on historical data, the average precipitation for this date is typically low. However, I recommend checking the real-time forecast for more accurate information.`;
        } else if (q.includes('coat') || q.includes('temperature')) {
            return `The historical average temperature is ${currentData.stats.mean}°C, ranging from ${currentData.stats.min}°C to ${currentData.stats.max}°C. Based on this data, you should dress accordingly for moderate temperatures.`;
        } else if (q.includes('uv') || q.includes('radiation')) {
            return `UV radiation data is not included in this analysis. I recommend checking local weather services for UV index information.`;
        } else if (q.includes('wind')) {
            return `Wind data is not included in this basic temperature analysis. For wind information, please use the forecast page or check local weather services.`;
        } else if (q.includes('trend')) {
            return `Over the past ${currentData.dataPoints} years, the temperature for this date has shown a standard deviation of ${currentData.stats.std}, indicating ${parseFloat(currentData.stats.std) < 3 ? 'consistent' : 'variable'} temperature patterns.`;
        }
    } else if (currentData.type === 'range') {
        if (q.includes('best date') || q.includes('outdoor event')) {
            return `Based on the analysis, the best date is ${currentData.best[0].date} with an average temperature of ${currentData.best[0].mean.toFixed(1)}°C. This date has historically shown the most favorable conditions.`;
        } else if (q.includes('least rain') || q.includes('rain')) {
            return `The dates with typically lower precipitation are ${currentData.best.slice(0, 3).map(d => d.date).join(', ')}. These dates have historically shown better weather conditions.`;
        } else if (q.includes('optimal temperature')) {
            return `The top 3 dates with optimal temperatures are: ${currentData.best.slice(0, 3).map((d, i) => `${i + 1}. ${d.date} (${d.mean.toFixed(1)}°C)`).join(', ')}.`;
        } else if (q.includes('avoid')) {
            return `I recommend avoiding ${currentData.worst[0].date} which has an average temperature of ${currentData.worst[0].mean.toFixed(1)}°C, historically the least favorable in your selected range.`;
        } else if (q.includes('pattern')) {
            return `The analysis shows ${currentData.results.length} days analyzed. The temperature range varies from ${Math.min(...currentData.results.map(r => r.mean)).toFixed(1)}°C to ${Math.max(...currentData.results.map(r => r.mean)).toFixed(1)}°C across the period.`;
        }
    } else if (currentData.type === 'polygon') {
        if (q.includes('best') || q.includes('relax')) {
            return `The optimal location is at coordinates ${currentData.best[0].lat}, ${currentData.best[0].lng} with an average temperature of ${currentData.best[0].mean.toFixed(1)}°C. This area shows the most favorable conditions.`;
        } else if (q.includes('wind') || q.includes('lowest wind')) {
            return `Wind-specific data is not included in this temperature analysis. The analysis shows temperature variations across ${currentData.total} points in your selected area.`;
        } else if (q.includes('ideal temperature') || q.includes('region')) {
            return `The top 3 locations with ideal temperatures are: ${currentData.best.slice(0, 3).map((loc, i) => `${i + 1}. (${loc.lat}, ${loc.lng}) at ${loc.mean.toFixed(1)}°C`).join('; ')}.`;
        } else if (q.includes('avoid')) {
            return `I recommend avoiding the area at ${currentData.worst[0].lat}, ${currentData.worst[0].lng} which has an average temperature of ${currentData.worst[0].mean.toFixed(1)}°C, the least favorable in your polygon.`;
        } else if (q.includes('locations')) {
            return `Out of ${currentData.total} analyzed points, the best 3 zones are marked in green on the map, and the worst 3 in red. Check the results panel for detailed coordinates and temperatures.`;
        }
    } else if (currentData.type === 'flood') {
        if (q.includes('risk level')) {
            return `The flood risk level is ${currentData.riskLevel} (${currentData.riskPercent}% probability) based on historical precipitation of ${currentData.precipStats.mean}mm and humidity of ${currentData.humidityStats.mean}%.`;
        } else if (q.includes('concerned')) {
            if (currentData.riskLevel === 'High') {
                return `Yes, with a ${currentData.riskLevel} risk level (${currentData.riskPercent}%), you should be prepared for potential flooding. Monitor local weather alerts closely.`;
            } else if (currentData.riskLevel === 'Medium') {
                return `There is a moderate risk (${currentData.riskPercent}%). Stay informed about weather conditions and have a basic emergency plan ready.`;
            } else {
                return `The risk is ${currentData.riskLevel} (${currentData.riskPercent}%), so flooding is unlikely based on historical data. However, always stay alert to current weather conditions.`;
            }
        } else if (q.includes('precautions')) {
            return `With ${currentData.riskLevel} risk: ${currentData.riskLevel === 'High' ? 'Prepare emergency supplies, know evacuation routes, and monitor weather alerts continuously.' : currentData.riskLevel === 'Medium' ? 'Stay informed, avoid low-lying areas during heavy rain, and keep emergency contacts ready.' : 'Continue normal activities but stay aware of weather forecasts.'}`;
        } else if (q.includes('safe')) {
            return `Based on historical data showing ${currentData.riskLevel} risk (${currentData.riskPercent}%), this area ${currentData.riskLevel === 'Low' ? 'is generally safe' : currentData.riskLevel === 'Medium' ? 'requires moderate caution' : 'requires high vigilance'} regarding flood potential.`;
        } else if (q.includes('data show')) {
            return `The data shows average precipitation of ${currentData.precipStats.mean}mm (range: ${currentData.precipStats.min}-${currentData.precipStats.max}mm) and humidity of ${currentData.humidityStats.mean}% over the analyzed period, resulting in a ${currentData.riskLevel} flood risk assessment.`;
        }
    }
    
    return `I've analyzed the data for ${currentData.type} mode. The results show interesting patterns. Would you like me to explain any specific aspect of the analysis?`;
}

// POLYGON TUTORIAL
function checkFirstTimePolygon() {
    const hasSeenTutorial = localStorage.getItem('polygonTutorialSeen');
    if (!hasSeenTutorial) {
        // Don't show automatically, but mark it for when user clicks polygon mode
        localStorage.setItem('polygonTutorialReady', 'true');
    }
}

function showPolygonTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (!overlay) return;
    
    overlay.style.display = 'flex';
    setupTutorialNavigation();
    localStorage.setItem('polygonTutorialSeen', 'true');
    localStorage.removeItem('polygonTutorialReady');
}

function setupTutorialNavigation() {
    const slides = document.querySelectorAll('.tutorial-slide');
    const dotsContainer = document.getElementById('tutorial-dots');
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');
    const finishBtn = document.getElementById('tutorial-finish');
    const skipBtn = document.getElementById('tutorial-skip');
    const closeBtn = document.getElementById('tutorial-close');
    const overlay = document.getElementById('tutorial-overlay');
    
    let currentSlide = 0;
    
    // Create dots
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = 'tutorial-dot' + (index === 0 ? ' active' : '');
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
    }
    
    function goToSlide(index) {
        slides.forEach(s => s.classList.remove('active'));
        slides[index].classList.add('active');
        
        const dots = dotsContainer.querySelectorAll('.tutorial-dot');
        dots.forEach(d => d.classList.remove('active'));
        dots[index].classList.add('active');
        
        currentSlide = index;
        
        if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : 'block';
        if (nextBtn) nextBtn.style.display = index === slides.length - 1 ? 'none' : 'block';
        if (finishBtn) finishBtn.style.display = index === slides.length - 1 ? 'block' : 'none';
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentSlide > 0) goToSlide(currentSlide - 1);
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentSlide < slides.length - 1) goToSlide(currentSlide + 1);
        });
    }
    
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    }
    
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
        });
    }
    
    goToSlide(0);
}

// Add tutorial trigger when polygon mode is selected
document.addEventListener('DOMContentLoaded', function() {
    const polygonBtn = document.querySelector('[data-mode="polygon"]');
    if (polygonBtn) {
        polygonBtn.addEventListener('click', function() {
            const tutorialReady = localStorage.getItem('polygonTutorialReady');
            const tutorialSeen = localStorage.getItem('polygonTutorialSeen');
            
            if (tutorialReady && !tutorialSeen) {
                setTimeout(() => showPolygonTutorial(), 500);
            }
        });
    }
});

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 80px; right: 20px; padding: 15px 20px;
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

// ====================================
// ANALYSIS FUNCTIONS
// ====================================

async function analyzeSinglePoint() {
    const dateInput = document.getElementById('date-input');
    const paramSelect = document.getElementById('parameter-select');
    
    if (!dateInput || !dateInput.value) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    const selectedParam = paramSelect ? paramSelect.value : 'T2M';
    const paramMeta = parameterInfo[selectedParam];
    
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
                const data = await fetchNASAData(selectedParam, selectedLat, selectedLon, dateStr, dateStr);
                if (data.length > 0) {
                    allYears.push(data[0].value);
                    years.push(y);
                }
                await sleep(100);
            } catch (err) {
                console.warn('Failed year', y);
            }
        }
        
        if (allYears.length === 0) throw new Error('No data available for this location and date');
        
        const stats = calculateStats(allYears, paramMeta.decimals);
        
        currentData = {
            type: 'single',
            stats: stats,
            values: allYears,
            years: years,
            location: { lat: selectedLat, lon: selectedLon },
            date: dateInput.value,
            dataPoints: allYears.length,
            parameter: selectedParam,
            parameterName: paramMeta.name,
            unit: paramMeta.unit
        };
        
        saveToHistory(currentData);
        
        hideLoading();
        displaySingleResults();
        createChart(years, allYears);
        showExportButtons();
        showNotification('Analysis complete!', 'success');
        
    } catch (error) {
        hideLoading();
        showNotification('Error: ' + error.message, 'error');
    }
}

async function analyzeDateRange() {
    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    const paramSelect = document.getElementById('parameter-select');
    
    if (!startInput || !endInput || !startInput.value || !endInput.value) {
        showNotification('Please select date range', 'error');
        return;
    }
    
    const selectedParam = paramSelect ? paramSelect.value : 'T2M';
    const paramMeta = parameterInfo[selectedParam];
    
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
                const data = await fetchNASAData(selectedParam, selectedLat, selectedLon, startStr, endStr);
                allData.push(...data);
                await sleep(200);
            } catch (err) {
                console.warn('Failed year', y);
            }
        }
        
        if (allData.length === 0) throw new Error('No data available for this date range');
        
        const dailyAvg = {};
        allData.forEach(item => {
            const key = item.month + '-' + item.day;
            if (!dailyAvg[key]) {
                dailyAvg[key] = { values: [], date: item.month + '/' + item.day };
            }
            dailyAvg[key].values.push(item.value);
        });
        
        const results = Object.values(dailyAvg).map(d => {
            const stats = calculateStats(d.values, paramMeta.decimals);
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
            worst: results.slice(-5).reverse(),
            parameter: selectedParam,
            parameterName: paramMeta.name,
            unit: paramMeta.unit
        };
        
        hideLoading();
        displayRangeResults();
        showExportButtons();
        showNotification('Analysis complete!', 'success');
        
    } catch (error) {
        hideLoading();
        showNotification('Error: ' + error.message, 'error');
    }
}

async function analyzePolygon() {
    if (!currentPolygon) {
        showNotification('Please draw an area first',
            'error');
        return;
    }
    
    const dateInput = document.getElementById('date-input');
    const paramSelect = document.getElementById('parameter-select');
    
    if (!dateInput || !dateInput.value) {
        showNotification('Please select a date', 'error');
        return;
    }
    
    const selectedParam = paramSelect ? paramSelect.value : 'T2M';
    const paramMeta = parameterInfo[selectedParam];
    
    showLoading('Analyzing polygon area... This may take a few minutes.');
    clearPolygonMarkers();
    
    try {
        const bounds = currentPolygon.getBounds();
        const points = generateGridPoints(bounds, 3);
        
        const dateObj = new Date(dateInput.value);
        const currentYear = new Date().getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        const results = [];
        let processed = 0;
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const allYears = [];
            
            for (let y = currentYear - 5; y < currentYear; y++) {
                const dateStr = y + month + day;
                try {
                    const data = await fetchNASAData(selectedParam, point.lat, point.lng, dateStr, dateStr);
                    if (data.length > 0) allYears.push(data[0].value);
                    await sleep(100);
                } catch (err) {
                    console.warn('Failed fetch:', err);
                }
            }
            
            if (allYears.length > 0) {
                const stats = calculateStats(allYears, paramMeta.decimals);
                results.push({
                    lat: parseFloat(point.lat),
                    lng: parseFloat(point.lng),
                    mean: parseFloat(stats.mean),
                    min: parseFloat(stats.min),
                    max: parseFloat(stats.max),
                    dataPoints: allYears.length
                });
            }
            
            processed++;
            updateLoadingProgress(processed, points.length);
            await sleep(200);
        }
        
        if (results.length === 0) throw new Error('No data available for this area');
        
        const sorted = results.slice().sort((a, b) => a.mean - b.mean);
        
        currentData = {
            type: 'polygon',
            results: results,
            best: sorted.slice(0, 3),
            worst: sorted.slice(-3).reverse(),
            total: results.length,
            parameter: selectedParam,
            parameterName: paramMeta.name,
            unit: paramMeta.unit
        };
        
        hideLoading();
        displayPolygonResults();
        visualizePolygon(results);
        showExportButtons();
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
        
        if (precipData.length === 0) throw new Error('No data available for flood analysis');
        
        const precipStats = calculateStats(precipData, 2);
        const humidityStats = calculateStats(humidityData, 1);
        
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
        showExportButtons();
        showNotification('Analysis complete!', 'success');
        
    } catch (error) {
        hideLoading();
        showNotification('Error: ' + error.message, 'error');
    }
}

// HELPER FUNCTIONS
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
        const norm = (result.mean - min) / (max - min || 1);
        const color = norm < 0.33 ? '#10b981' : norm < 0.66 ? '#f59e0b' : '#ef4444';
        
        const marker = L.circleMarker([result.lat, result.lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            fillOpacity: 0.8
        }).addTo(map).bindPopup(`Value: ${result.mean.toFixed(1)} ${currentData.unit}`);
        
        polygonMarkers.push(marker);
    });
}

function calculateStats(values, decimals = 1) {
    const sorted = values.slice().sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return {
        mean: mean.toFixed(decimals),
        median: sorted[Math.floor(sorted.length / 2)].toFixed(decimals),
        std: std.toFixed(decimals),
        min: sorted[0].toFixed(decimals),
        max: sorted[sorted.length - 1].toFixed(decimals)
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

function updateLoadingProgress(current, total) {
    const container = document.getElementById('results-container');
    if (container) {
        const percent = Math.round((current / total) * 100);
        const loadingText = container.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `Analyzing polygon area... ${percent}% (${current}/${total} points)`;
        }
    }
}

// DISPLAY FUNCTIONS
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

function showExportButtons() {
    const exportButtons = document.getElementById('export-buttons');
    if (exportButtons) {
        exportButtons.style.display = 'grid';
    }
}

function displaySingleResults() {
    const stats = currentData.stats;
    const unit = currentData.unit || '°C';
    const paramName = currentData.parameterName || 'Temperature';
    
    const html = `
        <div class="result-card">
            <h3 style="color: #00C4FF; margin-bottom: 20px;">Single Point Analysis - ${paramName}</h3>
            <div class="result-grid">
                <div class="metric-box">
                    <div class="metric-label">Average</div>
                    <div class="metric-value">${stats.mean}</div>
                    <div class="metric-unit">${unit}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">Minimum</div>
                    <div class="metric-value">${stats.min}</div>
                    <div class="metric-unit">${unit}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">Maximum</div>
                    <div class="metric-value">${stats.max}</div>
                    <div class="metric-unit">${unit}</div>
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
    const unit = currentData.unit || '°C';
    const paramName = currentData.parameterName || 'Temperature';
    
    let bestHtml = '';
    currentData.best.forEach((d, i) => {
        bestHtml += `
            <div class="metric-box">
                <div class="metric-label">#${i + 1} - ${d.date}</div>
                <div class="metric-value">${d.mean.toFixed(1)}</div>
                <div class="metric-unit">${unit}</div>
            </div>
        `;
    });
    
    let worstHtml = '';
    currentData.worst.forEach((d, i) => {
        worstHtml += `
            <div class="metric-box" style="border-color: rgba(239, 68, 68, 0.3);">
                <div class="metric-label">#${i + 1} - ${d.date}</div>
                <div class="metric-value">${d.mean.toFixed(1)}</div>
                <div class="metric-unit">${unit}</div>
            </div>
        `;
    });
    
    const html = `
        <div class="result-card">
            <h3 style="color: #00C4FF; margin-bottom: 20px;">Date Range Analysis - ${paramName}</h3>
            <h4 style="color: #10b981; margin-bottom: 15px;">Best Dates (Lowest Values)</h4>
            <div class="result-grid">${bestHtml}</div>
            <h4 style="color: #ef4444; margin: 30px 0 15px 0;">Worst Dates (Highest Values)</h4>
            <div class="result-grid">${worstHtml}</div>
        </div>
    `;
    
    document.getElementById('results-container').innerHTML = html;
}

function displayPolygonResults() {
    const unit = currentData.unit || '°C';
    const paramName = currentData.parameterName || 'Temperature';
    
    let bestHtml = '';
    currentData.best.forEach((loc, i) => {
        bestHtml += `
            <div class="metric-box">
                <div class="metric-label">#${i + 1} Best</div>
                <div class="metric-value">${loc.mean.toFixed(1)}</div>
                <div class="metric-unit">${unit}</div>
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
                <div class="metric-unit">${unit}</div>
                <div style="font-size: 0.75em; margin-top: 8px;">${loc.lat}, ${loc.lng}</div>
            </div>
        `;
    });
    
    const html = `
        <div class="result-card">
            <h3 style="color: #00C4FF; margin-bottom: 20px;">Polygon Area Analysis - ${paramName}</h3>
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
    
    const unit = currentData.unit || '°C';
    const paramName = currentData.parameterName || 'Temperature';
    
    const html = `
        <div class="chart-container">
            <h3 style="color: #00C4FF; margin-bottom: 18px;">Historical ${paramName} Trend</h3>
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
                label: `${paramName} (${unit})`,
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
                        callback: value => value + ' ' + unit
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

// EXPORT FUNCTIONS
function exportToCSV() {
    if (!currentData) {
        showNotification('No data to export', 'error');
        return;
    }
    
    let csv = '';
    const paramName = currentData.parameterName || 'Temperature';
    const unit = currentData.unit || '°C';
    
    if (currentData.type === 'single') {
        csv = `Year,${paramName} (${unit})\n`;
        currentData.years.forEach((year, i) => {
            csv += `${year},${currentData.values[i]}\n`;
        });
        csv += `\nStatistics\nAverage,${currentData.stats.mean}\nMinimum,${currentData.stats.min}\nMaximum,${currentData.stats.max}\nStd Dev,${currentData.stats.std}`;
    } else if (currentData.type === 'range') {
        csv = `Date,Mean (${unit}),Min (${unit}),Max (${unit})\n`;
        currentData.results.forEach(r => {
            csv += `${r.date},${r.mean},${r.min},${r.max}\n`;
        });
    } else if (currentData.type === 'polygon') {
        csv = `Latitude,Longitude,Mean (${unit}),Min (${unit}),Max (${unit})\n`;
        currentData.results.forEach(r => {
            csv += `${r.lat},${r.lng},${r.mean},${r.min},${r.max}\n`;
        });
    } else if (currentData.type === 'flood') {
        csv = 'Metric,Value\n';
        csv += `Risk Level,${currentData.riskLevel}\n`;
        csv += `Risk Percentage,${currentData.riskPercent}%\n`;
        csv += `Avg Precipitation,${currentData.precipStats.mean}mm\n`;
        csv += `Avg Humidity,${currentData.humidityStats.mean}%\n`;
    }
    
    downloadFile(csv, `dropcheck_${currentData.type}_${Date.now()}.csv`, 'text/csv');
    showNotification('CSV exported successfully!', 'success');
}

function exportToJSON() {
    if (!currentData) {
        showNotification('No data to export', 'error');
        return;
    }
    
    const json = JSON.stringify(currentData, null, 2);
    downloadFile(json, `dropcheck_${currentData.type}_${Date.now()}.json`, 'application/json');
    showNotification('JSON exported successfully!', 'success');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// HISTORY FUNCTIONS
function saveToHistory(data) {
    if (data.type !== 'single') return;
    
    const entry = {
        date: data.date,
        location: data.location,
        stats: data.stats,
        parameter: data.parameter,
        parameterName: data.parameterName,
        unit: data.unit,
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
    html += '<h2 style="color: #00C4FF; margin-bottom: 20px; font-family: Orbitron, sans-serif;">Comparison History</h2>';
    html += '<div style="display: grid; gap: 15px;">';
    
    comparisonHistory.forEach((entry, i) => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        html += `
            <div style="background: rgba(0, 196, 255, 0.1); padding: 20px; border-radius: 12px; border: 2px solid rgba(0, 196, 255, 0.3);">
                <div style="color: #1E1E2F; font-weight: 700; margin-bottom: 10px;">
                    ${entry.parameterName || 'Temperature'} - ${entry.date} - ${entry.location.lat}, ${entry.location.lon}
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 0.9em;">
                    <div><strong>Avg:</strong> ${entry.stats.mean}${entry.unit || '°C'}</div>
                    <div><strong>Min:</strong> ${entry.stats.min}${entry.unit || '°C'}</div>
                    <div><strong>Max:</strong> ${entry.stats.max}${entry.unit || '°C'}</div>
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

console.log('✅ DropCheck Scientific v2.0 - Ready!');