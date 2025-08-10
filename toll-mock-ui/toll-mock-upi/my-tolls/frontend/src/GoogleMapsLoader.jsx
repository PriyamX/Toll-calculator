import { useEffect, useState } from 'react';

function GoogleMapsLoader({ onLoad }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('GoogleMapsLoader: useEffect triggered');
    
    // Check if the script is already loaded
    if (window.google && window.google.maps) {
      console.log('GoogleMapsLoader: Google Maps already available');
      setIsLoaded(true);
      if (onLoad) onLoad();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      console.log('GoogleMapsLoader: Script already being loaded, waiting...');
      // Script is already being loaded, wait for it to complete
      const handleLoad = () => {
        console.log('GoogleMapsLoader: Existing script loaded');
        // Wait a bit more to ensure Google Maps is fully initialized
        setTimeout(() => {
          if (window.google && window.google.maps) {
            setIsLoaded(true);
            if (onLoad) onLoad();
          }
        }, 100);
        existingScript.removeEventListener('load', handleLoad);
      };
      existingScript.addEventListener('load', handleLoad);
      return;
    }

    // Create script element with proper API key handling
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    
    // Use environment variable or provide clear instructions
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      console.warn('GoogleMapsLoader: No valid API key found. Please set VITE_GOOGLE_MAPS_KEY in your .env file');
      console.warn('Get your free API key from: https://developers.google.com/maps/documentation/javascript/get-api-key');
      console.warn('For now, using DEMO_KEY (limited functionality, shows watermark)');
      
      // For development/testing, we can use a demo approach
      // But this will show a warning and limited functionality
      script.src = 'https://maps.googleapis.com/maps/api/js?key=DEMO_KEY&libraries=places,geometry&loading=async';
    } else {
      console.log('GoogleMapsLoader: Using API key:', apiKey ? 'API key set' : 'No API key');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
    }
    
    script.async = true;
    script.defer = true;
    
    // Add load event listener
    script.addEventListener('load', () => {
      console.log('GoogleMapsLoader: Script loaded successfully');
      // Wait for Google Maps to be fully available
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps && typeof window.google.maps.Map === 'function') {
          console.log('GoogleMapsLoader: Google Maps fully loaded and ready');
          setIsLoaded(true);
          if (onLoad) onLoad();
        } else {
          console.log('GoogleMapsLoader: Waiting for Google Maps to be fully ready...');
          setTimeout(checkGoogleMaps, 50);
        }
      };
      checkGoogleMaps();
    });
    
    // Add error event listener
    script.addEventListener('error', (error) => {
      console.error('GoogleMapsLoader: Failed to load Google Maps script:', error);
      setIsLoaded(false);
    });
    
    // Add script to document
    console.log('GoogleMapsLoader: Adding script to document head');
    document.head.appendChild(script);

    // Cleanup function
    return () => {
      // No specific cleanup needed for this approach
    };
  }, [onLoad]);

  // This component doesn't render anything
  return null;
}

export default GoogleMapsLoader;