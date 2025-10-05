// ====================================
// DISPLAY FUNCTIONS
// ====================================
function displaySingleResults() {
    const { stats, config, values } = currentData;
    
    const title = currentLang === 'en' ? 'Statistical Analysis' : 'Análisis Estadístico';
    const avgLabel = currentLang === 'en' ? 'AVERAGE' : 'PROMEDIO';
    const medianLabel = currentLang === 'en' ? 'MEDIAN' : 'MEDIANA';
    const minLabel = currentLang === 'en' ? 'MINIMUM' : 'MÍNIMO';
    const maxLabel = currentLang === 'en' ? 'MAXIMUM' : 'MÁXIMO';
    const stdLabel = 'STD DEV';
    const dataLabel = currentLang === 'en' ? 'DATA POINTS' : 'PUNTOS DE DATOS';
    const yearsLabel = currentLang === 'en' ? 'years' : 'años';
    
    const html = `
        <div class="result-card">
            <h3 style="color: #00C4FF; margin-bottom: 20px; font-size: 1.4em;">${title}</h3>
            <div class="result-grid">
                <div class="metric-box">
                    <div class="metric-label">${avgLabel}</div>
                    <div class="metric-value">${stats.mean}</div>
                    <div class="metric-unit">${config.unit}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">${medianLabel}</div>
                    <div class="metric-value">${stats.median}</div>
                    <div class="metric-unit">${config.unit}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">${minLabel}</div>
                    <div class="metric-value">${stats.min}</div>
                    <div class="metric-unit">${config.unit}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">${maxLabel}</div>
                    <div class="metric-value">${stats.max}</div>
                    <div class="metric-unit">${config.unit}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">${stdLabel}</div>
                    <div class="metric-value">${stats.std}</div>
                    <div class="metric-unit">${config.unit}</div>
                </div>
                <div class="metric-box">
                    <div class="metric-label">${dataLabel}</div>
                    <div class="metric-value">${values.length}</div>
                    <div class="metric-unit">${yearsLabel}</div>
                </div>
            </div>
            
            <div style="background: rgba(0, 196, 255, 0.1); border: 2px solid rgba(0, 196, 255, 0.3); padding: 20px; border-radius: 14px; margin-top: 25px;">
                <h4 style="color: #00C4FF; margin-bottom: 12px; font-size: 1.1em;">${currentLang === 'en' ? '📊 Analysis Summary' : '📊 Resumen del Análisis'}</h4>
                <p style="color: rgba(30, 30, 47, 0.8); line-height: 1.7; font-size: 0.95em;">
                    <strong>${currentLang === 'en' ? 'Location:' : 'Ubicación:'}</strong> ${selectedLat}, ${selectedLon}<br>
                    <strong>${currentLang === 'en' ? 'Parameter:' : 'Parámetro:'}</strong> ${config.name}<br>
                    <strong>${currentLang === 'en' ? 'Date:' : 'Fecha:'}</strong> ${currentData.date}<br>
                    <strong>${currentLang === 'en' ? 'Historical Data:' : 'Datos Históricos:'}</strong> ${values.length} ${yearsLabel} (${Math.min(...currentData.years)}-${Math.max(...currentData.years)})<br>
                    <strong>${currentLang === 'en' ? 'Percentiles:' : 'Percentiles:'}</strong> P10=${stats.p10}, P25=${stats.p25}, P75=${stats.p75}, P90=${stats.p90} ${config.unit}<br>
                    <strong>${currentLang === 'en' ? 'Data Source:' : 'Fuente de Datos:'}</strong> NASA POWER API
                </p>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                ${quickQuestions[currentLang].map(q => `
                    <button class="location-chip" onclick="handleQuickQuestion('${q.type}')" style="cursor: pointer;">
                        ${q.q}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('results-container').innerHTML = html;
    document.getElementById('charts-section').style.display = 'block';
}

