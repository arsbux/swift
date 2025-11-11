'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, Button, Input, Card } from '@/components/ui';
import type { JobMessage, User } from '@/lib/supabase/types';

interface JobChatProps {
  jobId: string;
  currentUserId: string;
}

export default function JobChat({ jobId, currentUserId }: JobChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<(JobMessage & { sender?: User })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`job-messages-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_messages',
          filter: `job_id=eq.${jobId}`,
        },
        async (payload) => {
          const newMsg = payload.new as JobMessage;
          
          // Fetch sender data
          const { data: sender } = await supabase
            .from('users')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, sender: sender as User },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('job_messages')
        .select('*, sender:users(*)')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('job_messages')
        .insert({
          job_id: jobId,
          sender_id: currentUserId,
          content: messageContent,
        });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && message.sender && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar
                        src={message.sender.avatar_url}
                        name={message.sender.name || undefined}
                        size="sm"
                      />
                      <span className="text-xs font-medium text-primary">
                        {message.sender.name || 'Anonymous'}
                      </span>
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-3 py-2 ${
                      isOwn
                        ? 'bg-accent text-white'
                        : 'bg-surface border border-gray-100 text-primary'
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    {message.file_url && (
                      <a
                        href={message.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline mt-1 block"
                      >
                        View attachment
                      </a>
                    )}
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-text-secondary'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message freelancer — ask a question or attach files"
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" variant="primary" disabled={sending || !newMessage.trim()} size="sm">
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
}

