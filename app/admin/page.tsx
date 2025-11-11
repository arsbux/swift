import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils/auth';
import { isAdmin } from '@/lib/utils/admin';
import { redirect } from 'next/navigation';
import AdminClient from '@/components/admin/AdminClient';
import type { User, Post } from '@/lib/supabase/types';

export default async function AdminPage() {
  await requireAuth();
  
  if (!(await isAdmin())) {
    redirect('/feed');
  }

  const supabase = await createClient();

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      user:users!posts_user_id_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <AdminClient
      initialUsers={(users as User[]) || []}
      initialPosts={(posts as (Post & { user: User })[]) || []}
    />
  );
}