function displayRangeResults() {
    const { bestDates, worstDates, config } = currentData;
    
    const bestLabel = currentLang === 'en' ? 'BEST DATE' : 'MEJOR FECHA';
    const worstLabel = currentLang === 'en' ? 'WORST DATE' : 'PEOR FECHA';
    const rangeLabel = currentLang === 'en' ? 'Range' : 'Rango';
    const dataLabel = currentLang === 'en' ? 'years data' : 'años de datos';
    
    const bestHtml = bestDates.map((d, i) => `
        <div class="metric-box" style="animation-delay: ${i * 0.1}s">
            <div class="metric-label">#${i + 1} ${bestLabel}</div>
            <div class="metric-value" style="font-size: 1.8em;">${d.date}</div>
            <div class="metric-unit">${d.mean.toFixed(1)} ${config.unit}</div>
            <p style="font-size: 0.8em; margin-top: 8px; color: rgba(30, 30, 47, 0.6);">
                ${rangeLabel}: ${d.min.toFixed(1)}-${d.max.toFixed(1)}<br>
                Std Dev: ${d.std.toFixed(2)}<br>
                ${d.count} ${dataLabel}
            </p>
        </div>
    `).join('');
    
    const worstHtml = worstDates.map((d, i) => `
        <div class="metric-box" style="animation-delay: ${i * 0.1}s; border-color: rgba(239, 68, 68, 0.3);">
            <div class="metric-label">#${i + 1} ${worstLabel}</div>
            <div class="metric-value" style="font-size: 1.8em;">${d.date}</div>
            <div class="metric-unit">${d.mean.toFixed(1)} ${config.unit}</div>
            <p style="font-size: 0.8em; margin-top: 8px; color: rgba(30, 30, 47, 0.6);">
                ${rangeLabel}: ${d.min.toFixed(1)}-${d.max.toFixed(1)}<br>
                Std Dev: ${d.std.toFixed(2)}<br>
                ${d.count} ${dataLabel}
            </p>
        </div>
    `).join('');
    
    const directionLabel = config.goodDirection === 'lower' ? (currentLang === 'en' ? 'Lowest' : 'Más Bajo') : config.goodDirection === 'higher' ? (currentLang === 'en' ? 'Highest' : 'Más Alto') : (currentLang === 'en' ? 'Most Stable' : 'Más Estable');
    
    document.getElementById('results-container').innerHTML = `
        <div class="result-card">
            <h3 style="color: #10b981; margin-bottom: 20px;">${currentLang === 'en' ? '✅ Best Dates' : '✅ Mejores Fechas'} (${directionLabel} ${config.name})</h3>
            <div class="result-grid">${bestHtml}</div>
            
            <h3 style="color: #ef4444; margin: 30px 0 20px;">${currentLang === 'en' ? '⚠️ Worst Dates' : '⚠️ Peores Fechas'}</h3>
            <div class="result-grid">${worstHtml}</div>
            
            <div style="background: rgba(0, 196, 255, 0.1); border: 2px solid rgba(0, 196, 255, 0.3); padding: 20px; border-radius: 14px; margin-top: 25px;">
                <h4 style="color: #00C4FF; margin-bottom: 12px; font-size: 1.1em;">${currentLang === 'en' ? '📅 Range Analysis Summary' : '📅 Resumen de Análisis de Rango'}</h4>
                <p style="color: rgba(30, 30, 47, 0.8); line-height: 1.7; font-size: 0.95em;">
                    <strong>${currentLang === 'en' ? 'Date Range:' : 'Rango de Fechas:'}</strong> ${currentData.dateRange.start} ${currentLang === 'en' ? 'to' : 'a'} ${currentData.dateRange.end}<br>
                    <strong>${currentLang === 'en' ? 'Total Dates Analyzed:' : 'Total de Fechas Analizadas:'}</strong> ${currentData.rangeResults.length}<br>
                    <strong>${currentLang === 'en' ? 'Location:' : 'Ubicación:'}</strong> ${currentData.location.lat}, ${currentData.location.lon}<br>
                    <strong>${currentLang === 'en' ? 'Parameter:' : 'Parámetro:'}</strong> ${config.name}<br>
                    <strong>${currentLang === 'en' ? 'Recommendation:' : 'Recomendación:'}</strong> ${currentLang === 'en' ? `Choose dates from the "Best Dates" section for optimal ${config.name} conditions` : `Elige fechas de la sección "Mejores Fechas" para condiciones óptimas de ${config.name}`}
                </p>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                ${quickQuestions[currentLang].map(q => `
                    <button class="location-chip" onclick="handleQuickQuestion('${q.type}')" style="cursor: pointer;">
                        ${q.q}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function displayPolygonResults() {
    const { bestLocations, worstLocations, config, totalPoints } = currentData;
    
    const bestLabel = currentLang === 'en' ? 'BEST LOCATION' : 'MEJOR UBICACIÓN';
    const worstLabel = currentLang === 'en' ? 'WORST LOCATION' : 'PEOR UBICACIÓN';
    const rangeLabel = currentLang === 'en' ? 'Range' : 'Rango';
    const dataLabel = currentLang === 'en' ? 'data points' : 'puntos de datos';
    
    const bestHtml = bestLocations.map((loc, i) => `
        <div class="metric-box" style="animation-delay: ${i * 0.1}s">
            <div class="metric-label">#${i + 1} ${bestLabel}</div>
            <div class="metric-value">${loc.mean.toFixed(1)}</div>
            <div class="metric-unit">${config.unit}</div>
            <p style="font-size: 0.8em; margin-top: 8px; color: rgba(30, 30, 47, 0.6);">
                📍 ${loc.lat}, ${loc.lng}<br>
                ${rangeLabel}: ${loc.min.toFixed(1)}-${loc.max.toFixed(1)}<br>
                Std Dev: ${loc.std.toFixed(2)}<br>
                ${loc.dataPoints} ${dataLabel}
            </p>
        </div>
    `).join('');
    
    const worstHtml = worstLocations.map((loc, i) => `
        <div class="metric-box" style="animation-delay: ${i * 0.1}s; border-color: rgba(239, 68, 68, 0.3);">
            <div class="metric-label">#${i + 1} ${worstLabel}</div>
            <div class="metric-value">${loc.mean.toFixed(1)}</div>
            <div class="metric-unit">${config.unit}</div>
            <p style="font-size: 0.8em; margin-top: 8px; color: rgba(30, 30, 47, 0.6);">
                📍 ${loc.lat}, ${loc.lng}<br>
                ${rangeLabel}: ${loc.min.toFixed(1)}-${loc.max.toFixed(1)}<br>
                Std Dev: ${loc.std.toFixed(2)}<br>
                ${loc.dataPoints} ${dataLabel}
            </p>
        </div>
    `).join('');
    
    document.getElementById('results-container').innerHTML = `
        <div class="result-card">
            <h3 style="color: #10b981; margin-bottom: 20px;">${currentLang === 'en' ? '🟢 Best Locations in Area' : '🟢 Mejores Ubicaciones en el Área'}</h3>
            <div class="result-grid">${bestHtml}</div>
            
            <h3 style="color: #ef4444; margin: 30px 0 20px;">${currentLang === 'en' ? '🔴 Worst Locations' : '🔴 Peores Ubicaciones'}</h3>
            <div class="result-grid">${worstHtml}</div>
            
            <div style="background: rgba(0, 196, 255, 0.1); border: 2px solid rgba(0, 196, 255, 0.3); padding: 20px; border-radius: 14px; margin-top: 25px;">
                <h4 style="color: #00C4FF; margin-bottom: 12px; font-size: 1.1em;">${currentLang === 'en' ? '🗺️ Polygon Analysis Summary' : '🗺️ Resumen de Análisis Poligonal'}</h4>
                <p style="color: rgba(30, 30, 47, 0.8); line-height: 1.7; font-size: 0.95em;">
                    <strong>${currentLang === 'en' ? 'Total Points Analyzed:' : 'Total de Puntos Analizados:'}</strong> ${totalPoints} ${currentLang === 'en' ? 'locations' : 'ubicaciones'} (${Math.sqrt(totalPoints).toFixed(0)}x${Math.sqrt(totalPoints).toFixed(0)} grid)<br>
                    <strong>${currentLang === 'en' ? 'Date:' : 'Fecha:'}</strong> ${currentData.date}<br>
                    <strong>${currentLang === 'en' ? 'Parameter:' : 'Parámetro:'}</strong> ${config.name}<br>
                    <strong>${currentLang === 'en' ? 'Best Location:' : 'Mejor Ubicación:'}</strong> ${bestLocations[0].lat}, ${bestLocations[0].lng} (${bestLocations[0].mean.toFixed(1)} ${config.unit})<br>
                    <strong>${currentLang === 'en' ? 'Worst Location:' : 'Peor Ubicación:'}</strong> ${worstLocations[0].lat}, ${worstLocations[0].lng} (${worstLocations[0].mean.toFixed(1)} ${config.unit})<br>
                    <strong>${currentLang === 'en' ? 'Map Markers:' : 'Marcadores del Mapa:'}</strong> 🟢 ${currentLang === 'en' ? 'Green = Best locations, 🔴 Red = Worst locations' : 'Verde = Mejores ubicaciones, 🔴 Rojo = Peores ubicaciones'}
                </p>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                ${quickQuestions[currentLang].map(q => `
                    <button class="location-chip" onclick="handleQuickQuestion('${q.type}')" style="cursor: pointer;">
                        ${q.q}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

function displayCharts() {
    const { years, values, config } = currentData;
    
    if (historyChart) historyChart.destroy();
    
    const chartsHtml = `
        <div class="chart-container">
            <h3 style="color: #00C4FF; margin-bottom: 18px;">${currentLang === 'en' ? '📈 Historical Trend (20 Years)' : '📈 Tendencia Histórica (20 Años)'}</h3>
            <canvas id="history-chart"></canvas>
        </div>
        <div class="chart-container">
            <h3 style="color: #00C4FF; margin-bottom: 18px;">${currentLang === 'en' ? '📊 Distribution' : '📊 Distribución'}</h3>
            <canvas id="distribution-chart"></canvas>
        </div>
    `;
    
    document.getElementById('charts-section').innerHTML = chartsHtml;
    
    const ctx1 = document.getElementById('history-chart').getContext('2d');
    historyChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: `${config.name} (${config.unit})`,
                data: values,
                borderColor: '#00C4FF',
                backgroundColor: 'rgba(0, 196, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#00C4FF',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#1E1E2F',
                        font: { family: 'Inter', size: 13, weight: 600 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#1E1E2F', font: { weight: 500 } },
                    grid: { color: 'rgba(0, 196, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#1E1E2F', font: { weight: 500 } },
                    grid: { color: 'rgba(0, 196, 255, 0.1)' }
                }
            }
        }
    });
}

