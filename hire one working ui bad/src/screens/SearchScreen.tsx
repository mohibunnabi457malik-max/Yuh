import React, { useState, useEffect, useCallback } from 'react';

import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ProviderCard } from '../components/cards/ProviderCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProviderCardSkeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../store/AppContext';
import { useLocation } from '../store/LocationContext';
import { supabase } from '../lib/supabase';
import { cache } from '../lib/cache';
import { calculateDistance, sortByDistance } from '../lib/distance';
import { t } from '../lib/translations';
import type { Provider } from '../types';

export const SearchScreen: React.FC = () => {
  
  const { language, categories } = useApp();
  const { location } = useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const loadPopularSearches = async () => {
      try {
        const { data } = await supabase
          .from('search_history')
          .select('query')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!mounted || !data) return;
        const counts = new Map<string, number>();
        data.forEach((row: any) => {
          const key = String(row.query || '').trim().toLowerCase();
          if (!key) return;
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        const top = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([q]) => q);
        setPopularSearches(top);
      } catch {
        setPopularSearches([]);
      }
    };
    loadPopularSearches();
    return () => {
      mounted = false;
    };
  }, []);

  const buildSearchCacheKey = () => {
    const locKey = location ? `${location.lat.toFixed(2)}:${location.lng.toFixed(2)}` : 'no-loc';
    return `search:${query.trim().toLowerCase()}:${selectedCategory || 'all'}:${availableOnly ? 1 : 0}:${minRating || 0}:${maxDistance || 0}:${locKey}`;
  };

  const search = useCallback(async () => {
    if (!query.trim() && !selectedCategory) return;

    const cacheKey = buildSearchCacheKey();
    const cached = cache.get<Provider[]>(cacheKey);
    if (cached) {
      setResults(cached);
      setSearched(true);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      let queryBuilder = supabase
        .from('providers')
        .select('*')
        .eq('is_active', true);

      // Search by name or category
      if (query.trim()) {
        queryBuilder = queryBuilder.or(
          `full_name.ilike.%${query}%,bio.ilike.%${query}%`
        );
      }

      // Filter by category
      if (selectedCategory) {
        queryBuilder = queryBuilder.contains('categories', [selectedCategory]);
      }

      // Filter by availability
      if (availableOnly) {
        queryBuilder = queryBuilder.eq('is_available', true);
      }

      // Filter by minimum rating
      if (minRating) {
        queryBuilder = queryBuilder.gte('rating', minRating);
      }

      const { data, error } = await queryBuilder.limit(50);

      if (error) throw error;

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

        // Filter by max distance
        if (maxDistance) {
          providersWithDistance = providersWithDistance.filter(
            (p) => p.distance && p.distance <= maxDistance
          );
        }

        // Sort by distance
        providersWithDistance = sortByDistance(providersWithDistance);
      }

      cache.set(cacheKey, providersWithDistance, 2 * 60 * 1000);
      setResults(providersWithDistance);

      if (query.trim()) {
        supabase.from('search_history').insert({
          user_id: null,
          query: query.trim(),
          result_count: providersWithDistance.length,
          location_lat: location?.lat || null,
          location_lng: location?.lng || null,
          location_city: location?.city || '',
        }).then(() => null);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, availableOnly, minRating, maxDistance, location]);

  // Search when filters change
  useEffect(() => {
    if (searched) {
      search();
    }
  }, [availableOnly, minRating, maxDistance, selectedCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search();
    }
  };

  const clearFilters = () => {
    setMaxDistance(null);
    setMinRating(null);
    setAvailableOnly(false);
    setSelectedCategory(null);
  };

  const hasActiveFilters = maxDistance || minRating || availableOnly || selectedCategory;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t(language, 'searchPlaceholder')}
              className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <Button onClick={search} disabled={loading}>
            {t(language, 'search')}
          </Button>
          <Button
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                if (!searched) setSearched(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="text-sm font-medium">
                {language === 'ur' ? cat.name_ur : cat.name_en}
              </span>
            </button>
          ))}
        </div>

        {!searched && (
          <div className="mb-6 space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Quick Filters</h3>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={`quick-${cat.id}`}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setQuery(language === 'ur' ? cat.name_ur : cat.name_en);
                    }}
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                  >
                    {cat.icon} {language === 'ur' ? cat.name_ur : cat.name_en}
                  </button>
                ))}
              </div>
            </div>

            {popularSearches.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">Popular Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setQuery(item);
                        setSearched(false);
                      }}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        ) : searched ? (
          results.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {results.length} {t(language, 'searchResults').toLowerCase()}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    showDistance={!!location}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(language, 'noResults')}
              </h3>
              <p className="text-gray-500">
                {t(language, 'tryDifferent')}
              </p>
            </Card>
          )
        ) : (
          <Card className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t(language, 'search')}
            </h3>
            <p className="text-gray-500">
              {t(language, 'searchPlaceholder')}
            </p>
          </Card>
        )}
      </main>

      {/* Filters Modal */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title={t(language, 'filter')}
      >
        <div className="space-y-6">
          {/* Distance Filter */}
          {location && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t(language, 'serviceRange')}
              </label>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 25, 50].map((km) => (
                  <button
                    key={km}
                    onClick={() => setMaxDistance(maxDistance === km ? null : km)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      maxDistance === km
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t(language, 'rating')}
            </label>
            <div className="flex flex-wrap gap-2">
              {[3, 4, 4.5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(minRating === rating ? null : rating)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    minRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating}+ ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {t(language, 'availableNow')}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              fullWidth
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              {t(language, 'cancel')}
            </Button>
            <Button fullWidth onClick={() => setShowFilters(false)}>
              {t(language, 'confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
