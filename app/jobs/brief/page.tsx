'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Input, Textarea, Button, Badge } from '@/components/ui';
import { generateBrief } from '@/lib/ai/claude';
import { calculatePriceEstimate, formatPrice, getDeadlineLabel } from '@/lib/utils/pricing';
import type { DeliverableType, JobPriority } from '@/lib/supabase/types';

export default function BriefPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [oneLineRequest, setOneLineRequest] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [jobFromSearch, setJobFromSearch] = useState(false);
  
  // Brief form state
  const [objective, setObjective] = useState('');
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('other');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>(['', '', '']);
  const [budget, setBudget] = useState('');
  const [deadlineHours, setDeadlineHours] = useState(48);
  const [priority, setPriority] = useState<JobPriority>('normal');
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  useEffect(() => {
    // Check if job is from search
    const fromSearch = sessionStorage.getItem('job_from_search');
    if (fromSearch === 'true') {
      setJobFromSearch(true);
      sessionStorage.removeItem('job_from_search');
    }

    // Load one-line request from sessionStorage
    const stored = sessionStorage.getItem('one_line_request');
    if (stored) {
      setOneLineRequest(stored);
      generateBriefFromRequest(stored);
    } else {
      // If no request, redirect back to home
      router.push('/');
    }
  }, []);

  useEffect(() => {
    // Recalculate price when deliverable type, deadline, or priority changes
    const priceEstimate = calculatePriceEstimate({
      deliverableType,
      deadlineHours,
      priority,
    });
    setEstimatedPrice(priceEstimate.estimatedPrice);
  }, [deliverableType, deadlineHours, priority]);

  const generateBriefFromRequest = async (request: string) => {
    setLoading(true);
    try {
      const brief = await generateBrief(request);
      setObjective(brief.objective);
      setDeliverableType(brief.deliverableType);
      setAcceptanceCriteria(brief.acceptanceCriteria);
      
      // Calculate initial price estimate
      const priceEstimate = calculatePriceEstimate({
        deliverableType: brief.deliverableType,
        deadlineHours: 48,
        priority: 'normal',
      });
      setEstimatedPrice(priceEstimate.estimatedPrice);
      
      setLoading(false);
    } catch (err) {
      console.error('Error generating brief:', err);
      setError('Failed to generate brief. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!objective.trim()) {
      setError('Please enter an objective');
      setSubmitting(false);
      return;
    }

    if (acceptanceCriteria.filter(c => c.trim()).length < 1) {
      setError('Please provide at least one acceptance criterion');
      setSubmitting(false);
      return;
    }

    if (!budget.trim()) {
      setError('Please enter a budget');
      setSubmitting(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Store job data temporarily and redirect to signup
        sessionStorage.setItem('pending_job', JSON.stringify({
          one_line_request: oneLineRequest,
          objective: objective.trim(),
          deliverable_type: deliverableType,
          acceptance_criteria: acceptanceCriteria.filter(c => c.trim()),
          budget: parseFloat(budget),
          deadline_hours: deadlineHours,
          priority,
          estimated_price: estimatedPrice,
        }));
        router.push('/signup?role=client&promise=24h');
        return;
      }

      // Calculate deadline timestamp
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + deadlineHours);

      // Create job
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert({
          client_id: user.id,
          one_line_request: oneLineRequest,
          objective: objective.trim(),
          deliverable_type: deliverableType,
          acceptance_criteria: acceptanceCriteria.filter(c => c.trim()),
          budget: parseFloat(budget),
          deadline: deadline.toISOString(),
          priority,
          status: 'brief_complete',
          estimated_price: estimatedPrice,
          final_price: parseFloat(budget),
        })
        .select()
        .single();

      if (jobError) {
        throw jobError;
      }

      // Clear sessionStorage
      sessionStorage.removeItem('one_line_request');
      sessionStorage.removeItem('pending_job');

      // Redirect directly to match page (skip payment for now)
      router.push(`/jobs/${job.id}/match`);
    } catch (err: any) {
      console.error('Error creating job:', err);
      setError(err.message || 'Failed to create job. Please try again.');
      setSubmitting(false);
    }
  };

  const updateCriterion = (index: number, value: string) => {
    const updated = [...acceptanceCriteria];
    updated[index] = value;
    setAcceptanceCriteria(updated);
  };

  const addCriterion = () => {
    if (acceptanceCriteria.length < 5) {
      setAcceptanceCriteria([...acceptanceCriteria, '']);
    }
  };

  const removeCriterion = (index: number) => {
    if (acceptanceCriteria.length > 1) {
      const updated = acceptanceCriteria.filter((_, i) => i !== index);
      setAcceptanceCriteria(updated);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="max-w-2xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-300">Generating your brief...</p>
          </div>
        </Card>
      </div>
    );
  }

  const priceEstimate = calculatePriceEstimate({
    deliverableType,
    deadlineHours,
    priority,
  });

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Create Your Job Post</h2>
                <p className="text-gray-300">
                  {jobFromSearch 
                    ? "We'll find you a match within 24 hours!"
                    : "We've structured your request. Review and adjust as needed."}
                </p>
              </div>

              {jobFromSearch && (
                <div className="mb-6 bg-accent/20 p-4 rounded-xl">
                  <p className="text-sm text-white font-medium">
                    ✓ We couldn&apos;t find immediate matches, but we&apos;ll find you the perfect freelancer within 24 hours!
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Objective (1 sentence)"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Clear description of what needs to be delivered"
              required
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Deliverable Type
              </label>
              <select
                value={deliverableType}
                onChange={(e) => setDeliverableType(e.target.value as DeliverableType)}
                className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                required
              >
                <option value="landing_page">Landing Page</option>
                <option value="ad_1min">1-Minute Ad/Video</option>
                <option value="bug_fix">Bug Fix</option>
                <option value="design">Design</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Collapsible Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-sm font-medium text-white mb-2"
              >
                <span>Acceptance Criteria {showAdvanced ? '(Optional)' : ''}</span>
                <svg
                  className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAdvanced && (
                <div className="space-y-2 mt-2">
                  {acceptanceCriteria.map((criterion, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={criterion}
                        onChange={(e) => updateCriterion(index, e.target.value)}
                        placeholder={`Criterion ${index + 1}`}
                        rows={2}
                        className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                      />
                      {acceptanceCriteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCriterion(index)}
                          className="text-gray-300 hover:text-white transition-colors px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {acceptanceCriteria.length < 5 && (
                    <button
                      type="button"
                      onClick={addCriterion}
                      className="text-sm text-accent hover:text-accent-hover"
                    >
                      + Add criterion
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Budget ($)
                </label>
                <Input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder={estimatedPrice.toString()}
                  min="0"
                  step="1"
                  required
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-300 mt-1">
                  Estimated: {formatPrice(estimatedPrice)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Deadline
                </label>
                <select
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  required
                >
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Priority
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPriority('normal')}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-colors ${
                    priority === 'normal'
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-700 text-white hover:border-accent/50 bg-gray-900'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('fast')}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-colors ${
                    priority === 'fast'
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-700 text-white hover:border-accent/50 bg-gray-900'
                  }`}
                >
                  Fast (+20%)
                </button>
              </div>
              {priority === 'normal' && priceEstimate.fastPrice && (
                <p className="text-xs text-gray-300 mt-2">
                  Want this faster? Toggle &quot;Fast&quot; to get matched within 1 hour ({formatPrice(priceEstimate.fastPrice)})
                </p>
              )}
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
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : jobFromSearch ? 'Post Job & Find Match' : 'Match me now'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Visual Preview Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-300 mb-1">Deliverable</p>
                  <Badge variant="accent" className="capitalize">
                    {deliverableType.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-300 mb-1">Budget</p>
                  <p className="text-lg font-semibold text-white">
                    {budget ? formatPrice(parseFloat(budget)) : formatPrice(estimatedPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-300 mb-1">Deadline</p>
                  <p className="text-sm font-medium text-white">
                    {getDeadlineLabel(deadlineHours)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-300 mb-1">Priority</p>
                  <p className="text-sm font-medium text-white capitalize">
                    {priority}
                    {priority === 'fast' && ' (+20%)'}
                  </p>
                </div>
                {showAdvanced && acceptanceCriteria.filter(c => c.trim()).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-300 mb-2">Acceptance Criteria</p>
                    <ul className="space-y-1">
                      {acceptanceCriteria.filter(c => c.trim()).map((criterion, index) => (
                        <li key={index} className="text-xs text-gray-300 flex items-start gap-2">
                          <span className="text-accent mt-0.5">•</span>
                          <span className="line-clamp-2">{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-800">
                  <div className="bg-accent/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-300 mb-1">Estimated Price</p>
                    <p className="text-lg font-bold text-white">
                      {formatPrice(estimatedPrice)}
                    </p>
                    <p className="text-xs text-gray-300 mt-1">
                      Includes 1 revision
                    </p>
                  </div>
                  {jobFromSearch && (
                    <div className="mt-3 bg-accent/20 p-3 rounded-lg">
                      <p className="text-xs font-medium text-white">
                        ⏱️ Match within 24 hours
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

