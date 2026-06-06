import React from 'react';
import { MapPin, Search, Users, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';

interface EmptyStateProps {
  type: 'no-providers' | 'no-results' | 'no-bookings' | 'no-chats';
  searchRadius?: number;
  onExpandSearch?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  searchRadius = 5,
  onExpandSearch,
}) => {
  const navigate = useNavigate();
  const { language } = useApp();
  const { user } = useAuth();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hire One',
          text: language === 'ur' 
            ? 'ہائر ون پر مقامی خدمات فراہم کنندگان تلاش کریں'
            : 'Find local service providers on Hire One',
          url: window.location.origin,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  if (type === 'no-providers') {
    return (
      <Card className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-10 h-10 text-gray-400" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {language === 'ur' 
            ? `${searchRadius} کلومیٹر میں کوئی فراہم کنندہ نہیں`
            : `No providers within ${searchRadius}km`}
        </h3>

        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {language === 'ur'
            ? 'آپ کے علاقے میں ابھی کوئی سروس فراہم کنندہ رجسٹرڈ نہیں ہے'
            : 'No service providers have registered in your area yet'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onExpandSearch && (
            <Button variant="outline" onClick={onExpandSearch}>
              <Search className="w-4 h-4 mr-2" />
              {language === 'ur' 
                ? `${searchRadius * 2} کلومیٹر تک تلاش کریں`
                : `Expand search to ${searchRadius * 2}km`}
            </Button>
          )}

          {user && user.role === 'customer' && (
            <Button onClick={() => navigate('/become-provider')}>
              <Users className="w-4 h-4 mr-2" />
              {language === 'ur'
                ? 'پہلے فراہم کنندہ بنیں'
                : 'Be the first provider'}
            </Button>
          )}

          <Button variant="ghost" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            {language === 'ur' ? 'دوستوں کو مدعو کریں' : 'Invite friends'}
          </Button>
        </div>
      </Card>
    );
  }

  if (type === 'no-results') {
    return (
      <Card className="text-center py-12">
        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {language === 'ur' ? 'کوئی نتیجہ نہیں' : 'No Results Found'}
        </h3>
        <p className="text-gray-500">
          {language === 'ur'
            ? 'کوئی اور تلاش کریں'
            : 'Try a different search term or filter'}
        </p>
      </Card>
    );
  }

  return null;
};

// Skeleton loader for provider cards
export const ProviderListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="flex gap-2">
                <div className="h-4 bg-gray-200 rounded w-16" />
                <div className="h-4 bg-gray-200 rounded w-12" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
