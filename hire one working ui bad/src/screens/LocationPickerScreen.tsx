import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crosshair, Search } from 'lucide-react';
import L from 'leaflet';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useLocation } from '../store/LocationContext';
import { buildReadableAddress, fetchNearbyReferences, reverseGeocode, searchLocation } from '../lib/geolocation';
import { supabase } from '../lib/supabase';
import type { LocationData, NearbyReference } from '../types';

const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export const LocationPickerScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();
  const { user } = useAuth();
  const { location, setManualLocation, detectLocation } = useLocation();

  const initialPoint = useMemo(() => ({
    lat: location?.lat || 31.5204,
    lng: location?.lng || 74.3587,
  }), [location?.lat, location?.lng]);

  const [point, setPoint] = useState(initialPoint);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [selected, setSelected] = useState<LocationData | null>(location || null);
  const [nearbyRefs, setNearbyRefs] = useState<NearbyReference[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapRootRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    setPoint(initialPoint);
  }, [initialPoint]);

  useEffect(() => {
    if (!mapRootRef.current || mapRef.current) return;

    const map = L.map(mapRootRef.current).setView([point.lat, point.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const marker = L.marker([point.lat, point.lng], { icon: pinIcon, draggable: true }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      setPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    marker.on('dragend', () => {
      const latLng = marker.getLatLng();
      setPoint({ lat: latLng.lat, lng: latLng.lng });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [point.lat, point.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;

    map.setView([point.lat, point.lng], map.getZoom(), { animate: true });
    marker.setLatLng([point.lat, point.lng]);
  }, [point.lat, point.lng]);

  const resolvePoint = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const raw = await reverseGeocode(lat, lng);
      const refs = await fetchNearbyReferences(lat, lng);
      const withReadable = buildReadableAddress(raw, refs);
      setNearbyRefs(refs);
      setSelected(withReadable);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resolvePoint(point.lat, point.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point.lat, point.lng]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    const items = await searchLocation(search.trim());
    setSearchResults(items);
  };

  const handleUseCurrent = async () => {
    await detectLocation();
    if (location) {
      setPoint({ lat: location.lat, lng: location.lng });
    }
  };

  const saveLocation = async () => {
    if (!selected) return;
    setManualLocation(selected);

    if (user) {
      await supabase
        .from('users')
        .update({
          location_lat: selected.lat,
          location_lng: selected.lng,
          location_city: selected.city,
          location_area: selected.area,
        })
        .eq('id', user.id);
    }

    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {language === 'ur' ? 'مقام منتخب کریں' : 'Pick Location'}
          </h1>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-4 p-4 md:grid-cols-[2fr_1fr]">
        <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${isFullscreen ? 'fixed inset-0 z-[70] rounded-none border-0' : ''}`}>
          <div className="relative">
            <div ref={mapRootRef} className={`${isFullscreen ? 'h-[100vh]' : 'h-[55vh]'} w-full`} />
            <div className="absolute right-3 top-3 z-[75] flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const map = mapRef.current;
                  if (!map) return;
                  map.zoomIn();
                }}
              >+
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const map = mapRef.current;
                  if (!map) return;
                  map.zoomOut();
                }}
              >-
              </Button>
              <Button size="sm" variant="outline" onClick={handleUseCurrent}>
                <Crosshair className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsFullscreen((v) => !v)}>
                {isFullscreen ? 'Exit' : 'Full'}
              </Button>
            </div>
          </div>
          <div className="p-3 text-sm text-gray-600">
            {language === 'ur'
              ? 'مقام منتخب کرنے کے لیے نقشے پر کلک کریں'
              : 'Tap/click on the map to pin exact location'}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={language === 'ur' ? 'مقام تلاش کریں' : 'Search location'}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" fullWidth onClick={handleUseCurrent}>
                <Crosshair className="mr-2 h-4 w-4" />
                {language === 'ur' ? 'میرا موجودہ مقام' : 'Use My GPS Location'}
              </Button>

              {!!searchResults.length && (
                <div className="max-h-40 space-y-2 overflow-auto">
                  {searchResults.map((item, idx) => (
                    <button
                      key={`${item.lat}-${item.lng}-${idx}`}
                      className="w-full rounded-lg border border-gray-200 p-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        setPoint({ lat: item.lat, lng: item.lng });
                        setSearchResults([]);
                      }}
                    >
                      {item.address || `${item.area}, ${item.city}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              {language === 'ur' ? 'پتہ' : 'Readable Address'}
            </h3>
            <p className="text-sm text-gray-700">{loading ? 'Loading...' : (selected?.address || '...')}</p>
            <p className="mt-1 text-xs text-gray-500">
              {selected ? `${selected.lat.toFixed(6)}, ${selected.lng.toFixed(6)}` : ''}
            </p>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">
              {language === 'ur' ? 'قریبی حوالہ جات' : 'Nearby References'}
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              {nearbyRefs.length ? nearbyRefs.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1.5">
                  <span>{ref.name}</span>
                  <span className="text-xs text-gray-500">{ref.distanceKm.toFixed(2)} km</span>
                </div>
              )) : (
                <p className="text-xs text-gray-500">
                  {language === 'ur' ? 'کوئی حوالہ دستیاب نہیں' : 'No nearby references found'}
                </p>
              )}
            </div>
          </Card>

          <Button fullWidth onClick={saveLocation} disabled={!selected || loading}>
            {language === 'ur' ? 'یہ مقام استعمال کریں' : 'Use This Location'}
          </Button>
        </div>
      </main>
    </div>
  );
};
