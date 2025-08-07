// Configuration for API endpoints
const config = {
  // In development, use relative URLs (proxy will handle it)
  // In production, use the full API URL
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://sg-bus-data-api.vercel.app' 
    : '',
  
  // Helper function to get full API URL
  getApiUrl: (endpoint) => {
    const baseUrl = config.apiBaseUrl;
    return baseUrl ? `${baseUrl}${endpoint}` : endpoint;
  }
};

export default config; 