'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Badge } from '@/components/ui';
import { formatPrice } from '@/lib/utils/pricing';
import type { Job, Transaction, JobMatch } from '@/lib/supabase/types';

export default function AdminJobsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<(Job & { transaction?: Transaction; match?: JobMatch })[]>([]);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    checkAdmin();
    loadJobs();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
      if (!adminEmails.includes(user.email || '')) {
        router.push('/feed');
        return;
      }
    } catch (err) {
      console.error('Error checking admin:', err);
      router.push('/feed');
    }
  };

  const loadJobs = async () => {
    try {
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading jobs:', error);
        return;
      }

      // Load transactions and matches for each job
      const jobsWithDetails = await Promise.all(
        (jobsData || []).map(async (job) => {
          const [transactionData, matchData] = await Promise.all([
            supabase
              .from('transactions')
              .select('*')
              .eq('job_id', job.id)
              .single(),
            supabase
              .from('job_matches')
              .select('*')
              .eq('job_id', job.id)
              .in('status', ['accepted', 'auto_assigned'])
              .single(),
          ]);

          return {
            ...job,
            transaction: transactionData.data as Transaction | undefined,
            match: matchData.data as JobMatch | undefined,
          };
        })
      );

      setJobs(jobsWithDetails);
      setLoading(false);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setLoading(false);
    }
  };

  const verifyPayment = async (jobId: string) => {
    setVerifying(true);
    try {
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({
          status: 'paid',
          admin_verified_at: new Date().toISOString(),
        })
        .eq('job_id', jobId)
        .eq('status', 'pending');

      if (transactionError) {
        throw transactionError;
      }

      // Update job status to matched
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'matched' })
        .eq('id', jobId);

      if (jobError) {
        throw jobError;
      }

      await loadJobs();
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      alert('Failed to verify payment: ' + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, 'accent' | 'default'> = {
      completed: 'accent',
      accepted: 'accent',
      paid: 'accent',
      in_progress: 'default',
      matched: 'default',
      submitted: 'default',
      payment_pending: 'default',
      brief_complete: 'default',
      draft: 'default',
      revision_requested: 'default',
      cancelled: 'default',
      pending: 'default',
    };
    return statusColors[status] || 'default';
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Admin: Job Management</h1>
          <p className="text-gray-300">
            Manage jobs, verify payments, and handle disputes
          </p>
        </div>

        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {job.one_line_request}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                      <span>
                        <Badge variant={getStatusColor(job.status)}>
                          {job.status.replace('_', ' ')}
                        </Badge>
                      </span>
                      <span>{formatPrice(job.final_price || job.estimated_price || 0)}</span>
                      <span>Job ID: {job.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Info */}
                {job.transaction && (
                  <div className="bg-black p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-white">Payment</span>
                      <Badge variant={getStatusColor(job.transaction.status)}>
                        {job.transaction.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>Amount: {formatPrice(job.transaction.amount)}</p>
                      {job.transaction.payment_method && (
                        <p>Method: {job.transaction.payment_method}</p>
                      )}
                      {job.transaction.payment_reference && (
                        <p>Reference: {job.transaction.payment_reference}</p>
                      )}
                      {job.transaction.status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => verifyPayment(job.id)}
                          disabled={verifying}
                          className="mt-2"
                        >
                          Verify Payment
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Match Info */}
                {job.match && (
                  <div className="bg-black p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">Freelancer Match</span>
                      <Badge variant={getStatusColor(job.match.status)}>
                        {job.match.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mt-1">
                      Match Score: {Math.round(job.match.match_score * 100)}%
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/jobs/${job.id}/workroom`)}
                  >
                    View Job
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

