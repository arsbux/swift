import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils/auth';
import MessagesClient from '@/components/messages/MessagesClient';
import type { User, Message } from '@/lib/supabase/types';

export default async function MessagesPage() {
  await requireAuth();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get all unique conversations
  const { data: sentMessages } = await supabase
    .from('messages')
    .select('receiver_id, users!messages_receiver_id_fkey(*)')
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });

  const { data: receivedMessages } = await supabase
    .from('messages')
    .select('sender_id, users!messages_sender_id_fkey(*)')
    .eq('receiver_id', user.id)
    .order('created_at', { ascending: false });

  // Combine and deduplicate conversations
  const conversations = new Map<string, { user: User; lastMessage?: Message }>();

  sentMessages?.forEach((msg: any) => {
    if (msg.users && !conversations.has(msg.receiver_id)) {
      conversations.set(msg.receiver_id, { user: msg.users });
    }
  });

  receivedMessages?.forEach((msg: any) => {
    if (msg.users) {
      const existing = conversations.get(msg.sender_id);
      if (!existing) {
        conversations.set(msg.sender_id, { user: msg.users });
      }
    }
  });

  // Get last message and unread count for each conversation
  for (const [userId] of conversations) {
    const { data: lastMsg } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get unread count for this conversation
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', userId)
      .eq('receiver_id', user.id)
      .is('read_at', null);

    if (lastMsg) {
      const conv = conversations.get(userId);
      if (conv) {
        conv.lastMessage = lastMsg as Message;
        (conv as any).unreadCount = unreadCount || 0;
      }
    }
  }

  // Sort conversations by last message time
  const sortedConversations = Array.from(conversations.values()).sort((a, b) => {
    const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
    const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <MessagesClient
      conversations={sortedConversations}
      currentUserId={user.id}
    />
  );
}

