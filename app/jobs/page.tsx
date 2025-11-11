'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Button, Badge } from '@/components/ui';
import { formatPrice } from '@/lib/utils/pricing';
import type { Job, Post } from '@/lib/supabase/types';

interface JobItem {
  id: string;
  title: string;
  description?: string;
  price: number | null;
  deadline?: string;
  status: string;
  type: 'job' | 'project';
  created_at: string;
}

export default function MyJobsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JobItem[]>([]);

  useEffect(() => {
    loadJobsAndProjects();
  }, []);

  const loadJobsAndProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Load jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (jobsError) {
        console.error('Error loading jobs:', jobsError);
      }

      // Load projects (posts with type='project')
      const { data: projectsData, error: projectsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'project')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
      }

      // Transform jobs to JobItem format
      const jobItems: JobItem[] = (jobsData || []).map((job) => ({
        id: job.id,
        title: job.one_line_request,
        description: job.objective,
        price: job.final_price || job.estimated_price || job.budget,
        deadline: job.deadline,
        status: job.status,
        type: 'job' as const,
        created_at: job.created_at,
      }));

      // Transform projects to JobItem format
      const projectItems: JobItem[] = (projectsData || []).map((project: Post) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        price: project.price,
        deadline: project.timeline || undefined,
        status: 'active',
        type: 'project' as const,
        created_at: project.created_at,
      }));

      // Combine and sort by created_at
      const allItems = [...jobItems, ...projectItems].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(allItems);
      setLoading(false);
    } catch (err) {
      console.error('Error loading jobs and projects:', err);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, 'accent' | 'default'> = {
      completed: 'accent',
      accepted: 'accent',
      in_progress: 'default',
      matched: 'default',
      submitted: 'default',
      payment_pending: 'default',
      brief_complete: 'default',
      draft: 'default',
      revision_requested: 'default',
      cancelled: 'default',
    };
    return statusColors[status] || 'default';
  };

  const getNextStep = (item: JobItem) => {
    if (item.type === 'project') {
      return `/post/${item.id}`;
    }
    
    // For jobs, use the existing logic
    switch (item.status) {
      case 'draft':
      case 'brief_complete':
      case 'payment_pending':
        return `/jobs/${item.id}/match`;
      case 'matched':
        return `/jobs/${item.id}/match`;
      case 'in_progress':
      case 'submitted':
      case 'revision_requested':
        return `/jobs/${item.id}/workroom`;
      case 'accepted':
        return `/jobs/${item.id}/review`;
      case 'completed':
        return `/jobs/${item.id}/complete`;
      default:
        return `/jobs/${item.id}/workroom`;
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

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">My Jobs & Projects</h1>
          <p className="text-gray-300">
            Track all your job requests and projects
          </p>
        </div>

        {items.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-300 mb-4">You haven&apos;t created any jobs or projects yet</p>
              <Button variant="primary" onClick={() => router.push('/')}>
                Create Your First Job
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {item.title}
                      </h3>
                      <Badge variant={item.type === 'project' ? 'accent' : 'default'}>
                        {item.type === 'project' ? 'Project' : 'Job'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                      {item.type === 'job' && (
                        <span>
                          <Badge variant={getStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </span>
                      )}
                      {item.price && (
                        <span>{formatPrice(item.price)}</span>
                      )}
                      {item.deadline && (
                        <span>
                          {item.type === 'job' 
                            ? new Date(item.deadline).toLocaleDateString()
                            : item.deadline
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push(getNextStep(item))}
                  >
                    {item.type === 'project' ? 'View Project' : 'View Job'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

