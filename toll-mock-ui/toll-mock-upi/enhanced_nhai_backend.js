import express from 'express';
import cors from 'cors';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());

// Load official NHAI toll data
let officialTollData = [];
let tollDataLoaded = false;

// Function to load official toll data
function loadOfficialTollData() {
  try {
    // Try to load the most recent data
    const dataDir = path.join(process.cwd(), 'official-toll-data', 'data');
    const availableDates = fs.readdirSync(dataDir)
      .filter(dir => fs.statSync(path.join(dataDir, dir)).isDirectory())
      .sort()
      .reverse(); // Most recent first
    
    if (availableDates.length === 0) {
      console.log('No official toll data found');
      return;
    }
    
    // Try to load from the most recent date
    for (const date of availableDates) {
      const tollsPath = path.join(dataDir, date, 'tolls-basic.json');
      if (fs.existsSync(tollsPath)) {
        const data = fs.readFileSync(tollsPath, 'utf8');
        officialTollData = JSON.parse(data);
        console.log(`✅ Loaded ${officialTollData.length} official toll plazas from ${date}`);
        tollDataLoaded = true;
        break;
      }
    }
    
    if (!tollDataLoaded) {
      console.log('❌ Could not load official toll data');
    }
  } catch (error) {
    console.error('Error loading official toll data:', error);
  }
}

// Load data on startup
loadOfficialTollData();

// Function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Function to find toll plazas near a route with enhanced accuracy
function findTollsNearRoute(routePoints, maxDistance = 5) { // Increased buffer to 5km
  const nearbyTolls = [];
  
  if (!officialTollData.length) {
    console.log('No official toll data available, using fallback');
    return [];
  }
  
  console.log(`🔍 Searching for tolls near route with ${routePoints.length} points, max distance: ${maxDistance}km`);
  
  // If route has only 2 points (start/end), interpolate intermediate points
  let enhancedRoutePoints = routePoints;
  if (routePoints.length === 2) {
    enhancedRoutePoints = interpolateRoutePoints(routePoints[0], routePoints[1], 20); // Add 20 intermediate points
    console.log(`📍 Interpolated route to ${enhancedRoutePoints.length} points for better toll detection`);
  }
  
  officialTollData.forEach(toll => {
    // Check if toll plaza is near any point in the route
    let minDistance = Infinity;
    let closestPoint = null;
    
    for (let point of enhancedRoutePoints) {
      const distance = calculateDistance(
        point.lat, point.lng,
        toll.lat, toll.lon
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    if (minDistance <= maxDistance) {
      // Map official rates to our vehicle types
      const mappedRates = {
        car_single: toll.rates.car_single || toll.rates.car_multi || 0,
        car_multi: toll.rates.car_multi || toll.rates.car_single || 0,
        car_monthly: toll.rates.car_monthly || 0,
        lcv_single: toll.rates.lcv_single || toll.rates.lcv_multi || 0,
        lcv_multi: toll.rates.lcv_multi || toll.rates.lcv_single || 0,
        lcv_monthly: toll.rates.lcv_monthly || 0,
        bus_single: toll.rates.bus_single || toll.rates.bus_multi || 0,
        bus_multi: toll.rates.bus_multi || toll.rates.bus_single || 0,
        bus_monthly: toll.rates.bus_monthly || 0
      };
      
      nearbyTolls.push({
        ...toll,
        distance_from_route: minDistance,
        rates: mappedRates,
        // Clean up location field (remove HTML tags)
        location: toll.location ? toll.location.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&') : 'Unknown',
        // Extract highway info from location if available
        highway: extractHighwayInfo(toll.location || ''),
        fee_effective_date: toll.fee_effective_date || 'Unknown',
        project_type: toll.project_type || 'Unknown'
      });
    }
  });
  
  console.log(`🎯 Found ${nearbyTolls.length} toll plazas within ${maxDistance}km of route`);
  
  // Sort by distance from route
  return nearbyTolls.sort((a, b) => a.distance_from_route - b.distance_from_route);
}

// Interpolate intermediate points between two route points
function interpolateRoutePoints(start, end, numPoints) {
  const points = [start];
  const latStep = (end.lat - start.lat) / (numPoints + 1);
  const lngStep = (end.lng - start.lng) / (numPoints + 1);
  
  for (let i = 1; i <= numPoints; i++) {
    points.push({
      lat: start.lat + (latStep * i),
      lng: start.lng + (lngStep * i)
    });
  }
  
  points.push(end);
  return points;
}

// Extract highway information from location string
function extractHighwayInfo(location) {
  const highwayMatch = location.match(/NH-?(\d+)/i);
  if (highwayMatch) {
    return `NH${highwayMatch[1]}`;
  }
  return 'Unknown';
}

// Function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      ...options,
      headers: {
        'User-Agent': 'Enhanced-NHAI-TollCalculator/1.0',
        ...options.headers
      }
    };
    
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Decode Google polyline
function decodePolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') {
    return [];
  }
  let index = 0;
  const len = encoded.length;
  const path = [];
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    path.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return path;
}

