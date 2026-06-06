import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Create Supabase client with optimized settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-client-info': 'hire-one-web',
    },
  },
  // Reduce realtime connections when not needed
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

// Helper to get public URL for storage files
export const getStorageUrl = (bucket: string, path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Helper to upload file to storage with retry
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  retries = 2
): Promise<string | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

      if (error) {
        if (attempt === retries) {
          console.error('Upload error after retries:', error);
          return null;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }

      return path;
    } catch (err) {
      if (attempt === retries) {
        console.error('Upload exception:', err);
        return null;
      }
    }
  }
  return null;
};

// Helper to delete file from storage
export const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return !error;
};

// Connection status check
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('categories').select('id').limit(1).single();
    return !error;
  } catch {
    return false;
  }
};
