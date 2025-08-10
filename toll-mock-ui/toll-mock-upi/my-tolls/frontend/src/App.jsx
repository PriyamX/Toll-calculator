// src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import GoogleMapsLoader from "./GoogleMapsLoader";

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
  const [mapContainerReady, setMapContainerReady] = useState(false);
  const [mapInitializing, setMapInitializing] = useState(false);
  const [mapElementStable, setMapElementStable] = useState(false);
  
  const mapRef = useRef(null);
  const mapElementCheckRef = useRef(null);
  const mapInitTimeoutRef = useRef(null);

  // Enhanced callback ref with more aggressive stability checks
  const setMapRef = useCallback((element) => {
    // Clear any existing timeouts
    if (mapInitTimeoutRef.current) {
      clearTimeout(mapInitTimeoutRef.current);
      mapInitTimeoutRef.current = null;
    }
    
    mapRef.current = element;
    
    if (element) {
      console.log('App.jsx: Map ref callback - element mounted:', element);
      
      // Reset states
      setMapContainerReady(false);
      setMapElementStable(false);
      
      // Wait for the element to be fully rendered and stable
      const checkElementStability = () => {
        if (element && document.contains(element)) {
          const rect = element.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Additional check: ensure the element is actually visible and stable
            const computedStyle = window.getComputedStyle(element);
            if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
              console.log('App.jsx: Map element fully rendered and stable:', rect);
              setMapContainerReady(true);
              
              // Wait a bit more to ensure complete stability
              setTimeout(() => {
                if (element && document.contains(element)) {
                  const rect2 = element.getBoundingClientRect();
                  if (rect2.width > 0 && rect2.height > 0) {
                    console.log('App.jsx: Map element confirmed stable after delay:', rect2);
                    setMapElementStable(true);
                  }
                }
              }, 100);
            } else {
              console.log('App.jsx: Map element has dimensions but is not visible');
              setTimeout(checkElementStability, 50);
            }
          } else {
            console.log('App.jsx: Map element mounted but no dimensions yet, waiting...');
            setTimeout(checkElementStability, 50);
          }
        } else {
          console.log('App.jsx: Map element no longer valid');
          setMapContainerReady(false);
          setMapElementStable(false);
        }
      };
      
      // Start checking after a short delay
      setTimeout(checkElementStability, 50);
    } else {
      console.log('App.jsx: Map ref callback - element unmounted');
      setMapContainerReady(false);
      setMapElementStable(false);
    }
  }, []);

  // Vehicle type options
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

  // Enhanced initMap function with more aggressive checks
  const initMap = useCallback(() => {
    console.log('App.jsx: initMap called');
    console.log('App.jsx: Current state:', {
      googleAvailable: !!window.google,
      mapsAvailable: !!(window.google && window.google.maps),
      mapConstructorAvailable: !!(window.google && window.google.maps && typeof window.google.maps.Map === 'function'),
      mapRefReady: !!mapRef.current,
      mapContainerReady: mapContainerReady,
      mapElementStable: mapElementStable,
      mapInitializing: mapInitializing,
      mapRefElement: mapRef.current
    });

    // Prevent multiple initialization attempts
    if (mapInitializing) {
      console.log('App.jsx: Map initialization already in progress');
      return;
    }

    // Check if all prerequisites are met
    if (!window.google || !window.google.maps) {
      console.log('App.jsx: Google Maps not available yet');
      return;
    }

    // Additional check: ensure Map constructor is available
    if (typeof window.google.maps.Map !== 'function') {
      console.log('App.jsx: Google Maps Map constructor not available yet, retrying in 100ms');
      mapInitTimeoutRef.current = setTimeout(initMap, 100);
      return;
    }

    if (!mapRef.current) {
      console.log('App.jsx: Map ref not ready yet, retrying in 100ms');
      mapInitTimeoutRef.current = setTimeout(initMap, 100);
      return;
    }

    // Ensure the element is actually in the DOM and has dimensions
    if (!document.contains(mapRef.current)) {
      console.log('App.jsx: Map element not in DOM yet, retrying in 100ms');
      mapInitTimeoutRef.current = setTimeout(initMap, 100);
      return;
    }

    // Check if element has dimensions (indicating it's rendered)
    const rect = mapRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.log('App.jsx: Map element has no dimensions yet, retrying in 100ms');
      mapInitTimeoutRef.current = setTimeout(initMap, 100);
      return;
    }

    // Additional stability check
    if (!mapElementStable) {
      console.log('App.jsx: Map element not yet stable, retrying in 100ms');
      mapInitTimeoutRef.current = setTimeout(initMap, 100);
      return;
    }
    
    console.log('App.jsx: All prerequisites met, initializing map');
    setMapInitializing(true);
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      try {
        // Final validation before creating the map
        if (!mapRef.current || !document.contains(mapRef.current)) {
          console.log('App.jsx: Map element became invalid during initialization');
          setMapInitializing(false);
          return;
        }
        
        // Additional validation: ensure the element is still valid
        const finalRect = mapRef.current.getBoundingClientRect();
        if (finalRect.width === 0 || finalRect.height === 0) {
          console.log('App.jsx: Map element lost dimensions during initialization');
          setMapInitializing(false);
          return;
        }
        
        // Final check: ensure Google Maps is still ready
        if (!window.google || !window.google.maps || typeof window.google.maps.Map !== 'function') {
          console.log('App.jsx: Google Maps became unavailable during initialization');
          setMapInitializing(false);
          return;
        }
        
        // Create a temporary div to test if the element can be observed
        let testObserver = null;
        try {
          testObserver = new IntersectionObserver(() => {}, { threshold: 0.1 });
          testObserver.observe(mapRef.current);
          testObserver.disconnect();
        } catch (observerError) {
          console.log('App.jsx: Element cannot be observed yet, retrying in 100ms');
          setMapInitializing(false);
          mapInitTimeoutRef.current = setTimeout(initMap, 100);
          return;
        }
        
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.2090 }, // Default to Delhi coordinates
          zoom: 8,
        });
        
        // Verify the map was created successfully
        if (mapInstance) {
          setMap(mapInstance);
          setDirectionsService(new window.google.maps.DirectionsService());
          setDirectionsRenderer(new window.google.maps.DirectionsRenderer());
          console.log('App.jsx: Map initialized successfully');
        } else {
          throw new Error('Map instance creation failed');
        }
        
        setMapInitializing(false);
      } catch (err) {
        console.error('App.jsx: Error initializing map:', err);
        setMapInitializing(false);
        
        // If it's an IntersectionObserver error, try to recover
        if (err.message && err.message.includes('IntersectionObserver')) {
          console.log('App.jsx: IntersectionObserver error detected, will retry after delay');
          setTimeout(() => {
            if (mapRef.current && document.contains(mapRef.current)) {
              initMap();
            }
          }, 500);
        } else if (err.message && err.message.includes('Map is not a constructor')) {
          console.log('App.jsx: Map constructor error detected, will retry after delay');
          setTimeout(() => {
            if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
              initMap();
            }
          }, 500);
        } else {
          setError('Failed to initialize Google Maps. Please refresh the page.');
        }
      }
    });
  }, [mapContainerReady, mapElementStable, mapInitializing]);

  // Handle Google Maps loaded callback
  const handleGoogleMapsLoaded = () => {
    console.log('App.jsx: Google Maps loaded');
    setGoogleMapsLoaded(true);
  };

  // Initialize Google Maps
  // Check if Google Maps is already loaded when component mounts
  useEffect(() => {
    if (window.google && window.google.maps) {
      console.log('App.jsx: Google Maps already available on mount');
      setGoogleMapsLoaded(true);
      // Wait for DOM to be ready
      setTimeout(() => {
        initMap();
      }, 300);
    }
  }, []);

  // Monitor mapRef availability and initialize map if ready
  useEffect(() => {
    if (googleMapsLoaded && mapContainerReady && mapElementStable && mapRef.current && !map && !mapInitializing) {
      console.log('App.jsx: All conditions met, initializing map');
      initMap();
    }
  }, [googleMapsLoaded, mapContainerReady, mapElementStable, mapRef.current, map, mapInitializing, initMap]);

  // Fallback: If Google Maps is loaded but map container isn't ready, keep checking
  useEffect(() => {
    if (googleMapsLoaded && (!mapContainerReady || !mapElementStable) && mapRef.current && !map) {
      console.log('App.jsx: Google Maps loaded but container not fully ready, setting up retry mechanism');
      
      const checkInterval = setInterval(() => {
        if (mapRef.current && document.contains(mapRef.current)) {
          const rect = mapRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const computedStyle = window.getComputedStyle(mapRef.current);
            if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
              console.log('App.jsx: Container now ready via fallback check, dimensions:', rect);
              setMapContainerReady(true);
              
              // Wait for stability
              setTimeout(() => {
                if (mapRef.current && document.contains(mapRef.current)) {
                  const rect2 = mapRef.current.getBoundingClientRect();
                  if (rect2.width > 0 && rect2.height > 0) {
                    setMapElementStable(true);
                    clearInterval(checkInterval);
                  }
                }
              }, 100);
            }
          }
        }
      }, 100);

      // Cleanup interval after 5 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 5000);

      return () => clearInterval(checkInterval);
    }
  }, [googleMapsLoaded, mapContainerReady, mapElementStable, mapRef.current, map]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mapInitTimeoutRef.current) {
        clearTimeout(mapInitTimeoutRef.current);
      }
      setMapInitializing(false);
      setMapContainerReady(false);
      setMapElementStable(false);
    };
  }, []);

  // Global error handler to catch IntersectionObserver errors
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (event.error && event.error.message && event.error.message.includes('IntersectionObserver')) {
        console.log('App.jsx: Global IntersectionObserver error caught, preventing infinite loop');
        event.preventDefault();
        event.stopPropagation();
        
        // If we have a map ref, try to recover
        if (mapRef.current && document.contains(mapRef.current)) {
          setTimeout(() => {
            if (!map && !mapInitializing) {
              console.log('App.jsx: Attempting recovery from global error');
              initMap();
            }
          }, 1000);
        }
      }
    };

    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('IntersectionObserver')) {
        console.log('App.jsx: Global IntersectionObserver promise rejection caught');
        event.preventDefault();
        
        // If we have a map ref, try to recover
        if (mapRef.current && document.contains(mapRef.current)) {
          setTimeout(() => {
            if (!map && !mapInitializing) {
              console.log('App.jsx: Attempting recovery from promise rejection');
              initMap();
            }
          }, 1000);
        }
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [map, mapInitializing, initMap]);

  // Calculate route and toll
  const calculateRoute = async () => {
    console.log('App.jsx: calculateRoute called with:', { origin, destination, vehicleType });
    
    if (!origin || !destination) {
      setError('Please enter both origin and destination');
      return;
    }

    if (!googleMapsLoaded) {
      setError('Google Maps is still loading. Please wait a moment and try again.');
      return;
    }

    if (!directionsService || !directionsRenderer) {
      setError('Google Maps services not ready. Please wait a moment and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('App.jsx: Calculating route for:', origin, 'to', destination, 'with vehicle type:', vehicleType);

      // First, get the route from Google Maps
      const routeRequest = {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      };

      console.log('App.jsx: Route request:', routeRequest);
      
      // Add error handling for route calculation
      let routeResult;
      try {
        routeResult = await directionsService.route(routeRequest);
        console.log('App.jsx: Google Maps route result:', routeResult);
      } catch (routeError) {
        console.error('App.jsx: Google Maps route error:', routeError);
        throw new Error(`Failed to calculate route: ${routeError.message || 'Route not found'}`);
      }

      // Validate route result
      if (!routeResult || !routeResult.routes || !routeResult.routes[0] || !routeResult.routes[0].legs || !routeResult.routes[0].legs[0]) {
        throw new Error('Invalid route result from Google Maps');
      }

      // Display the route on the map
      directionsRenderer.setDirections(routeResult);

      // Get toll data from our comprehensive API
      const apiUrl = `http://localhost:3005/api/comprehensive-route-tolls?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&vehicleType=${vehicleType}`;
      console.log('App.jsx: Calling API:', apiUrl);
      
      const tollResponse = await fetch(apiUrl);
      const tollData = await tollResponse.json();
      console.log('App.jsx: Toll API response:', tollData);

      if (tollResponse.ok) {
        setRouteData({
          route: routeResult,
          tolls: tollData.tolls || [],
          totalToll: tollData.total_toll_price || 0,
          currency: tollData.currency || 'INR',
          distance: routeResult.routes[0].legs[0].distance?.text || 'Unknown',
          duration: routeResult.routes[0].legs[0].duration?.text || 'Unknown',
          vehicleType: vehicleType
        });

        // Add toll markers to the map if tolls exist
        if (tollData.tolls && tollData.tolls.length > 0) {
          addTollMarkers(tollData.tolls);
        }
      } else {
        throw new Error(tollData.error || 'Failed to fetch toll data');
      }
    } catch (err) {
      console.error('App.jsx: Error calculating route:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add toll markers to the map
  const addTollMarkers = (tolls) => {
    console.log('App.jsx: addTollMarkers called with:', tolls);
    if (!map || !window.google) {
      console.log('App.jsx: Map or Google not available for markers');
      return;
    }
    
    tolls.forEach((toll, index) => {
      try {
        const marker = new window.google.maps.Marker({
          position: { lat: toll.lat, lng: toll.lng },
          map: map,
          title: `${toll.name} - ₹${toll.price}`,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#ff4444" stroke="white" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">₹</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 12)
          }
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 5px 0; color: #333;">${toll.name}</h3>
              <p style="margin: 5px 0; color: #4CAF50; font-weight: bold; font-size: 16px;">₹${toll.price} ${toll.currency}</p>
              <p style="margin: 5px 0; color: #666; font-size: 12px;">📍 ${toll.lat.toFixed(4)}, ${toll.lng.toFixed(4)}</p>
              <p style="margin: 5px 0; color: #666; font-size: 12px;">🛣️ ${toll.highway || 'Highway'}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      } catch (markerError) {
        console.error('App.jsx: Error creating marker:', markerError);
      }
    });
  };

  // Handle example route selection
  const handleExampleRoute = (originCity, destCity) => {
    console.log('App.jsx: handleExampleRoute called with:', originCity, destCity);
    setOrigin(originCity);
    setDestination(destCity);
    setError(null);
  };

  // Debug logging
  useEffect(() => {
    console.log('App.jsx: State updated:', { 
      origin, 
      destination, 
      vehicleType, 
      googleMapsLoaded, 
      map: !!map,
      directionsService: !!directionsService,
      directionsRenderer: !!directionsRenderer
    });
  }, [origin, destination, vehicleType, googleMapsLoaded, map, directionsService, directionsRenderer]);

  return (
    <div className="app">
      <GoogleMapsLoader onLoad={handleGoogleMapsLoaded} />
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1>🚗 Toll Route Calculator</h1>
          <p>Calculate toll charges for your journey with real-time route planning</p>
          
          {/* API Key Status Message */}
          {(!import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '12px',
              margin: '10px 0',
              fontSize: '14px',
              color: '#856404'
            }}>
              <strong>⚠️ API Key Required:</strong> Please set up your Google Maps API key for full functionality. 
              See <code>GOOGLE_MAPS_SETUP.md</code> for instructions. 
              Currently using demo mode (limited functionality).
            </div>
          )}
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
              onChange={(e) => {
                console.log('App.jsx: Origin input changed to:', e.target.value);
                setOrigin(e.target.value);
              }}
              placeholder="Enter origin city (e.g., Delhi)"
              className="input-field"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="destination">🎯 Destination</label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => {
                console.log('App.jsx: Destination input changed to:', e.target.value);
                setDestination(e.target.value);
              }}
              placeholder="Enter destination city (e.g., Mumbai)"
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label htmlFor="vehicleType">🚛 Vehicle Type</label>
            <select
              id="vehicleType"
              value={vehicleType}
              onChange={(e) => {
                console.log('App.jsx: Vehicle type changed to:', e.target.value);
                setVehicleType(e.target.value);
              }}
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
            onClick={() => {
              console.log('App.jsx: Calculate button clicked');
              calculateRoute();
            }}
            disabled={loading || !origin || !destination || !googleMapsLoaded}
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

      {/* Google Maps Status */}
      {!googleMapsLoaded && (
        <div className="info-message">
          <span>⏳ Loading Google Maps... {map ? '(Map Ready)' : '(Map Loading...)'}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Map Section */}
        <div className="map-section">
          <div className="map-container">
            <div ref={setMapRef} className="google-map" />
            {!map && (
              <div className="map-loading">
                <div className="loading-spinner"></div>
                <p>Loading Google Maps...</p>
                <p>Status: {googleMapsLoaded ? 'Google Maps Loaded' : 'Loading Google Maps Script...'}</p>
                <p>Map Ref: {mapRef.current ? 'Ready' : 'Not Ready'}</p>
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
                    <span className="value">{origin} → {destination}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Vehicle Type</span>
                    <span className="value">{vehicleTypes.find(v => v.value === vehicleType)?.label}</span>
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
                <h4>🔧 Data Sources</h4>
                <div className="api-sources">
                  <span className="api-source">🗺️ Google Maps (Route)</span>
                  <span className="api-source">💰 Comprehensive Toll API</span>
                </div>
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
