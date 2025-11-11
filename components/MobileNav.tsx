'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/lib/supabase/types';

export default function MobileNav() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
  };

  useEffect(() => {
    loadUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      .channel('unread-messages-mobile')
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  // Only show on mobile when user is logged in
  if (!user) {
    return null;
  }

  // Hide on onboarding pages and desktop
  if (pathname?.startsWith('/onboarding')) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-gray-800 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        <Link
          href="/feed"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-manipulation ${
            isActive('/feed')
              ? 'text-accent'
              : 'text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs font-medium">Feed</span>
        </Link>

        <Link
          href="/messages"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-manipulation relative ${
            isActive('/messages')
              ? 'text-accent'
              : 'text-gray-400'
          }`}
        >
          <div className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-accent text-white rounded-full text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-medium">Messages</span>
        </Link>

        <Link
          href="/post/new"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-manipulation ${
            isActive('/post/new')
              ? 'text-accent'
              : 'text-gray-400'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center -mt-2 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-medium">Post</span>
        </Link>

        <Link
          href="/search"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-manipulation ${
            isActive('/search')
              ? 'text-accent'
              : 'text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs font-medium">Search</span>
        </Link>

        <Link
          href={`/profile/${user.id}`}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-manipulation ${
            pathname === `/profile/${user.id}` || isActive('/profile/edit')
              ? 'text-accent'
              : 'text-gray-400'
          }`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

