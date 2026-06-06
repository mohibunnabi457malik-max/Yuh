// User Types
export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  role: 'customer' | 'provider' | 'admin';
  is_active: boolean;
  is_featured: boolean;
  location_city: string;
  location_area: string;
  location_lat: number;
  location_lng: number;
  is_banned: boolean;
  ban_reason: string;
  banned_until: string | null;
  accepted_privacy_terms: boolean;
  privacy_accepted_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Category Types
export interface Category {
  id: string;
  name_en: string;
  name_ur: string;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  usage_count?: number;
}

export interface CategoryRequest {
  id: string;
  requested_by: string;
  name_en: string;
  name_ur: string;
  icon: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

// Provider Types
export type VerificationStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type AvailabilityType = '24_hours' | 'daytime' | 'night' | 'custom';

export interface AvailabilityHours {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  bio: string;
  avatar_url: string;
  experience_years: number;
  categories: string[];
  location_lat: number;
  location_lng: number;
  location_area: string;
  location_city: string;
  location_address: string;
  service_range_km: number;
  service_areas: string[];
  is_available: boolean;
  is_active: boolean;
  is_featured: boolean;
  featured_expires_at: string | null;
  featured_applied_at: string | null;
  is_verified: boolean;
  // New verification fields
  cnic_front_url: string;
  cnic_back_url: string;
  selfie_url: string;
  verification_status: VerificationStatus;
  verification_notes: string;
  is_cnic_verified: boolean;
  is_selfie_verified: boolean;
  is_background_checked: boolean;
  // Availability
  availability_type: AvailabilityType;
  availability_hours: AvailabilityHours[];
  available_days: string[];
  is_emergency_available: boolean;
  // Suspension
  is_suspended: boolean;
  suspended_reason: string;
  suspended_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  // Stats
  rating: number;
  total_reviews: number;
  total_jobs: number;
  created_at: string;
  updated_at: string;
  distance?: number; // Calculated field
}

// Booking Types
export type BookingStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
export type PaymentStatus = 'pending' | 'paid';

export interface Booking {
  id: string;
  customer_id: string;
  provider_id: string;
  category: string;
  status: BookingStatus;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  photos: string[];
  payment_method: string;
  payment_status: PaymentStatus;
  amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  provider?: Provider;
  customer?: User;
}

// Message Types
export type MessageType = 'text' | 'image' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  image_url: string;
  message_type: MessageType;
  is_read: boolean;
  created_at: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string;
  last_message_at: string;
  user1_unread: number;
  user2_unread: number;
  created_at: string;
  // Joined fields
  other_user?: User;
  other_provider?: Provider;
}

// Review Types
export interface Review {
  id: string;
  booking_id: string | null;
  customer_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at: string;
  // Joined fields
  customer?: User;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  data: Record<string, unknown>;
  created_at: string;
}

// Saved Provider Types
export interface SavedProvider {
  id: string;
  user_id: string;
  provider_id: string;
  created_at: string;
  provider?: Provider;
}

// Report Types
export type ReportType = 'scam' | 'fake_profile' | 'harassment' | 'payment_issue' | 'service_quality' | 'inappropriate_content' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';
export type AdminAction = '' | 'warned' | 'suspended' | 'banned' | 'dismissed';

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_provider_id: string | null;
  report_type: ReportType;
  description: string;
  screenshot_url: string;
  status: ReportStatus;
  admin_notes: string;
  admin_action: AdminAction;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reporter?: User;
  reported_user?: User;
  reported_provider?: Provider;
}

// Local Ad Types
export interface LocalAd {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  target_lat: number;
  target_lng: number;
  radius_km: number;
  target_city: string;
  active_from: string;
  active_to: string | null;
  is_active: boolean;
  click_count: number;
  impression_count: number;
  created_by: string | null;
  created_at: string;
}

// Search History Types
export interface SearchHistory {
  id: string;
  user_id: string | null;
  query: string;
  category_id: string | null;
  result_count: number;
  location_lat: number;
  location_lng: number;
  location_city: string;
  created_at: string;
}

// Notification Token Types
export interface NotificationToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'web' | 'ios' | 'android';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Location Types
export interface LocationData {
  lat: number;
  lng: number;
  city: string;
  area: string;
  address: string;
  reference?: string;
}

export interface NearbyReference {
  id: string;
  name: string;
  type: 'mosque' | 'shop' | 'school' | 'market' | 'place';
  lat: number;
  lng: number;
  distanceKm: number;
}

// Nominatim API Response
export interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    county?: string;
    state?: string;
    country?: string;
    road?: string;
    house_number?: string;
  };
}

// Language
export type Language = 'en' | 'ur';

// Stats for Admin
export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalReviews: number;
  pendingVerifications: number;
  pendingReports: number;
  activeAds: number;
  todaySignups: number;
  todayBookings: number;
}

// Analytics
export interface AnalyticsData {
  dailyUsers: { date: string; count: number }[];
  bookingsByStatus: { status: string; count: number }[];
  topCategories: { category: string; count: number }[];
  topProviders: { provider: Provider; bookings: number }[];
  conversionRate: number;
}
