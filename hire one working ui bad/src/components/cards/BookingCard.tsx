import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { StatusBadge } from '../ui/Badge';
import { useApp } from '../../store/AppContext';
import { getStorageUrl } from '../../lib/supabase';
import type { Booking } from '../../types';

interface BookingCardProps {
  booking: Booking;
  showCustomer?: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  showCustomer = false,
}) => {
  const navigate = useNavigate();
  const { categories, language } = useApp();

  
  const displayName = showCustomer 
    ? booking.customer?.full_name 
    : booking.provider?.full_name;
  const avatarUrl = showCustomer
    ? booking.customer?.avatar_url
    : booking.provider?.avatar_url;

  // Get category name
  const getCategoryName = () => {
    const cat = categories.find(
      (c) => c.id === booking.category || c.name_en === booking.category
    );
    if (cat) {
      return language === 'ur' ? cat.name_ur : cat.name_en;
    }
    return booking.category;
  };

  return (
    <Card
      hoverable
      onClick={() => navigate(`/booking/${booking.id}`)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar
          src={avatarUrl ? getStorageUrl('avatars', avatarUrl) : undefined}
          name={displayName || 'User'}
          size="md"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {displayName || 'Unknown'}
              </h3>
              <p className="text-sm text-gray-500">{getCategoryName()}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            {booking.scheduled_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(new Date(booking.scheduled_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {booking.scheduled_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{booking.scheduled_time}</span>
              </div>
            )}
          </div>

          {booking.location_address && (
            <div className="flex items-start gap-1 mt-1.5 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span className="truncate">{booking.location_address}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
