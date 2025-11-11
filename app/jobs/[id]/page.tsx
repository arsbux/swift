'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Avatar, Badge } from '@/components/ui';
import { formatPrice } from '@/lib/utils/pricing';
import type { Job, User } from '@/lib/supabase/types';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job & { client?: User } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const { data: jobData, error } = await supabase
        .from('jobs')
        .select('*, client:users(*)')
        .eq('id', jobId)
        .single();

      if (error || !jobData) {
        console.error('Error loading job:', error);
        setLoading(false);
        return;
      }

      setJob(jobData as Job & { client?: User });
      setLoading(false);
    } catch (err) {
      console.error('Error loading job:', err);
      setLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!job?.client_id) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/signup?role=freelancer&redirect=/messages/${job.client_id}`);
      return;
    }

    router.push(`/messages/${job.client_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-300">Loading job details...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
        <div className="max-w-4xl mx-auto">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-300 mb-4">Job not found</p>
              <Button variant="outline" onClick={() => router.push('/feed')}>
                Back to Feed
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const client = job.client;
  const displayName = client?.name || client?.email?.split('@')[0] || 'Anonymous';
  const deadlineDate = new Date(job.deadline);
  const deadlineFormatted = deadlineDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/feed')}>
            ← Back to Feed
          </Button>
        </div>

        <Card>
          <div className="space-y-6">
            {/* Job Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="default" className="text-xs font-medium">
                    Job
                  </Badge>
                  {job.final_price || job.budget || job.estimated_price ? (
                    <span className="text-2xl font-bold text-white">
                      {formatPrice(job.final_price || job.budget || job.estimated_price || 0)}
                    </span>
                  ) : null}
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {job.one_line_request}
                </h1>
                <p className="text-gray-300">
                  Deadline: {deadlineFormatted}
                </p>
              </div>
            </div>

            {/* Objective */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Objective</h2>
              <p className="text-gray-300 leading-relaxed">{job.objective}</p>
            </div>

            {/* Acceptance Criteria */}
            {job.acceptance_criteria && job.acceptance_criteria.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-2">Acceptance Criteria</h2>
                <ul className="space-y-2">
                  {job.acceptance_criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <span className="text-accent mt-1">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Job Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div>
                <p className="text-xs text-gray-300 mb-1">Deliverable Type</p>
                <p className="text-sm font-medium text-white capitalize">
                  {job.deliverable_type.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-300 mb-1">Priority</p>
                <p className="text-sm font-medium text-white capitalize">
                  {job.priority}
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="pt-4 border-t border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-3">Client</h2>
              <div className="flex items-center gap-3">
                <Avatar
                  src={client?.avatar_url}
                  name={displayName}
                  size="md"
                />
                <div className="flex-1">
                  <p className="font-medium text-white">{displayName}</p>
                  {client?.bio && (
                    <p className="text-sm text-gray-300">{client.bio}</p>
                  )}
                </div>
                <Button variant="primary" onClick={handleMessage}>
                  Message Client
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

