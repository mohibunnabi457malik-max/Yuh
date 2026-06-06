import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
}) => {
  const baseStyles = 'animate-pulse bg-gray-200';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={style}
    />
  );
};

// Common skeleton patterns
export const ProviderCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100">
    <div className="flex items-start gap-3">
      <Skeleton variant="circular" width={56} height={56} />
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

export const CategorySkeleton: React.FC = () => (
  <div className="flex flex-col items-center gap-2">
    <Skeleton variant="circular" width={64} height={64} />
    <Skeleton className="h-4 w-16" />
  </div>
);

export const BookingCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-4 border border-gray-100">
    <div className="flex items-start gap-3">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1">
        <Skeleton className="h-5 w-40 mb-2" />
        <Skeleton className="h-4 w-28 mb-2" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  </div>
);

export const MessageSkeleton: React.FC = () => (
  <div className="flex items-start gap-3 mb-4">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="flex-1">
      <Skeleton className="h-5 w-32 mb-1" />
      <Skeleton className="h-4 w-48" />
    </div>
    <Skeleton className="h-3 w-12" />
  </div>
);
