# Free API Keys Setup Guide

## 🆓 Free APIs for Accurate Toll Data

### 1. **OpenRouteService** (Recommended)
- **URL**: https://openrouteservice.org/
- **Free Tier**: 2,000 requests/day
- **Features**: Routing, geocoding, isochrones
- **Setup**: 
  1. Sign up at https://openrouteservice.org/dev/
  2. Get your API key
  3. Add to environment: `OPENROUTE_API_KEY=your_key`

### 2. **Here Maps**
- **URL**: https://developer.here.com/
- **Free Tier**: 250,000 transactions/month
- **Features**: Routing, geocoding, traffic
- **Setup**:
  1. Create account at https://developer.here.com/
  2. Create a project
  3. Get API key
  4. Add to environment: `HERE_API_KEY=your_key`

### 3. **TollGuru**
- **URL**: https://tollguru.com/
- **Free Tier**: Available (contact for details)
- **Features**: Toll data, pricing
- **Setup**:
  1. Contact TollGuru for free tier access
  2. Get API key
  3. Add to environment: `TOLLGURU_API_KEY=your_key`

### 4. **OpenWeatherMap**
- **URL**: https://openweathermap.org/
- **Free Tier**: 1,000 calls/day
- **Features**: Weather data for route conditions
- **Setup**:
  1. Sign up at https://openweathermap.org/api
  2. Get API key
  3. Add to environment: `OPENWEATHER_API_KEY=your_key`

### 5. **Google Maps** (Alternative)
- **URL**: https://developers.google.com/maps
- **Free Tier**: $200 credit/month
- **Features**: Directions, geocoding, places
- **Setup**:
  1. Create project in Google Cloud Console
  2. Enable Maps JavaScript API
  3. Get API key
  4. Add to environment: `GOOGLE_MAPS_KEY=your_key`

## 🚀 Quick Setup

1. **Create `.env` file**:
```bash
# Routing APIs
OPENROUTE_API_KEY=your_openroute_key
HERE_API_KEY=your_here_key

# Toll Data
TOLLGURU_API_KEY=your_tollguru_key

# Weather Data
OPENWEATHER_API_KEY=your_openweather_key

# Alternative
GOOGLE_MAPS_KEY=your_google_key
```

2. **Start enhanced server**:
```bash
npm run enhanced
```

3. **Test the APIs**:
```bash
curl "http://localhost:3003/api/enhanced-route-tolls?origin=Delhi&destination=Mumbai"
```

## 📊 Data Accuracy Comparison

| API | Route Accuracy | Toll Accuracy | Cost | Rate Limits |
|-----|---------------|---------------|------|-------------|
| OpenRouteService | ⭐⭐⭐⭐⭐ | ⭐⭐ | Free | 2K/day |
| Here Maps | ⭐⭐⭐⭐ | ⭐⭐ | Free | 250K/month |
| TollGuru | ⭐⭐ | ⭐⭐⭐⭐⭐ | Free* | Contact |
| Google Maps | ⭐⭐⭐⭐⭐ | ⭐⭐ | $200 credit | High |
| Mock Data | ⭐ | ⭐ | Free | None |

*Contact TollGuru for free tier access

## 🔧 Environment Setup

Add this to your `package.json`:
```json
{
  "scripts": {
    "enhanced": "node enhanced_server.js",
    "enhanced-dev": "nodemon enhanced_server.js"
  }
}
```

## 🌐 API Endpoints

- `GET /api/enhanced-route-tolls?origin=Delhi&destination=Mumbai`
- `GET /api/traffic-info?lat=28.7041&lng=77.1025`
- `GET /api/alternative-routes?origin=Delhi&destination=Mumbai`

## 💡 Tips

1. **Start with OpenRouteService** - it's completely free and reliable
2. **Combine multiple APIs** for best accuracy
3. **Cache responses** to stay within rate limits
4. **Use fallback data** when APIs are unavailable
5. **Monitor usage** to avoid hitting limits 