import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { getStorageUrl } from '../../lib/supabase';
import type { Conversation, User, Provider } from '../../types';

interface MessageCardProps {
  conversation: Conversation;
  currentUserId: string;
  otherUser?: User | null;
  otherProvider?: Provider | null;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  conversation,
  currentUserId,
  otherUser,
  otherProvider,
}) => {
  const navigate = useNavigate();

  const isUser1 = conversation.user1_id === currentUserId;
  const unreadCount = isUser1 ? conversation.user1_unread : conversation.user2_unread;

  const displayName = otherProvider?.full_name || otherUser?.full_name || 'Unknown';
  const avatarUrl = otherProvider?.avatar_url || otherUser?.avatar_url;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  };

  return (
    <Card
      hoverable
      onClick={() => navigate(`/chat/${conversation.id}`)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar
          src={avatarUrl ? getStorageUrl('avatars', avatarUrl) : undefined}
          name={displayName}
          size="md"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-medium truncate ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
              {displayName}
            </h3>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTime(conversation.last_message_at)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {conversation.last_message || 'Start a conversation'}
            </p>
            {unreadCount > 0 && (
              <Badge variant="primary" size="sm" className="flex-shrink-0">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
