import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Clock, MessageCircle, Phone, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { t } from '../../lib/translations';
import { formatDistance } from '../../lib/distance';
import { getStorageUrl } from '../../lib/supabase';
import type { Provider } from '../../types';

interface ProviderCardProps {
  provider: Provider;
  showDistance?: boolean;
  compact?: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  showDistance = true,
  compact = false,
}) => {
  const navigate = useNavigate();
  const { language, categories } = useApp();
  const { user } = useAuth();

  // Get category names
  const getCategoryNames = () => {
    return provider.categories
      .map((catId) => {
        const cat = categories.find((c) => c.id === catId || c.name_en === catId);
        if (cat) {
          return language === 'ur' ? cat.name_ur : cat.name_en;
        }
        return catId;
      })
      .slice(0, 2)
      .join(', ');
  };

  return (
    <Card
      hoverable
      onClick={() => navigate(`/provider/${provider.id}`)}
      className="relative"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={provider.avatar_url ? getStorageUrl('avatars', provider.avatar_url) : undefined}
            name={provider.full_name}
            size="lg"
          />
          {provider.is_verified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full">
              <CheckCircle className="w-5 h-5 text-green-500 fill-green-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {provider.full_name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {getCategoryNames()}
              </p>
            </div>

            {/* Rating */}
            {provider.total_reviews > 0 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-gray-900">
                  {provider.rating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">
                  ({provider.total_reviews})
                </span>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Location */}
            <div className="flex items-center gap-1 text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs truncate max-w-[100px]">
                {provider.location_area || provider.location_city}
              </span>
            </div>

            {/* Distance */}
            {showDistance && provider.distance !== undefined && (
              <Badge variant="info" size="sm">
                {formatDistance(provider.distance)}
              </Badge>
            )}

            {/* Availability */}
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span
                className={`text-xs font-medium ${
                  provider.is_available ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {provider.is_available ? t(language, 'available') : t(language, 'busy')}
              </span>
            </div>

            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Starting price: Contact
            </span>
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-4 gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/provider/${provider.id}`)}
            className="rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            View
          </button>
          <button
            onClick={() => {
              if (!user) {
                navigate('/login', { state: { from: { pathname: `/provider/${provider.id}` } } });
                return;
              }
              const ids = [user.id, provider.user_id].sort();
              navigate(`/chat/${ids[0]}_${ids[1]}?providerId=${provider.id}`);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            title="Chat"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (provider.phone) window.location.href = `tel:${provider.phone}`;
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            title="Call"
          >
            <Phone className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => navigate(`/book/${provider.id}`)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-2 py-2 text-xs font-medium text-white hover:bg-blue-700"
            title="Book Now"
          >
            <Calendar className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Featured Badge */}
      {provider.is_featured && (
        <div className="absolute top-3 right-3">
          <Badge variant="warning" size="sm">
            {t(language, 'featured')}
          </Badge>
        </div>
      )}
    </Card>
  );
};
