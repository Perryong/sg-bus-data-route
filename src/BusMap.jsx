import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import config from './config';
import { isValidStopData } from './utils';

function BusMap() {
  const [busStops, setBusStops] = useState([]);
  const [arrivals, setArrivals] = useState({});

  // Load bus stops in current view
  useEffect(() => {
    const bbox = "103.8,1.3,103.9,1.4"; // Singapore bounds
    fetch(config.getApiUrl(`/api/bus-stops?bbox=${bbox}&limit=200`))
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.stops) {
          // Convert API response to GeoJSON format
          const features = Object.entries(data.data.stops)
            .filter(([code, stopData]) => isValidStopData(stopData))
            .map(([code, stopData]) => ({
              type: 'Feature',
              properties: {
                code: code,
                name: stopData[2],
                road: stopData[3],
                services: [] // API doesn't provide services in this endpoint
              },
              geometry: {
                type: 'Point',
                coordinates: [stopData[0], stopData[1]]
              }
            }));
          setBusStops(features);
        } else {
          console.error('Failed to load bus stops:', data);
        }
      })
      .catch(err => console.error('Failed to load bus stops:', err));
  }, []);

  // Load real-time arrivals for a specific stop
  const loadArrivals = async (stopCode) => {
    try {
      const response = await fetch(config.getApiUrl(`/api/arrivals?busStopCode=${stopCode}`));
      const data = await response.json();
      if (data.success && data.data.arrivals) {
        setArrivals(prev => ({ ...prev, [stopCode]: data.data.arrivals }));
      } else {
        console.error('Failed to load arrivals:', data);
      }
    } catch (error) {
      console.error('Failed to load arrivals:', error);
    }
  };

  return (
    <MapContainer center={[1.3521, 103.8198]} zoom={11} style={{ height: '100vh' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {busStops.map(stop => (
        <Marker 
          key={stop.properties.code}
          position={[stop.geometry.coordinates[1], stop.geometry.coordinates[0]]}
          eventHandlers={{
            click: () => loadArrivals(stop.properties.code)
          }}
        >
          <Popup>
            <div>
              <h3>{stop.properties.name}</h3>
              <p>Stop: {stop.properties.code}</p>
              <p>Road: {stop.properties.road}</p>
              <p>Services: {stop.properties.services.length > 0 ? stop.properties.services.join(', ') : 'No service info available'}</p>
              
              {arrivals[stop.properties.code] && (
                <div>
                  <h4>Next Arrivals:</h4>
                  {arrivals[stop.properties.code].map(arrival => (
                    <div key={arrival.serviceNo}>
                      <strong>Bus {arrival.serviceNo}:</strong>
                      {arrival.buses.map((bus, i) => (
                        <span key={i}> {bus.minutesAway}min</span>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default BusMap;