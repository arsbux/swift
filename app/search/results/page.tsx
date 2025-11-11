'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import PostCard from '@/components/posts/PostCard';
import FreelancerCard from '@/components/search/FreelancerCard';
import { searchFreelancersAndGigs, type SearchParams, type MatchResult } from '@/lib/ai/search';
import type { Post, User } from '@/lib/supabase/types';

export default function SearchResultsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [gigMatches, setGigMatches] = useState<MatchResult[]>([]);
  const [freelancerMatches, setFreelancerMatches] = useState<MatchResult[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      // Load search params from sessionStorage
      const stored = sessionStorage.getItem('search_params');
      if (!stored) {
        router.push('/search');
        return;
      }

      const params = JSON.parse(stored) as SearchParams;
      setSearchParams(params);

      // Perform search
      const results = await searchFreelancersAndGigs(params);
      setGigMatches(results.gigs);
      setFreelancerMatches(results.freelancers);

      setLoading(false);
    } catch (err) {
      console.error('Error loading search results:', err);
      setLoading(false);
    }
  };

  const handleMessage = async (userId: string) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Redirect to signup with redirect param
      router.push(`/signup?role=client&redirect=/messages/${userId}`);
      return;
    }

    // Navigate to messages
    router.push(`/messages/${userId}`);
  };

  const handlePostJob = () => {
    // Store search params for job creation
    if (searchParams) {
      sessionStorage.setItem('job_from_search', 'true');
      sessionStorage.setItem('one_line_request', searchParams.description);
    }
    // Redirect to simplified client signup
    router.push('/signup/client?from_search=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:ml-0">
        <div className="max-w-6xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-300">Searching for matches...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const hasMatches = gigMatches.length > 0 || freelancerMatches.length > 0;

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:ml-0">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Search Results</h1>
          {searchParams && (
            <p className="text-gray-300">
              Found {gigMatches.length} gig{gigMatches.length !== 1 ? 's' : ''} and{' '}
              {freelancerMatches.length} freelancer{freelancerMatches.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {!hasMatches ? (
          /* No Matches Found */
          <Card>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                No matches found
              </h2>
              <p className="text-gray-300 mb-6 max-w-md mx-auto">
                We couldn&apos;t find any matching freelancers or gigs right now, but we&apos;ll
                find you a match within 24 hours!
              </p>
              <Button variant="primary" size="lg" onClick={handlePostJob}>
                Create Account & Post Job
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Matching Gigs */}
            {gigMatches.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Matching Gigs ({gigMatches.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {gigMatches.map((match) => {
                    const post = match.item as Post & { user?: User };
                    return (
                      <div key={post.id} className="relative">
                        <PostCard
                          post={post}
                          currentUserId={currentUserId}
                          onMessage={handleMessage}
                        />
                        <div className="absolute top-2 right-2">
                          <span className="text-xs px-2 py-1 bg-accent text-white rounded-full font-medium">
                            {match.matchScore}% match
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matching Freelancers */}
            {freelancerMatches.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Matching Freelancers ({freelancerMatches.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {freelancerMatches.map((match) => {
                    const freelancer = match.item as User;
                    return (
                      <FreelancerCard
                        key={freelancer.id}
                        freelancer={freelancer}
                        matchScore={match.matchScore}
                        matchReason={match.matchReason}
                        onMessage={handleMessage}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Post Job CTA */}
            <Card>
              <div className="text-center py-6">
                <p className="text-gray-300 mb-4">
                  Didn&apos;t find what you&apos;re looking for?
                </p>
                <Button variant="outline" onClick={handlePostJob} className="border-gray-700 text-white hover:border-accent hover:text-accent">
                  Create Account & Post Job - We&apos;ll find a match within 24 hours
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

