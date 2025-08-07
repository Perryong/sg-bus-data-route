// Test endpoint to see bus route API response
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Test the bus route API
    const response = await fetch('https://sg-bus-data-api.vercel.app/api/bus-routes?service=27&format=geojson');
    const data = await response.json();
    
    res.status(200).json({
      success: true,
      message: 'Bus route API test',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
} 