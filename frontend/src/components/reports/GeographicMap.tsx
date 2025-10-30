import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
// @ts-expect-error - Leaflet type augmentation
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface GeographicMapData {
  lat: number;
  lon: number;
  visitors: number;
  views: number;
  name: string;
  region: string;
  country: string;
  avgTimeOnPage?: number;
}

interface GeographicMapProps {
  data: GeographicMapData[];
  height?: number;
}

export const GeographicMap: React.FC<GeographicMapProps> = ({ data, height = 400 }) => {
  // Filter out invalid coordinates
  const validData = data.filter(
    (item) =>
      item.lat !== null &&
      item.lat !== undefined &&
      item.lon !== null &&
      item.lon !== undefined &&
      !isNaN(item.lat) &&
      !isNaN(item.lon) &&
      item.lat >= -90 &&
      item.lat <= 90 &&
      item.lon >= -180 &&
      item.lon <= 180
  );

  // If no valid data, show message
  if (validData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <p className="font-medium">No geographic data with valid coordinates available</p>
          <p className="text-sm mt-1">Location data will appear here when available</p>
        </div>
      </div>
    );
  }

  // Calculate max visitors for sizing
  const maxVisitors = Math.max(...validData.map(d => d.visitors));
  const minVisitors = Math.min(...validData.map(d => d.visitors));

  // Function to calculate radius based on visitor count
  const getRadius = (visitors: number) => {
    if (maxVisitors === minVisitors) return 15;
    const normalized = (visitors - minVisitors) / (maxVisitors - minVisitors);
    return 5 + normalized * 20; // Range from 5 to 25
  };

  // Function to get color based on visitor count
  const getColor = (visitors: number) => {
    if (maxVisitors === minVisitors) return '#3B82F6';
    const normalized = (visitors - minVisitors) / (maxVisitors - minVisitors);

    // Color gradient from light blue to dark blue
    if (normalized < 0.25) return '#DBEAFE';
    if (normalized < 0.5) return '#93C5FD';
    if (normalized < 0.75) return '#3B82F6';
    return '#1E40AF';
  };

  // Calculate center point
  const centerLat = validData.reduce((sum, d) => sum + d.lat, 0) / validData.length;
  const centerLon = validData.reduce((sum, d) => sum + d.lon, 0) / validData.length;

  // Calculate appropriate zoom level based on data spread
  const latRange = Math.max(...validData.map(d => d.lat)) - Math.min(...validData.map(d => d.lat));
  const lonRange = Math.max(...validData.map(d => d.lon)) - Math.min(...validData.map(d => d.lon));
  const maxRange = Math.max(latRange, lonRange);

  let zoom = 2;
  if (maxRange < 1) zoom = 10;
  else if (maxRange < 5) zoom = 6;
  else if (maxRange < 20) zoom = 4;
  else if (maxRange < 50) zoom = 3;

  return (
    <div
      className="relative rounded-lg overflow-hidden border border-gray-200"
      style={{ height: `${height}px` }}
    >
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validData.map((location, index) => (
          <CircleMarker
            key={`${location.lat}-${location.lon}-${index}`}
            center={[location.lat, location.lon]}
            radius={getRadius(location.visitors)}
            fillColor={getColor(location.visitors)}
            color="#1E40AF"
            weight={2}
            opacity={0.8}
            fillOpacity={0.6}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-gray-900 mb-2">{location.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900">{location.region}, {location.country}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Visitors:</span>
                    <span className="font-medium text-blue-600">{location.visitors.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-medium text-gray-900">{location.views.toLocaleString()}</span>
                  </div>
                  {location.avgTimeOnPage !== undefined && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">Avg Time:</span>
                      <span className="font-medium text-gray-900">{location.avgTimeOnPage.toFixed(0)}s</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Coordinates:</span>
                    <span className="font-mono text-xs text-gray-500">
                      {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-95 rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Visitor Count</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#1E40AF' }}></div>
            <span className="text-xs text-gray-600">High ({maxVisitors.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
            <span className="text-xs text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#93C5FD' }}></div>
            <span className="text-xs text-gray-600">Low ({minVisitors.toLocaleString()})</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 rounded-lg shadow-lg p-2 px-3 z-[1000]">
        <p className="text-xs text-gray-600">
          <span className="font-semibold text-gray-900">{validData.length}</span> locations
        </p>
      </div>
    </div>
  );
};
