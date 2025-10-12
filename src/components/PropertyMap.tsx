import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import { Property } from '../types';

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function PropertyMap() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [center, setCenter] = useState<[number, number]>([39.7392, -104.9903]);

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('archived', false);

    if (error) {
      console.error('Error loading properties:', error);
    } else {
      const propertiesData = data || [];
      setProperties(propertiesData);

      const propertiesWithCoords = propertiesData.filter(p => p.latitude && p.longitude);
      if (propertiesWithCoords.length > 0) {
        const avgLat = propertiesWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) / propertiesWithCoords.length;
        const avgLng = propertiesWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) / propertiesWithCoords.length;
        setCenter([avgLat, avgLng]);
      }
    }
  }

  const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);

  if (propertiesWithCoords.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">
          No properties with location data yet. Properties will appear on the map once you add them.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          (Note: In this MVP, you'll need to manually add latitude/longitude coordinates to properties to display them on the map)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-[600px]">
        <MapContainer
          center={center}
          zoom={12}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {propertiesWithCoords.map(property => (
            <Marker
              key={property.id}
              position={[property.latitude!, property.longitude!]}
              icon={defaultIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">{property.name}</h3>
                  <p className="text-sm text-gray-600">{property.neighborhood}</p>
                  <p className="text-sm text-gray-600">{property.address}</p>
                  {property.price && (
                    <p className="text-sm text-gray-700 mt-1">
                      ${property.price.toLocaleString()}/mo
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
