import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Star,
  Clock,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BookingCard } from '../../components/cards/BookingCard';
import { BookingCardSkeleton } from '../../components/ui/Skeleton';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Booking } from '../../types';

export const ProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();
  const { provider, refreshProvider } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!provider) return;

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*, customer:users!bookings_customer_id_fkey(*)')
          .eq('provider_id', provider.id)
          .in('status', ['pending', 'accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();

    // Subscribe to booking changes
    const subscription = supabase
      .channel('provider_bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${provider?.id}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [provider]);

  const handleToggleAvailability = async () => {
    if (!provider) return;

    setTogglingAvailability(true);

    try {
      await supabase
        .from('providers')
        .update({ is_available: !provider.is_available })
        .eq('id', provider.id);

      await refreshProvider();
    } catch (err) {
      console.error('Error toggling availability:', err);
    } finally {
      setTogglingAvailability(false);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const activeBookings = bookings.filter((b) => b.status === 'accepted' || b.status === 'in_progress');

  if (!provider) {
    navigate('/become-provider');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t(language, 'dashboard')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Availability Toggle */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                {t(language, 'availabilityStatus')}
              </h3>
              <p className={`text-sm ${provider.is_available ? 'text-green-600' : 'text-gray-500'}`}>
                {provider.is_available
                  ? t(language, 'youAreAvailable')
                  : t(language, 'youAreBusy')}
              </p>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={togglingAvailability}
              className="p-1"
            >
              {provider.is_available ? (
                <ToggleRight className="w-12 h-12 text-green-600" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{provider.total_jobs}</p>
                <p className="text-xs text-gray-500">{t(language, 'totalJobs')}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {provider.rating.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">{t(language, 'rating')}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
                <p className="text-xs text-gray-500">{t(language, 'pending')}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeBookings.length}</p>
                <p className="text-xs text-gray-500">{t(language, 'activeJobs')}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Requests */}
        {pendingBookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t(language, 'pendingRequests')}
              </h2>
              <Badge variant="warning">{pendingBookings.length}</Badge>
            </div>
            <div className="space-y-3">
              {loading ? (
                [...Array(2)].map((_, i) => <BookingCardSkeleton key={i} />)
              ) : (
                pendingBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} showCustomer />
                ))
              )}
            </div>
          </section>
        )}

        {/* Active Jobs */}
        {activeBookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t(language, 'activeJobs')}
              </h2>
              <Badge variant="info">{activeBookings.length}</Badge>
            </div>
            <div className="space-y-3">
              {activeBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} showCustomer />
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card
            hoverable
            onClick={() => navigate('/provider/jobs')}
            className="text-center"
          >
            <Briefcase className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">{t(language, 'jobs')}</p>
          </Card>

          <Card
            hoverable
            onClick={() => navigate('/provider/edit')}
            className="text-center"
          >
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="font-medium text-gray-900">{t(language, 'editProfile')}</p>
          </Card>
        </div>
      </main>
    </div>
  );
};
