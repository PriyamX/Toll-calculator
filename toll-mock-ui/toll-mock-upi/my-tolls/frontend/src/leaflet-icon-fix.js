// leaflet-icon-fix.js
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the default icon issue in Leaflet with React
export default function fixLeafletIcon() {
  // Get the default icon configuration
  delete L.Icon.Default.prototype._getIconUrl;
  
  // Set the default icon to use the imported images
  L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl: iconUrl,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });
}