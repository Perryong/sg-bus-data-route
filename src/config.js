// Configuration for API endpoints
const config = {
  // Use environment variable if available, otherwise fall back to logic
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://api.allorigins.win/raw?url=https://sg-bus-data-api.vercel.app' 
      : ''),
  
  // Helper function to get full API URL
  getApiUrl: (endpoint) => {
    const baseUrl = config.apiBaseUrl;
    return baseUrl ? `${baseUrl}${endpoint}` : endpoint;
  }
};

export default config; 