// Get route using Google Directions API
async function getRouteGoogleDirections(origin, destination) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_KEY') {
      throw new Error('Missing GOOGLE_MAPS_KEY');
    }

    const params = new URLSearchParams({
      origin,
      destination,
      mode: 'driving',
      alternatives: 'false',
      key: apiKey
    }).toString();

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
    const response = await makeRequest(url, { headers: { Accept: 'application/json' } });

    if (response && response.status === 'OK' && response.routes && response.routes.length > 0) {
      const route = response.routes[0];
      const overview = route.overview_polyline && route.overview_polyline.points;
      const legs = route.legs || [];

      let distanceMeters = 0;
      let durationSeconds = 0;
      for (const leg of legs) {
        distanceMeters += (leg.distance && leg.distance.value) || 0;
        durationSeconds += (leg.duration && leg.duration.value) || 0;
      }

      const path = overview ? decodePolyline(overview) : [];

      return {
        path,
        distance: distanceMeters / 1000, // km
        duration: durationSeconds / 60, // minutes
        coordinates: null
      };
    }
    throw new Error(`Google Directions failed: ${response && response.status}`);
  } catch (error) {
    console.error('Google Directions error:', error.message);
    return null;
  }
}

// Enhanced route optimization with multiple waypoints
async function getOptimizedRoute(origin, destination, waypoints = []) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_KEY') {
      throw new Error('Missing GOOGLE_MAPS_KEY');
    }

    const params = new URLSearchParams({
      origin,
      destination,
      mode: 'driving',
      alternatives: 'true', // Get alternative routes
      optimize: 'true', // Optimize waypoints order
      key: apiKey
    });

    // Add waypoints if provided
    if (waypoints.length > 0) {
      waypoints.forEach(waypoint => {
        params.append('waypoints', waypoint);
      });
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;
    const response = await makeRequest(url, { headers: { Accept: 'application/json' } });

    if (response && response.status === 'OK' && response.routes && response.routes.length > 0) {
      // Return all alternative routes for comparison
      const optimizedRoutes = response.routes.map((route, index) => {
        const overview = route.overview_polyline && route.overview_polyline.points;
        const legs = route.legs || [];

        let distanceMeters = 0;
        let durationSeconds = 0;
        for (const leg of legs) {
          distanceMeters += (leg.distance && leg.distance.value) || 0;
          durationSeconds += (leg.duration && leg.duration.value) || 0;
        }

        const path = overview ? decodePolyline(overview) : [];

        return {
          routeIndex: index,
          path,
          distance: distanceMeters / 1000, // km
          duration: durationSeconds / 60, // minutes
          summary: route.summary || `Route ${index + 1}`,
          warnings: route.warnings || [],
          fare: route.fare || null,
          coordinates: null
        };
      });

      return optimizedRoutes;
    }
    throw new Error(`Google Directions optimization failed: ${response && response.status}`);
  } catch (error) {
    console.error('Route optimization error:', error.message);
    return null;
  }
}

