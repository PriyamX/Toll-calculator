# Toll Route Frontend

This is a React frontend application for visualizing toll routes and toll plaza information. It connects to the NHAI toll API backend to fetch route and toll data using a proxy configuration.

## Features

- Interactive map showing the route between origin and destination
- Markers for toll plazas along the route
- Form for entering custom origin and destination
- Summary of toll information including total price
- Proxy configuration for API calls to backend
- Google Maps API integration for geocoding and route calculation

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory with your Google Maps API key:
   ```
   VITE_GOOGLE_MAPS_KEY=YOUR_GOOGLE_KEY
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. To start both frontend and backend servers together:
   ```bash
   npm run start
   ```

## Environment Variables

- `VITE_GOOGLE_MAPS_KEY`: Your Google Maps API key (required for production use)

## Proxy Configuration

The application uses Vite's built-in proxy feature to redirect API calls to the backend server. This is configured in `vite.config.js`:

```js
server: {
  proxy: {
    '/api': 'http://localhost:3002' // backend address
  }
}
```

With this configuration, any fetch requests to `/api/*` will be automatically proxied to `http://localhost:3002/api/*`.

## Technologies Used

- React
- Vite
- Leaflet (for maps)
- React-Leaflet
- Google Maps API (for geocoding and route calculation)
