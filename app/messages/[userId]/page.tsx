import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils/auth';
import ChatClient from '@/components/messages/ChatClient';
import { notFound, redirect } from 'next/navigation';
import type { User, Message } from '@/lib/supabase/types';

export default async function ChatPage({ params }: { params: { userId: string } }) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    // Redirect to signup with redirect param
    redirect(`/signup?role=client&redirect=/messages/${params.userId}`);
  }

  // Get the other user
  const { data: otherUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.userId)
    .single();

  if (!otherUser) {
    notFound();
  }

  // Get messages between current user and other user
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sender_id_fkey(*),
      receiver:users!messages_receiver_id_fkey(*)
    `)
    .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${currentUser.id})`)
    .order('created_at', { ascending: true });

  // Mark messages as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('receiver_id', currentUser.id)
    .eq('sender_id', params.userId)
    .is('read_at', null);

  return (
    <ChatClient
      initialMessages={(messages as (Message & { sender: User; receiver: User })[]) || []}
      otherUser={otherUser as User}
      currentUserId={currentUser.id}
    />
  );
}