// Enhanced toll detection with route optimization
function findTollsWithRouteOptimization(routes, maxDistance = 5) {
  const routeAnalysis = routes.map(route => {
    const nearbyTolls = findTollsNearRoute(route.path, maxDistance);
    const totalToll = nearbyTolls.reduce((sum, toll) => {
      // Use car_single as default for analysis
      const rate = toll.rates.car_single || toll.rates.car_multi || 0;
      return sum + rate;
    }, 0);

    return {
      ...route,
      tolls: nearbyTolls,
      totalToll,
      tollCount: nearbyTolls.length,
      costPerKm: route.distance > 0 ? totalToll / route.distance : 0
    };
  });

  // Sort by different criteria
  const sortedByTollCost = [...routeAnalysis].sort((a, b) => a.totalToll - b.totalToll);
  const sortedByDistance = [...routeAnalysis].sort((a, b) => a.distance - b.distance);
  const sortedByDuration = [...routeAnalysis].sort((a, b) => a.duration - b.duration);
  const sortedByCostEfficiency = [...routeAnalysis].sort((a, b) => a.costPerKm - b.costPerKm);

  return {
    routes: routeAnalysis,
    recommendations: {
      cheapest: sortedByTollCost[0],
      fastest: sortedByDuration[0],
      shortest: sortedByDistance[0],
      mostEfficient: sortedByCostEfficiency[0]
    }
  };
}

// Routes optimization endpoint
app.get('/api/optimized-routes', async (req, res) => {
  try {
    const { origin, destination, waypoints, vehicleType = 'car_single', maxDistance = 5 } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }
    
    console.log(`🛣️ Route optimization: ${origin} → ${destination} (${vehicleType})`);
    
    // Parse waypoints if provided
    const waypointArray = waypoints ? waypoints.split('|') : [];
    
    // Get optimized routes
    const optimizedRoutes = await getOptimizedRoute(origin, destination, waypointArray);
    
    if (!optimizedRoutes) {
      return res.status(500).json({ error: 'Failed to get optimized routes' });
    }
    
    // Analyze tolls for each route
    const routeAnalysis = findTollsWithRouteOptimization(optimizedRoutes, parseFloat(maxDistance));
    
    // Format response
    const formattedRoutes = routeAnalysis.routes.map(route => ({
      routeIndex: route.routeIndex,
      summary: route.summary,
      distance: `${route.distance.toFixed(1)} km`,
      duration: `${Math.round(route.duration)} min`,
      tollCount: route.tollCount,
      totalToll: route.totalToll,
      costPerKm: route.costPerKm.toFixed(2),
      path: route.path,
      tolls: route.tolls.map(toll => ({
        id: toll.id,
        name: toll.name,
        lat: toll.lat,
        lng: toll.lon,
        location: toll.location,
        price: toll.rates[vehicleType] || toll.rates.car_single || 0,
        currency: 'INR',
        distance_from_route: toll.distance_from_route,
        highway: toll.highway,
        fee_effective_date: toll.fee_effective_date,
        project_type: toll.project_type
      }))
    }));
    
    res.json({
      origin,
      destination,
      waypoints: waypointArray,
      vehicleType,
      totalRoutes: formattedRoutes.length,
      routes: formattedRoutes,
      recommendations: {
        cheapest: {
          routeIndex: routeAnalysis.recommendations.cheapest.routeIndex,
          totalToll: routeAnalysis.recommendations.cheapest.totalToll,
          distance: routeAnalysis.recommendations.cheapest.distance.toFixed(1),
          duration: Math.round(routeAnalysis.recommendations.cheapest.duration)
        },
        fastest: {
          routeIndex: routeAnalysis.recommendations.fastest.routeIndex,
          totalToll: routeAnalysis.recommendations.fastest.totalToll,
          distance: routeAnalysis.recommendations.fastest.distance.toFixed(1),
          duration: Math.round(routeAnalysis.recommendations.fastest.duration)
        },
        shortest: {
          routeIndex: routeAnalysis.recommendations.shortest.routeIndex,
          totalToll: routeAnalysis.recommendations.shortest.totalToll,
          distance: routeAnalysis.recommendations.shortest.distance.toFixed(1),
          duration: Math.round(routeAnalysis.recommendations.shortest.duration)
        },
        mostEfficient: {
          routeIndex: routeAnalysis.recommendations.mostEfficient.routeIndex,
          totalToll: routeAnalysis.recommendations.mostEfficient.totalToll,
          distance: routeAnalysis.recommendations.mostEfficient.distance.toFixed(1),
          duration: Math.round(routeAnalysis.recommendations.mostEfficient.duration),
          costPerKm: routeAnalysis.recommendations.mostEfficient.costPerKm.toFixed(2)
        }
      },
      data_source: 'Official NHAI Data + Google Directions API (Optimized)',
      data_quality: tollDataLoaded ? 'Official NHAI Data' : 'Fallback Data'
    });
    
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ error: 'Failed to process route optimization' });
  }
});

