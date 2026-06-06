import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { MessageCard } from '../components/cards/MessageCard';
import { Card } from '../components/ui/Card';
import { MessageSkeleton } from '../components/ui/Skeleton';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';
import { t } from '../lib/translations';
import type { Conversation, User, Provider } from '../types';

export const ChatListScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useApp();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;

      setLoading(true);

      try {
        const { data: convData, error } = await supabase
          .from('conversations')
          .select('*')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false });

        if (error) throw error;

        const convs = convData || [];
        setConversations(convs);

        // Get unique other user IDs
        const otherUserIds = convs.map((c) =>
          c.user1_id === user.id ? c.user2_id : c.user1_id
        );

        if (otherUserIds.length > 0) {
          // Fetch users
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .in('id', otherUserIds);

          if (userData) {
            const usersMap: Record<string, User> = {};
            userData.forEach((u) => {
              usersMap[u.id] = u;
            });
            setUsers(usersMap);
          }

          // Fetch providers
          const { data: providerData } = await supabase
            .from('providers')
            .select('*')
            .in('user_id', otherUserIds);

          if (providerData) {
            const providersMap: Record<string, Provider> = {};
            providerData.forEach((p) => {
              providersMap[p.user_id] = p;
            });
            setProviders(providersMap);
          }
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    // Subscribe to conversation updates
    const subscription = supabase
      .channel('conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {t(language, 'chats')}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <MessageSkeleton />
              </Card>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const otherUserId =
                conversation.user1_id === user?.id
                  ? conversation.user2_id
                  : conversation.user1_id;

              return (
                <MessageCard
                  key={conversation.id}
                  conversation={conversation}
                  currentUserId={user?.id || ''}
                  otherUser={users[otherUserId]}
                  otherProvider={providers[otherUserId]}
                />
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t(language, 'noChats')}
            </h3>
            <p className="text-gray-500">{t(language, 'startChatting')}</p>
          </Card>
        )}
      </main>
    </div>
  );
};
