import { supabase } from './supabase';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  success: boolean;
  error?: string;
}

async function checkCache(address: string): Promise<GeocodeResult | null> {
  const { data, error } = await supabase
    .from('geocoding_cache')
    .select('latitude, longitude')
    .eq('address', address)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    success: true
  };
}

async function saveToCache(address: string, latitude: number, longitude: number): Promise<void> {
  await supabase
    .from('geocoding_cache')
    .insert({ address, latitude, longitude });
}

async function geocodeWithNominatim(address: string): Promise<GeocodeResult> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'HousingTrackerApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        success: false,
        error: 'Address not found. Please verify the address is correct.'
      };
    }

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    await saveToCache(address, latitude, longitude);

    return {
      latitude,
      longitude,
      success: true
    };
  } catch (error) {
    return {
      latitude: 0,
      longitude: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Geocoding failed'
    };
  }
}

let lastGeocodeTime = 0;
const RATE_LIMIT_MS = 1000;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastGeocode = now - lastGeocodeTime;

  if (timeSinceLastGeocode < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastGeocode;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  lastGeocodeTime = Date.now();
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!address || address.trim() === '') {
    return {
      latitude: 0,
      longitude: 0,
      success: false,
      error: 'Address is required'
    };
  }

  const normalizedAddress = address.trim().toLowerCase();

  const cached = await checkCache(normalizedAddress);
  if (cached) {
    return cached;
  }

  await enforceRateLimit();

  return geocodeWithNominatim(normalizedAddress);
}
