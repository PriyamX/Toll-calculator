import React, { useState, useEffect, useRef } from "react";
import "./App.css";

export default function App() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleType, setVehicleType] = useState('car_single');
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const apiBase = import.meta.env.VITE_API_BASE || '';
  
  const mapRef = useRef(null);

  const vehicleTypes = [
    { value: 'car_single', label: 'Car (Single Journey)' },
    { value: 'car_multi', label: 'Car (Return Journey)' },
    { value: 'car_monthly', label: 'Car (Monthly Pass)' },
    { value: 'lcv_single', label: 'LCV (Single Journey)' },
    { value: 'lcv_multi', label: 'LCV (Return Journey)' },
    { value: 'lcv_monthly', label: 'LCV (Monthly Pass)' },
    { value: 'bus_single', label: 'Bus (Single Journey)' },
    { value: 'bus_multi', label: 'Bus (Return Journey)' },
    { value: 'bus_monthly', label: 'Bus (Monthly Pass)' }
  ];

  // Load Google Maps
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setGoogleMapsLoaded(true);
        initMap();
      } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setGoogleMapsLoaded(true);
          initMap();
        };
        document.head.appendChild(script);
      }
    };

    loadGoogleMaps();
  }, []);

  const initMap = () => {
    if (!googleMapsLoaded || !mapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: 23.5937, lng: 78.9629 }, // Center of India
      zoom: 5,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true
    });

    const directionsServiceInstance = new window.google.maps.DirectionsService();
    const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    directionsRendererInstance.setMap(mapInstance);

    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);
  };

  const calculateRoute = async () => {
    if (!origin || !destination) {
      setError('Please enter origin and destination');
      return;
    }

    setLoading(true);
    setError(null);
    setRouteData(null);

    try {
      console.log('Calculating route from', origin, 'to', destination);
      
      // First get route from Google Maps
      if (directionsService && directionsRenderer) {
        const routeResult = await directionsService.route({
          origin: origin,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING
        });

        directionsRenderer.setDirections(routeResult);
      }
      
      // Then get toll data from our API
      const apiUrl = `${apiBase}/api/comprehensive-route-tolls?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&vehicleType=${vehicleType}&provider=google&optimize=true`;
      
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (response.ok) {
        setRouteData({
          route: `${origin} → ${destination}`,
          tolls: data.tolls || [],
          totalToll: data.total_toll_price || 0,
          currency: data.currency || 'INR',
          distance: data.distance || 'Unknown',
          duration: data.duration || 'Unknown',
          vehicleType: vehicleType,
          dataSource: data.data_source || 'Unknown'
        });
      } else {
        throw new Error(data.error || 'Failed to fetch toll data');
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleRoute = (originCity, destCity) => {
    setOrigin(originCity);
    setDestination(destCity);
    setError(null);
    setRouteData(null);
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>🚗 Toll Route Calculator</h1>
          <p>Calculate toll charges for your journey with real-time route planning</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="input-section">
        <div className="input-container">
          <div className="input-group">
            <label htmlFor="origin">📍 Origin</label>
            <input
              type="text"
              id="origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Enter origin city (e.g., Delhi)"
              className="input-field"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="destination">📍 Destination</label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination city (e.g., Mumbai)"
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label htmlFor="vehicleType">🚛 Vehicle Type</label>
            <select
              id="vehicleType"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="input-field"
            >
              {vehicleTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={calculateRoute}
            disabled={loading || !origin || !destination}
            className="calculate-btn"
          >
            {loading ? '🔄 Calculating...' : '🚀 Calculate Toll'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
        </div>
      )}

      {/* Main Content - Split Layout */}
      <div className="main-content">
        {/* Map Section */}
        <div className="map-section">
          <div className="map-container">
            <div ref={mapRef} className="google-map" />
            {!googleMapsLoaded && (
              <div className="map-loading">
                <div className="loading-spinner"></div>
                <p>Loading Google Maps...</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <div className="results-section">
          {routeData ? (
            <div className="results-content">
              <div className="route-summary">
                <h2>🗺️ Route Summary</h2>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Route</span>
                    <span className="value">{routeData.route}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Vehicle Type</span>
                    <span className="value">{vehicleTypes.find(v => v.value === routeData.vehicleType)?.label}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Distance</span>
                    <span className="value">{routeData.distance}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Duration</span>
                    <span className="value">{routeData.duration}</span>
                  </div>
                  <div className="summary-item total-toll">
                    <span className="label">Total Toll</span>
                    <span className="value">₹{routeData.totalToll} {routeData.currency}</span>
                  </div>
                </div>
              </div>

              <div className="toll-details">
                <h3>🏛️ Toll Plazas ({routeData.tolls.length})</h3>
                {routeData.tolls.length > 0 ? (
                  <div className="toll-list">
                    {routeData.tolls.map((toll, index) => (
                      <div key={index} className="toll-item">
                        <div className="toll-header">
                          <span className="toll-name">{toll.name}</span>
                          <span className="toll-price">₹{toll.price}</span>
                        </div>
                        <div className="toll-location">
                          📍 {toll.lat.toFixed(4)}, {toll.lng.toFixed(4)}
                        </div>
                        <div className="toll-highway">
                          🛣️ {toll.highway || 'Highway'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No toll plazas found on this route.</p>
                )}
              </div>

              <div className="api-info">
                <h4>🔧 Data Source</h4>
                <p>{routeData.dataSource}</p>
              </div>
            </div>
          ) : (
            <div className="welcome-message">
              <h2>👋 Welcome to Toll Calculator</h2>
              <p>Enter your origin and destination to calculate toll charges for your journey.</p>
              <div className="example-routes">
                <h4>💡 Try these examples:</h4>
                <div className="example-buttons">
                  <button 
                    onClick={() => handleExampleRoute('Delhi', 'Mumbai')}
                    className="example-btn"
                  >
                    Delhi → Mumbai
                  </button>
                  <button 
                    onClick={() => handleExampleRoute('Delhi', 'Kanpur')}
                    className="example-btn"
                  >
                    Delhi → Kanpur
                  </button>
                  <button 
                    onClick={() => handleExampleRoute('Mumbai', 'Pune')}
                    className="example-btn"
                  >
                    Mumbai → Pune
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
