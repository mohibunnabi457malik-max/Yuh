import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getUserLocation, searchLocation } from '../lib/geolocation';
import type { LocationData } from '../types';

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  detectLocation: () => Promise<void>;
  setManualLocation: (location: LocationData) => void;
  searchLocations: (query: string) => Promise<LocationData[]>;
  permissionDenied: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = 'hire_one_location';
const LOCATION_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const detectingRef = useRef(false);
  const lastDetectTime = useRef<number>(0);

  // Load cached location on mount (non-blocking)
  useEffect(() => {
    const cachedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation);
        // Check if cache is still valid (10 minutes)
        if (parsed.timestamp && Date.now() - parsed.timestamp < LOCATION_CACHE_DURATION) {
          setLocation(parsed.data);
        }
      } catch {
        // Invalid cached data
      }
    }
  }, []);

  // Save location to cache when it changes
  useEffect(() => {
    if (location) {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({
        data: location,
        timestamp: Date.now(),
      }));
    }
  }, [location]);

  // Detect user's current location (non-blocking)
  const detectLocation = useCallback(async () => {
    // Prevent concurrent detection
    if (detectingRef.current) return;
    
    // Don't detect too frequently
    if (Date.now() - lastDetectTime.current < 5000) return;
    
    detectingRef.current = true;
    lastDetectTime.current = Date.now();
    
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    try {
      const locationData = await getUserLocation();
      
      if (locationData) {
        setLocation(locationData);
      } else {
        setError('Could not detect your location');
      }
    } catch (err: any) {
      if (err?.code === 1) {
        setPermissionDenied(true);
        setError('Location permission denied');
      } else {
        setError('Failed to get location');
      }
    } finally {
      setLoading(false);
      detectingRef.current = false;
    }
  }, []);

  // Set location manually (from search)
  const setManualLocation = useCallback((newLocation: LocationData) => {
    setLocation(newLocation);
    setError(null);
    setPermissionDenied(false);
  }, []);

  // Search for locations (debounced in component)
  const searchLocations = useCallback(async (query: string): Promise<LocationData[]> => {
    if (!query.trim()) return [];
    
    try {
      return await searchLocation(query);
    } catch {
      return [];
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        loading,
        error,
        detectLocation,
        setManualLocation,
        searchLocations,
        permissionDenied,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
