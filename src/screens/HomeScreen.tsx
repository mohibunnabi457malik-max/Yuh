import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, MapPin, RefreshCw, Search, Bell,
  AlertTriangle, Star, ChevronDown, Briefcase,
  MessageCircle, Phone, CheckCircle2,
} from 'lucide-react';
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

// ─── Banners ──────────────────────────────────────────────────────────────────
const BANNERS = [
  { title: 'Emergency Services 24/7', subtitle: 'Electrician & Plumber on call', color: 'from-red-500 to-rose-600' },
  { title: 'Find Trusted Pros Near You', subtitle: 'Verified workers, on-demand', color: 'from-blue-600 to-indigo-700' },
  { title: 'Top Rated Providers', subtitle: 'Rated by your neighbours', color: 'from-emerald-500 to-teal-600' },
];

// ─── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-orange-500', 'bg-green-600', 'bg-blue-700',
  'bg-purple-600', 'bg-teal-600', 'bg-rose-500', 'bg-amber-500',
];
function getAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// ─── Inline Avatar (only used inside HomeScreen inline cards) ─────────────────
function Av({ name, url, online, verified, size = 'md' }: {
  name: string; url?: string | null;
  online?: boolean; verified?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-14 h-14 text-base' }[size];
  return (
    <div className="relative flex-shrink-0">
      {url
        ? <img src={url} alt={name} className={`${dim} rounded-full object-cover`} />
        : <div className={`${dim} ${getAvatarColor(name)} rounded-full flex items-center justify-center font-bold text-white select-none`}>{getInitials(name)}</div>
      }
      {online   && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />}
      {verified && (
        <span className="absolute -bottom-1 -right-0.5 w-[14px] h-[14px] bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
          <CheckCircle2 size={7} className="text-white" />
        </span>
      )}
    </div>
  );
}

// ─── Star row ─────────────────────────────────────────────────────────────────
function StarRow({ rating, reviews }: { rating: number; reviews: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-px">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={11}
            className={i <= full ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'} />
        ))}
      </div>
      <span className="text-[11px] text-gray-500">{rating?.toFixed(1)} ({reviews})</span>
    </div>
  );
}

