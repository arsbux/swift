'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId');
  const supabase = createClient();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserName();
  }, []);

  const loadUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profile?.name) {
          setUserName(profile.name);
        }
      }
    } catch (err) {
      console.error('Error loading user name:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-8 lg:ml-0">
      <div className="max-w-2xl w-full">
        <Card>
          <div className="text-center py-8">
            {/* Success Checkmark */}
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-accent rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Welcome aboard{userName ? `, ${userName}` : ''}!
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              You&apos;re now visible to clients. Your gig is live and ready to receive messages.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {postId && (
                <Link href={`/post/${postId}`}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto min-w-[200px]">
                    View My Gig
                  </Button>
                </Link>
              )}
              <Link href="/feed">
                <Button variant="outline" size="lg" className="w-full sm:w-auto min-w-[200px]">
                  Browse Feed
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

