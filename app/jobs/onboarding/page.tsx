'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Input } from '@/components/ui';

export default function ClientOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is a client
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'client') {
        router.push('/feed');
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error('Error checking user:', err);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    // Store in sessionStorage and redirect to brief page
    sessionStorage.setItem('one_line_request', request.trim());
    router.push('/jobs/brief');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-300">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-white mb-4">
              Welcome to Swift
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Get a vetted freelancer for a specific deliverable — fast.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="Describe what you need in one sentence. Example: 'Landing page with email capture in 48 hours — $150'"
                className="w-full text-base"
              />
              <Button
                type="submit"
                size="lg"
                variant="primary"
                className="w-full sm:w-auto min-w-[200px] font-semibold"
                disabled={!request.trim()}
              >
                Get price & time
              </Button>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-300 mb-4">
                How it works:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div>
                  <div className="text-2xl mb-2">1</div>
                  <p className="text-sm text-gray-300">
                    Describe your need in one sentence
                  </p>
                </div>
                <div>
                  <div className="text-2xl mb-2">2</div>
                  <p className="text-sm text-gray-300">
                    Get matched with top freelancers
                  </p>
                </div>
                <div>
                  <div className="text-2xl mb-2">3</div>
                  <p className="text-sm text-gray-300">
                    Work together in a dedicated workroom
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

