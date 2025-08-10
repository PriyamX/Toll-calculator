// src/App.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Default path data
const defaultPath = [
  { lat: 28.7041, lng: 77.1025 }, // Delhi
  { lat: 28.6300, lng: 77.0700 },
  { lat: 28.5000, lng: 77.0000 }, // along NH48
  { lat: 28.4593, lng: 77.0266 }, // Gurgaon area
];

export default function App() {
  const [data, setData] = useState({
    path: defaultPath,
    toll_booths: [],
    total: 0,
    currency: "INR",
    loading: true,
    error: null
  });

  const [origin, setOrigin] = useState('Delhi');
  const [destination, setDestination] = useState('Kanpur');

  useEffect(() => {
    // Fetch toll data from the NHAI API
    fetch(`http://localhost:3002/api/route-tolls?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(tollData => {
        setData({
          path: tollData.path || defaultPath,
          toll_booths: tollData.tolls.map(toll => ({
            name: toll.name,
            lat: toll.lat,
            lng: toll.lng,
            price: toll.price,
            currency: toll.currency || "INR"
          })),
          total: tollData.total_toll_price,
          currency: tollData.currency,
          loading: false,
          error: null
        });
      })
      .catch(error => {
        console.error('Error fetching toll data:', error);
        setData(prev => ({ ...prev, loading: false, error: error.message }));
      });
  }, [origin, destination]);

  const center = [data.path[1].lat, data.path[1].lng];
  const polyline = data.path.map(p => [p.lat, p.lng]);

  // Handle loading state
  if (data.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading toll data...</p>
      </div>
    );
  }

  // Handle error state
  if (data.error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
        <h2>Error loading toll data</h2>
        <p>{data.error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const handleRouteSubmit = (e) => {
    e.preventDefault();
    setData(prev => ({ ...prev, loading: true, error: null }));
    
    // Fetch toll data for the new route
    fetch(`http://localhost:3002/api/route-tolls?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(tollData => {
        setData({
          path: tollData.path || defaultPath,
          toll_booths: tollData.tolls.map(toll => ({
            name: toll.name,
            lat: toll.lat,
            lng: toll.lng,
            price: toll.price,
            currency: toll.currency || "INR"
          })),
          total: tollData.total_toll_price,
          currency: tollData.currency,
          loading: false,
          error: null
        });
      })
      .catch(error => {
        console.error('Error fetching toll data:', error);
        setData(prev => ({ ...prev, loading: false, error: error.message }));
      });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ padding: "10px", backgroundColor: "#f0f0f0", borderBottom: "1px solid #ddd" }}>
        <form onSubmit={handleRouteSubmit} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div>
            <label htmlFor="origin" style={{ marginRight: "5px" }}>Origin:</label>
            <input 
              type="text" 
              id="origin" 
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)} 
              style={{ padding: "5px" }}
            />
          </div>
          <div>
            <label htmlFor="destination" style={{ marginRight: "5px" }}>Destination:</label>
            <input 
              type="text" 
              id="destination" 
              value={destination} 
              onChange={(e) => setDestination(e.target.value)} 
              style={{ padding: "5px" }}
            />
          </div>
          <button type="submit" style={{ padding: "5px 10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px" }}>
            Get Toll Info
          </button>
        </form>
      </div>
      
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: 2 }}>
          <MapContainer center={center} zoom={11} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={polyline} />
            {data.toll_booths.map((t, i) => (
              <Marker key={i} position={[t.lat, t.lng]}>
                <Popup>
                  <div><strong>{t.name}</strong><br/>Price: {t.currency} {t.price}</div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div style={{ width: 360, padding: 16, borderLeft: "1px solid #ddd", overflow: "auto" }}>
          <h2>Toll summary</h2>
          <p>Route: <strong>{origin} → {destination}</strong></p>
          <p>Total: <strong>{data.currency} {data.total}</strong></p>
          <ul>
            {data.toll_booths.map((t,i) => (
              <li key={i} style={{ marginBottom: 12 }}>
                <strong>{t.name}</strong><br/>
                Price: {t.currency} {t.price}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
