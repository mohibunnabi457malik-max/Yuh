import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, MapPin, RefreshCw, Search,
  Bell, ChevronDown, Star, Briefcase,
  MessageCircle, Phone, CheckCircle2,
} from 'lucide-react';
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

// ─── Hero banner slides (hardcoded for now, admin-editable later) ─────────────
const HERO_SLIDES = [
  {
    title: 'Emergency Services 24/7',
    lines: ['Electrician & Plumber on call', 'Available right now in your area'],
    color: 'from-red-500 to-rose-600',
  },
  {
    title: 'Become a Provider Today',
    lines: ['Turn your skills into income', 'Join thousands of service providers.'],
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: 'Find Trusted Pros Near You',
    lines: ['Verified workers, on-demand', 'Rated by your neighbours'],
    color: 'from-blue-600 to-indigo-700',
  },
];

// ─── Avatar helpers ────────────────────────────────────────────────────────────
const AV_COLORS = [
  'bg-orange-500','bg-green-600','bg-blue-700',
  'bg-purple-600','bg-teal-600','bg-rose-500','bg-amber-500',
];
const avColor   = (n: string) => { let h=0; for(let i=0;i<n.length;i++) h=n.charCodeAt(i)+((h<<5)-h); return AV_COLORS[Math.abs(h)%AV_COLORS.length]; };
const avInitials = (n: string) => (n||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

// ─── Inline Avatar ────────────────────────────────────────────────────────────
function Av({ name, url, online, verified, size='md' }:{
  name:string; url?:string|null; online?:boolean; verified?:boolean; size?:'sm'|'md'|'lg';
}) {
  const dim={sm:'w-9 h-9 text-xs',md:'w-12 h-12 text-sm',lg:'w-14 h-14 text-base'}[size];
  return (
    <div className="relative flex-shrink-0">
      {url
        ? <img src={url} alt={name} className={`${dim} rounded-full object-cover`}/>
        : <div className={`${dim} ${avColor(name)} rounded-full flex items-center justify-center font-bold text-white select-none`}>{avInitials(name)}</div>
      }
      {online   && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"/>}
      {verified && (
        <span className="absolute -bottom-1 -right-0.5 w-[14px] h-[14px] bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
          <CheckCircle2 size={7} className="text-white"/>
        </span>
      )}
    </div>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating, reviews }:{ rating:number; reviews:number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-px">
        {[1,2,3,4,5].map(i=>(
          <Star key={i} size={11} className={i<=Math.round(rating)?'fill-yellow-400 text-yellow-400':'fill-gray-200 text-gray-200'}/>
        ))}
      </div>
      <span className="text-[11px] text-gray-500">{rating?.toFixed(1)} ({reviews})</span>
    </div>
  );
}

// ─── Full provider card (matches old long screenshot: rating/jobs/dist/avail/buttons) ──
function FullCard({ p, showDist }:{ p:Provider; showDist:boolean }) {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const onView  = () => navigate(`/provider/${p.id}`);
  const onChat  = () => {
    if (!user) { navigate('/login'); return; }
    const ids = [user.id, p.user_id].sort();
    navigate(`/chat/${ids[0]}_${ids[1]}?providerId=${p.id}`);
  };
  const onCall  = () => { if (p.phone) window.location.href=`tel:${p.phone}`; };
  const onBook  = () => navigate(`/book/${p.id}`);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Av name={p.full_name} url={p.avatar_url} online={p.is_available} verified={p.is_verified} size="lg"/>
          <div className="flex-1 min-w-0">
            {/* name + verify */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-[15px] text-gray-900 truncate">{p.full_name}</span>
              {p.is_verified && <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0"/>}
            </div>
            {/* stars */}
            <div className="mt-0.5"><Stars rating={p.rating} reviews={p.total_reviews}/></div>
            {/* meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
              <span className="flex items-center gap-1 text-[12px] text-gray-500">
                <Briefcase size={11} className="text-gray-400"/> {p.total_jobs} jobs
              </span>
              {showDist && p.distance!=null && (
                <span className="flex items-center gap-1 text-[12px] text-gray-500">
                  <MapPin size={11} className="text-gray-400"/> {p.distance.toFixed(1)} km
                </span>
              )}
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                p.is_available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${p.is_available?'bg-green-500':'bg-gray-400'}`}/>
                {p.is_available ? 'Available' : 'Busy'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* action bar */}
      <div className="flex border-t border-gray-100 divide-x divide-gray-100">
        <button onClick={onView}
          className="flex-1 py-3 text-[13px] font-semibold text-blue-700 hover:bg-blue-50 transition-colors">
          View Profile
        </button>
        <button onClick={onChat}
          className="flex-1 py-3 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
          <MessageCircle size={13}/> Chat
        </button>
        <button onClick={onCall}
          className="px-4 py-3 text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center">
          <Phone size={13}/>
        </button>
        <button onClick={onBook}
          className="flex-1 py-3 text-[13px] font-bold text-white bg-[#1a3a6b] hover:bg-[#15305a] transition-colors">
          Book Now
        </button>
      </div>
    </div>
  );
}

// ─── Compact card for horizontal-scroll sections ──────────────────────────────
function SlideCard({ p, showDist }:{ p:Provider; showDist:boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={()=>navigate(`/provider/${p.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3 text-left flex-shrink-0 w-[210px] hover:shadow-md transition-shadow"
    >
      <Av name={p.full_name} url={p.avatar_url} online={p.is_available} verified={p.is_verified} size="md"/>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] text-gray-900 truncate">{p.full_name}</p>
        <div className="mt-0.5"><Stars rating={p.rating} reviews={p.total_reviews}/></div>
        <div className="flex flex-wrap items-center gap-x-2 mt-1">
          {showDist && p.distance!=null && (
            <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
              <MapPin size={9}/>{p.distance.toFixed(1)} km
            </span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            p.is_available?'bg-green-50 text-green-700':'bg-gray-100 text-gray-400'
          }`}>
            {p.is_available?'Available':'Busy'}
          </span>
        </div>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export const HomeScreen: React.FC = () => {
  const navigate  = useNavigate();
  const { language, categories, loadingCategories } = useApp();
  const { location, detectLocation, loading: locationLoading, permissionDenied } = useLocation();
  const { user }  = useAuth();

  const [providers, setProviders]         = useState<Provider[]>([]);
  const [loading,   setLoading]           = useState(true);
  const [error,     setError]             = useState<string|null>(null);
  const [showAllCats, setShowAllCats]     = useState(false);
  const [slide,     setSlide]             = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval>|null>(null);

  // hero auto-advance
  useEffect(() => {
    slideTimer.current = setInterval(() => setSlide(s=>(s+1)%HERO_SLIDES.length), 4500);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, []);

  // ── fetchProviders — original logic, untouched ────────────────────────────
  const fetchProviders = useCallback(async (forceRefresh=false) => {
    const cacheKey = location ? CACHE_KEYS.providers(location.lat,location.lng) : 'providers:all';
    if (!forceRefresh) {
      const cached = cache.get<Provider[]>(cacheKey);
      if (cached) { setProviders(cached); setLoading(false); return; }
    }
    setLoading(true); setError(null);
    try {
      const { data, error: fe } = await supabase
        .from('providers')
        .select('id,user_id,full_name,avatar_url,categories,location_lat,location_lng,location_area,location_city,service_range_km,is_available,is_active,is_featured,is_verified,rating,total_reviews,total_jobs')
        .eq('is_active',true)
        .order('is_featured',{ascending:false})
        .order('rating',{ascending:false})
        .limit(50);
      if (fe) throw fe;
      let list = (data||[]) as Provider[];
      if (location?.lat && location?.lng) {
        list = list
          .map(p=>({...p, distance:calculateDistance(location.lat,location.lng,p.location_lat,p.location_lng)}))
          .filter(p=>!p.distance||p.distance<=p.service_range_km);
      }
      cache.set(cacheKey, list, 3*60*1000);
      setProviders(list);
    } catch(err) {
      console.error(err);
      setError(t(language,'errorLoadingData'));
    } finally { setLoading(false); }
  }, [location, language]);

  useEffect(()=>{ fetchProviders(); },[fetchProviders]);

  useEffect(()=>{
    if (!location&&!locationLoading&&!permissionDenied) {
      const id=setTimeout(()=>detectLocation(),500);
      return ()=>clearTimeout(id);
    }
  },[location,locationLoading,permissionDenied,detectLocation]);

  // ── memoised lists — original logic, untouched ───────────────────────────
  const nearbyProviders   = useMemo(()=>sortByDistance(providers).slice(0,8),[providers]);
  const topRatedProviders = useMemo(()=>[...providers].sort((a,b)=>b.rating-a.rating).slice(0,6),[providers]);
  const availableProviders= useMemo(()=>providers.filter(p=>p.is_available).slice(0,6),[providers]);

  const categoryUsage = useMemo(()=>{
    const m=new Map<string,number>();
    providers.forEach(p=>(p.categories||[]).forEach(id=>m.set(id,(m.get(id)||0)+1)));
    return m;
  },[providers]);

  const sortedCategories = useMemo(()=>[...categories].sort((a,b)=>{
    const d=(categoryUsage.get(b.id)||0)-(categoryUsage.get(a.id)||0);
    return d||a.sort_order-b.sort_order;
  }),[categories,categoryUsage]);

  const showDist = !!location;

  // ─── section helpers ──────────────────────────────────────────────────────

  // horizontal provider carousel (nearby / available now)
  const HScroll = ({ list, title, viewPath, empty }:{
    list:Provider[]; title:string; viewPath:string; empty:string;
  }) => (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3 px-4 md:px-6">
        <div className="flex items-center gap-1.5">
          <MapPin size={15} className="text-blue-700"/>
          <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
        </div>
        {list.length>0 && (
          <button onClick={()=>navigate(viewPath)}
            className="text-[13px] text-blue-700 font-semibold flex items-center gap-0.5">
            See All <ChevronRight size={13}/>
          </button>
        )}
      </div>
      {loading ? (
        <div className="flex gap-3 overflow-x-auto px-4 md:px-6 pb-2 hide-scrollbar">
          {[...Array(3)].map((_,i)=>(
            <div key={i} className="flex-shrink-0 w-[210px]"><ProviderCardSkeleton/></div>
          ))}
        </div>
      ) : list.length===0 ? (
        <p className="px-4 md:px-6 text-[13px] text-gray-400">{empty}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto px-4 md:px-6 pb-2 hide-scrollbar">
          {list.map(p=><SlideCard key={p.id} p={p} showDist={showDist}/>)}
        </div>
      )}
    </section>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    /*
     * KEY: overflow-x-hidden on this wrapper stops ANY child from causing
     * page-level horizontal scroll.  Carousels have overflow-x-auto on their
     * own div so they scroll internally only.
     * App.tsx MainLayout already provides <BottomNav/> — we do NOT add one here.
     * App.tsx MainLayout already provides <Header/> via desktop Sidebar — on
     * mobile we show our own dark top bar.
     */
    <div className="w-full overflow-x-hidden bg-gray-50 min-h-screen">

      {/* ════ MOBILE TOP BAR (hidden md+, desktop uses Header from MainLayout) */}
      <div className="md:hidden sticky top-0 z-50 bg-[#1b2d5b] w-full">
        {/* row 1: avatar + greeting + location + bell */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-full ${avColor(user?.full_name||'U')} flex items-center justify-center font-bold text-white text-sm flex-shrink-0`}>
              {avInitials(user?.full_name||'U')}
            </div>
            <div className="min-w-0">
              <p className="text-gray-300 text-[11px] leading-none">
                Hello, {user?.full_name?.split(' ')[0]||'there'} 👋
              </p>
              <button onClick={()=>navigate('/location-picker')} className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="fill-yellow-400 text-yellow-400 flex-shrink-0"/>
                <span className="text-white text-[13px] font-semibold truncate max-w-[170px]">
                  {location
                    ? [location.area, location.city].filter(Boolean).join(', ')
                    : 'Set location'}
                </span>
                <ChevronDown size={12} className="text-gray-400 flex-shrink-0"/>
              </button>
            </div>
          </div>
          <button onClick={()=>navigate('/notifications')}
            className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative flex-shrink-0">
            <Bell size={20} className="text-white"/>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"/>
          </button>
        </div>
        {/* row 2: search */}
        <button onClick={()=>navigate('/search')}
          className="mx-4 mb-4 flex items-center gap-3 bg-[#24396e] border border-white/10 rounded-xl px-4 py-3 w-[calc(100%-2rem)]">
          <Search size={16} className="text-gray-400 flex-shrink-0"/>
          <span className="text-[13px] text-gray-400">
            {t(language,'searchPlaceholder')||'Search for services...'}
          </span>
        </button>
      </div>

      {/* ════ CONTENT (max-width centres on desktop) ═════════════════════════ */}
      <div className="w-full max-w-7xl mx-auto">

        {/* ── HERO BANNER (sliding) ── */}
        <div className="px-4 mt-4 md:px-6 md:mt-6">
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${HERO_SLIDES[slide].color} px-6 py-6 shadow-sm`}>
            {/* decorative circles */}
            <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10"/>
            <div className="pointer-events-none absolute -bottom-6 right-12 w-20 h-20 rounded-full bg-white/10"/>
            {/* text */}
            <p className="relative z-10 text-white font-extrabold text-[18px] leading-tight">
              {HERO_SLIDES[slide].title}
            </p>
            {HERO_SLIDES[slide].lines.map((l,i)=>(
              <p key={i} className="relative z-10 text-white/80 text-[13px] mt-1">{l}</p>
            ))}
            {/* dot indicators */}
            <div className="flex gap-1.5 mt-4 relative z-10">
              {HERO_SLIDES.map((_,i)=>(
                <button key={i} onClick={()=>setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${i===slide?'w-6 bg-white':'w-1.5 bg-white/40'}`}/>
              ))}
            </div>
          </div>
        </div>

        {/* ── ALERTS ── */}
        {permissionDenied && (
          <div className="px-4 mt-3 md:px-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-3">
              <MapPin size={14} className="text-yellow-600 flex-shrink-0"/>
              <p className="text-[12px] text-yellow-800 flex-1 min-w-0">{t(language,'locationError')}</p>
              <button onClick={detectLocation}
                className="text-[11px] font-semibold text-yellow-700 flex items-center gap-1 flex-shrink-0">
                <RefreshCw size={11}/> {t(language,'retry')}
              </button>
            </div>
          </div>
        )}
        {error && (
          <div className="px-4 mt-3 md:px-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
              <p className="text-[12px] text-red-800 flex-1 min-w-0">{error}</p>
              <button onClick={()=>fetchProviders(true)}
                className="text-[11px] font-semibold text-red-700 flex items-center gap-1 flex-shrink-0">
                <RefreshCw size={11}/> {t(language,'retry')}
              </button>
            </div>
          </div>
        )}

        {/* ── ALL SERVICES — 2×4 grid ── */}
        <section className="px-4 mt-6 md:px-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-gray-900">All Services</h2>
            <button onClick={()=>setShowAllCats(v=>!v)}
              className="text-[13px] text-blue-700 font-semibold flex items-center gap-0.5">
              {showAllCats?'Show Less':'View All'} <ChevronRight size={14}/>
            </button>
          </div>

          {loadingCategories ? (
            /*
             * 4 cols on mobile = each cell is 25% wide.
             * We limit to 8 items (2 rows × 4 cols) by default.
             */
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {[...Array(8)].map((_,i)=><CategorySkeleton key={i}/>)}
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {(showAllCats ? sortedCategories : sortedCategories.slice(0,8)).map(cat=>(
                <button key={cat.id} onClick={()=>navigate(`/providers/${cat.id}`)}
                  className="bg-white rounded-2xl py-3 px-1 flex flex-col items-center gap-1.5 border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all active:scale-95">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                    style={{backgroundColor: cat.color?`${cat.color}18`:'#f0f4ff'}}>
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-2 w-full px-0.5">
                    {language==='ur'?cat.name_ur:cat.name_en}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── NEARBY PROVIDERS — horizontal slide ── */}
        <HScroll
          list={nearbyProviders}
          title="Nearby Providers"
          viewPath="/providers/all?sort=distance"
          empty="No providers found nearby"
        />

        {/* ── TOP RATED — vertical stacked full cards ── */}
        {(loading || topRatedProviders.length>0) && (
          <section className="px-4 mt-6 md:px-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Star size={15} className="text-yellow-400 fill-yellow-400"/>
                <h2 className="text-[15px] font-bold text-gray-900">
                  {t(language,'topRated')||'Top Rated'}
                </h2>
              </div>
              <button onClick={()=>navigate('/providers/all?sort=rating')}
                className="text-[13px] text-blue-700 font-semibold flex items-center gap-0.5">
                See All <ChevronRight size={13}/>
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_,i)=><ProviderCardSkeleton key={i}/>)}
              </div>
            ) : topRatedProviders.length===0 ? null : (
              <>
                {/* Mobile: custom full cards */}
                <div className="md:hidden space-y-3">
                  {topRatedProviders.map(p=>(
                    <FullCard key={p.id} p={p} showDist={showDist}/>
                  ))}
                </div>
                {/* Desktop: 3-col grid of full cards */}
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topRatedProviders.map(p=>(
                    <FullCard key={p.id} p={p} showDist={showDist}/>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ── AVAILABLE NOW — horizontal slide ── */}
        {(!loading && availableProviders.length>0) && (
          <HScroll
            list={availableProviders}
            title={t(language,'availableNow')||'Available Now'}
            viewPath="/providers/all?available=true"
            empty=""
          />
        )}

        {/* ── EMPTY STATE (no providers at all) ── */}
        {!loading && providers.length===0 && (
          <div className="px-4 mt-8 md:px-6">
            <Card className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400"/>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">{t(language,'noProviders')}</h3>
              <p className="text-gray-500 text-sm mb-4">{t(language,'beFirstProvider')}</p>
              {user?.role==='customer' && (
                <Button onClick={()=>navigate('/become-provider')}>{t(language,'becomeProvider')}</Button>
              )}
            </Card>
          </div>
        )}

        {/* breathing room above BottomNav (provided by App.tsx) */}
        <div className="h-8"/>
      </div>
    </div>
  );
};
