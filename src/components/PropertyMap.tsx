import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { AlertCircle } from 'lucide-react';
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
  const propertiesWithoutCoords = properties.filter(p => !p.latitude || !p.longitude);

  if (propertiesWithCoords.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">
            No properties with location data yet. Properties will appear on the map once you add them with valid addresses.
          </p>
          {properties.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              You have {properties.length} property(ies), but they couldn't be located on the map. This may happen if the address couldn't be geocoded.
            </p>
          )}
        </div>
        {propertiesWithoutCoords.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Properties Not Mapped
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  The following {propertiesWithoutCoords.length} {propertiesWithoutCoords.length === 1 ? 'property' : 'properties'} could not be geocoded:
                </p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {propertiesWithoutCoords.map(p => (
                    <li key={p.id} className="flex items-start gap-2">
                      <span className="text-yellow-600 mt-0.5">•</span>
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-gray-600"> - {p.address}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  To fix this, try editing these properties with more specific addresses (include city, state, and zip code).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {propertiesWithoutCoords.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {propertiesWithoutCoords.length} {propertiesWithoutCoords.length === 1 ? 'Property' : 'Properties'} Not Shown on Map
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                The following {propertiesWithoutCoords.length === 1 ? 'property was' : 'properties were'} not geocoded successfully:
              </p>
              <ul className="space-y-1 text-sm text-gray-700">
                {propertiesWithoutCoords.map(p => (
                  <li key={p.id} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <div>
                      <span className="font-medium">{p.name}</span>
                      <span className="text-gray-600"> - {p.address}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-600 mt-3">
                Tip: Edit these properties with complete addresses (city, state, zip) for better geocoding results.
              </p>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
