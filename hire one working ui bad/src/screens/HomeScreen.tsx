import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, RefreshCw } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ProviderCard } from '../components/cards/ProviderCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProviderCardSkeleton, CategorySkeleton } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import { useLocation } from '../store/LocationContext';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { cache, CACHE_KEYS } from '../lib/cache';
import { calculateDistance, sortByDistance } from '../lib/distance';
import { t } from '../lib/translations';
import type { Provider } from '../types';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, categories, loadingCategories } = useApp();
  const { location, detectLocation, loading: locationLoading, permissionDenied } = useLocation();
  const { user } = useAuth();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Fetch providers with caching
  const fetchProviders = useCallback(async (forceRefresh = false) => {
    // Generate cache key based on location
    const cacheKey = location 
      ? CACHE_KEYS.providers(location.lat, location.lng)
      : 'providers:all';

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = cache.get<Provider[]>(cacheKey);
      if (cached) {
        setProviders(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('providers')
        .select('id, user_id, full_name, avatar_url, categories, location_lat, location_lng, location_area, location_city, service_range_km, is_available, is_active, is_featured, is_verified, rating, total_reviews, total_jobs')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      let providersWithDistance = (data || []) as Provider[];

      // Calculate distance if we have user location
      if (location && location.lat && location.lng) {
        providersWithDistance = providersWithDistance.map((p) => ({
          ...p,
          distance: calculateDistance(
            location.lat,
            location.lng,
            p.location_lat,
            p.location_lng
          ),
        }));

        // Filter providers within their service range
        providersWithDistance = providersWithDistance.filter((p) => {
          if (!p.distance) return true;
          return p.distance <= p.service_range_km;
        });
      }

      // Cache for 3 minutes
      cache.set(cacheKey, providersWithDistance, 3 * 60 * 1000);
      setProviders(providersWithDistance);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(t(language, 'errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [location, language]);

  // Fetch on mount and when location changes
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Auto-detect location (non-blocking)
  useEffect(() => {
    if (!location && !locationLoading && !permissionDenied) {
      // Delay slightly to not block initial render
      const timer = setTimeout(() => {
        detectLocation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location, locationLoading, permissionDenied, detectLocation]);

  // Memoized provider lists
  const nearbyProviders = useMemo(() => 
    sortByDistance(providers).slice(0, 6),
    [providers]
  );

  const topRatedProviders = useMemo(() => 
    [...providers].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [providers]
  );

  const availableProviders = useMemo(() => 
    providers.filter((p) => p.is_available).slice(0, 6),
    [providers]
  );

  const categoryUsage = useMemo(() => {
    const counts = new Map<string, number>();
    providers.forEach((p) => {
      (p.categories || []).forEach((id) => {
        counts.set(id, (counts.get(id) || 0) + 1);
      });
    });
    return counts;
  }, [providers]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const usedA = categoryUsage.get(a.id) || 0;
      const usedB = categoryUsage.get(b.id) || 0;
      if (usedA !== usedB) return usedB - usedA;
      return a.sort_order - b.sort_order;
    });
  }, [categories, categoryUsage]);

  const renderCategoryGrid = () => {
    if (loadingCategories) {
      return (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      );
    }

    const visible = showAllCategories ? sortedCategories : sortedCategories.slice(0, 8);

    return (
      <>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
        {visible.map((category) => (
          <button
            key={category.id}
            onClick={() => navigate(`/providers/${category.id}`)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.icon}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">
              {language === 'ur' ? category.name_ur : category.name_en}
            </span>
          </button>
        ))}
      </div>
      {sortedCategories.length > 8 && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setShowAllCategories((v) => !v)}>
            {showAllCategories ? 'Show Less' : 'View All'}
          </Button>
        </div>
      )}
      </>
    );
  };

  const renderProviderSection = (
    title: string,
    providersList: Provider[],
    viewAllPath?: string
  ) => {
    if (loading) {
      return (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        </section>
      );
    }

    if (providersList.length === 0) {
      return null;
    }

    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {viewAllPath && providersList.length >= 6 && (
            <button
              onClick={() => navigate(viewAllPath)}
              className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
            >
              {t(language, 'viewAll')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providersList.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              showDistance={!!location}
            />
          ))}
        </div>
      </section>
    );
  };

  const renderNearbyCarousel = () => {
    if (loading) {
      return (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">{t(language, 'nearYou')}</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[290px] flex-1">
                <ProviderCardSkeleton />
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (!nearbyProviders.length) return null;

    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t(language, 'nearYou')}</h2>
          <button
            onClick={() => navigate('/providers/all?sort=distance')}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            {t(language, 'viewAll')}
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {nearbyProviders.map((provider) => (
            <div key={provider.id} className="min-w-[310px] max-w-[310px]">
              <ProviderCard provider={provider} showDistance compact />
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderEmptyState = () => (
    <Card className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <MapPin className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t(language, 'noProviders')}
      </h3>
      <p className="text-gray-500 mb-4">
        {t(language, 'beFirstProvider')}
      </p>
      {user && user.role === 'customer' && (
        <Button onClick={() => navigate('/become-provider')}>
          {t(language, 'becomeProvider')}
        </Button>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <section className="mb-6">
          <p className="text-sm text-gray-500">
            {language === 'ur' ? 'خوش آمدید' : 'Welcome back'}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.full_name || (language === 'ur' ? 'ہائر ون' : 'Hire One')}
          </h1>
          {location ? (
            <p className="mt-1 text-sm text-gray-600">
              {language === 'ur' ? 'مقام:' : 'Location:'} {location.area || location.city}
            </p>
          ) : null}
        </section>

        {/* Location Warning */}
        {permissionDenied && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800">
                  {t(language, 'locationError')}. {t(language, 'searchLocation')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={detectLocation}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {t(language, 'retry')}
              </Button>
            </div>
          </Card>
        )}

        {/* Categories */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t(language, 'categories')}
          </h2>
          {renderCategoryGrid()}
        </section>

        {/* Error State */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <Button size="sm" variant="outline" onClick={() => fetchProviders(true)}>
                {t(language, 'retry')}
              </Button>
            </div>
          </Card>
        )}

        {/* Providers Sections */}
        {!loading && providers.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderNearbyCarousel()}

            {renderProviderSection(
              t(language, 'topRated'),
              topRatedProviders,
              '/providers/all?sort=rating'
            )}

            {renderProviderSection(
              t(language, 'availableNow'),
              availableProviders,
              '/providers/all?available=true'
            )}
          </>
        )}
      </main>
    </div>
  );
};
