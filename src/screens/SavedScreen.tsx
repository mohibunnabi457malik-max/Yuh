import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { ProviderCard } from '../components/cards/ProviderCard';
import { Card } from '../components/ui/Card';
import { ProviderCardSkeleton } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useLocation } from '../store/LocationContext';
import { supabase } from '../lib/supabase';
import { calculateDistance } from '../lib/distance';
import { t } from '../lib/translations';
import type { Provider } from '../types';

export const SavedScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();
  const { user } = useAuth();
  const { location } = useLocation();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      if (!user) return;

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('saved_providers')
          .select('*, provider:providers(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        let providersList = (data || [])
          .map((item) => item.provider)
          .filter(Boolean) as Provider[];

        // Calculate distance
        if (location && location.lat && location.lng) {
          providersList = providersList.map((p) => ({
            ...p,
            distance: calculateDistance(
              location.lat,
              location.lng,
              p.location_lat,
              p.location_lng
            ),
          }));
        }

        setProviders(providersList);
      } catch (err) {
        console.error('Error fetching saved providers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, [user, location]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t(language, 'savedProviders')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                showDistance={!!location}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t(language, 'noSaved')}
            </h3>
            <p className="text-gray-500">{t(language, 'saveProviderDesc')}</p>
          </Card>
        )}
      </main>
    </div>
  );
};
