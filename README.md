# 🛰️ NASA Weather Intelligence Platform

**Complete Weather Analysis & Forecasting System with Real APIs**

NASA Space Apps Challenge 2025

---

## 🎯 Challenge Compliance

This project **FULLY IMPLEMENTS** all requirements from the NASA Space Apps Challenge:

### ✅ Core Requirements Met

1. **✅ NASA Earth Observation Data**
   - Real NASA POWER API integration (20+ years of historical data)
   - 8 climate variables including temperature extremes
   
2. **✅ Personalized Dashboard**
   - Interactive map for location selection
   - Custom date selection (single or range)
   - Quick access to popular cities

3. **✅ Probability Analysis**
   - Statistical analysis (mean, median, percentiles)
   - **Custom threshold probability** (e.g., "60% chance above 30°C")
   - Historical trend analysis
   
4. **✅ Visual Representation**
   - Line charts for historical trends
   - Distribution/bell curve charts
   - Extreme events analysis

5. **✅ Data Export**
   - **CSV format with complete metadata**
   - **JSON format** for programmatic access
   - Source attribution and units

6. **✅ Extreme Weather Tracking**
   - Decade-over-decade extreme event comparison
   - Probability change analysis (increasing/decreasing)

---

## 📋 Project Structure

```
nasa-weather-platform/
├── landing.html          # Main page with background image
├── scientific.html       # Scientific analysis version
├── consumer.html         # Quick forecast version
├── scientific.css        # Scientific styles
├── consumer.css          # Consumer styles (sky blue theme)
├── scientific.js         # Scientific logic (NASA API)
├── consumer.js           # Consumer logic (Open-Meteo API)
└── README.md            # This documentation
```

---

## ✨ Features

### 🔬 Scientific Version

#### Data Sources
- **✅ Real NASA POWER API** (automatically connects)
- 20+ years of historical climate data
- Fallback to simulated data if API unavailable

#### Climate Variables
- ✅ Temperature (Mean, Max, Min)
- ✅ Precipitation
- ✅ Wind Speed
- ✅ Relative Humidity
- ✅ Solar Radiation
- ✅ Specific Humidity

#### Analysis Features
- ✅ Statistical analysis (mean, median, std dev)
- ✅ Percentiles (10th, 25th, 75th, 90th)
- ✅ **Custom threshold probability** ("What's the probability of exceeding X?")
- ✅ Historical trend analysis
- ✅ Distribution charts (bell curves)
- ✅ Extreme events analysis (decade comparison)
- ✅ Date range comparison (find best dates)

#### Export Options
- ✅ **CSV with complete metadata**
  - Location coordinates
  - Variable name and unit
  - Data source (NASA API or simulated)
  - Generation timestamp
  - All data points
  
- ✅ **JSON format**
  - Complete metadata object
  - Statistics summary
  - Custom threshold results
  - Extreme analysis data

#### AI Features (Optional)
- ✅ Local AI assistant (Ollama/Mistral)
- ✅ Multi-language support (English/Spanish)
- ✅ Contextual insights
- ✅ Works without AI enabled

#### UI/UX
- ✅ Interactive Leaflet map
- ✅ Drag/click location selection
- ✅ Quick location chips
- ✅ Chart.js visualizations
- ✅ Glassmorphism design
- ✅ Fully responsive

### ☀️ Consumer Version

#### Data Source
- **✅ Real Open-Meteo API** (always real data)
- Real-time weather forecasts
- No API key required

#### Features
- ✅ 24-hour hourly forecast
- ✅ 7-day or 16-day outlook
- ✅ Current conditions
- ✅ Temperature & "feels like"
- ✅ Precipitation probability
- ✅ Wind speed & direction
- ✅ Humidity & UV index
- ✅ Sunrise & sunset times
- ✅ Beautiful weather cards
- ✅ **Sky blue color theme**

#### City Search
- ✅ Real geocoding API
- ✅ Global city search
- ✅ 8 quick-access cities
- ✅ Cache system (30 min)

---

## 🚀 Quick Start

### Option 1: Direct Open
```bash
# Download all files to a folder
# Open landing.html in your browser
```

### Option 2: Live Server (Recommended)
```bash
# VS Code: Install "Live Server" extension
# Right-click landing.html
# Select "Open with Live Server"
```

### Option 3: Python Server
```bash
cd nasa-weather-platform
python -m http.server 8000
# Open http://localhost:8000/landing.html
```

---

## 🔌 API Integration Status

