'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Avatar, Badge } from '@/components/ui';
import { formatPrice } from '@/lib/utils/pricing';
import type { Job, User, JobReview, Transaction } from '@/lib/supabase/types';

export default function CompletePage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [freelancer, setFreelancer] = useState<User | null>(null);
  const [review, setReview] = useState<JobReview | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load job
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

      // Load matched freelancer
      const { data: matchData } = await supabase
        .from('job_matches')
        .select('*, freelancer:users(*)')
        .eq('job_id', jobId)
        .in('status', ['accepted', 'auto_assigned'])
        .single();

      if (matchData && matchData.freelancer) {
        setFreelancer(matchData.freelancer as User);
      }

      // Load review
      const { data: reviewData } = await supabase
        .from('job_reviews')
        .select('*')
        .eq('job_id', jobId)
        .eq('client_id', user.id)
        .single();

      if (reviewData) {
        setReview(reviewData as JobReview);
      }

      // Load transaction
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (transactionData) {
        setTransaction(transactionData as Transaction);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Message */}
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center text-3xl text-white">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Job Completed!</h1>
            <p className="text-gray-300">
              Thank you for using Swift. Your payment has been released to the freelancer.
            </p>
          </div>
        </Card>

        {/* Invoice */}
        <Card>
          <h2 className="text-lg font-semibold text-white mb-4">Invoice</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Job ID:</span>
              <span className="text-white font-mono text-sm">{job.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Deliverable:</span>
              <span className="text-white capitalize">{job.deliverable_type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Amount:</span>
              <span className="text-white font-semibold">
                {formatPrice(job.final_price || job.estimated_price || 0)}
              </span>
            </div>
            {transaction && (
              <div className="flex justify-between">
                <span className="text-gray-300">Payment Status:</span>
                <Badge variant={transaction.status === 'released' ? 'accent' : 'default'}>
                  {transaction.status}
                </Badge>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-300">Completed:</span>
              <span className="text-white">
                {new Date(job.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>

        {/* Freelancer Info */}
        {freelancer && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Freelancer</h2>
            <div className="flex items-center gap-3">
              <Avatar
                src={freelancer.avatar_url}
                name={freelancer.name || undefined}
                size="md"
              />
              <div className="flex-1">
                <p className="font-medium text-white">{freelancer.name || 'Anonymous'}</p>
                {freelancer.bio && (
                  <p className="text-sm text-gray-300 line-clamp-2">{freelancer.bio}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Review */}
        {review && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Your Review</h2>
            <div className="space-y-3">
              {review.rating && (
                <div>
                  <span className="text-gray-300">Rating: </span>
                  <span className="text-accent">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                </div>
              )}
              {review.feedback && (
                <div>
                  <p className="text-sm text-gray-300">{review.feedback}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Rebook CTA */}
        <Card>
          <div className="text-center py-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Need another deliverable?
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Book the same freelancer or find a new match
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => router.push('/')}
              >
                Create New Job
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/feed')}
              >
                Browse Feed
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

