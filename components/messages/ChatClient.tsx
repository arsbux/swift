'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, Button, Input } from '@/components/ui';
import type { User, Message } from '@/lib/supabase/types';

interface ChatClientProps {
  initialMessages: (Message & { sender: User; receiver: User })[];
  otherUser: User;
  currentUserId: string;
}

export default function ChatClient({
  initialMessages,
  otherUser,
  currentUserId,
}: ChatClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing the chat
  useEffect(() => {
    const markAsRead = async () => {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('receiver_id', currentUserId)
        .eq('sender_id', otherUser.id)
        .is('read_at', null);
    };

    markAsRead();
    // Mark as read every 2 seconds while viewing
    const interval = setInterval(markAsRead, 2000);
    return () => clearInterval(interval);
  }, [currentUserId, otherUser.id, supabase]);

  // Typing indicator handler
  const handleTyping = () => {
    const ids = [currentUserId, otherUser.id].sort();
    const channelName = `chat:${ids[0]}:${ids[1]}`;
    
    supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping: true },
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(channelName).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: false },
      });
    }, 2000);
  };

  useEffect(() => {
    // Sort UUIDs lexicographically for consistent channel naming
    const ids = [currentUserId, otherUser.id].sort();
    const channelName = `chat:${ids[0]}:${ids[1]}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUserId}))`,
        },
        async (payload) => {
          const msg = payload.new as Message;
          
          setMessages((prev) => {
            const existingIndex = prev.findIndex(m => m.id === msg.id);
            
            if (existingIndex >= 0) {
              // Update existing message (for delivered/read status updates)
              const updated = [...prev];
              updated[existingIndex] = { 
                ...msg, 
                sender: prev[existingIndex].sender, 
                receiver: prev[existingIndex].receiver 
              };
              return updated;
            }
            
            // New message - fetch user data asynchronously
            (async () => {
              const { data: sender } = await supabase
                .from('users')
                .select('*')
                .eq('id', msg.sender_id)
                .single();
              
              const { data: receiver } = await supabase
                .from('users')
                .select('*')
                .eq('id', msg.receiver_id)
                .single();

              setMessages((current) => {
                if (current.some(m => m.id === msg.id)) return current;
                return [...current, { ...msg, sender: sender as User, receiver: receiver as User }];
              });

              // Mark as delivered if this user is the receiver
              if (msg.receiver_id === currentUserId && !msg.delivered_at) {
                await supabase
                  .from('messages')
                  .update({ delivered_at: new Date().toISOString() })
                  .eq('id', msg.id);
              }
            })();
            
            return prev;
          });
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId === otherUser.id) {
          setIsTyping(payload.isTyping);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOtherUserOnline(Object.keys(state).includes(otherUser.id));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === otherUser.id) setOtherUserOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === otherUser.id) setOtherUserOnline(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [currentUserId, otherUser.id, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    const { data, error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      content: messageContent,
    }).select().single();

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    } else {
      // Message will be added via real-time subscription
      // Optimistically add it to the UI
      if (data) {
        setMessages((prev) => [
          ...prev,
          {
            ...data,
            sender: { id: currentUserId } as User,
            receiver: otherUser,
          },
        ]);
      }
    }
    setSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col lg:pl-56">
      <div className="bg-black border-b border-gray-800 sticky top-0 z-10 backdrop-blur-sm bg-black/95">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => router.push('/messages')} 
            className="text-gray-300 hover:text-white text-lg sm:text-base transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-800"
            aria-label="Back to messages"
          >
            ← <span className="hidden sm:inline">Back</span>
          </button>
          <div className="relative">
            <Avatar src={otherUser.avatar_url} name={otherUser.name || undefined} size="md" />
            {otherUserOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm sm:text-base truncate text-white">{otherUser.name || 'Anonymous'}</h2>
            {isTyping ? (
              <p className="text-xs text-accent animate-pulse">typing...</p>
            ) : otherUserOnline ? (
              <p className="text-xs text-green-500">online</p>
            ) : otherUser.bio ? (
              <p className="text-xs sm:text-sm text-gray-300 truncate hidden sm:block">{otherUser.bio}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-300 py-12 text-sm sm:text-base">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar
                          src={message.sender?.avatar_url}
                          name={message.sender?.name || undefined}
                          size="sm"
                        />
                        <span className="text-xs sm:text-sm font-medium text-white">
                          {message.sender?.name || 'Anonymous'}
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-xl px-3 sm:px-4 py-2 shadow-lg transition-all hover:shadow-xl ${
                        isOwn
                          ? 'bg-accent text-white'
                          : 'bg-gray-900 border border-gray-800 text-white'
                      }`}
                    >
                      <p className="text-sm sm:text-base break-words whitespace-pre-wrap">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={`text-xs ${
                            isOwn ? 'text-white/70' : 'text-gray-400'
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </p>
                        {isOwn && (
                          <div className="flex items-center gap-1 ml-2">
                            {message.delivered_at ? (
                              message.read_at ? (
                                <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" transform="translate(-4 -4)" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[85%] sm:max-w-xs lg:max-w-md">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar
                    src={otherUser.avatar_url}
                    name={otherUser.name || undefined}
                    size="sm"
                  />
                  <span className="text-xs sm:text-sm font-medium text-white">
                    {otherUser.name || 'Anonymous'}
                  </span>
                </div>
                <div className="rounded-xl px-4 py-3 bg-gray-900 border border-gray-800">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-black border-t border-gray-800 sticky bottom-0 backdrop-blur-sm bg-black/95">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 text-sm sm:text-base bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 focus:border-accent focus:ring-1 focus:ring-accent min-h-[44px] touch-manipulation"
              disabled={sending}
              autoComplete="off"
            />
            <Button 
              type="submit" 
              variant="primary" 
              disabled={sending || !newMessage.trim()} 
              size="sm" 
              className="text-sm sm:text-base px-4 sm:px-6 min-h-[44px] min-w-[70px] touch-manipulation"
            >
              {sending ? '...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

