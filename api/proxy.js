// Vercel serverless function to proxy API requests and add CORS headers
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Get the target URL from query parameters
    const { url, ...queryParams } = req.query;
    
    if (!url) {
      return res.status(400).json({ 
        error: 'Missing URL parameter',
        usage: 'Use ?url=https://sg-bus-data-api.vercel.app/api/endpoint'
      });
    }
    
    // Construct the full URL with query parameters
    const targetUrl = new URL(url);
    Object.keys(queryParams).forEach(key => {
      targetUrl.searchParams.append(key, queryParams[key]);
    });
    
    // Make the request to the target API
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response with CORS headers
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy error',
      message: error.message 
    });
  }
} 