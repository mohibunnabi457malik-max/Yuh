import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Clock, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { BookingCardSkeleton } from '../../components/ui/Skeleton';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase, getStorageUrl } from '../../lib/supabase';
import { t } from '../../lib/translations';
import { format } from 'date-fns';
import type { Booking, BookingStatus } from '../../types';

const TABS: { key: 'pending' | 'active' | 'completed'; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export const ProviderJobsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, categories } = useApp();
  const { provider, refreshProvider } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!provider) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, customer:users!bookings_customer_id_fkey(*)')
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [provider]);

  const handleAction = async (bookingId: string, action: 'accept' | 'reject' | 'complete') => {
    setActionLoading(bookingId);

    try {
      let status: BookingStatus;
      switch (action) {
        case 'accept':
          status = 'accepted';
          break;
        case 'reject':
          status = 'rejected';
          break;
        case 'complete':
          status = 'completed';
          break;
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      // Update total_jobs if completed
      if (action === 'complete' && provider) {
        await supabase
          .from('providers')
          .update({ total_jobs: provider.total_jobs + 1 })
          .eq('id', provider.id);
        await refreshProvider();
      }

      // Refresh bookings
      await fetchBookings();

      // Send notification to customer
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        const title = action === 'accept' 
          ? 'Booking Accepted' 
          : action === 'reject' 
          ? 'Booking Rejected'
          : 'Service Completed';
        
        await supabase.from('notifications').insert({
          user_id: booking.customer_id,
          title,
          body: `Your booking has been ${status}`,
          type: 'booking',
          data: { booking_id: bookingId },
        });
      }
    } catch (err) {
      console.error('Error updating booking:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId || c.name_en === catId);
    return cat ? (language === 'ur' ? cat.name_ur : cat.name_en) : catId;
  };

  const filteredBookings = bookings.filter((b) => {
    switch (activeTab) {
      case 'pending':
        return b.status === 'pending';
      case 'active':
        return b.status === 'accepted' || b.status === 'in_progress';
      case 'completed':
        return b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected';
    }
  });

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
              {t(language, 'jobs')}
            </h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id}>
                <div className="flex items-start gap-3">
                  <Avatar
                    src={booking.customer?.avatar_url ? getStorageUrl('avatars', booking.customer.avatar_url) : undefined}
                    name={booking.customer?.full_name || 'Customer'}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {booking.customer?.full_name || 'Customer'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getCategoryName(booking.category)}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    {booking.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {booking.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {booking.scheduled_date && (
                        <span>{format(new Date(booking.scheduled_date), 'MMM d')}</span>
                      )}
                      {booking.scheduled_time && (
                        <span>{booking.scheduled_time}</span>
                      )}
                    </div>

                    {booking.location_address && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        📍 {booking.location_address}
                      </p>
                    )}

                    {/* Actions */}
                    {booking.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(booking.id, 'reject')}
                          loading={actionLoading === booking.id}
                          disabled={actionLoading !== null}
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t(language, 'reject')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAction(booking.id, 'accept')}
                          loading={actionLoading === booking.id}
                          disabled={actionLoading !== null}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t(language, 'accept')}
                        </Button>
                      </div>
                    )}

                    {(booking.status === 'accepted' || booking.status === 'in_progress') && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => handleAction(booking.id, 'complete')}
                          loading={actionLoading === booking.id}
                          disabled={actionLoading !== null}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          {t(language, 'markComplete')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'pending' ? t(language, 'noRequests') : t(language, 'noActiveJobs')}
            </h3>
          </Card>
        )}
      </main>
    </div>
  );
};