// Enhanced route tolls endpoint with route optimization
app.get('/api/enhanced-route-tolls', async (req, res) => {
  try {
    const { origin, destination, vehicleType = 'car_single', provider = 'google', optimize = 'false' } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }
    
    console.log(`🚗 Enhanced route calculation: ${origin} → ${destination} (${vehicleType}) - Optimization: ${optimize}`);
    
    // Get route data with optimization if requested
    let routeData = null;
    let sourceUsed = 'mock';
    
    if (provider === 'google') {
      if (optimize === 'true') {
        const optimizedRoutes = await getOptimizedRoute(origin, destination);
        if (optimizedRoutes && optimizedRoutes.length > 0) {
          // Use the most efficient route (lowest cost per km)
          const routeAnalysis = findTollsWithRouteOptimization(optimizedRoutes, 3);
          const bestRoute = routeAnalysis.recommendations.mostEfficient;
          
          routeData = {
            path: bestRoute.path,
            distance: bestRoute.distance,
            duration: bestRoute.duration,
            coordinates: null
          };
          sourceUsed = 'google_optimized';
        }
      } else {
        routeData = await getRouteGoogleDirections(origin, destination);
        if (routeData) sourceUsed = 'google';
      }
    }
    
    // Fallback to mock data if no route found
    if (!routeData) {
      const mockRoute = generateMockRoute(origin, destination);
      routeData = mockRoute;
      sourceUsed = 'mock';
    }
    
    // Find toll plazas near the route using official NHAI data
    const nearbyTolls = findTollsNearRoute(routeData.path, 3); // 3km buffer for accuracy
    
    // Calculate total toll cost
    const totalToll = nearbyTolls.reduce((sum, toll) => {
      const rate = toll.rates[vehicleType];
      return sum + (rate || 0);
    }, 0);
    
    // Format toll data for response
    const formattedTolls = nearbyTolls.map(toll => ({
      id: toll.id,
      name: toll.name,
      lat: toll.lat,
      lng: toll.lon,
      location: toll.location,
      price: toll.rates[vehicleType] || 0,
      currency: 'INR',
      distance_from_route: toll.distance_from_route,
      highway: toll.highway,
      fee_effective_date: toll.fee_effective_date,
      project_type: toll.project_type,
      all_rates: toll.rates
    }));
    
    res.json({
      route: `${origin} → ${destination}`,
      path: routeData.path || [],
      total_toll_price: totalToll,
      currency: 'INR',
      tolls: formattedTolls,
      distance: routeData.distance ? `${routeData.distance.toFixed(1)} km` : 'Unknown',
      duration: routeData.duration ? `${Math.round(routeData.duration)} min` : 'Unknown',
      vehicle_type: vehicleType,
      toll_count: formattedTolls.length,
      data_source: `Official NHAI Data + ${sourceUsed === 'google_optimized' ? 'Google Directions API (Optimized)' : sourceUsed === 'google' ? 'Google Directions API' : 'Mock Route'}`,
      coordinates: routeData.coordinates || null,
      data_quality: tollDataLoaded ? 'Official NHAI Data' : 'Fallback Data',
      optimization_used: optimize === 'true'
    });
    
  } catch (error) {
    console.error('Enhanced route tolls error:', error);
    res.status(500).json({ error: 'Failed to process enhanced route tolls' });
  }
});

// Generate mock route when Google Directions is unavailable
function generateMockRoute(origin, destination) {
  // Simple straight-line route for fallback
  const originCoords = getMockCoordinates(origin);
  const destCoords = getMockCoordinates(destination);
  
  if (originCoords && destCoords) {
    const path = [originCoords, destCoords];
    const distance = calculateDistance(
      originCoords.lat, originCoords.lng,
      destCoords.lat, destCoords.lng
    );
    
    return {
      path,
      distance,
      duration: distance * 1.2, // Rough estimate: 1.2 min per km
      coordinates: null
    };
  }
  
  // Default fallback
  return {
    path: [
      { lat: 28.7041, lng: 77.1025 }, // Delhi
      { lat: 26.8467, lng: 80.9462 }  // Kanpur
    ],
    distance: 480,
    duration: 360,
    coordinates: null
  };
}

