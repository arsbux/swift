'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Avatar, Badge } from '@/components/ui';
import Link from 'next/link';
import type { User, Post } from '@/lib/supabase/types';

interface AdminClientProps {
  initialUsers: User[];
  initialPosts: (Post & { user: User })[];
}

export default function AdminClient({ initialUsers, initialPosts }: AdminClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [users, setUsers] = useState(initialUsers);
  const [posts, setPosts] = useState(initialPosts);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This will also delete all their posts and messages.')) {
      return;
    }

    setDeleting(userId);
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } else {
      setUsers(users.filter((u) => u.id !== userId));
      setPosts(posts.filter((p) => p.user_id !== userId));
    }
    setDeleting(null);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setDeleting(postId);
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } else {
      setPosts(posts.filter((p) => p.id !== postId));
    }
    setDeleting(null);
  };

  return (
    <div className="min-h-screen bg-surface py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Admin Panel</h1>
          <Link href="/feed">
            <Button variant="ghost" size="sm" className="text-sm">Back to Feed</Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'users'
                  ? 'bg-accent text-white'
                  : 'bg-white text-primary hover:bg-surface'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                activeTab === 'posts'
                  ? 'bg-accent text-white'
                  : 'bg-white text-primary hover:bg-surface'
              }`}
            >
              Posts ({posts.length})
            </button>
          </div>
        </div>

        {activeTab === 'users' ? (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <Avatar src={user.avatar_url} name={user.name || undefined} size="md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{user.name || 'Anonymous'}</h3>
                      <p className="text-xs sm:text-sm text-text-secondary truncate">{user.email}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant={user.role === 'freelancer' ? 'accent' : 'default'} className="text-xs">
                          {user.role}
                        </Badge>
                        {user.skills?.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="default" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deleting === user.id}
                    className="text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto text-sm"
                  >
                    {deleting === user.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card key={post.id}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={post.type === 'gig' ? 'accent' : 'default'} className="text-xs sm:text-sm">
                        {post.type}
                      </Badge>
                      <Link
                        href={`/profile/${post.user_id}`}
                        className="flex items-center gap-2 hover:opacity-80"
                      >
                        <Avatar
                          src={post.user?.avatar_url}
                          name={post.user?.name || undefined}
                          size="sm"
                        />
                        <span className="text-xs sm:text-sm font-medium">{post.user?.name || 'Anonymous'}</span>
                      </Link>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-1">{post.title}</h3>
                    <p className="text-sm sm:text-base text-text-secondary mb-2 line-clamp-2">{post.description}</p>
                    <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-text-secondary">
                      {post.price && <span>${post.price}</span>}
                      {post.timeline && <span>{post.timeline}</span>}
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deleting === post.id}
                    className="text-red-600 border-red-600 hover:bg-red-50 w-full sm:w-auto text-sm"
                  >
                    {deleting === post.id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

