import React from 'react';
import { CheckCircle, Shield, Star, AlertCircle, Clock } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import type { Provider } from '../../types';

interface VerificationBadgesProps {
  provider: Provider;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export const VerificationBadges: React.FC<VerificationBadgesProps> = ({
  provider,
  size = 'md',
  showLabels = false,
}) => {
  const { language } = useApp();

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const badges = [
    {
      show: provider.is_cnic_verified,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      label: language === 'ur' ? 'شناخت تصدیق شدہ' : 'ID Verified',
    },
    {
      show: provider.is_selfie_verified,
      icon: CheckCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      label: language === 'ur' ? 'سیلفی تصدیق شدہ' : 'Selfie Verified',
    },
    {
      show: provider.is_background_checked,
      icon: Shield,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      label: language === 'ur' ? 'پس منظر جانچا گیا' : 'Background Checked',
    },
    {
      show: provider.is_featured && (!provider.featured_expires_at || new Date(provider.featured_expires_at) > new Date()),
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      label: language === 'ur' ? 'نمایاں' : 'Featured',
    },
    {
      show: provider.is_emergency_available,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100',
      label: language === 'ur' ? '24/7 دستیاب' : '24/7 Available',
    },
  ];

  const visibleBadges = badges.filter((b) => b.show);

  if (visibleBadges.length === 0) {
    // Show pending verification status if no badges
    if (provider.verification_status === 'pending') {
      return (
        <div className="flex items-center gap-1 text-yellow-600">
          <AlertCircle className={sizeClasses[size]} />
          {showLabels && (
            <span className="text-xs font-medium">
              {language === 'ur' ? 'تصدیق زیر التواء' : 'Verification Pending'}
            </span>
          )}
        </div>
      );
    }
    return null;
  }

  if (!showLabels) {
    // Compact badge display
    return (
      <div className="flex items-center gap-1">
        {visibleBadges.map((badge, index) => (
          <badge.icon
            key={index}
            className={`${sizeClasses[size]} ${badge.color}`}
            fill="currentColor"
          />
        ))}
      </div>
    );
  }

  // Full badge display with labels
  return (
    <div className="flex flex-wrap gap-2">
      {visibleBadges.map((badge, index) => (
        <div
          key={index}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badge.bgColor}`}
        >
          <badge.icon className={`${sizeClasses[size]} ${badge.color}`} fill="currentColor" />
          <span className={`text-xs font-medium ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Verification status badge
export const VerificationStatusBadge: React.FC<{ status: Provider['verification_status'] }> = ({ status }) => {
  const { language } = useApp();

  const config = {
    not_submitted: {
      color: 'bg-gray-100 text-gray-600',
      label: language === 'ur' ? 'جمع نہیں کیا' : 'Not Submitted',
    },
    pending: {
      color: 'bg-yellow-100 text-yellow-700',
      label: language === 'ur' ? 'زیر التواء' : 'Pending Review',
    },
    approved: {
      color: 'bg-green-100 text-green-700',
      label: language === 'ur' ? 'منظور شدہ' : 'Approved',
    },
    rejected: {
      color: 'bg-red-100 text-red-700',
      label: language === 'ur' ? 'مسترد' : 'Rejected',
    },
  };

  const { color, label } = config[status] || config.not_submitted;

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};
