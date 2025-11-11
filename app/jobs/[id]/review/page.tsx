'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Textarea, Badge } from '@/components/ui';
import { formatPrice } from '@/lib/utils/pricing';
import type { Job, JobDeliverable, JobReview } from '@/lib/supabase/types';

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState<Job | null>(null);
  const [deliverables, setDeliverables] = useState<JobDeliverable[]>([]);
  const [metCriteria, setMetCriteria] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [existingReview, setExistingReview] = useState<JobReview | null>(null);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
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

      // Load deliverables
      const { data: deliverablesData } = await supabase
        .from('job_deliverables')
        .select('*')
        .eq('job_id', jobId)
        .eq('is_final', true)
        .order('version', { ascending: false })
        .limit(1);

      if (deliverablesData && deliverablesData.length > 0) {
        setDeliverables(deliverablesData);
      }

      // Check for existing review
      const { data: reviewData } = await supabase
        .from('job_reviews')
        .select('*')
        .eq('job_id', jobId)
        .eq('client_id', user.id)
        .single();

      if (reviewData) {
        setExistingReview(reviewData as JobReview);
        setMetCriteria(reviewData.met_criteria);
        setFeedback(reviewData.feedback || '');
        setRating(reviewData.rating || null);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading job:', err);
      setError(err.message || 'Failed to load job');
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (metCriteria === null) {
      setError('Please indicate if the deliverable met the criteria');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !job) {
        throw new Error('Not authenticated');
      }

      // Get matched freelancer
      const { data: matchData } = await supabase
        .from('job_matches')
        .select('freelancer_id')
        .eq('job_id', jobId)
        .in('status', ['accepted', 'auto_assigned'])
        .single();

      if (!matchData) {
        throw new Error('Freelancer not found');
      }

      // Create or update review
      const reviewData: any = {
        job_id: jobId,
        client_id: user.id,
        freelancer_id: matchData.freelancer_id,
        met_criteria: metCriteria,
        feedback: feedback.trim() || null,
        rating: rating || null,
      };

      if (existingReview) {
        const { error: updateError } = await supabase
          .from('job_reviews')
          .update(reviewData)
          .eq('id', existingReview.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('job_reviews')
          .insert(reviewData);

        if (insertError) throw insertError;
      }

      // Update job status
      if (metCriteria) {
        // Accept - release payment and mark as completed
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ status: 'accepted' })
          .eq('id', jobId);

        if (jobError) throw jobError;

        // Release payment
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({
            status: 'released',
            released_at: new Date().toISOString(),
          })
          .eq('job_id', jobId)
          .eq('status', 'paid');

        if (transactionError) throw transactionError;

        // Mark job as completed
        await supabase
          .from('jobs')
          .update({ status: 'completed' })
          .eq('id', jobId);

        // Redirect to completion page
        router.push(`/jobs/${jobId}/complete`);
      } else {
        // Request revision
        const { error: jobError } = await supabase
          .from('jobs')
          .update({
            status: 'revision_requested',
            revision_count: (job.revision_count || 0) + 1,
          })
          .eq('id', jobId);

        if (jobError) throw jobError;

        // Redirect back to workroom
        router.push(`/jobs/${jobId}/workroom`);
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review');
      setSubmitting(false);
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

  const canRequestRevision = (job.revision_count || 0) < (job.max_revisions || 2);

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Review Deliverable</h2>
            <p className="text-gray-300">
              Does the deliverable meet your acceptance criteria?
            </p>
          </div>

          {/* Deliverables */}
          {deliverables.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Final Deliverable</h3>
              {deliverables.map((deliverable) => (
                <div key={deliverable.id} className="bg-black p-4 rounded-lg mb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{deliverable.file_name}</p>
                      <p className="text-xs text-gray-300">
                        Version {deliverable.version} • {new Date(deliverable.created_at).toLocaleString()}
                      </p>
                    </div>
                    <a
                      href={deliverable.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Acceptance Criteria */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Acceptance Criteria</h3>
            <ul className="space-y-2">
              {job.acceptance_criteria.map((criterion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span className="text-sm text-gray-300">{criterion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Binary Choice */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3">
              Does this meet all criteria?
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMetCriteria(true)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-colors ${
                  metCriteria === true
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-800 hover:border-accent/20'
                }`}
              >
                ✓ Yes, accept
              </button>
              <button
                type="button"
                onClick={() => setMetCriteria(false)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-colors ${
                  metCriteria === false
                    ? 'border-red-500 bg-red-900/300 text-white'
                    : 'border-gray-800 hover:border-red-500/20'
                }`}
              >
                ✗ No, request revision
              </button>
            </div>
            {metCriteria === false && !canRequestRevision && (
              <p className="text-xs text-red-400 mt-2">
                Maximum revisions reached ({job.max_revisions}). Please contact support.
              </p>
            )}
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Feedback (optional)
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts on the deliverable..."
              rows={4}
            />
          </div>

          {/* Rating */}
          {metCriteria === true && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">
                Rating (optional)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-10 h-10 rounded-lg border-2 transition-colors ${
                      rating && star <= rating
                        ? 'border-accent bg-accent text-white'
                        : 'border-gray-800 hover:border-accent/20'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-accent/20 p-4 rounded-xl mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Escrow Amount:</span>
              <span className="text-lg font-semibold text-white">
                {formatPrice(job.final_price || job.estimated_price || 0)}
              </span>
            </div>
            {metCriteria === true && (
              <p className="text-xs text-gray-300">
                Payment will be released to the freelancer upon acceptance.
              </p>
            )}
            {metCriteria === false && canRequestRevision && (
              <p className="text-xs text-gray-300">
                Revision {job.revision_count + 1} of {job.max_revisions} will be requested.
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleAccept}
              className="flex-1"
              disabled={submitting || metCriteria === null || (metCriteria === false && !canRequestRevision)}
            >
              {submitting
                ? 'Processing...'
                : metCriteria === true
                ? 'Accept & Release Payment'
                : 'Request Revision'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

