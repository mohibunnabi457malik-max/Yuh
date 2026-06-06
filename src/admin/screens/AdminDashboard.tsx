import React, { useState, useEffect } from 'react';
import { Users, Briefcase, Calendar, Star, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { useApp } from '../../store/AppContext';
import { supabase, getStorageUrl } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { User, Provider, Booking } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { language } = useApp();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    totalReviews: 0,
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch counts
        const [usersRes, providersRes, bookingsRes, reviewsRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('providers').select('id', { count: 'exact', head: true }),
          supabase.from('bookings').select('id', { count: 'exact', head: true }),
          supabase.from('reviews').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalUsers: usersRes.count || 0,
          totalProviders: providersRes.count || 0,
          totalBookings: bookingsRes.count || 0,
          totalReviews: reviewsRes.count || 0,
        });

        // Fetch recent users
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentUsers(usersData || []);

        // Fetch recent bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*, customer:users!bookings_customer_id_fkey(*), provider:providers(*)')
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentBookings(bookingsData || []);

        // Fetch unverified providers
        const { data: providersData } = await supabase
          .from('providers')
          .select('*')
          .eq('is_verified', false)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5);
        setPendingProviders(providersData || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: t(language, 'totalUsers'), value: stats.totalUsers, icon: Users, color: 'blue' },
    { label: t(language, 'totalProviders'), value: stats.totalProviders, icon: Briefcase, color: 'green' },
    { label: t(language, 'totalBookings'), value: stats.totalBookings, icon: Calendar, color: 'purple' },
    { label: t(language, 'totalReviews'), value: stats.totalReviews, icon: Star, color: 'yellow' },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">{t(language, 'dashboard')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? '-' : stat.value.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t(language, 'recentSignups')}
          </h2>
          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-32 mb-1" />
                    <div className="h-3 bg-gray-700 rounded w-24" />
                  </div>
                </div>
              ))
            ) : recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar
                    src={user.avatar_url ? getStorageUrl('avatars', user.avatar_url) : undefined}
                    name={user.full_name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{user.full_name}</p>
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Badge variant={user.role === 'provider' ? 'info' : 'default'}>
                    {user.role}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No recent signups</p>
            )}
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            {t(language, 'pendingVerification')}
          </h2>
          <div className="space-y-3">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-32" />
                  </div>
                </div>
              ))
            ) : pendingProviders.length > 0 ? (
              pendingProviders.map((provider) => (
                <div key={provider.id} className="flex items-center gap-3">
                  <Avatar
                    src={provider.avatar_url ? getStorageUrl('avatars', provider.avatar_url) : undefined}
                    name={provider.full_name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{provider.full_name}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {provider.location_area || provider.location_city}
                    </p>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No pending verifications</p>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-gray-800 rounded-xl p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t(language, 'bookings')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-2"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                      <td className="py-2"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                      <td className="py-2"><div className="h-4 bg-gray-700 rounded w-20" /></td>
                      <td className="py-2"><div className="h-4 bg-gray-700 rounded w-16" /></td>
                      <td className="py-2"><div className="h-4 bg-gray-700 rounded w-20" /></td>
                    </tr>
                  ))
                ) : recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="py-2 pr-4">{booking.customer?.full_name || 'Unknown'}</td>
                      <td className="py-2 pr-4">{booking.provider?.full_name || 'Unknown'}</td>
                      <td className="py-2 pr-4">{booking.category}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant={
                            booking.status === 'completed' ? 'success' :
                            booking.status === 'pending' ? 'warning' :
                            booking.status === 'cancelled' ? 'danger' : 'info'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-400">
                        {format(new Date(booking.created_at), 'MMM d')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      No bookings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
