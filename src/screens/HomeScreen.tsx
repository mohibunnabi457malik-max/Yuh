import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  MapPin,
  RefreshCw,
  Search,
  Bell,
  AlertTriangle,
  Star,
  ChevronDown,
} from 'lucide-react';
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

// Rotating promotional banners (visual-only; no mockData import)
const BANNERS = [
  {
    title: 'Emergency Services 24/7',
    subtitle: 'Electrician & Plumber on call',
    color: 'from-red-500 to-rose-600',
  },
  {
    title: 'Top Rated Professionals',
    subtitle: 'Verified experts at your doorstep',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    title: 'Book in Seconds',
    subtitle: 'Trusted services, instant booking',
    color: 'from-emerald-500 to-teal-600',
  },
];

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, categories, loadingCategories } = useApp();
  const { location, detectLocation, loading: locationLoading, permissionDenied } = useLocation();
  const { user } = useAuth();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Rotate banner
  useEffect(() => {
    const timer = setInterval(
      () => setCurrentBanner((p) => (p + 1) % BANNERS.length),
      4000
    );
    return () => clearInterval(timer);
  }, []);

  // Fetch providers with caching
  const fetchProviders = useCallback(
    async (forceRefresh = false) => {
      const cacheKey = location
        ? CACHE_KEYS.providers(location.lat, location.lng)
        : 'providers:all';

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
          .select(
            'id, user_id, full_name, avatar_url, categories, location_lat, location_lng, location_area, location_city, service_range_km, is_available, is_active, is_featured, is_verified, rating, total_reviews, total_jobs'
          )
          .eq('is_active', true)
          .order('is_featured', { ascending: false })
          .order('rating', { ascending: false })
          .limit(50);

        if (fetchError) throw fetchError;

        let providersWithDistance = (data || []) as Provider[];

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

          providersWithDistance = providersWithDistance.filter((p) => {
            if (!p.distance) return true;
            return p.distance <= p.service_range_km;
          });
        }

        cache.set(cacheKey, providersWithDistance, 3 * 60 * 1000);
        setProviders(providersWithDistance);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError(t(language, 'errorLoadingData'));
      } finally {
        setLoading(false);
      }
    },
    [location, language]
  );

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    if (!location && !locationLoading && !permissionDenied) {
      const timer = setTimeout(() => {
        detectLocation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location, locationLoading, permissionDenied, detectLocation]);

  const nearbyProviders = useMemo(
    () => sortByDistance(providers).slice(0, 6),
    [providers]
  );

  const topRatedProviders = useMemo(
    () => [...providers].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [providers]
  );

  const availableProviders = useMemo(
    () => providers.filter((p) => p.is_available).slice(0, 6),
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

  // Emergency categories — production schema may include flag; fall back gracefully.
  const emergencyCategories = useMemo(() => {
    return sortedCategories
      .filter((c: any) => c.is_emergency || c.isEmergency)
      .slice(0, 6);
  }, [sortedCategories]);

  const userDisplayName =
    user?.full_name || (language === 'ur' ? 'مہمان' : 'Guest');
  const initials = userDisplayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderCategoryGrid = () => {
    if (loadingCategories) {
      return (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 md:gap-4">
          {[...Array(8)].map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      );
    }

    const visible = showAllCategories
      ? sortedCategories
      : sortedCategories.slice(0, 8);

    return (
      <>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 md:gap-4">
          {visible.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/providers/${category.id}`)}
              className="bg-white rounded-2xl p-3 md:p-4 flex flex-col items-center gap-1.5 md:gap-2 shadow-sm border border-gray-50 hover:shadow-md hover:border-blue-200 transition-all active:scale-95"
            >
              <div
                className="w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon}
              </div>
              <span className="text-[10px] md:text-xs font-semibold text-gray-600 text-center leading-tight line-clamp-2">
                {language === 'ur' ? category.name_ur : category.name_en}
              </span>
            </button>
          ))}
        </div>
        {sortedCategories.length > 8 && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllCategories((v) => !v)}
            >
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
    viewAllPath?: string,
    icon?: React.ReactNode
  ) => {
    if (loading) {
      return (
        <section className="px-4 mt-6 md:px-0 md:mt-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-base md:text-lg font-bold text-gray-800">
                {title}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {[...Array(3)].map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        </section>
      );
    }

    if (providersList.length === 0) return null;

    return (
      <section className="px-4 mt-6 md:px-0 md:mt-8">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-base md:text-lg font-bold text-gray-800">
              {title}
            </h2>
          </div>
          {viewAllPath && providersList.length >= 6 && (
            <button
              onClick={() => navigate(viewAllPath)}
              className="text-xs md:text-sm text-blue-700 font-semibold flex items-center gap-0.5 hover:underline"
            >
              {t(language, 'viewAll')}
              <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
        <section className="px-4 mt-6 md:px-0 md:mt-8">
          <h2 className="mb-3 md:mb-4 text-base md:text-lg font-bold text-gray-800">
            {t(language, 'nearYou')}
          </h2>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[270px] md:min-w-0 flex-1">
                <ProviderCardSkeleton />
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (!nearbyProviders.length) return null;

    return (
      <section className="px-4 mt-6 md:px-0 md:mt-8">
        <div className="mb-3 md:mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-700" />
            <h2 className="text-base md:text-lg font-bold text-gray-800">
              {t(language, 'nearYou')}
            </h2>
          </div>
          <button
            onClick={() => navigate('/providers/all?sort=distance')}
            className="text-xs md:text-sm font-semibold text-blue-700 flex items-center gap-0.5 hover:underline"
          >
            {t(language, 'viewAll')}
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </button>
        </div>
        {/* Mobile: horizontal carousel | Desktop: grid */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar md:hidden">
          {nearbyProviders.map((provider) => (
            <div key={provider.id} className="min-w-[280px] max-w-[280px]">
              <ProviderCard provider={provider} showDistance compact />
            </div>
          ))}
        </div>
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              showDistance
            />
          ))}
        </div>
      </section>
    );
  };

  const renderEmergencySection = () => {
    if (emergencyCategories.length === 0) return null;
    return (
      <section className="px-4 mt-6 md:px-0 md:mt-8">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
          <h2 className="text-base md:text-lg font-bold text-gray-800">
            {language === 'ur' ? 'ہنگامی خدمات' : 'Emergency Services'}
          </h2>
          <span className="text-[10px] md:text-xs bg-red-50 text-red-500 font-bold px-2 py-0.5 rounded-full">
            24/7
          </span>
        </div>
        <div className="flex gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1 md:flex-wrap md:overflow-visible">
          {emergencyCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate(`/providers/${cat.id}`)}
              className="flex-shrink-0 bg-white rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm border border-gray-50 hover:border-red-200 hover:bg-red-50 transition-all"
            >
              <span className="text-xl md:text-2xl">{cat.icon}</span>
              <div className="text-left">
                <p className="text-xs md:text-sm font-semibold text-gray-700">
                  {language === 'ur' ? cat.name_ur : cat.name_en}
                </p>
                <p className="text-[9px] md:text-[10px] text-gray-400">
                  {language === 'ur' ? 'ابھی دستیاب' : 'Available now'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    );
  };

  const renderEmptyState = () => (
    <div className="px-4 md:px-0 mt-6">
      <Card className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t(language, 'noProviders')}
        </h3>
        <p className="text-gray-500 mb-4">{t(language, 'beFirstProvider')}</p>
        {user && user.role === 'customer' && (
          <Button onClick={() => navigate('/become-provider')}>
            {t(language, 'becomeProvider')}
          </Button>
        )}
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Desktop header (preserved) */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile catchy hero header */}
      <div className="md:hidden bg-gradient-to-br from-blue-800 to-indigo-900 px-4 pt-5 pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 text-white font-bold flex items-center justify-center border border-white/20">
              {initials || 'U'}
            </div>
            <div>
              <p className="text-blue-200 text-[11px]">
                {language === 'ur'
                  ? `ہیلو، ${userDisplayName} 👋`
                  : `Hello, ${userDisplayName} 👋`}
              </p>
              <button
                onClick={detectLocation}
                className="flex items-center gap-1 text-white"
              >
                <MapPin size={12} className="text-amber-300" />
                <span className="text-sm font-semibold">
                  {location?.area || location?.city ||
                    (language === 'ur' ? 'مقام منتخب کریں' : 'Set location')}
                </span>
                <ChevronDown size={14} className="text-blue-300" />
              </button>
            </div>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative"
          >
            <Bell size={20} className="text-white" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-800" />
          </button>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <Search size={18} className="text-blue-200" />
          <span className="text-sm text-blue-200">
            {language === 'ur'
              ? 'خدمات تلاش کریں...'
              : 'Search for services...'}
          </span>
        </button>
      </div>

      <main className="max-w-7xl mx-auto md:px-4 md:py-6">
        {/* Desktop welcome */}
        <section className="hidden md:block mb-6 px-4 md:px-0">
          <p className="text-sm text-gray-500">
            {language === 'ur' ? 'خوش آمدید' : 'Welcome back'}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.full_name || (language === 'ur' ? 'ہائر ون' : 'Hire One')}
          </h1>
          {location ? (
            <p className="mt-1 text-sm text-gray-600 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {location.area || location.city}
            </p>
          ) : null}
        </section>

        {/* Promo Banner */}
        <div className="px-4 mt-4 md:px-0 md:mt-0 md:mb-6">
          <div
            className={`bg-gradient-to-r ${BANNERS[currentBanner].color} rounded-2xl p-5 md:p-8 relative overflow-hidden shadow-md`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 right-10 w-20 h-20 md:w-32 md:h-32 bg-white/5 rounded-full translate-y-6" />
            <h3 className="text-white font-bold text-lg md:text-2xl z-10 relative">
              {BANNERS[currentBanner].title}
            </h3>
            <p className="text-white/80 text-sm md:text-base mt-1 z-10 relative">
              {BANNERS[currentBanner].subtitle}
            </p>
            <div className="flex gap-1.5 mt-3 z-10 relative">
              {BANNERS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Location Warning */}
        {permissionDenied && (
          <div className="px-4 md:px-0 mt-4">
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    {t(language, 'locationError')}.{' '}
                    {t(language, 'searchLocation')}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={detectLocation}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t(language, 'retry')}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Categories */}
        <section className="px-4 mt-6 md:px-0 md:mt-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-bold text-gray-800">
              {t(language, 'categories')}
            </h2>
            <button
              onClick={() => navigate('/categories')}
              className="text-xs md:text-sm text-blue-700 font-semibold flex items-center gap-0.5 hover:underline"
            >
              {t(language, 'viewAll')}
              <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>
          {renderCategoryGrid()}
        </section>

        {/* Emergency Services */}
        {renderEmergencySection()}

        {/* Error State */}
        {error && (
          <div className="px-4 md:px-0 mt-4">
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-800">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fetchProviders(true)}
                >
                  {t(language, 'retry')}
                </Button>
              </div>
            </Card>
          </div>
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
              '/providers/all?sort=rating',
              <Star className="w-4 h-4 md:w-5 md:h-5 text-amber-400 fill-amber-400" />
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
