'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Button } from '@/components/ui';
import type { JobDeliverable } from '@/lib/supabase/types';

interface DeliverableUploadProps {
  jobId: string;
  currentUserId: string;
  isFreelancer: boolean;
}

export default function DeliverableUpload({
  jobId,
  currentUserId,
  isFreelancer,
}: DeliverableUploadProps) {
  const supabase = createClient();
  const [deliverables, setDeliverables] = useState<JobDeliverable[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeliverables();

    // Subscribe to new deliverables
    const channel = supabase
      .channel(`deliverables-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_deliverables',
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          loadDeliverables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, supabase]);

  const loadDeliverables = async () => {
    try {
      const { data, error } = await supabase
        .from('job_deliverables')
        .select('*')
        .eq('job_id', jobId)
        .order('version', { ascending: false });

      if (error) {
        console.error('Error loading deliverables:', error);
        return;
      }

      setDeliverables(data || []);
    } catch (err) {
      console.error('Error loading deliverables:', err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isFreelancer) return;

    setUploading(true);
    setError('');

    try {
      // Get current version
      const maxVersion = deliverables.length > 0 
        ? Math.max(...deliverables.map(d => d.version))
        : 0;
      const newVersion = maxVersion + 1;

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}/${currentUserId}/${newVersion}-${Date.now()}.${fileExt}`;
      const filePath = `job-deliverables/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('job-deliverables')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-deliverables')
        .getPublicUrl(filePath);

      // Create deliverable record
      const { error: dbError } = await supabase
        .from('job_deliverables')
        .insert({
          job_id: jobId,
          uploaded_by: currentUserId,
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size,
          version: newVersion,
          is_final: false,
        });

      if (dbError) {
        throw dbError;
      }

      // Clear file input
      e.target.value = '';
    } catch (err: any) {
      console.error('Error uploading deliverable:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!isFreelancer || deliverables.length === 0) return;

    setUploading(true);
    try {
      // Mark latest deliverable as final
      const latest = deliverables[0];
      const { error: updateError } = await supabase
        .from('job_deliverables')
        .update({ is_final: true })
        .eq('id', latest.id);

      if (updateError) {
        throw updateError;
      }

      // Update job status to submitted
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ status: 'submitted' })
        .eq('id', jobId);

      if (jobError) {
        throw jobError;
      }

      alert('Deliverable submitted for review!');
    } catch (err: any) {
      console.error('Error submitting for review:', err);
      setError(err.message || 'Failed to submit for review');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-primary mb-2">Deliverables</h3>
        <p className="text-xs text-text-secondary">
          Upload the final files and screenshots here. We store versions.
        </p>
      </div>

      {isFreelancer && (
        <div className="mb-4">
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent-hover file:cursor-pointer cursor-pointer disabled:opacity-50"
          />
          {uploading && (
            <p className="text-xs text-accent mt-1">Uploading...</p>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {deliverables.length > 0 ? (
        <div className="space-y-2">
          {deliverables.map((deliverable) => (
            <div
              key={deliverable.id}
              className="flex items-center justify-between p-3 bg-surface rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">
                    {deliverable.file_name}
                  </span>
                  {deliverable.is_final && (
                    <span className="text-xs px-2 py-0.5 bg-accent text-white rounded">
                      Final
                    </span>
                  )}
                  <span className="text-xs text-text-secondary">
                    v{deliverable.version}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  {new Date(deliverable.created_at).toLocaleString()}
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
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary text-center py-4">
          No deliverables uploaded yet
        </p>
      )}

      {isFreelancer && deliverables.length > 0 && (
        <Button
          variant="primary"
          className="w-full mt-4"
          onClick={handleSubmitForReview}
          disabled={uploading || deliverables.some(d => d.is_final)}
        >
          {deliverables.some(d => d.is_final) ? 'Submitted for Review' : 'Submit for Review'}
        </Button>
      )}
    </Card>
  );
}

