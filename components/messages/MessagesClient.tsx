'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, Card } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { User, Message } from '@/lib/supabase/types';

interface MessagesClientProps {
  conversations: { user: User; lastMessage?: Message; unreadCount?: number }[];
  currentUserId: string;
}

export default function MessagesClient({ conversations: initialConversations, currentUserId }: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const supabase = createClient();

  // Real-time updates for new messages
  useEffect(() => {
    const channel = supabase
      .channel('messages_list')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Fetch sender info
          const { data: sender } = await supabase
            .from('users')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          if (sender) {
            setConversations((prev) => {
              const existingIndex = prev.findIndex(c => c.user.id === newMsg.sender_id);
              
              if (existingIndex >= 0) {
                // Update existing conversation
                const updated = [...prev];
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  lastMessage: newMsg,
                  unreadCount: (updated[existingIndex].unreadCount || 0) + 1,
                };
                // Move to top
                return [updated[existingIndex], ...updated.slice(0, existingIndex), ...updated.slice(existingIndex + 1)];
              } else {
                // New conversation
                return [{ user: sender as User, lastMessage: newMsg, unreadCount: 1 }, ...prev];
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black lg:pl-56">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 md:mb-8">Messages</h1>
        
        {conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map(({ user, lastMessage, unreadCount }) => (
              <Link key={user.id} href={`/messages/${user.id}`}>
                <Card hover className="cursor-pointer touch-manipulation active:scale-[0.98] transition-transform">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar src={user.avatar_url} name={user.name || undefined} size="md" />
                      {unreadCount && unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h3 className={`truncate text-sm sm:text-base ${unreadCount && unreadCount > 0 ? 'font-bold text-white' : 'font-semibold text-white'}`}>
                          {user.name || 'Anonymous'}
                        </h3>
                        {lastMessage && (
                          <span className={`text-xs flex-shrink-0 ${unreadCount && unreadCount > 0 ? 'text-accent font-semibold' : 'text-gray-400'}`}>
                            {formatTime(lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className={`text-xs sm:text-sm truncate ${unreadCount && unreadCount > 0 ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {lastMessage.sender_id === currentUserId && <span className="text-gray-400">You: </span>}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-400 text-sm sm:text-base mb-2 font-medium">
                No messages yet
              </p>
              <p className="text-gray-500 text-xs sm:text-sm">
                Start a conversation from a post or profile!
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