// Get mock coordinates for common cities
function getMockCoordinates(city) {
  const cities = {
    'delhi': { lat: 28.7041, lng: 77.1025 },
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'kanpur': { lat: 26.8467, lng: 80.9462 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'nagpur': { lat: 21.1458, lng: 79.0882 },
    'indore': { lat: 22.7196, lng: 75.8577 },
    'thane': { lat: 19.2183, lng: 72.9781 },
    'bhopal': { lat: 23.2599, lng: 77.4126 },
    'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'patna': { lat: 25.5941, lng: 85.1376 },
    'vadodara': { lat: 22.3072, lng: 73.1812 },
    'ghaziabad': { lat: 28.6692, lng: 77.4538 },
    'ludhiana': { lat: 30.9010, lng: 75.8573 }
  };
  
  const cityKey = city.toLowerCase();
  return cities[cityKey] || null;
}

// Get all official toll plazas
app.get('/api/official-toll-plazas', (req, res) => {
  try {
    if (!tollDataLoaded) {
      return res.status(503).json({ 
        error: 'Official toll data not loaded',
        message: 'Please ensure the official-toll-data repository is properly set up'
      });
    }
    
    res.json({
      count: officialTollData.length,
      toll_plazas: officialTollData.map(toll => ({
        id: toll.id,
        name: toll.name,
        lat: toll.lat,
        lon: toll.lon,
        location: toll.location ? toll.location.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&') : 'Unknown',
        highway: extractHighwayInfo(toll.location || ''),
        fee_effective_date: toll.fee_effective_date || 'Unknown',
        project_type: toll.project_type || 'Unknown',
        rates: toll.rates
      })),
      data_source: 'Official NHAI Data from geohacker/toll-plazas-india',
      last_updated: 'Monthly updates via GitHub Actions'
    });
  } catch (error) {
    console.error('Error fetching official toll plazas:', error);
    res.status(500).json({ error: 'Failed to fetch official toll plazas' });
  }
});

// Search official toll plazas
app.get('/api/search-official-tolls', (req, res) => {
  try {
    const { location, highway, state } = req.query;
    let filteredTolls = officialTollData;
    
    if (location) {
      filteredTolls = filteredTolls.filter(toll => 
        toll.name.toLowerCase().includes(location.toLowerCase()) ||
        (toll.location && toll.location.toLowerCase().includes(location.toLowerCase()))
      );
    }
    
    if (highway) {
      filteredTolls = filteredTolls.filter(toll => {
        const tollHighway = extractHighwayInfo(toll.location || '');
        return tollHighway.toLowerCase().includes(highway.toLowerCase());
      });
    }
    
    res.json({
      count: filteredTolls.length,
      toll_plazas: filteredTolls.map(toll => ({
        id: toll.id,
        name: toll.name,
        lat: toll.lat,
        lon: toll.lon,
        location: toll.location ? toll.location.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&') : 'Unknown',
        highway: extractHighwayInfo(toll.location || ''),
        fee_effective_date: toll.fee_effective_date || 'Unknown',
        project_type: toll.project_type || 'Unknown',
        rates: toll.rates
      }))
    });
  } catch (error) {
    console.error('Error searching official toll plazas:', error);
    res.status(500).json({ error: 'Failed to search official toll plazas' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    official_data_loaded: tollDataLoaded,
    toll_plaza_count: officialTollData.length,
    timestamp: new Date().toISOString(),
    data_source: 'Official NHAI Data from geohacker/toll-plazas-india'
  });
});

// Reload official data endpoint
app.post('/api/reload-official-data', (req, res) => {
  try {
    loadOfficialTollData();
    res.json({
      success: true,
      message: 'Official toll data reloaded',
      toll_plaza_count: officialTollData.length,
      data_loaded: tollDataLoaded
    });
  } catch (error) {
    console.error('Error reloading official data:', error);
    res.status(500).json({ error: 'Failed to reload official data' });
  }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`🚀 Enhanced NHAI Toll API running on http://localhost:${PORT}`);
  console.log('📡 Features:');
  console.log('   • Official NHAI Toll Data Integration');
  console.log('   • Google Directions API Support');
  console.log('   • Accurate Route-based Toll Detection');
  console.log('   • Real-time Toll Rate Calculation');
  console.log('   • Enhanced Data Quality');
  console.log(`   • ${officialTollData.length} Official Toll Plazas Loaded`);
  console.log('   • Data Source: geohacker/toll-plazas-india');
});

export { app };
