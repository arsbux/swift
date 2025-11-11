import { createClient } from '@/lib/supabase/server';
import { Avatar, Badge, Card } from '@/components/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { User, Post } from '@/lib/supabase/types';

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', params.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Avatar src={profile.avatar_url} name={profile.name || undefined} size="lg" />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{profile.name || 'Anonymous'}</h1>
              {profile.bio && (
                <p className="text-sm sm:text-base text-gray-300 mb-4">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills?.map((skill: string) => (
                  <Badge key={skill} variant="accent" className="text-xs sm:text-sm">{skill}</Badge>
                ))}
              </div>
              {profile.links && (
                <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                  {profile.links.portfolio && (
                    <a
                      href={profile.links.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      Portfolio
                    </a>
                  )}
                  {profile.links.twitter && (
                    <a
                      href={profile.links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      Twitter
                    </a>
                  )}
                  {profile.links.linkedin && (
                    <a
                      href={profile.links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Posts</h2>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: Post) => (
                <Card key={post.id} hover>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={post.type === 'gig' ? 'accent' : 'default'} className="text-xs sm:text-sm">
                          {post.type === 'gig' ? 'Gig' : 'Project'}
                        </Badge>
                        {post.price && (
                          <span className="text-sm sm:text-base text-gray-300">${post.price}</span>
                        )}
                        {post.timeline && (
                          <span className="text-xs sm:text-sm text-gray-300">• {post.timeline}</span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">{post.title}</h3>
                      <p className="text-sm sm:text-base text-gray-300 mb-4">{post.description}</p>
                      <Link
                        href={`/post/${post.id}`}
                        className="text-accent hover:underline text-sm"
                      >
                        View details →
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-gray-400 text-center py-8">No posts yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

