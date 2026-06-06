import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, X, Flag } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Avatar } from '../components/ui/Avatar';
import { useApp } from '../store/AppContext';
import { useAuth } from '../store/AuthContext';
import { supabase, getStorageUrl, uploadFile } from '../lib/supabase';
import { t } from '../lib/translations';
import type { Message, User, Provider } from '../types';
import { ReportModal } from '../components/modals/ReportModal';

export const ChatScreen: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  
  
  const navigate = useNavigate();
  const { language } = useApp();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherProvider, setOtherProvider] = useState<Provider | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showReport, setShowReport] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchData = async () => {
      // Get other user ID from conversation ID
      const ids = conversationId.split('_');
      const otherUserId = ids.find((id) => id !== user.id);

      if (otherUserId) {
        // Fetch other user
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', otherUserId)
          .single();

        if (userData) {
          setOtherUser(userData);
        }

        // Fetch provider if exists
        const { data: providerData } = await supabase
          .from('providers')
          .select('*')
          .eq('user_id', otherUserId)
          .single();

        if (providerData) {
          setOtherProvider(providerData);
        }
      }

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(messagesData || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      // Update unread count in conversation
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convData) {
        const isUser1 = convData.user1_id === user.id;
        await supabase
          .from('conversations')
          .update({
            [isUser1 ? 'user1_unread' : 'user2_unread']: 0,
          })
          .eq('id', conversationId);
      }
    };

    fetchData();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);

          // Mark as read if we're the receiver
          if (newMsg.receiver_id === user.id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, user]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !imageFile) || !user || !conversationId) return;

    const otherUserId = conversationId.split('_').find((id) => id !== user.id);
    if (!otherUserId) return;

    setSending(true);

    try {
      let imageUrl = '';

      // Upload image if present
      if (imageFile) {
        const path = `${conversationId}/${Date.now()}_${imageFile.name}`;
        const uploaded = await uploadFile('chat-images', path, imageFile);
        if (uploaded) {
          imageUrl = uploaded;
        }
      }

      // Ensure conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .single();

      if (!existingConv) {
        // Create conversation
        const ids = conversationId.split('_').sort();
        await supabase.from('conversations').insert({
          id: conversationId,
          user1_id: ids[0],
          user2_id: ids[1],
          last_message: newMessage || 'Image',
          last_message_at: new Date().toISOString(),
          user1_unread: ids[0] === user.id ? 0 : 1,
          user2_unread: ids[1] === user.id ? 0 : 1,
        });
      }

      // Send message
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        receiver_id: otherUserId,
        content: newMessage,
        image_url: imageUrl,
        message_type: imageUrl ? 'image' : 'text',
      });

      // Update conversation
      const isUser1 = conversationId.split('_').sort()[0] === user.id;
      await supabase
        .from('conversations')
        .update({
          last_message: newMessage || 'Image',
          last_message_at: new Date().toISOString(),
          [isUser1 ? 'user2_unread' : 'user1_unread']: supabase.rpc('increment_unread'),
        })
        .eq('id', conversationId);

      // Increment unread separately
      const { data: convData } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convData) {
        const field = isUser1 ? 'user2_unread' : 'user1_unread';
        await supabase
          .from('conversations')
          .update({
            [field]: (convData[field] || 0) + 1,
          })
          .eq('id', conversationId);
      }

      setNewMessage('');
      setImageFile(null);
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const shouldShowDateHeader = (currentIndex: number) => {
    if (currentIndex === 0) return true;
    const currentDate = new Date(messages[currentIndex].created_at).toDateString();
    const prevDate = new Date(messages[currentIndex - 1].created_at).toDateString();
    return currentDate !== prevDate;
  };

  const displayName = otherProvider?.full_name || otherUser?.full_name || 'User';
  const avatarUrl = otherProvider?.avatar_url || otherUser?.avatar_url;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center h-16 gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <Avatar
              src={avatarUrl ? getStorageUrl('avatars', avatarUrl) : undefined}
              name={displayName}
              size="sm"
            />
            <div className="flex-1">
              <h1 className="font-semibold text-gray-900">{displayName}</h1>
            </div>
            <button
              onClick={() => setShowReport(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              title="Report"
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user?.id;
            const showHeader = shouldShowDateHeader(index);

            return (
              <React.Fragment key={message.id}>
                {showHeader && (
                  <div className="text-center">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {formatDateHeader(message.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {message.image_url && (
                      <img
                        src={getStorageUrl('chat-images', message.image_url)}
                        alt=""
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    {message.content && (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? 'text-blue-200' : 'text-gray-400'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Image Preview */}
      {imageFile && (
        <div className="max-w-3xl mx-auto w-full px-4">
          <div className="relative inline-block">
            <img
              src={URL.createObjectURL(imageFile)}
              alt=""
              className="h-20 rounded-lg"
            />
            <button
              onClick={() => setImageFile(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <label className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
            <ImageIcon className="w-6 h-6 text-gray-500" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(language, 'typeMessage')}
            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !imageFile) || sending}
            className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        reportedUserId={otherUser?.id}
        reportedProviderId={otherProvider?.id}
        reportedName={displayName}
      />
    </div>
  );
};
