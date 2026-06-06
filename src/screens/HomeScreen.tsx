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
  Briefcase,
  MessageCircle,
  Phone,
  CheckCircle2,
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

// ─── Inline Banner data (replaces mockData banners) ────────────────────────
const BANNERS = [
  {
    title: 'Find Trusted Pros Near You',
    subtitle: 'Verified workers, on-demand',
    color: 'from-blue-700 to-indigo-800',
  },
  {
    title: 'Emergency? We Got You',
    subtitle: '24/7 services available now',
    color: 'from-rose-600 to-red-700',
  },
  {
    title: 'Top Rated Providers',
    subtitle: 'Rated by your neighbours',
    color: 'from-emerald-600 to-teal-700',
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

  // ─── Banner auto-rotate ────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(
      () => setCurrentBanner((p) => (p + 1) % BANNERS.length),
      4000,
    );
    return () => clearInterval(timer);
  }, []);

  // ─── Fetch providers with caching ─────────────────────────────────────────
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
            'id, user_id, full_name, avatar_url, categories, location_lat, location_lng, location_area, location_city, service_range_km, is_available, is_active, is_featured, is_verified, rating, total_reviews, total_jobs',
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
              p.location_lng,
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
    [location, language],
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

  // ─── Memoized provider lists ───────────────────────────────────────────────
  const nearbyProviders = useMemo(() => sortByDistance(providers).slice(0, 6), [providers]);

  const topRatedProviders = useMemo(
    () => [...providers].sort((a, b) => b.rating - a.rating).slice(0, 6),
    [providers],
  );

  const availableProviders = useMemo(
    () => providers.filter((p) => p.is_available).slice(0, 6),
    [providers],
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

  // ─── Render helpers ────────────────────────────────────────────────────────

  const renderHeroHeader = () => (
    <div className="bg-gradient-to-br from-blue-800 to-indigo-900 px-4 pt-5 pb-6 rounded-b-3xl shadow-lg md:rounded-none md:px-8 md:pt-6">
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar initials */}
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {(user?.full_name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-blue-200 text-[10px]">
              {language === 'ur' ? 'خوش آمدید' : 'Hello'},{' '}
              {user?.full_name?.split(' ')[0] || 'Guest'} 👋
            </p>
            <button
              onClick={detectLocation}
              className="flex items-center gap-1 text-white"
            >
              <MapPin size={12} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">
                {location?.area || location?.city || (language === 'ur' ? 'مقام' : 'Location')}
              </span>
              <ChevronDown size={14} className="text-blue-300" />
            </button>
          </div>
        </div>

        <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative">
          <Bell size={20} className="text-white" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-indigo-900" />
        </button>
      </div>

      {/* Search bar */}
      <button
        onClick={() => navigate('/search')}
        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3 hover:bg-white/20 transition-colors"
      >
        <Search size={18} className="text-blue-200" />
        <span className="text-sm text-blue-200">
          {t(language, 'searchPlaceholder') || 'Search for services…'}
        </span>
      </button>
    </div>
  );

  const renderBanner = () => (
    <div className="px-4 mt-4 md:px-8">
      <div
        className={`bg-gradient-to-r ${BANNERS[currentBanner].color} rounded-2xl p-5 relative overflow-hidden shadow-md`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 right-10 w-20 h-20 bg-white/5 rounded-full translate-y-6" />
        <h3 className="text-white font-bold text-lg relative z-10">
          {BANNERS[currentBanner].title}
        </h3>
        <p className="text-white/70 text-sm mt-1 relative z-10">
          {BANNERS[currentBanner].subtitle}
        </p>
        <div className="flex gap-1.5 mt-3 relative z-10">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBanner(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderCategoryGrid = () => {
    if (loadingCategories) {
      return (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <CategorySkeleton key={i} />
          ))}
        </div>
      );
    }

    const visible = showAllCategories ? sortedCategories : sortedCategories.slice(0, 8);

    return (
      <>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {visible.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/providers/${category.id}`)}
              className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-sm border border-gray-50 hover:shadow-md hover:border-blue-200 transition-all active:scale-95"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon}
              </div>
              <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-2">
                {language === 'ur' ? category.name_ur : category.name_en}
              </span>
            </button>
          ))}
        </div>
        {sortedCategories.length > 8 && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => setShowAllCategories((v) => !v)}>
              {showAllCategories
                ? language === 'ur'
                  ? 'کم دکھائیں'
                  : 'Show Less'
                : language === 'ur'
                  ? 'سب دیکھیں'
                  : 'View All'}
            </Button>
          </div>
        )}
      </>
    );
  };

  // Inline mini provider card using production fields
  const renderInlineProviderCard = (provider: Provider, compact = false) => {
    const handleView = () => navigate(`/providers/profile/${provider.id}`);
    const handleBook = () => navigate(`/booking/${provider.id}`);
    const handleChat = () => navigate(`/chat/${provider.id}`);

    if (compact) {
      return (
        <div
          key={provider.id}
          onClick={handleView}
          className="bg-white rounded-2xl p-3 shadow-sm border border-gray-50 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow min-w-[260px]"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {provider.avatar_url ? (
              <img
                src={provider.avatar_url}
                alt={provider.full_name}
                className="w-11 h-11 rounded-xl object-cover"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-base">
                {(provider.full_name || '?')[0].toUpperCase()}
              </div>
            )}
            {provider.is_available && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-800 truncate">{provider.full_name}</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] text-gray-500">
                {provider.rating?.toFixed(1)} ({provider.total_reviews})
              </span>
            </div>
            {location && provider.distance != null && (
              <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                <MapPin size={10} />
                <span className="text-[10px]">{provider.distance.toFixed(1)} km</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        key={provider.id}
        className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden hover:shadow-md transition-all duration-200"
      >
        <div className="p-4">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {provider.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={provider.full_name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xl">
                  {(provider.full_name || '?')[0].toUpperCase()}
                </div>
              )}
              {provider.is_available && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-800 text-sm">{provider.full_name}</h3>
                    {provider.is_verified && (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[11px] text-gray-500">
                      {provider.rating?.toFixed(1)} · {provider.total_reviews} reviews
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    provider.is_available
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {provider.is_available
                    ? language === 'ur'
                      ? '● دستیاب'
                      : '● Available'
                    : language === 'ur'
                      ? '● مصروف'
                      : '● Busy'}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-gray-500">
                  <Briefcase size={11} />
                  <span className="text-[11px]">{provider.total_jobs} jobs</span>
                </div>
                {location && provider.distance != null && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin size={11} />
                    <span className="text-[11px]">{provider.distance.toFixed(1)} km</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-500">
                  <MapPin size={11} />
                  <span className="text-[11px]">
                    {provider.location_area || provider.location_city}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex border-t border-gray-100">
          <button
            onClick={handleView}
            className="flex-1 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
          >
            {t(language, 'viewProfile') || 'View Profile'}
          </button>
          <div className="w-px bg-gray-100" />
          <button
            onClick={handleChat}
            className="flex items-center justify-center gap-1 flex-1 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle size={13} />
            {t(language, 'chat') || 'Chat'}
          </button>
          <div className="w-px bg-gray-100" />
          <button className="flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <Phone size={13} />
          </button>
          <div className="w-px bg-gray-100" />
          <button
            onClick={handleBook}
            className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 transition-colors"
          >
            {t(language, 'bookNow') || 'Book Now'}
          </button>
        </div>
      </div>
    );
  };

  const renderNearbyCarousel = () => {
    if (loading) {
      return (
        <section className="px-4 md:px-8 mt-6">
          <h2 className="mb-3 text-base font-bold text-gray-800">
            {t(language, 'nearYou')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[260px]">
                <ProviderCardSkeleton />
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (!nearbyProviders.length) return null;

    return (
      <section className="px-4 md:px-8 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-blue-700" />
            <h2 className="text-base font-bold text-gray-800">{t(language, 'nearYou')}</h2>
          </div>
          <button
            onClick={() => navigate('/providers/all?sort=distance')}
            className="text-xs text-blue-700 font-semibold flex items-center gap-0.5 hover:underline"
          >
            {t(language, 'viewAll')} <ChevronRight size={14} />
          </button>
        </div>

        {/* Mobile: horizontal scroll / Desktop: grid */}
        <div className="md:hidden flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {nearbyProviders.map((p) => renderInlineProviderCard(p, true))}
        </div>
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyProviders.map((p) => (
            <ProviderCard key={p.id} provider={p} showDistance={!!location} />
          ))}
        </div>
      </section>
    );
  };

  const renderTopRated = () => {
    if (loading) {
      return (
        <section className="px-4 md:px-8 mt-6">
          <h2 className="mb-3 text-base font-bold text-gray-800">{t(language, 'topRated')}</h2>
          <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
            {[...Array(3)].map((_, i) => <ProviderCardSkeleton key={i} />)}
          </div>
        </section>
      );
    }

    if (!topRatedProviders.length) return null;

    return (
      <section className="px-4 md:px-8 mt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <h2 className="text-base font-bold text-gray-800">{t(language, 'topRated')}</h2>
          </div>
          <button
            onClick={() => navigate('/providers/all?sort=rating')}
            className="text-xs text-blue-700 font-semibold flex items-center gap-0.5 hover:underline"
          >
            {t(language, 'viewAll')} <ChevronRight size={14} />
          </button>
        </div>
        {/* Mobile: stacked cards / Desktop: grid */}
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {topRatedProviders.map((p) => renderInlineProviderCard(p))}
        </div>
      </section>
    );
  };

  const renderAvailableNow = () => {
    if (loading || !availableProviders.length) return null;

    return (
      <section className="px-4 md:px-8 mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <h2 className="text-base font-bold text-gray-800">
              {t(language, 'availableNow')}
            </h2>
          </div>
          <button
            onClick={() => navigate('/providers/all?available=true')}
            className="text-xs text-blue-700 font-semibold flex items-center gap-0.5 hover:underline"
          >
            {t(language, 'viewAll')} <ChevronRight size={14} />
          </button>
        </div>
        <div className="md:hidden flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {availableProviders.map((p) => renderInlineProviderCard(p, true))}
        </div>
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableProviders.map((p) => (
            <ProviderCard key={p.id} provider={p} showDistance={!!location} />
          ))}
        </div>
      </section>
    );
  };

  const renderEmptyState = () => (
    <div className="px-4 md:px-8 mt-8">
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

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Desktop top nav (hidden on mobile, the hero header serves as nav on mobile) */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile hero header (hidden on desktop) */}
      <div className="md:hidden">
        {renderHeroHeader()}
      </div>

      {/* Desktop hero banner strip */}
      <div className="hidden md:block bg-gradient-to-br from-blue-800 to-indigo-900 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm">
              {language === 'ur' ? 'خوش آمدید' : 'Welcome back'},{' '}
              {user?.full_name?.split(' ')[0] || 'there'} 👋
            </p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              {language === 'ur' ? 'ہائر ون' : 'Hire One'}
            </h1>
            {location && (
              <p className="text-blue-300 text-sm mt-1 flex items-center gap-1">
                <MapPin size={13} className="fill-yellow-400 text-yellow-400" />
                {location.area || location.city}
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/search')}
            className="bg-white/10 border border-white/20 rounded-xl px-5 py-3 flex items-center gap-3 hover:bg-white/20 transition-colors w-72"
          >
            <Search size={18} className="text-blue-200" />
            <span className="text-sm text-blue-200">
              {t(language, 'searchPlaceholder') || 'Search for services…'}
            </span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto">
        {/* Promo Banner */}
        {renderBanner()}

        {/* Location Warning */}
        {permissionDenied && (
          <div className="px-4 md:px-8 mt-4">
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800">
                    {t(language, 'locationError')}. {t(language, 'searchLocation')}
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

        {/* Error State */}
        {error && (
          <div className="px-4 md:px-8 mt-4">
            <Card className="bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-800">{error}</p>
                <Button size="sm" variant="outline" onClick={() => fetchProviders(true)}>
                  {t(language, 'retry')}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Categories */}
        <section className="px-4 md:px-8 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">
              {t(language, 'categories') || 'All Services'}
            </h2>
            {sortedCategories.length > 8 && !showAllCategories && (
              <button
                onClick={() => navigate('/categories')}
                className="text-xs text-blue-700 font-semibold flex items-center gap-0.5"
              >
                {t(language, 'viewAll') || 'View All'} <ChevronRight size={14} />
              </button>
            )}
          </div>
          {renderCategoryGrid()}
        </section>

        {/* Provider Sections */}
        {!loading && providers.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {renderNearbyCarousel()}
            {renderAvailableNow()}
            {renderTopRated()}
          </>
        )}
      </main>
    </div>
  );
};