### ✅ Automatically Working

#### NASA POWER API (Scientific Version)
- **Status**: ✅ Active and working
- **URL**: https://power.larc.nasa.gov/api
- **API Key**: Not required (public)
- **Features**: 
  - 20+ years historical data
  - 8 climate variables
  - Global coverage

#### Open-Meteo API (Consumer Version)
- **Status**: ✅ Active and working
- **URL**: https://api.open-meteo.com
- **API Key**: Not required (open-source)
- **Features**:
  - Real-time forecasts
  - 24-hour & 16-day predictions
  - Global coverage

### ⚙️ Optional: AI Assistant

#### Ollama (Local AI)
- **Status**: Optional (app works without it)
- **Installation**:
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download Mistral model
ollama pull mistral

# Run Ollama server
ollama serve
```

---

## 📊 Data Export Examples

### CSV Export (with metadata)
```csv
# NASA Weather Platform - Data Export
# Generated: 2025-10-04T15:30:00.000Z
# Location: Lat -25.2637, Lon -57.5759
# Variable: Temperature (T2M)
# Unit: °C
# Source: NASA_POWER
# Date: 2025-03-15
#
Year,Value,Unit
2005,23.4,°C
2006,24.1,°C
2007,22.9,°C
...
```

### JSON Export
```json
{
  "metadata": {
    "generated": "2025-10-04T15:30:00.000Z",
    "location": {
      "latitude": -25.2637,
      "longitude": -57.5759
    },
    "variable": {
      "code": "T2M",
      "name": "Temperature",
      "unit": "°C"
    },
    "source": "NASA_POWER"
  },
  "statistics": {
    "mean": 23.5,
    "median": 23.4,
    "p10": 20.1,
    "p90": 27.2,
    "trend": "Increasing",
    "trendPercent": 5.3
  },
  "customThreshold": {
    "value": 30,
    "operator": "above",
    "probability": 15.5,
    "unit": "°C"
  },
  "extremeAnalysis": {
    "extremeThreshold": 27.2,
    "firstDecadeCount": 8,
    "secondDecadeCount": 12,
    "change": 50.0,
    "increasing": true
  },
  "data": [...]
}
```

---

## 🎨 Design Features

### Landing Page
- ✅ Space background image from Pexels
- ✅ Three-tier typography hierarchy:
  - **Largest**: "Weather Intelligence" (5.5em)
  - **Medium**: "NASA Weather Platform" (3em)
  - **Small**: Subtitle (1.1em)
- ✅ Glassmorphism cards
- ✅ Sky blue theme for Quick Forecast card

### Scientific Version
- ✅ Dark space theme
- ✅ Blue/purple gradients
- ✅ Interactive charts
- ✅ Smooth animations

### Consumer Version
- ✅ **Sky blue color palette** (#87CEEB)
- ✅ Animated background
- ✅ Floating weather cards
- ✅ Smooth transitions

---

## 📱 Responsive Design

Tested and optimized for:
- ✅ Desktop (1920×1080)
- ✅ Laptop (1366×768)
- ✅ Tablet (768×1024)
- ✅ iPad (820×1180)
- ✅ Mobile (375×667)
- ✅ Small Mobile (360×640)
- ✅ Landscape mode

---

## 🔧 Technical Stack

| Technology | Purpose |
|------------|---------|
| **HTML5** | Structure |
| **CSS3** | Styling, animations, glassmorphism |
| **JavaScript (ES6+)** | Logic, API calls, data processing |
| **Leaflet.js** | Interactive maps |
| **Chart.js** | Data visualizations |
| **NASA POWER API** | Historical climate data |
| **Open-Meteo API** | Real-time weather forecasts |
| **Ollama** | Optional local AI (Mistral) |

---

## 📈 Statistics Calculated

### Basic Statistics
- Mean (average)
- Median
- Standard deviation
- Minimum
- Maximum

### Percentiles
- 10th percentile
- 25th percentile (Q1)
- 75th percentile (Q3)
- 90th percentile

### Trends
- Historical trend (increasing/decreasing)
- Trend percentage
- Decade-over-decade comparison

### Custom Analysis
- Threshold exceedance probability
- Extreme event frequency
- Date-to-date comparison

---

## 🎯 Use Cases

### Scientific Version
1. **Event Planning**
   - Find optimal dates for outdoor events
   - Assess weather risks
   - Historical probability analysis

2. **Research**
   - Climate trend studies
   - Extreme event analysis
   - Statistical modeling

3. **Agriculture**
   - Planting date optimization
   - Precipitation patterns
   - Temperature extremes

4. **Construction**
   - Weather risk assessment
   - Project timeline planning
   - Safety planning

### Consumer Version
1. **Travel Planning**
   - Vacation weather forecast
   - Packing decisions
   - Activity planning

2. **Daily Life**
   - Commute planning
   - Outdoor activities
   - Event scheduling

3. **Sports & Recreation**
   - Game day weather
   - Hiking conditions
   - Beach day planning

---

## 🚢 Deployment Options

### GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/nasa-weather-platform.git
git push -u origin main

# Enable GitHub Pages in repository settings
# Your URL: https://YOUR-USERNAME.github.io/nasa-weather-platform/
```

