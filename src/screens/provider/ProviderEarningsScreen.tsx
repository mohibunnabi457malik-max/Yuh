import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Booking } from '../../types';

export const ProviderEarningsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language, categories } = useApp();
  const { provider } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedBookings = async () => {
      if (!provider) return;

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('provider_id', provider.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedBookings();
  }, [provider]);

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId || c.name_en === catId);
    return cat ? (language === 'ur' ? cat.name_ur : cat.name_en) : catId;
  };

  const totalEarnings = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // This month's earnings
  const now = new Date();
  const thisMonthBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.created_at);
    return (
      bookingDate.getMonth() === now.getMonth() &&
      bookingDate.getFullYear() === now.getFullYear()
    );
  });
  const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

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
              {t(language, 'earnings')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm">{t(language, 'totalEarned')}</p>
                <p className="text-2xl font-bold">Rs {totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">{t(language, 'thisMonth')}</p>
                <p className="text-2xl font-bold">Rs {thisMonthEarnings.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Transactions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t(language, 'recentTransactions')}
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-24" />
                    </div>
                    <div className="h-5 bg-gray-200 rounded w-16" />
                  </div>
                </Card>
              ))}
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {getCategoryName(booking.category)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(booking.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="font-semibold text-green-600">
                      +Rs {(booking.amount || 0).toLocaleString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t(language, 'noEarnings')}
              </h3>
              <p className="text-gray-500">
                Complete jobs to start earning
              </p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};