// ─── Full provider card matching screenshot exactly ────────────────────────────
// NOTE: used on mobile only. Desktop uses the existing <ProviderCard /> component.
function FullProviderCard({ p, showDist }: { p: Provider; showDist: boolean }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleView  = () => navigate(`/provider/${p.id}`);
  const handleChat  = () => {
    if (!user) { navigate('/login'); return; }
    const ids = [user.id, p.user_id].sort();
    navigate(`/chat/${ids[0]}_${ids[1]}?providerId=${p.id}`);
  };
  const handleCall  = () => { if (p.phone) window.location.href = `tel:${p.phone}`; };
  const handleBook  = () => navigate(`/book/${p.id}`);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Av name={p.full_name} url={p.avatar_url} online={p.is_available} verified={p.is_verified} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[15px] text-gray-900 truncate">{p.full_name}</span>
                  {p.is_verified && <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />}
                </div>
                <div className="mt-0.5">
                  <StarRow rating={p.rating} reviews={p.total_reviews} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <span className="flex items-center gap-1 text-[12px] text-gray-500">
                <Briefcase size={12} className="text-gray-400" /> {p.total_jobs} jobs
              </span>
              {showDist && p.distance != null && (
                <span className="flex items-center gap-1 text-[12px] text-gray-500">
                  <MapPin size={12} className="text-gray-400" /> {p.distance.toFixed(1)} km
                </span>
              )}
              <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                p.is_available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${p.is_available ? 'bg-green-500' : 'bg-gray-400'}`} />
                {p.is_available ? 'Available' : 'Busy'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Action bar */}
      <div className="flex border-t border-gray-100 divide-x divide-gray-100">
        <button onClick={handleView}
          className="flex-1 py-3 text-[13px] font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
          View Profile
        </button>
        <button onClick={handleChat}
          className="flex-1 py-3 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
          <MessageCircle size={14} /> Chat
        </button>
        <button onClick={handleCall}
          className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center">
          <Phone size={14} />
        </button>
        <button onClick={handleBook}
          className="flex-1 py-3 text-[13px] font-bold text-white bg-[#1a3a6b] hover:bg-[#15305a] transition-colors">
          Book Now
        </button>
      </div>
    </div>
  );
}

// ─── Compact card for Nearby horizontal scroll ────────────────────────────────
function NearbyCard({ p, showDist }: { p: Provider; showDist: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/provider/${p.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 text-left flex-shrink-0 w-[200px] hover:shadow-md transition-shadow"
    >
      <Av name={p.full_name} url={p.avatar_url} online={p.is_available} verified={p.is_verified} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-gray-900 truncate">{p.full_name}</p>
        <div className="mt-0.5"><StarRow rating={p.rating} reviews={p.total_reviews} /></div>
        {showDist && p.distance != null && (
          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-0.5">
            <MapPin size={9} /> {p.distance.toFixed(1)} km away
          </p>
        )}
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, categories, loadingCategories } = useApp();
  const { location, detectLocation, loading: locationLoading, permissionDenied } = useLocation();
  const { user } = useAuth();

  const [providers, setProviders]     = useState<Provider[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [currentBanner, setCurrentBanner]         = useState(0);

  // Banner rotation
  useEffect(() => {
    const id = setInterval(() => setCurrentBanner(p => (p + 1) % BANNERS.length), 4000);
    return () => clearInterval(id);
  }, []);

  // ── Fetch providers — original production logic, untouched ─────────────────
  const fetchProviders = useCallback(async (forceRefresh = false) => {
    const cacheKey = location
      ? CACHE_KEYS.providers(location.lat, location.lng)
      : 'providers:all';

    if (!forceRefresh) {
      const cached = cache.get<Provider[]>(cacheKey);
      if (cached) { setProviders(cached); setLoading(false); return; }
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('providers')
        .select('id, user_id, full_name, avatar_url, categories, location_lat, location_lng, location_area, location_city, service_range_km, is_available, is_active, is_featured, is_verified, rating, total_reviews, total_jobs')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating',      { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      let list = (data || []) as Provider[];

      if (location && location.lat && location.lng) {
        list = list.map(p => ({
          ...p,
          distance: calculateDistance(location.lat, location.lng, p.location_lat, p.location_lng),
        })).filter(p => !p.distance || p.distance <= p.service_range_km);
      }

      cache.set(cacheKey, list, 3 * 60 * 1000);
      setProviders(list);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(t(language, 'errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [location, language]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  useEffect(() => {
    if (!location && !locationLoading && !permissionDenied) {
      const timer = setTimeout(() => detectLocation(), 500);
      return () => clearTimeout(timer);
    }
  }, [location, locationLoading, permissionDenied, detectLocation]);

  // ── Memoised lists — original production logic, untouched ─────────────────
  const nearbyProviders = useMemo(() => sortByDistance(providers).slice(0, 6), [providers]);
  const topRatedProviders = useMemo(() => [...providers].sort((a, b) => b.rating - a.rating).slice(0, 6), [providers]);
  const availableProviders = useMemo(() => providers.filter(p => p.is_available).slice(0, 6), [providers]);

  const categoryUsage = useMemo(() => {
    const counts = new Map<string, number>();
    providers.forEach(p => (p.categories || []).forEach(id => counts.set(id, (counts.get(id) || 0) + 1)));
    return counts;
  }, [providers]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const diff = (categoryUsage.get(b.id) || 0) - (categoryUsage.get(a.id) || 0);
      return diff !== 0 ? diff : a.sort_order - b.sort_order;
    });
  }, [categories, categoryUsage]);

  // Use top-3 most-used categories as "emergency" since Category has no is_emergency field
  const emergencyCategories = useMemo(() => sortedCategories.slice(0, 3), [sortedCategories]);

  const visibleCategories = showAllCategories ? sortedCategories : sortedCategories.slice(0, 8);
  const showDist = !!location;

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTE: No <Header /> here — App.tsx wraps HomeScreen in <MainLayout>
  //       which already renders <Header /> and <BottomNav />.
  //       Adding them again would duplicate the nav bars.
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    /*
     * overflow-x-hidden stops any child from causing page-level horizontal scroll.
     * The page only ever scrolls vertically.
     * Horizontal carousels use overflow-x-auto on their OWN wrapper div,
     * so they scroll internally without affecting the page.
     */
    <div className="w-full overflow-x-hidden bg-gray-50 min-h-screen">

      {/* ── Mobile hero header (hidden on md+, where the desktop Header is shown) ── */}
      <div className="md:hidden bg-[#1b2d5b] w-full">
        {/* Row 1 */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full ${getAvatarColor(user?.full_name || 'AR')} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
              {getInitials(user?.full_name || 'AR')}
            </div>
            <div className="min-w-0">
              <p className="text-gray-300 text-[11px] leading-none">
                Hello, {user?.full_name?.split(' ')[0] || 'there'} 👋
              </p>
              <button onClick={detectLocation} className="flex items-center gap-1 mt-0.5 max-w-full">
                <MapPin size={11} className="fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <span className="text-white text-[13px] font-semibold truncate">
                  {location?.area || location?.city || 'Set location'}
                </span>
                <ChevronDown size={12} className="text-gray-400 flex-shrink-0 ml-0.5" />
              </button>
            </div>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative flex-shrink-0"
          >
            <Bell size={20} className="text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
        {/* Search bar */}
        <button
          onClick={() => navigate('/search')}
          className="mx-4 mb-4 flex items-center gap-3 bg-[#24396e] border border-white/10 rounded-xl px-4 py-3 w-[calc(100%-2rem)]"
        >
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-[13px] text-gray-400">{t(language, 'searchPlaceholder') || 'Search for services...'}</span>
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="w-full max-w-7xl mx-auto">

        {/* ── Banner ── */}
        <div className="px-4 mt-3 md:mt-5 md:px-6">
          <div className={`bg-gradient-to-r ${BANNERS[currentBanner].color} rounded-2xl px-5 py-5 relative overflow-hidden shadow-sm w-full`}>
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-10 translate-x-10 pointer-events-none" />
            <div className="absolute bottom-0 right-8 w-16 h-16 bg-white/10 rounded-full translate-y-6 pointer-events-none" />
            <p className="text-white font-bold text-[17px] relative z-10">{BANNERS[currentBanner].title}</p>
            <p className="text-white/80 text-[13px] mt-1 relative z-10">{BANNERS[currentBanner].subtitle}</p>
            <div className="flex gap-1.5 mt-3 relative z-10">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setCurrentBanner(i)}
                  className={`h-1.5 rounded-full transition-all ${i === currentBanner ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Location alert ── */}
        {permissionDenied && (
          <div className="px-4 mt-3 md:px-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-3">
              <MapPin size={14} className="text-yellow-600 flex-shrink-0" />
              <p className="text-[12px] text-yellow-800 flex-1 min-w-0">
                {t(language, 'locationError')}. {t(language, 'searchLocation')}
              </p>
              <button onClick={detectLocation}
                className="text-[11px] font-semibold text-yellow-700 flex items-center gap-1 flex-shrink-0 whitespace-nowrap">
                <RefreshCw size={11} /> {t(language, 'retry')}
              </button>
            </div>
          </div>
        )}

        {/* ── Error alert ── */}
        {error && (
          <div className="px-4 mt-3 md:px-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3">
              <p className="text-[12px] text-red-800 flex-1 min-w-0">{error}</p>
              <button onClick={() => fetchProviders(true)}
                className="text-[11px] font-semibold text-red-700 flex items-center gap-1 flex-shrink-0">
                <RefreshCw size={11} /> {t(language, 'retry')}
              </button>
            </div>
          </div>
        )}

        {/* ── All Services ── */}
        <section className="px-4 mt-5 md:px-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-gray-900">
              {t(language, 'categories') || 'All Services'}
            </h2>
            <button
              onClick={() => setShowAllCategories(v => !v)}
              className="text-[13px] text-blue-700 font-semibold flex items-center gap-0.5"
            >
              {showAllCategories ? 'Show Less' : 'View All'} <ChevronRight size={14} />
            </button>
          </div>

          {loadingCategories ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {[...Array(8)].map((_, i) => <CategorySkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {visibleCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/providers/${cat.id}`)}
                  className="bg-white rounded-2xl py-3 px-1 flex flex-col items-center gap-1.5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all active:scale-95 w-full"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: cat.color ? `${cat.color}18` : '#f0f4ff' }}
                  >
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-2 w-full px-0.5">
                    {language === 'ur' ? cat.name_ur : cat.name_en}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Emergency Services ── */}
        {emergencyCategories.length > 0 && (
          <section className="mt-5 w-full">
            <div className="flex items-center gap-2 mb-3 px-4 md:px-6">
              <AlertTriangle size={15} className="text-red-500" />
              <h2 className="text-[15px] font-bold text-gray-900">Emergency Services</h2>
              <span className="text-[10px] bg-red-50 text-red-500 font-bold px-2 py-0.5 rounded-full border border-red-100">
                24/7
              </span>
            </div>
            {/*
              Carousel: overflow-x-auto on THIS div only.
              The page itself never scrolls horizontally.
            */}
            <div
              className="flex gap-2 overflow-x-auto px-4 md:px-6 pb-1 hide-scrollbar"
            >
              {emergencyCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/providers/${cat.id}`)}
                  className="flex-shrink-0 bg-white rounded-2xl px-4 py-3 flex items-center gap-2.5 shadow-sm border border-gray-100 hover:border-red-200 hover:bg-red-50 transition-all"
                  style={{ minWidth: '130px' }}
                >
                  <span className="text-xl leading-none">{cat.icon}</span>
                  <div className="text-left">
                    <p className="text-[12px] font-semibold text-gray-800 whitespace-nowrap">
                      {language === 'ur' ? cat.name_ur : cat.name_en}
                    </p>
                    <p className="text-[10px] text-gray-400">Available now</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {!loading && providers.length === 0 && (
          <div className="px-4 mt-8 md:px-6">
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{t(language, 'noProviders')}</h3>
              <p className="text-gray-500 text-sm mb-4">{t(language, 'beFirstProvider')}</p>
              {user?.role === 'customer' && (
                <Button onClick={() => navigate('/become-provider')}>{t(language, 'becomeProvider')}</Button>
              )}
            </Card>
          </div>
        )}

        {/* ── Nearby Providers ── */}
        {(loading || nearbyProviders.length > 0) && (
          <section className="mt-5 w-full">
            <div className="flex items-center justify-between mb-3 px-4 md:px-6">
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-blue-700" />
                <h2 className="text-[15px] font-bold text-gray-900">{t(language, 'nearYou') || 'Nearby Providers'}</h2>
              </div>
              <button
                onClick={() => navigate('/providers/all?sort=distance')}
                className="text-[13px] text-blue-700 font-semibold flex items-center gap-0.5"
              >
                {t(language, 'viewAll') || 'See All'} <ChevronRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="flex gap-3 overflow-x-auto px-4 md:px-6 pb-2 hide-scrollbar">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[200px]"><ProviderCardSkeleton /></div>
                ))}
              </div>
            ) : (
              <>
                {/* Mobile: compact horizontal scroll */}
                <div className="md:hidden flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
                  {nearbyProviders.map(p => <NearbyCard key={p.id} p={p} showDist={showDist} />)}
                </div>
                {/* Desktop: grid using existing ProviderCard component */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
                  {nearbyProviders.map(p => (
                    <ProviderCard key={p.id} provider={p} showDistance={showDist} compact />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Top Rated ── */}
        {(loading || topRatedProviders.length > 0) && (
          <section className="px-4 mt-5 md:px-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Star size={15} className="text-yellow-400 fill-yellow-400" />
                <h2 className="text-[15px] font-bold text-gray-900">{t(language, 'topRated') || 'Top Rated'}</h2>
              </div>
              <button
                onClick={() => navigate('/providers/all?sort=rating')}
                className="text-[13px] text-blue-700 font-semibold flex items-center gap-0.5"
              >
                {t(language, 'viewAll') || 'See All'} <ChevronRight size={14} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <ProviderCardSkeleton key={i} />)}
              </div>
            ) : (
              <>
                {/* Mobile: custom full cards matching screenshot */}
                <div className="md:hidden space-y-3">
                  {topRatedProviders.map(p => <FullProviderCard key={p.id} p={p} showDist={showDist} />)}
                </div>
                {/* Desktop: existing ProviderCard */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topRatedProviders.map(p => (
                    <ProviderCard key={p.id} provider={p} showDistance={showDist} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Available Now ── */}
        {!loading && availableProviders.length > 0 && (
          <section className="mt-5 w-full">
            <div className="flex items-center justify-between mb-3 px-4 md:px-6">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-[15px] font-bold text-gray-900">{t(language, 'availableNow') || 'Available Now'}</h2>
              </div>
              <button
                onClick={() => navigate('/providers/all?available=true')}
                className="text-[13px] text-blue-700 font-semibold flex items-center gap-0.5"
              >
                {t(language, 'viewAll') || 'See All'} <ChevronRight size={14} />
              </button>
            </div>
            <div className="md:hidden flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
              {availableProviders.map(p => <NearbyCard key={p.id} p={p} showDist={showDist} />)}
            </div>
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
              {availableProviders.map(p => (
                <ProviderCard key={p.id} provider={p} showDistance={showDist} />
              ))}
            </div>
          </section>
        )}

        {/* Bottom breathing room — clears BottomNav from App.tsx */}
        <div className="h-6" />
      </div>
    </div>
  );
};
