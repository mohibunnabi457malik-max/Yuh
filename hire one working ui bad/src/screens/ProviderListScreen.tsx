import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProviderCard } from '../components/cards/ProviderCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProviderCardSkeleton } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import { useLocation } from '../store/LocationContext';
import { supabase } from '../lib/supabase';
import { calculateDistance, sortByDistance } from '../lib/distance';
import { t } from '../lib/translations';
import type { Provider } from '../types';

export const ProviderListScreen: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { language, categories } = useApp();
  const { location } = useLocation();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const category = categories.find((c) => c.id === categoryId);
  const categoryName = category
    ? language === 'ur'
      ? category.name_ur
      : category.name_en
    : t(language, 'providers');

  const fetchProviders = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('providers')
        .select('*')
        .eq('is_active', true);

      if (categoryId && categoryId !== 'all') {
        query = query.contains('categories', [categoryId]);
      }

      const { data, error: fetchError } = await query.limit(100);

      if (fetchError) throw fetchError;

      let providersWithDistance = data || [];

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

        // Sort by distance
        providersWithDistance = sortByDistance(providersWithDistance);
      }

      setProviders(providersWithDistance);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(t(language, 'errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [categoryId, location]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1 flex items-center gap-2">
              {category && (
                <span className="text-2xl">{category.icon}</span>
              )}
              <h1 className="text-lg font-semibold text-gray-900">
                {categoryName}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <Button size="sm" variant="outline" onClick={fetchProviders}>
                {t(language, 'retry')}
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        ) : providers.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {providers.length} {t(language, 'providers').toLowerCase()}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providers.map((provider) => (
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
            <div className="text-4xl mb-4">{category?.icon || '🔍'}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t(language, 'noProviders')}
            </h3>
            <p className="text-gray-500">
              {t(language, 'beFirstProvider')}
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};
