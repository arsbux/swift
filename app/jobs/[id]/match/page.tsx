'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Avatar, Badge } from '@/components/ui';
import { matchFreelancersToJob } from '@/lib/utils/matching';
import type { Job, User, JobMatch } from '@/lib/supabase/types';

export default function MatchPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);

  useEffect(() => {
    loadJobAndMatches();
  }, [jobId]);

  useEffect(() => {
    if (job && matches.length > 0) {
      // Subscribe to match status changes
      const channel = supabase
        .channel(`job-matches-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'job_matches',
            filter: `job_id=eq.${jobId}`,
          },
          (payload) => {
            // Reload matches when status changes
            loadMatches();
            
            // If a match is accepted, redirect to workroom
            if (payload.new && (payload.new as any).status === 'accepted') {
              router.push(`/jobs/${jobId}/workroom`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [job, matches, jobId, router, supabase]);

  const loadJobAndMatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('client_id', user.id)
        .single();

      if (jobError || !jobData) {
        throw new Error('Job not found');
      }

      setJob(jobData as Job);
      await loadMatches();
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading job:', err);
      setError(err.message || 'Failed to load job');
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!job) return;

    try {
      // Check if matches already exist
      const { data: existingMatches } = await supabase
        .from('job_matches')
        .select('*, freelancer:users(*)')
        .eq('job_id', jobId)
        .order('match_score', { ascending: false });

      if (existingMatches && existingMatches.length > 0) {
        // Use existing matches
        setMatches(existingMatches.map((m: any) => ({
          ...m,
          freelancer: m.freelancer,
        })));
        return;
      }

      // Generate new matches
      const matchResults = await matchFreelancersToJob(job);

      if (matchResults.length === 0) {
        setError('No matching freelancers found. We\'ll assign one manually or refund.');
        return;
      }

      // Create job_match records
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 20); // 20 minute hold

      const matchRecords = await Promise.all(
        matchResults.map(async (result) => {
          const { data: matchData, error: matchError } = await supabase
            .from('job_matches')
            .insert({
              job_id: jobId,
              freelancer_id: result.freelancer.id,
              match_score: result.matchScore,
              status: 'pending',
              expires_at: expiresAt.toISOString(),
            })
            .select('*, freelancer:users(*)')
            .single();

          if (matchError) {
            console.error('Error creating match:', matchError);
            return null;
          }

          return {
            ...matchData,
            freelancer: result.freelancer,
            estimatedFinishTime: result.estimatedFinishTime,
            completionRate: result.completionRate,
          };
        })
      );

      setMatches(matchRecords.filter(Boolean));
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError(err.message || 'Failed to load matches');
    }
  };

  const handleSelectFreelancer = async (freelancerId: string) => {
    setSelecting(true);
    setError('');

    try {
      // Update match status to pending (it's already pending, but ensure it's selected)
      const { error: updateError } = await supabase
        .from('job_matches')
        .update({ status: 'pending' })
        .eq('job_id', jobId)
        .eq('freelancer_id', freelancerId);

      if (updateError) {
        throw updateError;
      }

      setSelectedMatch(freelancerId);

      // Update job status to matched
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'matched' })
        .eq('id', jobId);

      if (jobError) {
        throw jobError;
      }

      // Wait for freelancer to accept (or timeout after 20 minutes)
      // The real-time subscription will handle the redirect when accepted
      setSelecting(false);
    } catch (err: any) {
      console.error('Error selecting freelancer:', err);
      setError(err.message || 'Failed to select freelancer');
      setSelecting(false);
    }
  };

  const handleAutoAssign = async () => {
    if (matches.length === 0) return;
    
    // Auto-assign top match
    const topMatch = matches[0];
    await handleSelectFreelancer(topMatch.freelancer_id);
    
    // Also mark as auto_assigned
    await supabase
      .from('job_matches')
      .update({ status: 'auto_assigned' })
      .eq('job_id', jobId)
      .eq('freelancer_id', topMatch.freelancer_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-300">Finding the best freelancers...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-300">Job not found</p>
            <Button onClick={() => router.push('/')} className="mt-4">
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const activeMatch = matches.find(m => m.status === 'pending' || m.status === 'accepted' || m.status === 'auto_assigned');

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-2">Choose Your Freelancer</h2>
            <p className="text-gray-300">
              We&apos;ve matched you with top freelancers. Select one or auto-assign the best match.
            </p>
          </div>

          {activeMatch && activeMatch.status === 'pending' && (
            <div className="bg-accent/20 p-4 rounded-xl mb-4">
              <p className="text-sm text-white font-medium">
                We&apos;ll hold the freelancer for 20 minutes after you select. If they accept, work starts immediately.
              </p>
            </div>
          )}

          {activeMatch && activeMatch.status === 'accepted' && (
            <div className="bg-success/20 p-4 rounded-xl mb-4">
              <p className="text-sm text-success font-medium">
                ✓ Freelancer accepted! Redirecting to workroom...
              </p>
            </div>
          )}
        </Card>

        {error && (
          <Card className="mb-6">
            <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg">
              {error}
            </div>
          </Card>
        )}

        {matches.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-300 mb-4">
                No matching freelancers found at this time.
              </p>
              <p className="text-sm text-gray-300 mb-6">
                We&apos;ll assign one manually or process a refund. Admin will contact you within 30 minutes.
              </p>
              <Button onClick={() => router.push('/feed')} variant="primary">
                Go to Feed
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {matches.map((match, index) => {
                const freelancer = match.freelancer as User;
                const isSelected = selectedMatch === freelancer.id || match.status !== 'pending';
                const isTopMatch = index === 0;

                return (
                  <Card
                    key={match.id}
                    className={`relative ${isTopMatch ? 'ring-2 ring-accent' : ''}`}
                  >
                    {isTopMatch && (
                      <Badge variant="accent" className="absolute top-2 right-2">
                        Best Match
                      </Badge>
                    )}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={freelancer.avatar_url}
                          name={freelancer.name || undefined}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">
                            {freelancer.name || 'Anonymous'}
                          </h3>
                          <p className="text-xs text-gray-300 truncate">
                            {Math.round(match.match_score * 100)}% match
                          </p>
                        </div>
                      </div>

                      {freelancer.bio && (
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {freelancer.bio}
                        </p>
                      )}

                      {freelancer.skills && freelancer.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {freelancer.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-xs px-2 py-1 bg-black text-white rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Completion Rate:</span>
                          <span className="text-white font-medium">
                            {Math.round((match.completionRate || 0.8) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Est. Finish:</span>
                          <span className="text-white font-medium">
                            {match.estimatedFinishTime || '48 hours'}
                          </span>
                        </div>
                      </div>

                      {match.status === 'pending' && (
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={() => handleSelectFreelancer(freelancer.id)}
                          disabled={selecting || isSelected}
                        >
                          {isSelected ? 'Selected' : 'Choose This Freelancer'}
                        </Button>
                      )}

                      {match.status === 'accepted' && (
                        <div className="bg-success/20 p-2 rounded-lg text-center">
                          <p className="text-xs text-success font-medium">Accepted</p>
                        </div>
                      )}

                      {match.status === 'auto_assigned' && (
                        <div className="bg-accent/20 p-2 rounded-lg text-center">
                          <p className="text-xs text-accent font-medium">Auto-Assigned</p>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                  <p className="text-sm text-gray-300">
                    Or let us auto-assign the best available freelancer
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAutoAssign}
                  disabled={selecting || matches.length === 0}
                >
                  Auto-assign Best Available
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

