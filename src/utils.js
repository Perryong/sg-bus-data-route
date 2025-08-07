// Utility functions for coordinate validation and data processing

/**
 * Validates if coordinates are valid (not NaN, not 0, and are numbers)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - True if coordinates are valid
 */
export const isValidCoordinate = (lat, lng) => {
  return lat != null && lng != null && 
         !isNaN(lat) && !isNaN(lng) && 
         lat !== 0 && lng !== 0 &&
         typeof lat === 'number' && typeof lng === 'number';
};

/**
 * Filters an array of coordinates to only include valid ones
 * @param {Array} coordinates - Array of coordinate pairs
 * @returns {Array} - Filtered array with only valid coordinates
 */
export const filterValidCoordinates = (coordinates) => {
  return coordinates.filter(coord => 
    coord && 
    Array.isArray(coord) && 
    coord.length >= 2 && 
    isValidCoordinate(coord[0], coord[1])
  );
};

/**
 * Calculates bounds from an array of coordinates with validation
 * @param {Array} coordinates - Array of coordinate pairs
 * @param {Array} defaultBounds - Default bounds to use if no valid coordinates
 * @returns {Array} - Bounds array [[minLat, minLng], [maxLat, maxLng]]
 */
export const calculateBounds = (coordinates, defaultBounds = [[1.2, 103.6], [1.5, 104.0]]) => {
  const validCoords = filterValidCoordinates(coordinates);
  
  if (validCoords.length === 0) {
    return defaultBounds;
  }
  
  const lats = validCoords.map(coord => coord[1]);
  const lngs = validCoords.map(coord => coord[0]);
  
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ];
};

/**
 * Validates bus stop data from API response
 * @param {Array} stopData - Bus stop data array from API
 * @returns {boolean} - True if stop data is valid
 */
export const isValidStopData = (stopData) => {
  return stopData && 
         Array.isArray(stopData) && 
         stopData.length >= 4 && 
         isValidCoordinate(stopData[0], stopData[1]);
};

/**
 * Validates bus data from API response
 * @param {Object} bus - Bus data object from API
 * @returns {boolean} - True if bus data is valid
 */
export const isValidBusData = (bus) => {
  return bus && 
         isValidCoordinate(bus.latitude, bus.longitude);
}; 