import { supabase } from './supabase';

export interface BanStatus {
  isBanned: boolean;
  reason: string;
  until: string | null;
  isTemporary: boolean;
}

export const checkUserBan = async (userId: string): Promise<BanStatus> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_banned, ban_reason, banned_until')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return { isBanned: false, reason: '', until: null, isTemporary: false };
    }

    const now = new Date();
    const bannedUntil = data.banned_until ? new Date(data.banned_until) : null;
    
    // Check if ban is expired
    if (data.is_banned && bannedUntil && bannedUntil < now) {
      // Auto-unban expired bans
      await supabase
        .from('users')
        .update({ is_banned: false, ban_reason: '', banned_until: null })
        .eq('id', userId);
      
      return { isBanned: false, reason: '', until: null, isTemporary: false };
    }

    return {
      isBanned: data.is_banned || false,
      reason: data.ban_reason || '',
      until: data.banned_until,
      isTemporary: !!bannedUntil,
    };
  } catch (err) {
    console.error('Ban check error:', err);
    return { isBanned: false, reason: '', until: null, isTemporary: false };
  }
};

export const formatBanMessage = (banStatus: BanStatus): string => {
  if (!banStatus.isBanned) return '';

  let message = 'Your account has been suspended.';
  
  if (banStatus.reason) {
    message += `\n\nReason: ${banStatus.reason}`;
  }
  
  if (banStatus.isTemporary && banStatus.until) {
    const until = new Date(banStatus.until);
    message += `\n\nYour suspension will be lifted on ${until.toLocaleDateString()} at ${until.toLocaleTimeString()}.`;
  } else {
    message += '\n\nThis is a permanent suspension. If you believe this is an error, please contact support.';
  }
  
  return message;
};