// ====================================
// AI AUTO-INSIGHTS
// ====================================
async function generateAutoInsights() {
    if (!aiEnabled || !currentData) return;
    
    let context = {
        param: currentData.config.name,
        location: `${selectedLat}, ${selectedLon}`
    };
    
    let prompt = '';
    
    if (currentData.type === 'single') {
        context.stats = currentData.stats;
        prompt = `Analyze this ${currentData.config.name} data for ${currentData.date}. Average: ${currentData.stats.mean}${currentData.config.unit}, Range: ${currentData.stats.min}-${currentData.stats.max}${currentData.config.unit}. What insights can you provide?`;
    } else if (currentData.type === 'range') {
        context.dateRange = `${currentData.dateRange.start} to ${currentData.dateRange.end}`;
        prompt = `I analyzed ${currentData.rangeResults.length} dates for ${currentData.config.name}. Best date is ${currentData.bestDates[0].date} with ${currentData.bestDates[0].mean.toFixed(1)}${currentData.config.unit}. What recommendations do you have?`;
    } else if (currentData.type === 'polygon') {
        prompt = `I analyzed ${currentData.totalPoints} locations in an area for ${currentData.config.name}. Best location: ${currentData.bestLocations[0].lat}, ${currentData.bestLocations[0].lng} with ${currentData.bestLocations[0].mean.toFixed(1)}${currentData.config.unit}. What spatial insights can you provide?`;
    }
    
    displayAIMessage(prompt, true);
    
    const response = await sendToOllama(prompt, context);
    displayAIMessage(response, false);
}

// ====================================
// UTILITIES
// ====================================
function calculateStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
    
    return {
        mean: mean.toFixed(1),
        median: sorted[Math.floor(sorted.length / 2)].toFixed(1),
        std: std.toFixed(2),
        min: sorted[0].toFixed(1),
        max: sorted[sorted.length - 1].toFixed(1),
        p10: sorted[Math.floor(sorted.length * 0.1)].toFixed(1),
        p25: sorted[Math.floor(sorted.length * 0.25)].toFixed(1),
        p75: sorted[Math.floor(sorted.length * 0.75)].toFixed(1),
        p90: sorted[Math.floor(sorted.length * 0.9)].toFixed(1)
    };
}

