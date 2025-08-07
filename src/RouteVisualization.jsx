import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import polyline from '@mapbox/polyline';
import config from './config';
import { calculateBounds } from './utils';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function RouteVisualization({ 
  serviceNumber, 
  apiBaseUrl = '',
  showStops = true,
  showPatternLabels = true 
}) {
  const [routeData, setRouteData] = useState(null);
  const [busStops, setBusStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!serviceNumber) return;

    const fetchRouteData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch route geometry - try GeoJSON format first, then fallback to JSON
        let routeResponse = await fetch(config.getApiUrl(`/api/bus-routes?service=${serviceNumber}&format=geojson`));
        
        // If GeoJSON format fails, try regular JSON format
        if (!routeResponse.ok) {
          routeResponse = await fetch(config.getApiUrl(`/api/bus-routes?service=${serviceNumber}`));
        }
        
        if (!routeResponse.ok) {
          throw new Error(`HTTP ${routeResponse.status}: Failed to fetch route data`);
        }

        const routeData = await routeResponse.json();

        // Check for success and extract data
        if (routeData.success && routeData.data && routeData.data.routes && routeData.data.routes[serviceNumber]) {
          const routeInfo = routeData.data.routes[serviceNumber];
          const features = [];
          
          // Handle polylines if available
          if (routeInfo.polylines && Array.isArray(routeInfo.polylines)) {
            routeInfo.polylines.forEach((polylineString, index) => {
              try {
                // Decode the polyline string to get coordinates
                const coordinates = polyline.decode(polylineString);
                
                features.push({
                  type: 'Feature',
                  properties: { 
                    pattern: index,
                    serviceNo: serviceNumber,
                    direction: index === 0 ? 'Direction 1' : `Direction ${index + 1}`
                  },
                  geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                  }
                });
              } catch (error) {
                console.error(`Failed to decode polyline ${index}:`, error);
              }
            });
          }
          
          // If no polylines, try to create routes from stops
          if (features.length === 0 && routeInfo.stops && Array.isArray(routeInfo.stops)) {
            routeInfo.stops.forEach((stopSequence, index) => {
              // For now, we'll create a simple line connecting the stops
              // In a real implementation, you'd need to fetch stop coordinates
              features.push({
                type: 'Feature',
                properties: { 
                  pattern: index,
                  serviceNo: serviceNumber,
                  direction: index === 0 ? 'Direction 1' : `Direction ${index + 1}`,
                  stops: stopSequence
                },
                geometry: {
                  type: 'LineString',
                  coordinates: [] // Will be populated when we have stop coordinates
                }
              });
            });
          }
          
          setRouteData({
            type: 'FeatureCollection',
            features: features
          });
        } else {
          throw new Error('Invalid route data response');
        }

        // For now, we'll set empty stops since the API doesn't seem to have a service-specific stops endpoint
        setBusStops([]);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch route data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [serviceNumber, apiBaseUrl, showStops]);

  const routeStyle = (feature) => {
    const pattern = feature.properties.pattern;
    const colors = ['#ff7800', '#00ff78', '#7800ff', '#ff0078', '#78ff00'];
    
    return {
      color: colors[pattern % colors.length],
      weight: 4,
      opacity: 0.8,
      dashArray: pattern > 0 ? '10, 5' : null
    };
  };

  const busStopIcon = L.divIcon({
    className: 'bus-stop-marker',
    html: `<div style="
      background: #0066cc; 
      width: 10px; 
      height: 10px; 
      border-radius: 50%; 
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2em', marginBottom: '10px' }}>🚌</div>
          <div>Loading route {serviceNumber}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffebee', 
        color: '#c62828',
        borderRadius: '8px',
        border: '1px solid #ffcdd2'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          ❌ Error loading route {serviceNumber}
        </div>
        <div>{error}</div>
        <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
          Please check if the service number exists and try again.
        </div>
      </div>
    );
  }

  if (!routeData || routeData.features.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff3e0', 
        color: '#f57c00',
        borderRadius: '8px',
        border: '1px solid #ffcc02'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
          ⚠️ No route data found
        </div>
        <div>Service {serviceNumber} may not exist or have route geometry available.</div>
        <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
          Try popular services like: 10, 14, 36, 133, 174
        </div>
      </div>
    );
  }

  // Calculate map bounds using utility function
  const allCoordinates = routeData.features.flatMap(feature => 
    feature.geometry.coordinates
  );
  
  const bounds = calculateBounds(allCoordinates);

  return (
    <div style={{ height: '500px', width: '100%', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 15px', 
        backgroundColor: '#e3f2fd', 
        borderBottom: '1px solid #bbdefb',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          🚌 Bus Service {serviceNumber} - Route Map
        </div>
        <div style={{ fontWeight: 'normal', fontSize: '0.85em', color: '#666' }}>
          {routeData.features.length} pattern{routeData.features.length !== 1 ? 's' : ''}
          {showStops && busStops.length > 0 && `, ${busStops.length} stops`}
        </div>
      </div>
      
      {/* Map */}
      <MapContainer 
        bounds={bounds} 
        style={{ height: 'calc(100% - 45px)', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Route lines */}
        {routeData && (
          <GeoJSON 
            data={routeData} 
            style={routeStyle}
            onEachFeature={(feature, layer) => {
              const pattern = feature.properties.pattern;
              const direction = feature.properties.direction || `Direction ${pattern + 1}`;
              const coordinates = feature.geometry.coordinates;
              
              layer.bindPopup(`
                <div style="min-width: 200px;">
                  <strong>🚌 Service ${serviceNumber}</strong><br/>
                  <strong>${direction}</strong><br/>
                  <small>Route pattern ${pattern + 1}</small><br/>
                  <small>${coordinates.length} coordinate points</small>
                  ${feature.properties.stops ? `<br/><small>${feature.properties.stops.length} stops</small>` : ''}
                </div>
              `);
            }}
          />
        )}
        
        {/* Pattern labels as separate markers */}
        {showPatternLabels && routeData.features.map((feature, index) => {
          if (feature.geometry.coordinates.length > 0) {
            const midPoint = feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length / 2)];
            const pattern = feature.properties.pattern;
            const colors = ['#ff7800', '#00ff78', '#7800ff', '#ff0078', '#78ff00'];
            
            return (
              <Marker
                key={`pattern-${index}`}
                position={[midPoint[1], midPoint[0]]}
                icon={L.divIcon({
                  className: 'pattern-label',
                  html: `<div style="
                    background: ${colors[pattern % colors.length]};
                    color: white;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: bold;
                    border: 1px solid white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                  ">${pattern + 1}</div>`,
                  iconSize: [20, 16],
                  iconAnchor: [10, 8]
                })}
              />
            );
          }
          return null;
        })}
        
        {/* Bus stops */}
        {showStops && busStops.map((stop, index) => (
          <Marker 
            key={stop.id || index}
            position={[stop.geometry.coordinates[1], stop.geometry.coordinates[0]]}
            icon={busStopIcon}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>{stop.properties.name}</strong><br/>
                <div style={{ margin: '8px 0', fontSize: '0.9em', color: '#666' }}>
                  Stop: <code>{stop.properties.number}</code><br/>
                  Road: {stop.properties.road}
                </div>
                <div style={{ marginTop: '10px' }}>
                  <strong>All Services at this stop:</strong><br/>
                  <div style={{ 
                    fontSize: '0.8em', 
                    marginTop: '5px',
                    maxHeight: '60px',
                    overflowY: 'auto'
                  }}>
                    {stop.properties.services.join(', ')}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      {routeData.features.length > 1 && (
        <div style={{ 
          position: 'absolute', 
          bottom: '50px', 
          left: '10px', 
          backgroundColor: 'rgba(255,255,255,0.95)',
          padding: '8px 10px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          fontSize: '0.8em',
          zIndex: 1000,
          border: '1px solid #ddd'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Route Patterns:</div>
          {routeData.features.map((feature, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <div style={{
                width: '12px',
                height: '3px',
                backgroundColor: routeStyle(feature).color,
                marginRight: '6px',
                borderRadius: '1px'
              }}></div>
              Direction {feature.properties.pattern + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RouteVisualization;
