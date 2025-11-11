'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Avatar, Badge } from '@/components/ui';
import ProgressChecklist from '@/components/jobs/ProgressChecklist';
import DeliverableUpload from '@/components/jobs/DeliverableUpload';
import JobChat from '@/components/jobs/JobChat';
import { formatPrice } from '@/lib/utils/pricing';
import type { Job, User, JobMatch } from '@/lib/supabase/types';

export default function WorkroomPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matchedFreelancer, setMatchedFreelancer] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isFreelancer, setIsFreelancer] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    loadJob();
  }, [jobId]);

  useEffect(() => {
    if (job) {
      // Calculate time remaining
      const updateTimeRemaining = () => {
        const deadline = new Date(job.deadline);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining('Overdue');
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        }
      };

      updateTimeRemaining();
      const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [job]);

  useEffect(() => {
    if (job) {
      // Subscribe to job status changes
      const channel = supabase
        .channel(`job-${jobId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'jobs',
            filter: `id=eq.${jobId}`,
          },
          (payload) => {
            setJob(payload.new as Job);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [job, jobId, supabase]);

  const loadJob = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load current user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        setCurrentUser(userData as User);
        setIsClient(userData.role === 'client');
        setIsFreelancer(userData.role === 'freelancer');
      }

      // Load job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !jobData) {
        throw new Error('Job not found');
      }

      setJob(jobData as Job);

      // Load matched freelancer
      const { data: matchData } = await supabase
        .from('job_matches')
        .select('*, freelancer:users(*)')
        .eq('job_id', jobId)
        .in('status', ['accepted', 'auto_assigned'])
        .single();

      if (matchData && matchData.freelancer) {
        setMatchedFreelancer(matchData.freelancer as User);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading job:', err);
      setLoading(false);
    }
  };

  const initializeChecklist = async () => {
    if (!job) return;

    try {
      // Check if checklist already exists
      const { data: existing } = await supabase
        .from('job_checklists')
        .select('*')
        .eq('job_id', jobId)
        .limit(1);

      if (existing && existing.length > 0) {
        return; // Checklist already exists
      }

      // Create default checklist based on deliverable type
      const defaultItems: Record<string, string[]> = {
        landing_page: [
          'Design mockup approved',
          'Development complete',
          'Testing and QA',
          'Deployment',
        ],
        ad_1min: [
          'Script/storyboard approved',
          'Video production',
          'Editing and post-production',
          'Final review',
        ],
        bug_fix: [
          'Issue identified',
          'Fix implemented',
          'Testing completed',
          'Code review',
        ],
        design: [
          'Initial concepts',
          'Client feedback incorporated',
          'Final design approved',
          'Assets delivered',
        ],
        other: [
          'Requirements confirmed',
          'Work in progress',
          'Quality check',
          'Final delivery',
        ],
      };

      const items = defaultItems[job.deliverable_type] || defaultItems.other;

      const checklistItems = items.map((item, index) => ({
        job_id: jobId,
        item,
        completed: false,
        order: index,
      }));

      const { error } = await supabase
        .from('job_checklists')
        .insert(checklistItems);

      if (error) {
        console.error('Error creating checklist:', error);
      }
    } catch (err) {
      console.error('Error initializing checklist:', err);
    }
  };

  useEffect(() => {
    if (job && job.status === 'in_progress') {
      initializeChecklist();
    }
  }, [job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-300">Loading workroom...</p>
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

  // Check access
  const hasAccess = isClient || (isFreelancer && matchedFreelancer);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-300">You don&apos;t have access to this job</p>
            <Button onClick={() => router.push('/feed')} className="mt-4">
              Go to Feed
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{job.one_line_request}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>Status: <Badge variant={job.status === 'completed' ? 'accent' : 'default'}>{job.status}</Badge></span>
                <span>ETA: {timeRemaining}</span>
                <span>Budget: {formatPrice(job.final_price || job.estimated_price || 0)}</span>
              </div>
            </div>
            {isClient && matchedFreelancer && (
              <div className="flex items-center gap-3">
                <Avatar
                  src={matchedFreelancer.avatar_url}
                  name={matchedFreelancer.name || undefined}
                  size="md"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    {matchedFreelancer.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-300">Freelancer</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Brief */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Brief</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Objective</h3>
              <p className="text-sm text-gray-300">{job.objective}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Deliverable Type</h3>
              <p className="text-sm text-gray-300 capitalize">{job.deliverable_type.replace('_', ' ')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Acceptance Criteria</h3>
              <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                {job.acceptance_criteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Progress Checklist */}
        {job.status === 'in_progress' && (
          <ProgressChecklist
            jobId={jobId}
            currentUserId={currentUser?.id || ''}
            isClient={isClient}
            isFreelancer={isFreelancer}
          />
        )}

        {/* Deliverables */}
        {job.status === 'in_progress' && (
          <DeliverableUpload
            jobId={jobId}
            currentUserId={currentUser?.id || ''}
            isFreelancer={isFreelancer}
          />
        )}

        {/* Chat */}
        <JobChat jobId={jobId} currentUserId={currentUser?.id || ''} />

        {/* Actions */}
        {isFreelancer && job.status === 'matched' && (
          <Card>
            <Button
              variant="primary"
              className="w-full"
              onClick={async () => {
                const { error } = await supabase
                  .from('jobs')
                  .update({ status: 'in_progress' })
                  .eq('id', jobId);

                if (error) {
                  console.error('Error starting job:', error);
                }
              }}
            >
              Start Working
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

