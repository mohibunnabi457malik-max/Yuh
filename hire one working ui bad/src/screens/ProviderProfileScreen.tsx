import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle,
  Briefcase,
  Heart,
  Flag,
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { useLocation } from '../store/LocationContext';
import { supabase, getStorageUrl } from '../lib/supabase';
import { calculateDistance, formatDistance } from '../lib/distance';
import { t } from '../lib/translations';
import type { Provider, Review } from '../types';
import { VerificationBadges } from '../components/provider/VerificationBadges';
import { ReportModal } from '../components/modals/ReportModal';

export const ProviderProfileScreen: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { language, categories } = useApp();
  const { user } = useAuth();
  const { location } = useLocation();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'pricing'>('about');

  useEffect(() => {
    const fetchProvider = async () => {
      if (!providerId) return;

      setLoading(true);

      try {
        // Fetch provider
        const { data: providerData, error: providerError } = await supabase
          .from('providers')
          .select('*')
          .eq('id', providerId)
          .single();

        if (providerError) throw providerError;

        // Calculate distance
        if (location && location.lat && location.lng && providerData) {
          providerData.distance = calculateDistance(
            location.lat,
            location.lng,
            providerData.location_lat,
            providerData.location_lng
          );
        }

        setProvider(providerData);

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*, customer:users!reviews_customer_id_fkey(*)')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false })
          .limit(10);

        setReviews(reviewsData || []);

        // Check if saved
        if (user) {
          const { data: savedData } = await supabase
            .from('saved_providers')
            .select('id')
            .eq('user_id', user.id)
            .eq('provider_id', providerId)
            .single();

          setIsSaved(!!savedData);
        }
      } catch (err) {
        console.error('Error fetching provider:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId, user, location]);

  const handleSaveToggle = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/provider/${providerId}` } } });
      return;
    }

    if (!provider) return;

    setSavingFavorite(true);

    try {
      if (isSaved) {
        await supabase
          .from('saved_providers')
          .delete()
          .eq('user_id', user.id)
          .eq('provider_id', provider.id);
        setIsSaved(false);
      } else {
        await supabase
          .from('saved_providers')
          .insert({ user_id: user.id, provider_id: provider.id });
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setSavingFavorite(false);
    }
  };

  const handleChat = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/provider/${providerId}` } } });
      return;
    }

    if (!provider) return;

    // Generate conversation ID
    const ids = [user.id, provider.user_id].sort();
    const conversationId = `${ids[0]}_${ids[1]}`;
    navigate(`/chat/${conversationId}?providerId=${provider.id}`);
  };

  const handleBook = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/provider/${providerId}` } } });
      return;
    }

    navigate(`/book/${providerId}`);
  };

  const handleCall = () => {
    if (provider?.phone) {
      window.location.href = `tel:${provider.phone}`;
    }
  };

  const getCategoryNames = () => {
    if (!provider) return [];
    return provider.categories.map((catId) => {
      const cat = categories.find((c) => c.id === catId || c.name_en === catId);
      return cat ? (language === 'ur' ? cat.name_ur : cat.name_en) : catId;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center h-16 gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4 mb-6">
            <Skeleton variant="circular" width={80} height={80} />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center py-12 max-w-sm mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Provider not found
          </h3>
          <Button onClick={() => navigate('/')}>{t(language, 'home')}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Report"
              >
                <Flag className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleSaveToggle}
                disabled={savingFavorite}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isSaved ? 'text-red-500 fill-red-500' : 'text-gray-600'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <Card className="mb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar
                src={provider.avatar_url ? getStorageUrl('avatars', provider.avatar_url) : undefined}
                name={provider.full_name}
                size="xl"
              />
              {provider.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                  <CheckCircle className="w-6 h-6 text-green-500 fill-green-500" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {provider.full_name}
                  </h1>
                  <p className="text-gray-500 text-sm">
                    {getCategoryNames().join(' • ')}
                  </p>
                </div>
                {provider.is_featured && (
                  <Badge variant="warning">{t(language, 'featured')}</Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3">
                {provider.total_reviews > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {provider.rating.toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({provider.total_reviews})
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-gray-500">
                  <Briefcase className="w-4 h-4" />
                  <span className="text-sm">{provider.total_jobs} {t(language, 'jobs')}</span>
                </div>
                {provider.distance !== undefined && (
                  <Badge variant="info">{formatDistance(provider.distance)}</Badge>
                )}
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 mt-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    provider.is_available ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    provider.is_available ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  {provider.is_available
                    ? t(language, 'available')
                    : t(language, 'busy')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-4">
          <VerificationBadges provider={provider} showLabels />
        </Card>

        <div className="mb-4 flex gap-2 overflow-x-auto">
          {[
            { id: 'about', label: 'About' },
            { id: 'reviews', label: 'Reviews' },
            { id: 'pricing', label: 'Pricing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'about' | 'reviews' | 'pricing')}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* About */}
        {activeTab === 'about' && (
          <Card className="mb-4">
            {provider.bio && (
              <>
                <h2 className="font-semibold text-gray-900 mb-2">{t(language, 'bio')}</h2>
                <p className="text-gray-600 whitespace-pre-wrap mb-4">{provider.bio}</p>
              </>
            )}

            <h3 className="font-semibold text-gray-900 mb-3">Provider Details</h3>
          <div className="space-y-3">
            {/* Experience */}
            {provider.experience_years > 0 && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t(language, 'experience')}</p>
                  <p className="font-medium text-gray-900">
                    {provider.experience_years} {provider.experience_years === 1 ? t(language, 'year') : t(language, 'years')}
                  </p>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t(language, 'serviceAreas')}</p>
                <p className="font-medium text-gray-900">
                  {provider.location_area || provider.location_city}
                  {provider.location_area && provider.location_city && `, ${provider.location_city}`}
                </p>
              </div>
            </div>

            {/* Service Range */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t(language, 'serviceRange')}</p>
                <p className="font-medium text-gray-900">
                  {provider.service_range_km} km
                </p>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t(language, 'memberSince')}</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(provider.created_at), 'MMMM yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Trust Checklist</p>
                <p className="font-medium text-gray-900">
                  {provider.is_verified ? 'ID verified' : 'Verification pending'}
                </p>
              </div>
            </div>
          </div>
          </Card>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
        <Card className="mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">
            {t(language, 'reviews')} ({provider.total_reviews})
          </h2>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={review.customer?.avatar_url ? getStorageUrl('avatars', review.customer.avatar_url) : undefined}
                      name={review.customer?.full_name || 'User'}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {review.customer?.full_name || 'Anonymous'}
                        </p>
                        <span className="text-xs text-gray-400">
                          {format(new Date(review.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">{t(language, 'noReviews')}</p>
          )}
        </Card>
        )}

        {/* Pricing */}
        {activeTab === 'pricing' && (
          <Card className="mb-4">
            <h2 className="font-semibold text-gray-900 mb-3">Pricing</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span>Starting price</span>
                <span className="font-semibold">Contact provider</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span>Service range</span>
                <span className="font-semibold">{provider.service_range_km} km</span>
              </div>
              <p className="pt-2 text-xs text-gray-500">
                Final quote depends on issue complexity, parts, and travel distance.
              </p>
            </div>
          </Card>
        )}
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Button variant="outline" onClick={handleCall} disabled={!provider.phone}>
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="outline" onClick={handleChat} className="flex-1">
            <MessageCircle className="w-5 h-5 mr-2" />
            {t(language, 'chat')}
          </Button>
          <Button onClick={handleBook} className="flex-1" disabled={!provider.is_available}>
            <Calendar className="w-5 h-5 mr-2" />
            {t(language, 'bookNow')}
          </Button>
        </div>
      </div>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedProviderId={provider.id}
        reportedUserId={provider.user_id}
        reportedName={provider.full_name}
      />
    </div>
  );
};
