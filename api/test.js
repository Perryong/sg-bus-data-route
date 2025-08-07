// Test endpoint to verify the proxy is working
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Test the bus API directly
    const response = await fetch('https://sg-bus-data-api.vercel.app/api/bus-stops?bbox=103.8,1.3,103.9,1.4&limit=5');
    const data = await response.json();
    
    res.status(200).json({
      success: true,
      message: 'Proxy test successful',
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