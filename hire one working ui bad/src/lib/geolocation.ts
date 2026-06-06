import type { LocationData, NearbyReference, NominatimResponse } from '../types';
import { calculateDistance } from './distance';

const FETCH_TIMEOUT_MS = 6000;

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        // User-Agent is forbidden in browsers. Keep headers lightweight.
        'Accept-Language': 'en',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
};

// Get current position using browser Geolocation API
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes cache
    });
  });
};

// Reverse geocode coordinates to address using Nominatim
export const reverseGeocode = async (lat: number, lng: number): Promise<LocationData> => {
  try {
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data: NominatimResponse = await response.json();
    const address = data.address;

    // Extract city (try multiple fields)
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.county ||
      address.state ||
      '';

    // Extract area/neighborhood
    const area =
      address.suburb ||
      address.neighbourhood ||
      address.road ||
      '';

    return {
      lat,
      lng,
      city,
      area,
      address: data.display_name || '',
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      lat,
      lng,
      city: '',
      area: '',
      address: '',
    };
  }
};

// Search for location by text using Nominatim
export const searchLocation = async (query: string): Promise<LocationData[]> => {
  try {
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
    );

    if (!response.ok) {
      throw new Error('Failed to search location');
    }

    const data: NominatimResponse[] = await response.json();

    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      city:
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.county ||
        '',
      area:
        item.address?.suburb ||
        item.address?.neighbourhood ||
        '',
      address: item.display_name || '',
    }));
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

// Get user's current location with reverse geocoding
export const getUserLocation = async (): Promise<LocationData | null> => {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    return await reverseGeocode(latitude, longitude);
  } catch (error) {
    console.error('Failed to get user location:', error);
    return null;
  }
};

const inferReferenceType = (tags: Record<string, string>): NearbyReference['type'] => {
  if (tags.amenity === 'place_of_worship') return 'mosque';
  if (tags.shop) return 'shop';
  if (tags.amenity === 'school') return 'school';
  if (tags.amenity === 'marketplace') return 'market';
  return 'place';
};

export const fetchNearbyReferences = async (
  lat: number,
  lng: number,
  radiusMeters: number = 1200
): Promise<NearbyReference[]> => {
  try {
    const overpassQuery = `[out:json][timeout:12];
(
  node(around:${radiusMeters},${lat},${lng})["amenity"="place_of_worship"];
  node(around:${radiusMeters},${lat},${lng})["shop"];
  node(around:${radiusMeters},${lat},${lng})["amenity"="school"];
  node(around:${radiusMeters},${lat},${lng})["amenity"="marketplace"];
);
out body 25;`;

    const response = await fetchWithTimeout(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`
    );

    if (!response.ok) return [];

    const payload = await response.json();
    const elements = Array.isArray(payload?.elements) ? payload.elements : [];

    const refs: NearbyReference[] = elements
      .filter((el: any) => el?.lat && el?.lon && el?.tags)
      .map((el: any, idx: number) => {
        const tags = el.tags || {};
        const name =
          tags.name ||
          tags['name:en'] ||
          (tags.amenity === 'place_of_worship' ? 'Mosque' :
            tags.amenity === 'school' ? 'School' :
            tags.amenity === 'marketplace' ? 'Market' :
            tags.shop ? 'Shop' : 'Nearby Place');
        const refLat = Number(el.lat);
        const refLng = Number(el.lon);
        return {
          id: String(el.id || idx),
          name,
          type: inferReferenceType(tags),
          lat: refLat,
          lng: refLng,
          distanceKm: calculateDistance(lat, lng, refLat, refLng),
        };
      })
      .sort((a: NearbyReference, b: NearbyReference) => a.distanceKm - b.distanceKm)
      .slice(0, 8);

    return refs;
  } catch {
    return [];
  }
};

export const buildReadableAddress = (raw: LocationData, refs: NearbyReference[]): LocationData => {
  if (!refs.length) return raw;
  const nearest = refs[0];
  const nearPrefix = `Near ${nearest.name}`;
  const currentAddress = raw.address?.trim();

  return {
    ...raw,
    reference: nearest.name,
    address: currentAddress ? `${nearPrefix}, ${currentAddress}` : nearPrefix,
  };
};
