'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui';
import type { JobChecklist } from '@/lib/supabase/types';

interface ProgressChecklistProps {
  jobId: string;
  currentUserId: string;
  isClient: boolean;
  isFreelancer: boolean;
}

export default function ProgressChecklist({
  jobId,
  currentUserId,
  isClient,
  isFreelancer,
}: ProgressChecklistProps) {
  const supabase = createClient();
  const [checklist, setChecklist] = useState<JobChecklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklist();
    
    // Subscribe to checklist changes
    const channel = supabase
      .channel(`checklist-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_checklists',
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          loadChecklist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, supabase]);

  const loadChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('job_checklists')
        .select('*')
        .eq('job_id', jobId)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error loading checklist:', error);
        return;
      }

      setChecklist(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading checklist:', err);
      setLoading(false);
    }
  };

  const toggleItem = async (itemId: string, currentStatus: boolean) => {
    if (!isFreelancer && !isClient) return; // Only freelancer or client can toggle

    try {
      const { error } = await supabase
        .from('job_checklists')
        .update({
          completed: !currentStatus,
          completed_by: !currentStatus ? currentUserId : null,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating checklist:', error);
      }
    } catch (err) {
      console.error('Error updating checklist:', err);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="py-8">
          <p className="text-text-secondary text-center">Loading checklist...</p>
        </div>
      </Card>
    );
  }

  if (checklist.length === 0) {
    return null;
  }

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  return (
    <Card>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-primary">Progress</h3>
          <span className="text-sm text-text-secondary">
            {completedCount} / {checklist.length}
          </span>
        </div>
        <div className="w-full bg-surface rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {checklist.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(item.id, item.completed)}
              disabled={!isFreelancer && !isClient}
              className="w-5 h-5 rounded border-gray-300 text-accent focus:ring-accent cursor-pointer disabled:cursor-not-allowed"
            />
            <span className={`flex-1 text-sm ${item.completed ? 'text-text-secondary line-through' : 'text-primary'}`}>
              {item.item}
            </span>
            {item.completed && item.completed_at && (
              <span className="text-xs text-text-secondary">
                {new Date(item.completed_at).toLocaleDateString()}
              </span>
            )}
          </label>
        ))}
      </div>
    </Card>
  );
}

