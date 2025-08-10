// Test script for enhanced API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3003';

async function testEnhancedAPI() {
  console.log('🚀 Testing Enhanced Toll API...\n');
  
  try {
    // Test 1: Enhanced route tolls
    console.log('1️⃣ Testing Enhanced Route Tolls (Delhi → Mumbai)');
    const routeResponse = await fetch(`${BASE_URL}/api/enhanced-route-tolls?origin=Delhi&destination=Mumbai`);
    const routeData = await routeResponse.json();
    
    console.log('✅ Route Data:');
    console.log(`   Route: ${routeData.route}`);
    console.log(`   Total Toll: ₹${routeData.total_toll_price} ${routeData.currency}`);
    console.log(`   Toll Plazas: ${routeData.tolls.length}`);
    console.log(`   Data Source: ${routeData.data_source}`);
    console.log(`   Toll Source: ${routeData.toll_source}`);
    console.log('');
    
    // Test 2: Traffic info
    console.log('2️⃣ Testing Traffic Info (Delhi coordinates)');
    const trafficResponse = await fetch(`${BASE_URL}/api/traffic-info?lat=28.7041&lng=77.1025`);
    const trafficData = await trafficResponse.json();
    
    console.log('✅ Traffic Data:');
    console.log(`   Weather: ${trafficData.weather}`);
    console.log(`   Temperature: ${trafficData.temperature}°C`);
    console.log(`   Traffic Condition: ${trafficData.traffic_condition}`);
    console.log(`   Source: ${trafficData.source}`);
    console.log('');
    
    // Test 3: Alternative routes
    console.log('3️⃣ Testing Alternative Routes (Delhi → Mumbai)');
    const altResponse = await fetch(`${BASE_URL}/api/alternative-routes?origin=Delhi&destination=Mumbai`);
    const altData = await altResponse.json();
    
    console.log('✅ Alternative Routes:');
    altData.alternatives.forEach((route, index) => {
      console.log(`   ${index + 1}. ${route.name}`);
      console.log(`      Distance: ${route.distance}`);
      console.log(`      Duration: ${route.duration}`);
      console.log(`      Tolls: ${route.tolls} (₹${route.total_toll})`);
    });
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    console.log('\n💡 To get even more accurate data:');
    console.log('   1. Sign up for free API keys (see api-keys.md)');
    console.log('   2. Add keys to environment variables');
    console.log('   3. Restart the enhanced server');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the enhanced server is running:');
    console.log('   npm run enhanced');
  }
}

// Run the test
testEnhancedAPI(); 