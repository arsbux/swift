import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/utils/auth';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Post, User } from '@/lib/supabase/types';

export default async function PostPage({ params }: { params: { id: string } }) {
  await requireAuth();
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from('posts')
    .select(`
      *,
      user:users!posts_user_id_fkey(*)
    `)
    .eq('id', params.id)
    .single();

  if (!post) {
    notFound();
  }

  const postWithUser = post as Post & { user: User };
  const isOwnPost = postWithUser.user_id === currentUser?.id;

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-4xl mx-auto">
        <Link href="/feed" className="text-accent hover:underline mb-4 inline-block text-sm sm:text-base">
          ← Back to Feed
        </Link>

        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant={postWithUser.type === 'gig' ? 'accent' : 'default'} className="text-xs sm:text-sm">
              {postWithUser.type === 'gig' ? 'Gig' : 'Project'}
            </Badge>
            {postWithUser.price && (
              <span className="text-xl sm:text-2xl font-bold text-white">${postWithUser.price}</span>
            )}
            {postWithUser.timeline && (
              <span className="text-sm sm:text-base text-gray-300">• {postWithUser.timeline}</span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{postWithUser.title}</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 whitespace-pre-wrap mb-6">
            {postWithUser.description}
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t">
            <Link
              href={`/profile/${postWithUser.user_id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1 min-w-0"
            >
              <Avatar
                src={postWithUser.user?.avatar_url}
                name={postWithUser.user?.name || undefined}
                size="md"
              />
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate">{postWithUser.user?.name || 'Anonymous'}</p>
                {postWithUser.user?.bio && (
                  <p className="text-xs sm:text-sm text-gray-300 truncate">{postWithUser.user.bio}</p>
                )}
              </div>
            </Link>

            <div className="w-full sm:w-auto">
              {isOwnPost ? (
                <Link href={`/post/${postWithUser.id}/edit`} className="block">
                  <Button variant="primary" className="w-full sm:w-auto">Edit Post</Button>
                </Link>
              ) : (
                <Link href={`/messages/${postWithUser.user_id}`} className="block">
                  <Button variant="primary" className="w-full sm:w-auto">Message</Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

