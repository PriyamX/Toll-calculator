import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to toll plaza data file
const TOLL_DATA_FILE = './my-tolls/backend/data/tollplazas_india.json';
// Path to sample route data for demo mode
const SAMPLE_ROUTE_FILE = './my-tolls/backend/data/sample_route.json';

// Get Google Maps API key from environment variable
const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_KEY;

const app = express();
app.use(cors());

// Function to get directions from Google Maps API
async function getDirections(origin, destination) {
  return new Promise((resolve, reject) => {
    // Check if Google Maps API key is available and valid (not the placeholder)
    if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === "YOUR_GOOGLE_KEY") {
      console.warn('GOOGLE_MAPS_KEY not set or invalid. Using demo mode with sample route data.');
      try {
        // Load sample route data from file
        const samplePath = path.join(__dirname, SAMPLE_ROUTE_FILE);
        if (fs.existsSync(samplePath)) {
          const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
          return resolve(sampleData);
        } else {
          console.warn(`Sample route file ${SAMPLE_ROUTE_FILE} not found. Using default route.`);
          // Return a default route if sample file doesn't exist
          return resolve({
            path: [
              { lat: 28.7041, lng: 77.1025 }, // Delhi
              { lat: 28.6300, lng: 77.0700 },
              { lat: 28.5000, lng: 77.0000 }, // along NH48
              { lat: 28.4593, lng: 77.0266 }, // Gurgaon area
            ]
          });
        }
      } catch (error) {
        console.error('Error loading sample route data:', error);
        reject(error);
      }
      return;
    }

    // If Google Maps API key is available, make API request
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_KEY}`;
    
    https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          const directions = JSON.parse(data);
          if (directions.status !== 'OK') {
            reject(new Error(`Google Directions API error: ${directions.status}`));
            return;
          }
          
          // Extract path from Google Directions API response
          const path = [];
          const route = directions.routes[0];
          const legs = route.legs;
          
          legs.forEach(leg => {
            leg.steps.forEach(step => {
              if (step.polyline && step.polyline.points) {
                // Decode polyline points and add to path
                const points = decodePath(step.polyline.points);
                path.push(...points);
              }
            });
          });
          
          resolve({ path });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Function to decode Google's encoded polyline format
function decodePath(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      lat: lat * 1e-5,
      lng: lng * 1e-5
    });
  }
  return points;
}

// Function to find toll plazas along a route
function findTollsAlongRoute(path, tollPlazas, radiusKm = 5) {
  // Convert radius from km to degrees (approximate)
  const radiusDegrees = radiusKm / 111;
  
  console.log(`Searching for toll plazas within ${radiusKm}km (${radiusDegrees.toFixed(4)} degrees) of route`);
  console.log(`Route has ${path.length} points, checking against ${tollPlazas.length} toll plazas`);
  
  // Find toll plazas near the path
  const nearbyTolls = tollPlazas.filter(toll => {
    // Check if toll plaza is near any point in the path
    return path.some(point => {
      const distance = Math.sqrt(
        Math.pow(point.lat - toll.lat, 2) + 
        Math.pow(point.lng - toll.lng, 2)
      );
      const isNearby = distance <= radiusDegrees;
      
      if (isNearby) {
        console.log(`Found toll plaza ${toll.name} near route point (${point.lat}, ${point.lng}), distance: ${(distance * 111).toFixed(2)}km`);
      }
      
      return isNearby;
    });
  });
  
  console.log(`Found ${nearbyTolls.length} toll plazas along route`);
  return nearbyTolls;
}

// API endpoint to get toll information for a route
app.get('/api/route-tolls', async (req, res) => {
  try {
    const { origin, destination } = req.query;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }
    
    // Get directions for the route
    const routeData = await getDirections(origin, destination);
    
    // Load toll plaza data
    const dataPath = path.join(__dirname, TOLL_DATA_FILE);
    const tollPlazas = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Find toll plazas along the route
    const routeTolls = findTollsAlongRoute(routeData.path, tollPlazas);
    
    // Calculate total toll price
    const totalPrice = routeTolls.reduce((sum, toll) => sum + toll.price, 0);
    
    // Determine currency (use the first toll's currency or default to INR)
    const currency = routeTolls.length > 0 ? routeTolls[0].currency : 'INR';
    
    res.json({
      route: `${origin} → ${destination}`,
      path: routeData.path,
      total_toll_price: totalPrice,
      currency,
      tolls: routeTolls
    });
  } catch (error) {
    console.error('Error processing route tolls:', error);
    res.status(500).json({ error: 'Failed to process route tolls' });
  }
});

// API endpoint to get all toll plazas
app.get('/api/toll-plazas', (req, res) => {
  try {
    const dataPath = path.join(__dirname, TOLL_DATA_FILE);
    const tollPlazas = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(tollPlazas);
  } catch (error) {
    console.error('Error reading toll plaza data:', error);
    res.status(500).json({ error: 'Failed to load toll plaza data' });
  }
});

// Default port is 3002, but can be overridden by environment variable
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, () => {
  console.log(`NHAI toll API running on http://localhost:${PORT}`);
  if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === "YOUR_GOOGLE_KEY") {
    console.log('⚠️  Running in demo mode without valid Google Maps API key');
    console.log('    Set GOOGLE_MAPS_KEY environment variable for live routing');
  }
  
  // Keep the server running indefinitely
  console.log('Server will remain running until manually terminated.');
});

// Keep the server running when imported as a module
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close();
  process.exit(0);
});

// Prevent the process from exiting
setInterval(() => {}, 1000 * 60 * 60); // Keep alive every hour

// Export the app and server for external use
export { app, server };