function createHistogram(values, bins) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / bins;
    
    const histogram = Array(bins).fill(0).map((_, i) => ({
        min: min + i * binSize,
        max: min + (i + 1) * binSize,
        count: 0,
        range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`
    }));
    
    values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binSize), bins - 1);
        histogram[binIndex].count++;
    });
    
    return histogram;
}

function getParamConfig(param) {
    const configs = {
        'T2M': { unit: '°C', name: 'Temperature', goodDirection: 'stable' },
        'T2M_MAX': { unit: '°C', name: 'Max Temperature', goodDirection: 'lower' },
        'T2M_MIN': { unit: '°C', name: 'Min Temperature', goodDirection: 'higher' },
        'PRECTOTCORR': { unit: 'mm', name: 'Precipitation', goodDirection: 'lower' },
        'WS2M': { unit: 'm/s', name: 'Wind Speed', goodDirection: 'lower' },
        'RH2M': { unit: '%', name: 'Relative Humidity', goodDirection: 'stable' },
        'ALLSKY_SFC_SW_DWN': { unit: 'kWh/m²', name: 'Solar Radiation', goodDirection: 'higher' }
    };
    return configs[param] || { unit: '', name: param, goodDirection: 'stable' };
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

function visualizePolygonOnMap(results, config) {
    map.eachLayer(layer => {
        if (layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
        }
    });
    
    results.forEach(result => {
        const values = results.map(r => parseFloat(r.mean));
        const min = Math.min(...values);
        const max = Math.max(...values);
        const normalized = (parseFloat(result.mean) - min) / (max - min);
        
        let color;
        if (config.goodDirection === 'lower') {
            color = normalized < 0.33 ? '#10b981' : normalized < 0.66 ? '#f59e0b' : '#ef4444';
        } else {
            color = normalized > 0.66 ? '#10b981' : normalized > 0.33 ? '#f59e0b' : '#ef4444';
        }
        
        L.circleMarker([result.lat, result.lng], {
            radius: 8,
            fillColor: color,
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map).bindPopup(`
            <strong>${result.mean} ${config.unit}</strong><br>
            Range: ${result.min}-${result.max}<br>
            Location: ${result.lat}, ${result.lng}
        `);
    });
}

function formatDateForAPI(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function showLoading(text) {
    document.getElementById('results-container').innerHTML = `
        <div class="loading">
            <div class="loading-ring"></div>
            <div class="loading-text">${text}</div>
        </div>
    `;
}

function hideLoading() {}

// ====================================
// EXPORT FUNCTIONS
// ====================================
function exportData() {
    if (!currentData) return alert('No data to export');
    
    const format = confirm('Click OK for CSV, Cancel for JSON');
    
    if (format) {
        exportCSV();
    } else {
        exportJSON();
    }
}

function exportCSV() {
    let csv = '';
    
    if (currentData.type === 'single') {
        csv = 'Year,Value,Parameter,Unit\n';
        currentData.years.forEach((year, i) => {
            csv += `${year},${currentData.values[i]},${currentData.config.name},${currentData.config.unit}\n`;
        });
    } else if (currentData.type === 'range') {
        csv = 'Date,Mean,Min,Max,StdDev,Count,Parameter,Unit\n';
        currentData.rangeResults.forEach(d => {
            csv += `${d.date},${d.mean},${d.min},${d.max},${d.std},${d.count},${currentData.config.name},${currentData.config.unit}\n`;
        });
    } else if (currentData.type === 'polygon') {
        csv = 'Latitude,Longitude,Mean,Min,Max,StdDev,DataPoints,Parameter,Unit\n';
        currentData.polygonResults.forEach(loc => {
            csv += `${loc.lat},${loc.lng},${loc.mean},${loc.min},${loc.max},${loc.std},${loc.dataPoints},${currentData.config.name},${currentData.config.unit}\n`;
        });
    } else if (currentData.type === 'flood') {
        csv = 'Metric,Value,Unit\n';
        csv += `Risk Level,${currentData.riskLevel},-\n`;
        csv += `Risk Score,${currentData.riskScore},%\n`;
        csv += `Avg Precipitation,${currentData.precipStats.mean},mm\n`;
        csv += `Max Precipitation,${currentData.precipStats.max},mm\n`;
        csv += `Avg Humidity,${currentData.humidityStats.mean},%\n`;
        csv += `High Precip Days,${currentData.highPrecipDays},days\n`;
        csv += `Extreme Days,${currentData.extremePrecipDays},days\n`;
    }
    
    downloadFile(csv, 'dropcheck-data.csv', 'text/csv');
}

function exportJSON() {
    const exportData = {
        ...currentData,
        metadata: {
            exportDate: new Date().toISOString(),
            dataSource: 'NASA POWER API',
            application: 'DropCheck Scientific v3.0',
            units: currentData.config?.unit || 'N/A'
        }
    };
    
    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, 'dropcheck-data.json', 'application/json');
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
            polygon: true,
            rectangle: true,
            circle: false,
            circlemarker: false,
            polyline: false,
            marker: false
        }
    });
    map.addControl(drawControl);
    
    marker = L.marker([selectedLat, selectedLon], { draggable: true }).addTo(map);
    
    marker.on('dragend', e => {
        const p = marker.getLatLng();
        selectedLat = parseFloat(p.lat.toFixed(4));
        selectedLon = parseFloat(p.lng.toFixed(4));
        updateCoordinates();
    });
    
    map.on('click', e => {
        selectedLat = parseFloat(e.latlng.lat.toFixed(4));
        selectedLon = parseFloat(e.latlng.lng.toFixed(4));
        marker.setLatLng([selectedLat, selectedLon]);
        updateCoordinates();
    });
    
    map.on(L.Draw.Event.CREATED, e => {
        drawnItems.clearLayers();
        drawnItems.addLayer(e.layer);
        currentPolygon = e.layer;
        alert('Area created! Click "Analyze with NASA Data" to begin analysis.');
    });
    
    updateCoordinates();
}

function updateCoordinates() {
    document.getElementById('coordinates').textContent = `📍 ${selectedLat}, ${selectedLon}`;
}

// ====================================
// UI INITIALIZATION
// ====================================
function initQuickLocations() {
    const container = document.getElementById('quick-locations');
    quickLocations.forEach(loc => {
        const chip = document.createElement('div');
        chip.className = 'location-chip';
        chip.textContent = loc.name;
        chip.onclick = () => {
            selectedLat = loc.coords[0];
            selectedLon = loc.coords[1];
            map.setView([selectedLat, selectedLon], 5);
            marker.setLatLng([selectedLat, selectedLon]);
            updateCoordinates();
        };
        container.appendChild(chip);
    });
}

function setDefaultDates() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('date-input').valueAsDate = tomorrow;
    document.getElementById('start-date').valueAsDate = tomorrow;
    const end = new Date(tomorrow);
    end.setDate(end.getDate() + 30);
    document.getElementById('end-date').valueAsDate = end;
}

function loadSavedLanguage() {
    const saved = localStorage.getItem('selectedLanguage') || 'en';
    currentLang = saved;
    document.getElementById('lang-select').value = saved;
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('selectedLanguage', lang);
}

// ====================================
// EVENT LISTENERS
// ====================================
function setupEventListeners() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            
            if (currentMode === 'range') {
                document.getElementById('date-container-single').style.display = 'none';
                document.getElementById('date-container-range').style.display = 'block';
            } else {
                document.getElementById('date-container-single').style.display = 'block';
                document.getElementById('date-container-range').style.display = 'none';
            }
        });
    });
    
    document.getElementById('analyze-btn').addEventListener('click', async () => {
        if (currentMode === 'single') {
            await analyzeSinglePoint();
        } else if (currentMode === 'range') {
            await analyzeDateRange();
        } else if (currentMode === 'polygon') {
            await analyzePolygon();
        } else if (currentMode === 'flood') {
            await analyzeFloodRisk();
        }
    });
    
    document.getElementById('export-btn').addEventListener('click', exportData);
    
    document.getElementById('lang-select').addEventListener('change', e => {
        changeLanguage(e.target.value);
    });
    
    document.getElementById('ai-toggle-btn').addEventListener('click', () => {
        const container = document.getElementById('ai-chat-container');
        container.style.display = container.style.display === 'none' ? 'flex' : 'none';
    });
    
    document.getElementById('ai-close-btn').addEventListener('click', () => {
        document.getElementById('ai-chat-container').style.display = 'none';
    });
    
    document.getElementById('ai-send-btn').addEventListener('click', handleAISend);
    document.getElementById('ai-input').addEventListener('keypress', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAISend();
        }
    });
    
    document.getElementById('ai-settings-btn').addEventListener('click', () => {
        const modal = document.getElementById('ai-settings-modal');
        modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    });
    
    document.getElementById('save-settings-btn').addEventListener('click', () => {
        OLLAMA_CONFIG.url = document.getElementById('ollama-url').value;
        OLLAMA_CONFIG.model = document.getElementById('ollama-model').value;
        OLLAMA_CONFIG.temperature = parseFloat(document.getElementById('ollama-temp').value);
        
        localStorage.setItem('ollama_url', OLLAMA_CONFIG.url);
        localStorage.setItem('ollama_model', OLLAMA_CONFIG.model);
        localStorage.setItem('ollama_temp', OLLAMA_CONFIG.temperature);
        
        document.getElementById('ai-settings-modal').style.display = 'none';
        checkOllamaConnection();
        alert('Settings saved!');
    });
    
    document.getElementById('test-connection-btn').addEventListener('click', async () => {
        const status = document.getElementById('connection-status');
        status.textContent = 'Testing connection...';
        status.style.color = '#f59e0b';
        status.style.background = 'rgba(245, 158, 11, 0.1)';
        status.style.padding = '10px';
        status.style.borderRadius = '8px';
        
        const connected = await checkOllamaConnection();
        status.textContent = connected ? '✅ Connected successfully!' : '❌ Failed to connect. Make sure Ollama is running.';
        status.style.color = connected ? '#10b981' : '#ef4444';
        status.style.background = connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    });
    
    document.getElementById('ollama-temp').addEventListener('input', e => {
        document.getElementById('temp-value').textContent = e.target.value;
    });
    
    document.addEventListener('click', e => {
        if (e.target.id === 'ai-settings-modal') {
            document.getElementById('ai-settings-modal').style.display = 'none';
        }
    });
}

async function handleAISend() {
    const input = document.getElementById('ai-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    displayAIMessage(message, true);
    
    let context = {};
    if (currentData) {
        context = {
            param: currentData.config?.name || 'N/A',
            location: `${selectedLat}, ${selectedLon}`,
            stats: currentData.stats || currentData.rangeResults?.[0] || currentData.polygonResults?.[0] || {},
            dateRange: currentData.dateRange ? `${currentData.dateRange.start} to ${currentData.dateRange.end}` : null
        };
    }
    
    const response = await sendToOllama(message, context);
    displayAIMessage(response, false);
}

// ====================================
// TOOLTIP SYSTEM
// ====================================
function initTooltipSystem() {
    class TooltipSystem {
        constructor() {
            this.activeTooltip = null;
            this.pressTimer = null;
            this.init();
        }
        
        init() {
            this.attachTooltips();
        }
        
        attachTooltips() {
            const elements = document.querySelectorAll('[data-tooltip]');
            elements.forEach(el => {
                el.addEventListener('mouseenter', (e) => this.showTooltip(el, e));
                el.addEventListener('mouseleave', () => this.hideTooltip());
                
                el.addEventListener('touchstart', (e) => {
                    this.pressTimer = setTimeout(() => {
                        this.showTooltip(el, e, true);
                        if (navigator.vibrate) navigator.vibrate(50);
                    }, 500);
                });
                
                el.addEventListener('touchend', () => {
                    clearTimeout(this.pressTimer);
                });
                
                el.addEventListener('touchmove', () => {
                    clearTimeout(this.pressTimer);
                });
            });
            
            document.addEventListener('click', (e) => {
                if (this.activeTooltip && !e.target.closest('[data-tooltip]')) {
                    this.hideTooltip();
                }
            });
        }
        
        showTooltip(element, event, isMobile = false) {
            const text = element.getAttribute('data-tooltip');
            if (!text) return;
            
            this.hideTooltip();
            
            const tooltip = document.createElement('div');
            tooltip.className = 'custom-tooltip' + (isMobile ? ' mobile' : '');
            tooltip.innerHTML = `<div class="tooltip-content">${text}</div>`;
            
            document.body.appendChild(tooltip);
            this.activeTooltip = tooltip;
            
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let top = rect.bottom + 10;
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            
            if (left + tooltipRect.width > window.innerWidth - 20) {
                left = window.innerWidth - tooltipRect.width - 20;
            }
            if (left < 20) left = 20;
            
            if (top + tooltipRect.height > window.innerHeight - 20) {
                top = rect.top - tooltipRect.height - 10;
            }
            
            tooltip.style.top = top + 'px';
            tooltip.style.left = left + 'px';
            
            setTimeout(() => tooltip.classList.add('show'), 10);
        }
        
        hideTooltip() {
            if (this.activeTooltip) {
                this.activeTooltip.classList.remove('show');
                setTimeout(() => {
                    if (this.activeTooltip && this.activeTooltip.parentNode) {
                        this.activeTooltip.parentNode.removeChild(this.activeTooltip);
                    }
                    this.activeTooltip = null;
                }, 200);
            }
        }
    }
    
    new TooltipSystem();
}

console.log('🛰️ DropCheck Scientific V3.0 - Ready!');]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#1E1E2F',
                        font: { family: 'Inter', size: 13, weight: 600 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#1E1E2F', font: { weight: 500 } },
                    grid: { color: 'rgba(0, 196, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#1E1E2F', font: { weight: 500 } },
                    grid: { color: 'rgba(0, 196, 255, 0.1)' }
                }
            }
        }
    });
    
    if (distributionChart) distributionChart.destroy();
    
    const bins = createHistogram(values, 10);
    const ctx2 = document.getElementById('distribution-chart').getContext('2d');
    distributionChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: bins.map(b => b.range),
            datasets: [{
                label: currentLang === 'en' ? 'Frequency' : 'Frecuencia',
                data: bins.map(b => b.count),
                backgroundColor: 'rgba(0, 196, 255, 0.6)',
                borderColor: '#00C4FF',
                borderWidth: 1
            }// ====================================
// DROPCHECK SCIENTIFIC V3.0 - COMPLETE
// 100% Real NASA POWER API Data
// Ollama AI Integration + Flood Analysis
// ====================================

const NASA_API = 'https://power.larc.nasa.gov/api/temporal/daily/point';

// OLLAMA AI CONFIGURATION
const OLLAMA_CONFIG = {
    url: 'http://localhost:11434',
    model: 'mistral',
    temperature: 0.7,
    timeout: 30000
// ====================================
// ANALYSIS MODES
// ====================================
async function analyzeSinglePoint() {
    const date = document.getElementById('date-input').value;
    const param = document.getElementById('parameter-select').value;
    
    if (!date) return alert(translations[currentLang].selectDate);
    
    showLoading(translations[currentLang].analyzing);
    
    try {
        const dateObj = new Date(date);
        const currentYear = new Date().getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        const allData = [];
        
        for (let y = currentYear - 20; y < currentYear; y++) {
            const dateStr = `${y}${month}${day}`;
            try {
                const data = await fetchNASAPowerData(selectedLat, selectedLon, param, dateStr, dateStr);
                allData.push(...data);
                await sleep(100);
            } catch (e) {
                console.warn(`Failed year ${y}`);
            }
        }
        
        if (allData.length === 0) throw new Error(translations[currentLang].noData);
        
        const config = getParamConfig(param);
        const values = allData.map(d => d.value);
        const years = allData.map(d => d.year);
        const stats = calculateStats(values);
        
        currentData = {
            type: 'single',
            param,
            config,
            stats,
            values,
            years,
            location: { lat: selectedLat, lon: selectedLon },
            date: date
        };
        
        hideLoading();
        displaySingleResults();
        displayCharts();
        document.getElementById('export-btn').style.display = 'block';
        
        if (aiEnabled) {
            setTimeout(() => generateAutoInsights(), 1000);
        }
        
    } catch (error) {
        hideLoading();
        alert(`${translations[currentLang].error}: ${error.message}`);
    }
}

async function analyzeDateRange() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const param = document.getElementById('parameter-select').value;
    
    if (!startDate || !endDate) return alert(translations[currentLang].selectRange);
    
    showLoading(translations[currentLang].analyzing);
    
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const config = getParamConfig(param);
        
        const startStr = formatDateForAPI(start);
        const endStr = formatDateForAPI(end);
        
        const data = await fetchNASAPowerData(selectedLat, selectedLon, param, startStr, endStr);
        
        if (data.length === 0) throw new Error(translations[currentLang].noData);
        
        const dailyData = {};
        data.forEach(item => {
            const key = `${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
            if (!dailyData[key]) dailyData[key] = [];
            dailyData[key].push(item.value);
        });
        
        const rangeResults = Object.keys(dailyData).map(key => {
            const values = dailyData[key];
            const stats = calculateStats(values);
            return {
                date: key,
                ...stats,
                count: values.length
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
        document.getElementById('charts-section').style.display = 'none';
        document.getElementById('export-btn').style.display = 'block';
        
        if (aiEnabled) {
            setTimeout(() => generateAutoInsights(), 1000);
        }
        
    } catch (error) {
        hideLoading();
        alert(`${translations[currentLang].error}: ${error.message}`);
    }
}

async function analyzePolygon() {
    if (!currentPolygon) return alert(translations[currentLang].drawArea);
    
    const date = document.getElementById('date-input').value;
    const param = document.getElementById('parameter-select').value;
    
    if (!date) return alert(translations[currentLang].selectDate);
    
    showLoading(translations[currentLang].analyzing);
    
    try {
        const bounds = currentPolygon.getBounds();
        const points = generateGridPoints(bounds, 4);
        const config = getParamConfig(param);
        
        const dateObj = new Date(date);
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const currentYear = new Date().getFullYear();
        
        const results = [];
        
        for (const point of points) {
            const allYears = [];
            
            for (let y = currentYear - 10; y < currentYear; y++) {
                const dateStr = `${y}${month}${day}`;
                try {
                    const data = await fetchNASAPowerData(point.lat, point.lng, param, dateStr, dateStr);
                    allYears.push(...data);
                } catch (e) {
                    console.warn(`Failed: ${point.lat}, ${point.lng}, ${y}`);
                }
                await sleep(100);
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
        }
        
        if (results.length === 0) throw new Error(translations[currentLang].noData);
        
        const sorted = [...results].sort((a, b) => {
            if (config.goodDirection === 'lower') return a.mean - b.mean;
            if (config.goodDirection === 'higher') return b.mean - a.mean;
            return Math.abs(a.std) - Math.abs(b.std);
        });
        
        currentData = {
            type: 'polygon',
            param,
            config,
            polygonResults: results,
            bestLocations: sorted.slice(0, 3),
            worstLocations: sorted.slice(-3).reverse(),
            date: date,
            totalPoints: results.length
        };
        
        hideLoading();
        displayPolygonResults();
        visualizePolygonOnMap(results, config);
        document.getElementById('charts-section').style.display = 'none';
        document.getElementById('export-btn').style.display = 'block';
        
        if (aiEnabled) {
            setTimeout(() => generateAutoInsights(), 1000);
        }
        
    } catch (error) {
        hideLoading();
        alert(`${translations[currentLang].error}: ${error.message}`);
    }
};

// GLOBAL STATE
let map, marker, drawnItems, currentPolygon;
let selectedLat = -25.2637, selectedLon = -57.5759;
let currentMode = 'single';
let currentData = null;
let currentLang = 'en';
let historyChart = null, distributionChart = null;
let aiEnabled = false;
let conversationHistory = [];

const quickLocations = [
    { name: 'Asunción', coords: [-25.2637, -57.5759] },
    { name: 'New York', coords: [40.7128, -74.0060] },
    { name: 'Tokyo', coords: [35.6762, 139.6503] },
    { name: 'Paris', coords: [48.8566, 2.3522] },
    { name: 'London', coords: [51.5074, -0.1278] },
    { name: 'Sydney', coords: [-33.8688, 151.2093] }
];

const quickQuestions = {
    en: [
        { q: "Should I bring a jacket for this weather?", type: "jacket" },
        { q: "What are the best dates for outdoor activities?", type: "dates" },
        { q: "Is there a flood risk at this location?", type: "flood" },
        { q: "How does this compare to historical averages?", type: "compare" },
        { q: "What trends do you see in the data?", type: "trends" }
    ],
    es: [
        { q: "¿Debería llevar una chaqueta para este clima?", type: "jacket" },
        { q: "¿Cuáles son las mejores fechas para actividades al aire libre?", type: "dates" },
        { q: "¿Hay riesgo de inundación en esta ubicación?", type: "flood" },
        { q: "¿Cómo se compara esto con los promedios históricos?", type: "compare" },
        { q: "¿Qué tendencias ves en los datos?", type: "trends" }
    ]
};

const translations = {
    en: {
        analyzing: 'Analyzing NASA data...',
        selectDate: 'Please select a date',
        selectRange: 'Please select date range',
        drawArea: 'Please draw an area first',
        noData: 'No data available',
        error: 'Error',
        connected: '✅ NASA API Connected',
        disconnected: '❌ NASA API Unavailable'
    },
    es: {
        analyzing: 'Analizando datos NASA...',
        selectDate: 'Por favor selecciona una fecha',
        selectRange: 'Por favor selecciona rango de fechas',
        drawArea: 'Por favor dibuja un área primero',
        noData: 'No hay datos disponibles',
        error: 'Error',
        connected: '✅ API NASA Conectada',
        disconnected: '❌ API NASA No Disponible'
    }
};

// ====================================
// INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DropCheck Scientific V3 - Initializing...');
    initMap();
    initQuickLocations();
    setDefaultDates();
    setupEventListeners();
    checkNASAAPI();
    initOllamaAI();
    loadSavedLanguage();
    initTooltipSystem();
    console.log('✅ App Ready!');
});

// ====================================
// OLLAMA AI FUNCTIONS
// ====================================
async function initOllamaAI() {
    console.log('🤖 Initializing Ollama AI...');
    
    const savedUrl = localStorage.getItem('ollama_url') || OLLAMA_CONFIG.url;
    const savedModel = localStorage.getItem('ollama_model') || OLLAMA_CONFIG.model;
    const savedTemp = localStorage.getItem('ollama_temp') || OLLAMA_CONFIG.temperature;
    
    OLLAMA_CONFIG.url = savedUrl;
    OLLAMA_CONFIG.model = savedModel;
    OLLAMA_CONFIG.temperature = parseFloat(savedTemp);
    
    document.getElementById('ollama-url').value = savedUrl;
    document.getElementById('ollama-model').value = savedModel;
    document.getElementById('ollama-temp').value = savedTemp;
    document.getElementById('temp-value').textContent = savedTemp;
    
    await checkOllamaConnection();
}

async function checkOllamaConnection() {
    const statusEl = document.getElementById('ai-status');
    
    try {
        const response = await fetch(`${OLLAMA_CONFIG.url}/api/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            aiEnabled = true;
            statusEl.textContent = `✅ Connected (${data.models?.length || 0} models)`;
            statusEl.style.color = '#10b981';
            document.getElementById('ai-model-info').textContent = `Model: ${OLLAMA_CONFIG.model}`;
            console.log('✅ Ollama connected:', data);
            return true;
        }
    } catch (error) {
        aiEnabled = false;
        statusEl.textContent = '❌ Ollama Offline';
        statusEl.style.color = '#ef4444';
        console.warn('⚠️ Ollama not available. Start with: ollama serve');
        return false;
    }
}

async function sendToOllama(message, context = {}) {
    if (!aiEnabled) {
        return 'AI Assistant is currently offline. Please ensure Ollama is running:\n\n1. Install: https://ollama.ai\n2. Run: ollama pull mistral\n3. Start: ollama serve';
    }
    
    const systemPrompt = `You are a professional meteorological data analyst for NASA climate data. You help users understand weather patterns, climate trends, and make informed decisions.

Current Analysis Context:
${context.param ? `- Parameter: ${context.param}` : ''}
${context.location ? `- Location: ${context.location}` : ''}
${context.stats ? `- Statistics: Mean=${context.stats.mean?.toFixed(1)}, Min=${context.stats.min?.toFixed(1)}, Max=${context.stats.max?.toFixed(1)}` : ''}
${context.dateRange ? `- Date Range: ${context.dateRange}` : ''}

Provide clear, concise, and scientifically accurate responses in 2-3 short paragraphs. Focus on practical insights.`;

    conversationHistory.push({
        role: 'user',
        content: message
    });
    
    try {
        const response = await fetch(`${OLLAMA_CONFIG.url}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_CONFIG.model,
                prompt: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
                stream: false,
                options: {
                    temperature: OLLAMA_CONFIG.temperature,
                    num_predict: 200
                }
            })
        });
        
        if (!response.ok) throw new Error('Ollama request failed');
        
        const data = await response.json();
        const aiResponse = data.response;
        
        conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });
        
        return aiResponse;
        
    } catch (error) {
        console.error('Ollama error:', error);
        return 'Error connecting to Ollama. Make sure it\'s running with: ollama serve';
    }
}

