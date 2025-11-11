'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Avatar } from '@/components/ui';
import type { User } from '@/lib/supabase/types';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  if (loading) {
    return null;
  }

  // Hide navbar on pages that have the sidebar
  // These are: feed, messages, post/new, post/[id], post/[id]/edit, profile/[id], profile/edit, admin
  const sidebarPages = [
    '/feed',
    '/messages',
    '/post/new',
    '/profile/edit',
    '/admin',
  ];
  
  const hasSidebar = sidebarPages.some(page => pathname === page || pathname?.startsWith(page + '/'));
  
  if (hasSidebar) {
    return null;
  }

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={user ? '/feed' : '/'} className="text-xl sm:text-2xl font-bold text-white">
            Swift
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <Link href={`/profile/${user.id}`} className="hidden sm:block">
                  <Avatar src={user.avatar_url} name={user.name || undefined} size="sm" />
                </Link>
                <Link href={`/profile/${user.id}`} className="sm:hidden">
                  <Avatar src={user.avatar_url} name={user.name || undefined} size="sm" />
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-sm">
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-sm">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm" className="text-sm">Sign up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
