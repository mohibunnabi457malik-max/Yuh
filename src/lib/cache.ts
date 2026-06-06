// Simple in-memory cache with expiration

interface CacheItem<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiry = Date.now() + (ttlMs || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear all cache on logout
  clearUserData(): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith('user:') || key.startsWith('provider:') || key.startsWith('bookings:')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export const cache = new SimpleCache();

// Cache keys
export const CACHE_KEYS = {
  categories: 'categories',
  userProfile: (id: string) => `user:${id}`,
  providerProfile: (id: string) => `provider:${id}`,
  providers: (lat: number, lng: number) => `providers:${lat.toFixed(2)}:${lng.toFixed(2)}`,
  providerDetail: (id: string) => `provider-detail:${id}`,
};