function displayAIMessage(message, isUser = false) {
    const chatBody = document.getElementById('ai-chat-body');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${isUser ? 'ai-message-user' : 'ai-message-bot'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.textContent = isUser ? '👤' : '🤖';
    
    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    bubble.innerHTML = formatAIMessage(message);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    
    chatBody.appendChild(messageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function formatAIMessage(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\n/g, '<br>');
    return text;
}

async function handleQuickQuestion(type) {
    if (!currentData) {
        alert('Please run an analysis first');
        return;
    }
    
    let question = '';
    let context = {
        param: currentData.config.name,
        location: `${selectedLat}, ${selectedLon}`,
        stats: currentData.stats || currentData.rangeResults?.[0] || currentData.polygonResults?.[0]
    };
    
    if (type === 'jacket') {
        question = currentLang === 'en' 
            ? `Based on the ${currentData.config.name} data (avg: ${context.stats.mean.toFixed(1)}${currentData.config.unit}), should I bring a jacket?`
            : `Basado en los datos de ${currentData.config.name} (promedio: ${context.stats.mean.toFixed(1)}${currentData.config.unit}), ¿debería llevar chaqueta?`;
    } else if (type === 'dates') {
        if (currentData.type === 'range') {
            question = currentLang === 'en'
                ? `What are the 3 best dates for outdoor activities based on this ${currentData.config.name} analysis?`
                : `¿Cuáles son las 3 mejores fechas para actividades al aire libre según este análisis de ${currentData.config.name}?`;
        } else {
            question = currentLang === 'en'
                ? `Based on this ${currentData.config.name} data, what time of year is best for outdoor activities?`
                : `Según estos datos de ${currentData.config.name}, ¿qué época del año es mejor para actividades al aire libre?`;
        }
    } else if (type === 'flood') {
        question = currentLang === 'en'
            ? `Assess the flood risk at this location based on the precipitation data.`
            : `Evalúa el riesgo de inundación en esta ubicación según los datos de precipitación.`;
    } else if (type === 'compare') {
        question = currentLang === 'en'
            ? `How do these ${currentData.config.name} values compare to long-term averages?`
            : `¿Cómo se comparan estos valores de ${currentData.config.name} con los promedios a largo plazo?`;
    } else if (type === 'trends') {
        question = currentLang === 'en'
            ? `What trends or patterns do you see in this ${currentData.config.name} data?`
            : `¿Qué tendencias o patrones ves en estos datos de ${currentData.config.name}?`;
    }
    
    document.getElementById('ai-chat-container').style.display = 'flex';
    displayAIMessage(question, true);
    
    const response = await sendToOllama(question, context);
    displayAIMessage(response, false);
}

// ====================================
// NASA API FUNCTIONS
// ====================================
async function checkNASAAPI() {
    try {
        const testUrl = `${NASA_API}?parameters=T2M&community=RE&longitude=-57&latitude=-25&start=20240101&end=20240102&format=JSON`;
        const response = await fetch(testUrl);
        if (response.ok) {
            console.log('✅ NASA API Connected');
        }
    } catch (error) {
        console.warn('⚠️ NASA API check failed');
    }
}

async function fetchNASAPowerData(lat, lon, param, startDate, endDate) {
    const url = `${NASA_API}?parameters=${param}&community=RE&longitude=${lon}&latitude=${lat}&start=${startDate}&end=${endDate}&format=JSON`;
    
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
    
    return values;
}

// ====================================
// FLOOD RISK ANALYSIS
// ====================================
async function analyzeFloodRisk() {
    const date = document.getElementById('date-input').value;
    
    if (!date) return alert(translations[currentLang].selectDate);
    
    showLoading(currentLang === 'en' ? 'Analyzing flood risk with NASA data...' : 'Analizando riesgo de inundación con datos NASA...');
    
    try {
        const dateObj = new Date(date);
        const currentYear = new Date().getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        // Fetch precipitation and humidity data for 20 years
        const precipData = [];
        const humidityData = [];
        
        for (let y = currentYear - 20; y < currentYear; y++) {
            const dateStr = `${y}${month}${day}`;
            try {
                const precip = await fetchNASAPowerData(selectedLat, selectedLon, 'PRECTOTCORR', dateStr, dateStr);
                const humidity = await fetchNASAPowerData(selectedLat, selectedLon, 'RH2M', dateStr, dateStr);
                
                precipData.push(...precip);
                humidityData.push(...humidity);
                await sleep(100);
            } catch (e) {
                console.warn(`Failed year ${y}`);
            }
        }
        
        if (precipData.length === 0 || humidityData.length === 0) {
            throw new Error(translations[currentLang].noData);
        }
        
        // Calculate flood risk metrics
        const precipValues = precipData.map(d => d.value);
        const humidityValues = humidityData.map(d => d.value);
        
        const precipStats = calculateStats(precipValues);
        const humidityStats = calculateStats(humidityValues);
        
        // Flood Risk Algorithm
        const avgPrecip = parseFloat(precipStats.mean);
        const maxPrecip = parseFloat(precipStats.max);
        const avgHumidity = parseFloat(humidityStats.mean);
        
        // Risk score calculation (0-100)
        let riskScore = 0;
        
        // Precipitation risk (60% weight)
        if (avgPrecip > 50) riskScore += 30;
        else if (avgPrecip > 30) riskScore += 20;
        else if (avgPrecip > 10) riskScore += 10;
        
        if (maxPrecip > 100) riskScore += 30;
        else if (maxPrecip > 70) riskScore += 20;
        else if (maxPrecip > 40) riskScore += 10;
        
        // Humidity risk (40% weight)
        if (avgHumidity > 85) riskScore += 20;
        else if (avgHumidity > 75) riskScore += 15;
        else if (avgHumidity > 65) riskScore += 10;
        
        // Standard deviation (variability)
        const precipStd = parseFloat(precipStats.std);
        if (precipStd > 30) riskScore += 20;
        else if (precipStd > 20) riskScore += 10;
        
        // Determine risk level
        let riskLevel, riskColor, riskIcon;
        if (riskScore >= 70) {
            riskLevel = currentLang === 'en' ? 'High' : 'Alto';
            riskColor = '#ef4444';
            riskIcon = '🔴';
        } else if (riskScore >= 40) {
            riskLevel = currentLang === 'en' ? 'Moderate' : 'Moderado';
            riskColor = '#f59e0b';
            riskIcon = '🟡';
        } else {
            riskLevel = currentLang === 'en' ? 'Low' : 'Bajo';
            riskColor = '#10b981';
            riskIcon = '🟢';
        }
        
        // Days with high precipitation (>50mm)
        const highPrecipDays = precipValues.filter(v => v > 50).length;
        const extremePrecipDays = precipValues.filter(v => v > 100).length;
        
        currentData = {
            type: 'flood',
            riskScore,
            riskLevel,
            riskColor,
            riskIcon,
            precipStats,
            humidityStats,
            highPrecipDays,
            extremePrecipDays,
            totalDataPoints: precipData.length,
            location: { lat: selectedLat, lon: selectedLon },
            date: date
        };
        
        hideLoading();
        displayFloodResults();
        displayFloodCharts(precipData, humidityData);
        document.getElementById('export-btn').style.display = 'block';
        
        if (aiEnabled) {
            setTimeout(() => generateFloodInsights(), 1000);
        }
        
    } catch (error) {
        hideLoading();
        alert(`${translations[currentLang].error}: ${error.message}`);
    }
}

function displayFloodResults() {
    const { riskScore, riskLevel, riskColor, riskIcon, precipStats, humidityStats, highPrecipDays, extremePrecipDays, totalDataPoints, date, location } = currentData;
    
    const title = currentLang === 'en' ? 'Flood Risk Assessment' : 'Evaluación de Riesgo de Inundación';
    const basedOn = currentLang === 'en' ? `Analysis based on ${totalDataPoints} years of NASA POWER data` : `Análisis basado en ${totalDataPoints} años de datos de NASA POWER`;
    
    const html = `
        <div class="result-card">
            <h3 style="color: ${riskColor}; margin-bottom: 20px; font-size: 1.4em;">💧 ${title}</h3>
            <p style="color: rgba(30, 30, 47, 0.7); margin-bottom: 20px;">${basedOn}</p>
            
            <div class="result-grid">
                <div class="metric-box" style="border-color: ${riskColor}; grid-column: span 2;">
                    <div class="metric-label">${currentLang === 'en' ? 'Risk Level' : 'Nivel de Riesgo'}</div>
                    <div class="metric-value" style="font-size: 3em;">${riskIcon}</div>
                    <div style="font-size: 1.8em; font-weight: 700; color: ${riskColor}; margin-top: 10px;">${riskLevel}</div>
                    <div class="metric-unit">${riskScore}% ${currentLang === 'en' ? 'Risk Score' : 'Puntuación'}</div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">${currentLang === 'en' ? 'Avg Precipitation' : 'Precipitación Prom'}</div>
                    <div class="metric-value">${precipStats.mean}</div>
                    <div class="metric-unit">mm/day</div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">${currentLang === 'en' ? 'Max Precipitation' : 'Precipitación Máx'}</div>
                    <div class="metric-value">${precipStats.max}</div>
                    <div class="metric-unit">mm/day</div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">${currentLang === 'en' ? 'Avg Humidity' : 'Humedad Prom'}</div>
                    <div class="metric-value">${humidityStats.mean}</div>
                    <div class="metric-unit">%</div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">${currentLang === 'en' ? 'High Precip Days' : 'Días Alta Precip'}</div>
                    <div class="metric-value">${highPrecipDays}</div>
                    <div class="metric-unit">> 50mm</div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">${currentLang === 'en' ? 'Extreme Days' : 'Días Extremos'}</div>
                    <div class="metric-value">${extremePrecipDays}</div>
                    <div class="metric-unit">> 100mm</div>
                </div>
                
                <div class="metric-box">
                    <div class="metric-label">${currentLang === 'en' ? 'Precip Variability' : 'Variabilidad Precip'}</div>
                    <div class="metric-value">${precipStats.std}</div>
                    <div class="metric-unit">std dev</div>
                </div>
            </div>
            
            <div style="background: rgba(0, 196, 255, 0.1); border: 2px solid rgba(0, 196, 255, 0.3); padding: 20px; border-radius: 14px; margin-top: 25px;">
                <h4 style="color: #00C4FF; margin-bottom: 12px; font-size: 1.1em;">📊 ${currentLang === 'en' ? 'Risk Assessment Summary' : 'Resumen de Evaluación'}</h4>
                <p style="color: rgba(30, 30, 47, 0.8); line-height: 1.7; font-size: 0.95em;">
                    <strong>${currentLang === 'en' ? 'Location:' : 'Ubicación:'}</strong> ${location.lat}, ${location.lon}<br>
                    <strong>${currentLang === 'en' ? 'Analysis Date:' : 'Fecha de Análisis:'}</strong> ${date}<br>
                    <strong>${currentLang === 'en' ? 'Historical Data:' : 'Datos Históricos:'}</strong> ${totalDataPoints} ${currentLang === 'en' ? 'years' : 'años'}<br>
                    <strong>${currentLang === 'en' ? 'Data Source:' : 'Fuente de Datos:'}</strong> NASA POWER API<br><br>
                    
                    <strong>${currentLang === 'en' ? 'Risk Factors:' : 'Factores de Riesgo:'}</strong><br>
                    • ${currentLang === 'en' ? 'Average precipitation:' : 'Precipitación promedio:'} ${precipStats.mean} mm/day<br>
                    • ${currentLang === 'en' ? 'Maximum recorded:' : 'Máximo registrado:'} ${precipStats.max} mm/day<br>
                    • ${currentLang === 'en' ? 'Average humidity:' : 'Humedad promedio:'} ${humidityStats.mean}%<br>
                    • ${currentLang === 'en' ? 'Days with >50mm:' : 'Días con >50mm:'} ${highPrecipDays} ${currentLang === 'en' ? 'days' : 'días'}<br>
                    • ${currentLang === 'en' ? 'Extreme events (>100mm):' : 'Eventos extremos (>100mm):'} ${extremePrecipDays} ${currentLang === 'en' ? 'days' : 'días'}
                </p>
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                ${quickQuestions[currentLang].map(q => `
                    <button class="location-chip" onclick="handleQuickQuestion('${q.type}')" style="cursor: pointer;">
                        ${q.q}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('results-container').innerHTML = html;
    document.getElementById('charts-section').style.display = 'block';
}

function displayFloodCharts(precipData, humidityData) {
    const years = precipData.map(d => d.year);
    const precipValues = precipData.map(d => d.value);
    const humidityValues = humidityData.map(d => d.value);
    
    const chartsHtml = `
        <div class="chart-container">
            <h3 style="color: #00C4FF; margin-bottom: 18px;">${currentLang === 'en' ? '🌧️ Precipitation History (20 Years)' : '🌧️ Historial de Precipitación (20 Años)'}</h3>
            <canvas id="flood-precip-chart"></canvas>
        </div>
        <div class="chart-container">
            <h3 style="color: #00C4FF; margin-bottom: 18px;">${currentLang === 'en' ? '💧 Humidity History (20 Years)' : '💧 Historial de Humedad (20 Años)'}</h3>
            <canvas id="flood-humidity-chart"></canvas>
        </div>
    `;
    
    document.getElementById('charts-section').innerHTML = chartsHtml;
    
    // Precipitation Chart
    const ctx1 = document.getElementById('flood-precip-chart').getContext('2d');
    new Chart(ctx1, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: currentLang === 'en' ? 'Precipitation (mm)' : 'Precipitación (mm)',
                data: precipValues,
                borderColor: '#00C4FF',
                backgroundColor: 'rgba(0, 196, 255, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: precipValues.map(v => v > 50 ? '#ef4444' : '#00C4FF'),
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#1E1E2F',
                        font: { family: 'Inter', size: 13, weight: 600 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#1E1E2F', font: { weight: 500 } },
                    grid: { color: 'rgba(0, 196, 255, 0.1)' }
                },
                y: {
                    ticks: { color: '#1E1E2F', font: { weight: 500 } },
                    grid: { color: 'rgba(0, 196, 255, 0.1)' }
                }
            }
        }
    });
    
    // Humidity Chart
    const ctx2 = document.getElementById('flood-humidity-chart').getContext('2d');
    new Chart(ctx2, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: currentLang === 'en' ? 'Humidity (%)' : 'Humedad (%)',
                data: humidityValues,
                borderColor: '#82FFD2',
                backgroundColor: 'rgba(130, 255, 210, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#82FFD2',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#1E1E2F',
                        font: { family: 'Inter', size: 13, weight: 600 }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#1E1E2F', font: { weight: 500 } },
                    grid: { color: 'rgba(130, 255, 210, 0.1)' }
                },
                y: {
                    ticks: { color: '#1E1E2F', font: { weight: 500 } },
                    grid: { color: 'rgba(130, 255, 210, 0.1)' }
                }
            }
        }
    });
}

