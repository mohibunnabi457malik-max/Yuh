import React, { useState, useEffect } from 'react';

import { format } from 'date-fns';
import { Badge } from '../../components/ui/Badge';
import { useApp } from '../../store/AppContext';
import { supabase } from '../../lib/supabase';
import { t } from '../../lib/translations';
import type { Booking, BookingStatus } from '../../types';

export const AdminBookings: React.FC = () => {
  const { language, categories } = useApp();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchBookings = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('bookings')
        .select('*, customer:users!bookings_customer_id_fkey(*), provider:providers(*)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
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
  }, [statusFilter]);

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId || c.name_en === catId);
    return cat ? (language === 'ur' ? cat.name_ur : cat.name_en) : catId;
  };

  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled':
      case 'rejected': return 'danger';
      default: return 'info';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">{t(language, 'manageBookings')}</h1>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr className="text-left text-gray-300 text-sm">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="text-white divide-y divide-gray-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-32" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-4 bg-gray-700 rounded w-24" /></td>
                  </tr>
                ))
              ) : bookings.length > 0 ? (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3">{booking.customer?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3">{booking.provider?.full_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-gray-300">{getCategoryName(booking.category)}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {booking.scheduled_date ? format(new Date(booking.scheduled_date), 'MMM d, yyyy') : '-'}
                      {booking.scheduled_time && ` ${booking.scheduled_time}`}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(booking.status)}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {format(new Date(booking.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