### Netlify (Easiest)
1. Drag folder to [netlify.com](https://netlify.com)
2. Get instant URL
3. Done!

### Vercel
```bash
npm i -g vercel
vercel
```

---

## 🐛 Troubleshooting

### NASA API Not Working
- Check internet connection
- API might be temporarily down (app uses fallback)
- Console will show: "⚠️ Using Simulated Data"

### Open-Meteo API Not Working
- Check internet connection
- Verify city name spelling
- Try using quick city chips

### Charts Not Displaying
- Ensure Chart.js CDN is loading
- Check browser console for errors
- Try refreshing page

### Map Not Loading
- Ensure Leaflet.js CDN is loading
- Use Live Server (not file://)
- Check browser console

---

## 🔮 Future Enhancements

- [ ] More climate variables (snow depth, air quality)
- [ ] Multiple location comparison
- [ ] Weather alerts
- [ ] PDF export
- [ ] Social sharing
- [ ] Mobile app (PWA)
- [ ] Dark/light mode toggle
- [ ] Multi-language UI
- [ ] Historical weather photos
- [ ] Climate change visualizations

---

## 📄 License

MIT License - Free for personal and commercial use

---

## 👨‍💻 Credits

**Developed for NASA Space Apps Challenge 2025**

### Data Sources
- NASA POWER API (https://power.larc.nasa.gov)
- Open-Meteo API (https://open-meteo.com)
- OpenStreetMap (https://openstreetmap.org)

### Technologies
- Leaflet.js (https://leafletjs.com)
- Chart.js (https://chartjs.org)
- Ollama AI (https://ollama.com)

### Design
- Background: Pexels (https://pexels.com)
- Fonts: Google Fonts
- Icons: Unicode Emoji

---

## 📞 Support

### Issues?
- Check the Troubleshooting section
- Review browser console (F12)
- Ensure all files are in the same directory

### Questions?
- Review this README
- Check NASA POWER API docs
- Check Open-Meteo API docs

---

## ⭐ Key Differentiators

### What Makes This Special

1. **Real APIs Connected**
   - Actually working NASA POWER integration
   - Real Open-Meteo forecasts
   - Not just mock data

2. **Complete Challenge Implementation**
   - All requirements met
   - Custom threshold analysis
   - Extreme events tracking
   - Full metadata export

3. **Production-Ready**
   - Error handling
   - Caching system
   - Fallback mechanisms
   - Responsive design

4. **Beautiful Design**
   - Space-themed aesthetics
   - Smooth animations
   - Sky blue accents
   - Professional UI/UX

5. **Dual-Mode System**
   - Scientific analysis for researchers
   - Simple forecast for consumers
   - Best of both worlds

---

**Made with ❤️ for NASA Space Apps Challenge 2025**

🛰️ **From Earth, For Earth** 🌍

---

## 📝 Version History

### v2.0 - Complete Implementation (2025-10-04)
- ✅ Real NASA POWER API integration
- ✅ Custom threshold probability
- ✅ Distribution charts
- ✅ Extreme events analysis
- ✅ CSV + JSON export with metadata
- ✅ 8 climate variables
- ✅ Sky blue consumer theme
- ✅ Space background on landing page
- ✅ Full challenge compliance

### v1.0 - Initial Release
- Basic structure
- Simulated data
- Core UI components

---

## 🎓 Educational Value

This platform demonstrates:
- Real-world API integration
- Statistical analysis techniques
- Data visualization best practices
- Responsive web design
- Asynchronous JavaScript
- Error handling strategies
- User experience design
- Climate data interpretation

Perfect for:
- Students learning web development
- Researchers needing weather probability
- Event planners assessing risks
- Anyone interested in climate data

---

**End of Documentation**