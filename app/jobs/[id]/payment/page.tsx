'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import { formatPrice } from '@/lib/utils/pricing';
import type { PaymentMethod, TransactionStatus } from '@/lib/supabase/types';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState<any>(null);
  const [transaction, setTransaction] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

  useEffect(() => {
    loadJob();
  }, [jobId]);

  useEffect(() => {
    if (job && transaction) {
      // Subscribe to transaction status changes
      const channel = supabase
        .channel(`transaction-${transaction.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transactions',
            filter: `id=eq.${transaction.id}`,
          },
          (payload) => {
            const updated = payload.new as any;
            setTransaction(updated);
            
            // If payment is verified, redirect to match page
            if (updated.status === 'paid') {
              router.push(`/jobs/${jobId}/match`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [job, transaction, jobId, router, supabase]);

  const loadJob = async () => {
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

      setJob(jobData);

      // Check if transaction already exists
      const { data: transactionData } = await supabase
        .from('transactions')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (transactionData) {
        setTransaction(transactionData);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error loading job:', err);
      setError(err.message || 'Failed to load job');
      setLoading(false);
    }
  };

  const generatePaymentReference = () => {
    return `SWF-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const getPaymentInstructions = (method: PaymentMethod): string => {
    switch (method) {
      case 'paypal':
        return 'Send payment to: paypal@swift.com\nInclude reference in payment notes.';
      case 'mobile_money':
        return 'Send to: +1234567890\nReference: [Will be shown after submission]';
      case 'bank_transfer':
        return 'Account: 123456789\nBank: Swift Bank\nReference: [Will be shown after submission]';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const paymentReference = generatePaymentReference();

      // Create transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          job_id: jobId,
          client_id: user.id,
          amount: job.final_price,
          status: 'pending',
          payment_method: paymentMethod,
          payment_reference: paymentReference,
        })
        .select()
        .single();

      if (transactionError) {
        throw transactionError;
      }

      // Update job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'payment_pending' })
        .eq('id', jobId);

      if (jobError) {
        throw jobError;
      }

      setTransaction(transactionData);
      setSubmitting(false);
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message || 'Failed to create transaction. Please try again.');
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

  const escrowAmount = job.final_price || job.estimated_price || 0;
  const isPaid = transaction?.status === 'paid';
  const isPending = transaction?.status === 'pending';

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Payment & Escrow</h2>
            <p className="text-gray-300">
              Secure your freelancer by placing payment in escrow
            </p>
          </div>

          {isPaid ? (
            <div className="space-y-6">
              <div className="bg-success/20 p-4 rounded-xl">
                <p className="text-sm font-medium text-success">
                  ✓ Payment verified! Redirecting to match freelancers...
                </p>
              </div>
            </div>
          ) : isPending ? (
            <div className="space-y-6">
              <div className="bg-accent/20 p-4 rounded-xl">
                <p className="text-sm font-medium text-white mb-2">
                  Escrow Status: <span className="text-accent">Pending</span>
                </p>
                <p className="text-xs text-gray-300">
                  Follow the payment instructions below. Admin will verify within 30 minutes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Payment Instructions</h3>
                <div className="bg-black p-4 rounded-lg border border-gray-800">
                  <p className="text-sm text-gray-300 mb-2">
                    {getPaymentInstructions(transaction.payment_method)}
                  </p>
                  <p className="text-sm font-mono text-white">
                    Reference: {transaction.payment_reference}
                  </p>
                </div>
              </div>

              <div className="bg-black p-4 rounded-xl">
                <p className="text-xs text-gray-300">
                  We hold your payment in escrow until you accept the final deliverable. This protects both sides.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Escrow Amount: {formatPrice(escrowAmount)}
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {(['paypal', 'mobile_money', 'bank_transfer'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                        paymentMethod === method
                          ? 'border-accent bg-accent text-white'
                          : 'border-gray-800 hover:border-accent/20'
                      }`}
                    >
                      <span className="font-medium capitalize">
                        {method === 'paypal' ? 'PayPal' : method === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod && (
                <div className="bg-black p-4 rounded-xl">
                  <p className="text-sm text-gray-300">
                    {getPaymentInstructions(paymentMethod)}
                  </p>
                </div>
              )}

              <div className="bg-accent/20 p-4 rounded-xl">
                <p className="text-xs text-gray-300">
                  We hold your payment in escrow until you accept the final deliverable. This protects both sides.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg">
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
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={submitting || !paymentMethod}
                >
                  {submitting ? 'Creating...' : 'Lock freelancer (pay escrow)'}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

