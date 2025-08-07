// Configuration for API endpoints
const config = {
  // Use environment variable if available, otherwise fall back to logic
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://sg-bus-data-api.vercel.app' 
      : ''),
  
  // Helper function to get full API URL with CORS handling
  getApiUrl: (endpoint) => {
    const baseUrl = config.apiBaseUrl;
    if (!baseUrl) return endpoint; // Development - use relative URLs
    
    // Production - use our own proxy function
    if (process.env.NODE_ENV === 'production') {
      // Use the proxy function we created
      return `/api/proxy?url=${encodeURIComponent(baseUrl + endpoint)}`;
    }
    
    return baseUrl + endpoint;
  }
};

export default config; 