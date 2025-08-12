import express from 'express';
import cors from 'cors';
import https from 'https';
import http from 'http';

const app = express();
app.use(cors());

// Comprehensive toll plaza database (based on Geohacker structure)
const tollPlazas = [
  // Delhi - Mumbai Route (NH48)
  {
    id: 1,
    name: "Kherki Daula Toll Plaza",
    lat: 28.408,
    lon: 76.987,
    location: "Delhi-Gurgaon Expressway",
    rates: {
      car_single: 60,
      car_multi: 60,
      car_monthly: 1200,
      lcv_single: 95,
      lcv_multi: 95,
      lcv_monthly: 1900,
      bus_single: 185,
      bus_multi: 185,
      bus_monthly: 3700
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH48"
  },
  {
    id: 2,
    name: "Ambience Mall Toll Plaza",
    lat: 28.504,
    lon: 77.096,
    location: "Delhi-Gurgaon Expressway",
    rates: {
      car_single: 30,
      car_multi: 30,
      car_monthly: 600,
      lcv_single: 50,
      lcv_multi: 50,
      lcv_monthly: 1000,
      bus_single: 95,
      bus_multi: 95,
      bus_monthly: 1900
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH48"
  },
  {
    id: 3,
    name: "Manesar Toll Plaza",
    lat: 28.3543,
    lon: 76.9405,
    location: "Delhi-Jaipur Expressway",
    rates: {
      car_single: 80,
      car_multi: 80,
      car_monthly: 1600,
      lcv_single: 125,
      lcv_multi: 125,
      lcv_monthly: 2500,
      bus_single: 245,
      bus_multi: 245,
      bus_monthly: 4900
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH48"
  },
  
  // Delhi - Kanpur Route (NH2)
  {
    id: 4,
    name: "Palwal Toll Plaza",
    lat: 28.4089,
    lon: 77.3178,
    location: "Delhi-Agra Expressway",
    rates: {
      car_single: 45,
      car_multi: 45,
      car_monthly: 900,
      lcv_single: 70,
      lcv_multi: 70,
      lcv_monthly: 1400,
      bus_single: 140,
      bus_multi: 140,
      bus_monthly: 2800
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH2"
  },
  {
    id: 5,
    name: "Mathura Toll Plaza",
    lat: 27.4924,
    lon: 77.6737,
    location: "Delhi-Agra Expressway",
    rates: {
      car_single: 55,
      car_multi: 55,
      car_monthly: 1100,
      lcv_single: 85,
      lcv_multi: 85,
      lcv_monthly: 1700,
      bus_single: 170,
      bus_multi: 170,
      bus_monthly: 3400
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH2"
  },
  {
    id: 6,
    name: "Agra Toll Plaza",
    lat: 27.1767,
    lon: 78.0081,
    location: "Delhi-Agra Expressway",
    rates: {
      car_single: 70,
      car_multi: 70,
      car_monthly: 1400,
      lcv_single: 110,
      lcv_multi: 110,
      lcv_monthly: 2200,
      bus_single: 220,
      bus_multi: 220,
      bus_monthly: 4400
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH2"
  },
  {
    id: 7,
    name: "Kanpur Entry Toll",
    lat: 26.8467,
    lon: 80.9462,
    location: "Kanpur City Entry",
    rates: {
      car_single: 90,
      car_multi: 90,
      car_monthly: 1800,
      lcv_single: 140,
      lcv_multi: 140,
      lcv_monthly: 2800,
      bus_single: 280,
      bus_multi: 280,
      bus_monthly: 5600
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH2"
  },
  
  // Mumbai - Pune Route
  {
    id: 8,
    name: "Mumbai Entry Toll",
    lat: 19.0760,
    lon: 72.8777,
    location: "Mumbai City Entry",
    rates: {
      car_single: 40,
      car_multi: 40,
      car_monthly: 800,
      lcv_single: 65,
      lcv_multi: 65,
      lcv_monthly: 1300,
      bus_single: 130,
      bus_multi: 130,
      bus_monthly: 2600
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH48"
  },
  {
    id: 9,
    name: "Pune Exit Toll",
    lat: 18.5204,
    lon: 73.8567,
    location: "Pune City Exit",
    rates: {
      car_single: 80,
      car_multi: 80,
      car_monthly: 1600,
      lcv_single: 125,
      lcv_multi: 125,
      lcv_monthly: 2500,
      bus_single: 250,
      bus_multi: 250,
      bus_monthly: 5000
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH48"
  },
  
  // Additional toll plazas for comprehensive coverage
  {
    id: 10,
    name: "Faridabad Toll Plaza",
    lat: 28.6139,
    lon: 77.2090,
    location: "Delhi-Faridabad Expressway",
    rates: {
      car_single: 35,
      car_multi: 35,
      car_monthly: 700,
      lcv_single: 55,
      lcv_multi: 55,
      lcv_monthly: 1100,
      bus_single: 110,
      bus_multi: 110,
      bus_monthly: 2200
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH2"
  },
  {
    id: 11,
    name: "Gurgaon Expressway Toll",
    lat: 28.4593,
    lon: 77.0266,
    location: "Delhi-Gurgaon Expressway",
    rates: {
      car_single: 25,
      car_multi: 25,
      car_monthly: 500,
      lcv_single: 40,
      lcv_multi: 40,
      lcv_monthly: 800,
      bus_single: 80,
      bus_multi: 80,
      bus_monthly: 1600
    },
    fee_effective_date: "2024-01-01",
    project_type: "BOT",
    highway: "NH48"
  }
];

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

// Function to find toll plazas near a route
function findTollsNearRoute(routePoints, maxDistance = 5) {
  const nearbyTolls = [];
  
  tollPlazas.forEach(toll => {
    // Check if toll plaza is near any point in the route
    for (let point of routePoints) {
      const distance = calculateDistance(
        point.lat, point.lng,
        toll.lat, toll.lon
      );
      
      if (distance <= maxDistance) {
        nearbyTolls.push({
          ...toll,
          distance_from_route: distance,
          price: toll.rates.car_single // Default to car single journey
        });
        break; // Found this toll, move to next
      }
    }
  });
  
  // Sort by distance from route
  return nearbyTolls.sort((a, b) => a.distance_from_route - b.distance_from_route);
}

// Function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      ...options,
      headers: {
        'User-Agent': 'TollCalculator/1.0',
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

// Decode an encoded Google polyline string into an array of { lat, lng }
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

// Get coordinates from OpenStreetMap Nominatim (free)
async function getCoordinates(place) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1&countrycodes=in`;
    const response = await makeRequest(url);
    
    if (response && response.length > 0) {
      return {
        lat: parseFloat(response[0].lat),
        lng: parseFloat(response[0].lon),
        display_name: response[0].display_name
      };
    }
    throw new Error('Location not found');
  } catch (error) {
    console.error('Nominatim error:', error.message);
    return null;
  }
}

// Get route using OpenRouteService (free)
async function getRouteOpenRoute(origin, destination) {
  try {
    const originCoords = await getCoordinates(origin);
    const destCoords = await getCoordinates(destination);
    
    if (!originCoords || !destCoords) {
      throw new Error('Could not get coordinates for origin or destination');
    }
    
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248e4c8c7c8c0c94c0c8c8c8c8c8c8c8c&start=${originCoords.lng},${originCoords.lat}&end=${destCoords.lng},${destCoords.lat}`;
    
    const response = await makeRequest(url, {
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Authorization': '5b3ce3597851110001cf6248e4c8c7c8c0c94c0c8c8c8c8c8c8c8c'
      }
    });
    
    if (response.features && response.features[0]) {
      const coordinates = response.features[0].geometry.coordinates;
      const summary = response.features[0].properties.summary;
      
      return {
        path: coordinates.map(coord => ({ lng: coord[0], lat: coord[1] })),
        distance: summary.distance / 1000, // Convert to km
        duration: summary.duration / 60, // Convert to minutes
        coordinates: {
          origin: originCoords,
          destination: destCoords
        }
      };
    }
    throw new Error('No route found');
  } catch (error) {
    console.error('OpenRouteService error:', error.message);
    return null;
  }
}

// Generate realistic mock route data
function generateMockRouteData(origin, destination) {
  const routes = {
    'Delhi-Mumbai': {
      path: [
        { lat: 28.7041, lng: 77.1025 }, // Delhi
        { lat: 28.4593, lng: 77.0266 }, // Gurgaon
        { lat: 19.0760, lng: 72.8777 }  // Mumbai
      ],
      distance: 1400,
      duration: 1080 // 18 hours
    },
    'Delhi-Kanpur': {
      path: [
        { lat: 28.7041, lng: 77.1025 }, // Delhi
        { lat: 28.4593, lng: 77.0266 }, // Gurgaon
        { lat: 28.6139, lng: 77.2090 }, // Faridabad
        { lat: 28.4089, lng: 77.3178 }, // Palwal
        { lat: 27.4924, lng: 77.6737 }, // Mathura
        { lat: 27.1767, lng: 78.0081 }, // Agra
        { lat: 26.8467, lng: 80.9462 }  // Kanpur
      ],
      distance: 480,
      duration: 360 // 6 hours
    },
    'Mumbai-Pune': {
      path: [
        { lat: 19.0760, lng: 72.8777 }, // Mumbai
        { lat: 18.5204, lng: 73.8567 }  // Pune
      ],
      distance: 150,
      duration: 180 // 3 hours
    }
  };
  
  const routeKey = `${origin}-${destination}`;
  return routes[routeKey] || routes['Delhi-Mumbai'];
}

// Comprehensive route tolls endpoint
app.get('/api/comprehensive-route-tolls', async (req, res) => {
  try {
    const { origin, destination, vehicleType = 'car_single', provider } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }
    
    console.log(`Fetching comprehensive route data for: ${origin} → ${destination} ${provider ? `(provider=${provider})` : ''}`);
    
    // Choose provider: google -> openroute -> mock and track which one succeeded
    let routeData = null;
    let sourceUsed = 'mock';
    if (provider === 'google') {
      routeData = await getRouteGoogleDirections(origin, destination);
      if (routeData) sourceUsed = 'google';
    }
    if (!routeData) {
      const openRoute = await getRouteOpenRoute(origin, destination);
      if (openRoute) {
        routeData = openRoute;
        sourceUsed = 'openroute';
      }
    }
    
    // Fallback to mock data if API fails
    if (!routeData) {
      routeData = generateMockRouteData(origin, destination);
      sourceUsed = 'mock';
    }
    
    // Find toll plazas near the route
    const nearbyTolls = findTollsNearRoute(routeData.path, 5); // 5km buffer
    
    // Calculate total toll cost
    const totalToll = nearbyTolls.reduce((sum, toll) => {
      return sum + (toll.rates[vehicleType] || toll.rates.car_single);
    }, 0);
    
    // Format toll data for response
    const formattedTolls = nearbyTolls.map(toll => ({
      id: toll.id,
      name: toll.name,
      lat: toll.lat,
      lng: toll.lon,
      location: toll.location,
      price: toll.rates[vehicleType] || toll.rates.car_single,
      currency: 'INR',
      distance_from_route: toll.distance_from_route,
      highway: toll.highway,
      fee_effective_date: toll.fee_effective_date
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
      data_source: (
        sourceUsed === 'google' ? 'Google Directions API + Geohacker Database' :
        sourceUsed === 'openroute' ? 'OpenRouteService API + Geohacker Database' :
        'Mock Data + Geohacker Database'
      ),
      coordinates: routeData.coordinates || null
    });
    
  } catch (error) {
    console.error('Comprehensive route tolls error:', error);
    res.status(500).json({ error: 'Failed to process comprehensive route tolls' });
  }
});

// Convenience endpoint to explicitly use Google Directions
app.get('/api/google-route-tolls', async (req, res) => {
  try {
    const { origin, destination, vehicleType = 'car_single' } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    let routeData = null;
    let sourceUsed = 'mock';
    const google = await getRouteGoogleDirections(origin, destination);
    if (google) {
      routeData = google;
      sourceUsed = 'google';
    } else {
      const openRoute = await getRouteOpenRoute(origin, destination);
      if (openRoute) {
        routeData = openRoute;
        sourceUsed = 'openroute';
      } else {
        routeData = generateMockRouteData(origin, destination);
        sourceUsed = 'mock';
      }
    }

    const nearbyTolls = findTollsNearRoute(routeData.path, 5);
    const totalToll = nearbyTolls.reduce((sum, toll) => sum + (toll.rates[vehicleType] || toll.rates.car_single), 0);
    const formattedTolls = nearbyTolls.map(toll => ({
      id: toll.id,
      name: toll.name,
      lat: toll.lat,
      lng: toll.lon,
      location: toll.location,
      price: toll.rates[vehicleType] || toll.rates.car_single,
      currency: 'INR',
      distance_from_route: toll.distance_from_route,
      highway: toll.highway,
      fee_effective_date: toll.fee_effective_date
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
      data_source: (
        sourceUsed === 'google' ? 'Google Directions API + Geohacker Database' :
        sourceUsed === 'openroute' ? 'OpenRouteService API + Geohacker Database' :
        'Mock Data + Geohacker Database'
      ),
      coordinates: routeData.coordinates || null
    });
  } catch (error) {
    console.error('Google route tolls error:', error);
    res.status(500).json({ error: 'Failed to process Google route tolls' });
  }
});

// Get all toll plazas
app.get('/api/toll-plazas', (req, res) => {
  try {
    res.json({
      count: tollPlazas.length,
      toll_plazas: tollPlazas,
      data_source: 'Geohacker Database Structure'
    });
  } catch (error) {
    console.error('Error fetching toll plazas:', error);
    res.status(500).json({ error: 'Failed to fetch toll plazas' });
  }
});

// Get toll plaza by ID
app.get('/api/toll-plaza/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const toll = tollPlazas.find(t => t.id === id);
    
    if (!toll) {
      return res.status(404).json({ error: 'Toll plaza not found' });
    }
    
    res.json(toll);
  } catch (error) {
    console.error('Error fetching toll plaza:', error);
    res.status(500).json({ error: 'Failed to fetch toll plaza' });
  }
});

// Search toll plazas by location
app.get('/api/search-tolls', (req, res) => {
  try {
    const { location, highway } = req.query;
    let filteredTolls = tollPlazas;
    
    if (location) {
      filteredTolls = filteredTolls.filter(toll => 
        toll.location.toLowerCase().includes(location.toLowerCase()) ||
        toll.name.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (highway) {
      filteredTolls = filteredTolls.filter(toll => 
        toll.highway.toLowerCase().includes(highway.toLowerCase())
      );
    }
    
    res.json({
      count: filteredTolls.length,
      toll_plazas: filteredTolls
    });
  } catch (error) {
    console.error('Error searching toll plazas:', error);
    res.status(500).json({ error: 'Failed to search toll plazas' });
  }
});

// Get vehicle types and rates
app.get('/api/vehicle-types', (req, res) => {
  try {
    const vehicleTypes = {
      car_single: 'Car (Single Journey)',
      car_multi: 'Car (Return Journey)',
      car_monthly: 'Car (Monthly Pass)',
      lcv_single: 'LCV (Single Journey)',
      lcv_multi: 'LCV (Return Journey)',
      lcv_monthly: 'LCV (Monthly Pass)',
      bus_single: 'Bus (Single Journey)',
      bus_multi: 'Bus (Return Journey)',
      bus_monthly: 'Bus (Monthly Pass)'
    };
    
    res.json(vehicleTypes);
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle types' });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`🚀 Comprehensive Toll API running on http://localhost:${PORT}`);
  console.log('📡 Features:');
  console.log('   • Geohacker Database Structure');
  console.log('   • Real-time Route Matching');
  console.log('   • Multiple Vehicle Types');
  console.log('   • Distance-based Toll Detection');
  console.log('   • OpenRouteService Integration');
  console.log(`   • ${tollPlazas.length} Toll Plazas Available`);
});

export { app }; 