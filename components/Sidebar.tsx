'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Avatar } from '@/components/ui';
import type { User } from '@/lib/supabase/types';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load and subscribe to unread messages count
  useEffect(() => {
    if (!user) return;

    const loadUnreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .is('read_at', null);
      
      setUnreadCount(count || 0);
    };

    loadUnreadCount();

    // Subscribe to message changes for real-time unread count
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id.eq.${user.id}`,
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    // Refresh count periodically
    const interval = setInterval(loadUnreadCount, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, supabase]);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setUser(profile as User);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    window.location.href = '/';
  };

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  if (loading) {
    return null;
  }

  // Only show sidebar on desktop when user is logged in
  if (!user) {
    return null;
  }

  // Hide sidebar on onboarding pages
  if (pathname?.startsWith('/onboarding')) {
    return null;
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 bg-black border-r border-gray-800 flex-col z-40">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-800">
          <Link href="/feed" className="text-2xl font-bold text-white">
            Swift
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            href="/feed"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
              isActive('/feed')
                ? 'bg-accent text-white'
                : 'text-gray-300 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-medium">Feed</span>
          </Link>

          <Link
            href="/messages"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors relative ${
              isActive('/messages')
                ? 'bg-accent text-white'
                : 'text-gray-300 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium">Messages</span>
            {unreadCount > 0 && (
              <span className={`ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                isActive('/messages')
                  ? 'bg-white text-accent'
                  : 'bg-accent text-white'
              }`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/post/new"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
              isActive('/post/new')
                ? 'bg-accent text-white'
                : 'text-gray-300 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">Create Post</span>
          </Link>

          <Link
            href={`/profile/${user.id}`}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
              pathname === `/profile/${user.id}` || (pathname?.startsWith('/profile/') && pathname !== '/profile/edit')
                ? 'bg-accent text-white'
                : 'text-gray-300 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-medium">Profile</span>
          </Link>

          <Link
            href="/profile/edit"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
              pathname === '/profile/edit'
                ? 'bg-accent text-white'
                : 'text-gray-300 hover:bg-gray-900 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Settings</span>
          </Link>
        </nav>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <Link href={`/profile/${user.id}`}>
              <Avatar src={user.avatar_url} name={user.name || undefined} size="md" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${user.id}`}>
                <p className="text-sm font-medium text-white truncate">
                  {user.name || 'Anonymous'}
                </p>
              </Link>
              <p className="text-xs text-gray-400 truncate">
                {user.email || ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-sm text-gray-300 hover:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}