async function generateFloodInsights() {
    if (!aiEnabled || !currentData) return;
    
    const { riskLevel, riskScore, precipStats, humidityStats, highPrecipDays, extremePrecipDays } = currentData;
    
    const prompt = currentLang === 'en'
        ? `Analyze this flood risk assessment: Risk Level is ${riskLevel} (${riskScore}% score). Average precipitation: ${precipStats.mean}mm, Max: ${precipStats.max}mm. Humidity: ${humidityStats.mean}%. ${highPrecipDays} days with >50mm, ${extremePrecipDays} extreme events. What precautions should be taken?`
        : `Analiza esta evaluación de riesgo de inundación: Nivel de Riesgo ${riskLevel} (${riskScore}% puntuación). Precipitación promedio: ${precipStats.mean}mm, Máx: ${precipStats.max}mm. Humedad: ${humidityStats.mean}%. ${highPrecipDays} días con >50mm, ${extremePrecipDays} eventos extremos. ¿Qué precauciones se deben tomar?`;
    
    document.getElementById('ai-chat-container').style.display = 'flex';
    displayAIMessage(prompt, true);
    
    const response = await sendToOllama(prompt, {
        param: 'Flood Risk',
        location: `${selectedLat}, ${selectedLon}`,
        stats: { mean: riskScore, min: 0, max: 100 }
    });
    displayAIMessage(response, false);
}