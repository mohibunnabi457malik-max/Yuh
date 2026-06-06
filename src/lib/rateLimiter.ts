import { supabase } from './supabase';

type ActionType = 'message' | 'booking' | 'report' | 'review';

interface RateLimitConfig {
  maxActions: number;
  windowMinutes: number;
}

const RATE_LIMITS: Record<ActionType, RateLimitConfig> = {
  message: { maxActions: 5, windowMinutes: 1 }, // 5 messages per minute
  booking: { maxActions: 3, windowMinutes: 60 }, // 3 bookings per hour
  report: { maxActions: 3, windowMinutes: 1440 }, // 3 reports per day
  review: { maxActions: 10, windowMinutes: 60 }, // 10 reviews per hour
};

// In-memory cache for rate limiting (as backup)
const localCache: Map<string, { count: number; windowStart: number }> = new Map();

export const checkRateLimit = async (
  userId: string,
  actionType: ActionType
): Promise<{ allowed: boolean; message?: string }> => {
  const config = RATE_LIMITS[actionType];
  const cacheKey = `${userId}:${actionType}`;
  const now = Date.now();
  const windowMs = config.windowMinutes * 60 * 1000;

  // Check local cache first (faster)
  const cached = localCache.get(cacheKey);
  if (cached) {
    if (now - cached.windowStart < windowMs) {
      if (cached.count >= config.maxActions) {
        const waitMinutes = Math.ceil((windowMs - (now - cached.windowStart)) / 60000);
        return {
          allowed: false,
          message: `Too many ${actionType}s. Please wait ${waitMinutes} minute(s).`,
        };
      }
      cached.count++;
    } else {
      // Reset window
      cached.count = 1;
      cached.windowStart = now;
    }
    localCache.set(cacheKey, cached);
  } else {
    localCache.set(cacheKey, { count: 1, windowStart: now });
  }

  // Also check database for persistence
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_action_type: actionType,
      p_max_actions: config.maxActions,
      p_window_minutes: config.windowMinutes,
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fall back to local cache result
      return { allowed: true };
    }

    if (!data) {
      const waitMinutes = config.windowMinutes;
      return {
        allowed: false,
        message: `Too many ${actionType}s. Please wait up to ${waitMinutes} minute(s).`,
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('Rate limit error:', err);
    return { allowed: true }; // Allow on error to not block users
  }
};

// Clear local cache periodically
setInterval(() => {
  const now = Date.now();
  localCache.forEach((value, key) => {
    const actionType = key.split(':')[1] as ActionType;
    const windowMs = RATE_LIMITS[actionType].windowMinutes * 60 * 1000;
    if (now - value.windowStart > windowMs) {
      localCache.delete(key);
    }
  });
}, 60000); // Clean every minute
