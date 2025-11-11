'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import FeedClient from '@/components/posts/FeedClient';
import type { Post, User, Job } from '@/lib/supabase/types';

// Transform job to post-like structure for display
function transformJobToPost(job: Job & { client?: User }): Post & { user: User } {
  const deadlineDate = new Date(job.deadline);
  const now = new Date();
  const hoursUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysUntilDeadline = Math.ceil(hoursUntilDeadline / 24);
  const timeline = daysUntilDeadline > 0 ? `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}` : `${hoursUntilDeadline} hour${hoursUntilDeadline !== 1 ? 's' : ''}`;

  return {
    id: job.id,
    user_id: job.client_id,
    title: job.one_line_request,
    description: job.objective,
    type: 'project' as const, // Keep as 'project' for PostCard compatibility
    price: job.final_price || job.budget || job.estimated_price,
    timeline: timeline,
    created_at: job.created_at,
    updated_at: job.updated_at,
    user: job.client || {
      id: job.client_id,
      name: null,
      email: null,
      bio: null,
      role: 'client' as const,
      skills: [],
      links: {},
      avatar_url: null,
      created_at: '',
      updated_at: '',
    } as User,
  };
}

export default function FeedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<(Post & { user: User })[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    loadFeed();
  }, [searchParams]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const type = searchParams.get('type');
      const search = searchParams.get('search');
      const sort = searchParams.get('sort') || 'newest';

      // If type is 'job', fetch from jobs table
      if (type === 'job') {
        // Fetch jobs that are available for freelancers (not completed, cancelled, or in progress)
        let jobQuery = supabase
          .from('jobs')
          .select('*, client:users(*)')
          .in('status', ['brief_complete', 'payment_pending', 'matched']);

        if (search) {
          jobQuery = jobQuery.or(
            `one_line_request.ilike.%${search}%,objective.ilike.%${search}%`
          );
        }

        // Apply sorting
        switch (sort) {
          case 'price-high':
            jobQuery = jobQuery.order('final_price', { ascending: false });
            break;
          case 'price-low':
            jobQuery = jobQuery.order('final_price', { ascending: true });
            break;
          case 'newest':
          default:
            jobQuery = jobQuery.order('created_at', { ascending: false });
            break;
        }

        const { data: jobsData, error: jobsError } = await jobQuery;

        if (jobsError) {
          console.error('Error fetching jobs:', jobsError);
          setLoading(false);
          return;
        }

        // Transform jobs to post-like structure
        const jobsAsPosts = (jobsData || []).map((job: Job & { client?: User }) => 
          transformJobToPost(job)
        );

        // Apply client-side sorting for timeline
        let sortedJobs = jobsAsPosts;
        if (sort === 'timeline-fast') {
          sortedJobs = [...jobsAsPosts].sort((a, b) => {
            const aPrice = a.price || 0;
            const bPrice = b.price || 0;
            return aPrice - bPrice; // Sort by price for timeline (lower price = faster)
          });
        }

        setPosts(sortedJobs);
        setLoading(false);
        return;
      }

      // If type is 'all', we need to fetch both posts and jobs
      if (type === 'all') {
        // Fetch posts
        let postsQuery = supabase
          .from('posts')
          .select('*');

        if (search) {
          postsQuery = postsQuery.or(
            `title.ilike.%${search}%,description.ilike.%${search}%`
          );
        }

        // Fetch jobs
        let jobsQuery = supabase
          .from('jobs')
          .select('*, client:users(*)')
          .in('status', ['brief_complete', 'payment_pending', 'matched']);

        if (search) {
          jobsQuery = jobsQuery.or(
            `one_line_request.ilike.%${search}%,objective.ilike.%${search}%`
          );
        }

        // Execute both queries
        const [postsResult, jobsResult] = await Promise.all([
          postsQuery.order('created_at', { ascending: false }),
          jobsQuery.order('created_at', { ascending: false }),
        ]);

        if (postsResult.error) {
          console.error('Error fetching posts:', postsResult.error);
        }
        if (jobsResult.error) {
          console.error('Error fetching jobs:', jobsResult.error);
        }

        // Transform jobs to posts
        const jobsAsPosts = (jobsResult.data || []).map((job: any) => {
          const transformed = transformJobToPost(job);
          // Preserve client data
          if (job.client) {
            transformed.user = job.client;
          }
          return transformed;
        });

        // Combine posts and jobs
        const allItems = [
          ...(postsResult.data || []),
          ...jobsAsPosts,
        ];

        // Fetch user data for all items
        const userIds = [...new Set(allItems.map((item: any) => item.user_id || item.client_id).filter(Boolean))];
        let users: User[] = [];
        
        if (userIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('*')
            .in('id', userIds);
          
          if (usersError) {
            console.error('Error fetching users:', usersError);
          } else {
            users = (usersData || []) as User[];
          }
        }

        // Create a map of user_id -> user for quick lookup
        const usersMap = new Map<string, User>();
        users.forEach((u: User) => {
          if (u.id) {
            usersMap.set(u.id, u);
          }
        });

        // Combine items with user data
        const itemsWithUsers = allItems.map((item: any) => {
          // If item already has user data (from transformJobToPost), use it
          if (item.user) {
            return item;
          }
          
          // Otherwise, it's a post - fetch user data
          const userId = item.user_id;
          const userData = usersMap.get(userId);
          
          return {
            ...item,
            user: userData || {
              id: userId,
              name: null,
              email: null,
              bio: null,
              role: null,
              skills: [],
              links: {},
              avatar_url: null,
              created_at: '',
              updated_at: '',
            } as User,
          };
        });

        // Apply sorting
        let sortedItems = itemsWithUsers;
        switch (sort) {
          case 'price-high':
            sortedItems = [...itemsWithUsers].sort((a, b) => (b.price || 0) - (a.price || 0));
            break;
          case 'price-low':
            sortedItems = [...itemsWithUsers].sort((a, b) => (a.price || 0) - (b.price || 0));
            break;
          case 'timeline-fast':
            sortedItems = [...itemsWithUsers].sort((a, b) => {
              const aDays = parseInt(a.timeline?.match(/\d+/)?.[0] || '999');
              const bDays = parseInt(b.timeline?.match(/\d+/)?.[0] || '999');
              return aDays - bDays;
            });
            break;
          case 'newest':
          default:
            sortedItems = [...itemsWithUsers].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            break;
        }

        setPosts(sortedItems as (Post & { user: User })[]);
        setLoading(false);
        return;
      }

      // Otherwise, fetch from posts table (for 'gig')
      let query = supabase
        .from('posts')
        .select('*');

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      // Apply sorting
      switch (sort) {
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data: postsData, error } = await query;

      if (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
        return;
      }

      // Fetch user data for all posts
      const userIds = [...new Set(postsData?.map((p: Post) => p.user_id).filter(Boolean) || [])];
      let users: User[] = [];
      
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          users = (usersData || []) as User[];
        }
      }

      // Create a map of user_id -> user for quick lookup
      const usersMap = new Map<string, User>();
      users.forEach((u: User) => {
        if (u.id) {
          usersMap.set(u.id, u);
        }
      });

      // Combine posts with user data
      const postsWithUsers = (postsData || []).map((post: Post) => {
        const userData = usersMap.get(post.user_id);
        
        return {
          ...post,
          user: userData || {
            id: post.user_id,
            name: null,
            email: null,
            bio: null,
            role: null,
            skills: [],
            links: {},
            avatar_url: null,
            created_at: '',
            updated_at: '',
          } as User,
        };
      });

      // Apply client-side sorting for timeline
      let sortedPosts = postsWithUsers;
      if (sort === 'timeline-fast') {
        sortedPosts = [...postsWithUsers].sort((a, b) => {
          const aDays = parseInt(a.timeline?.match(/\d+/)?.[0] || '999');
          const bDays = parseInt(b.timeline?.match(/\d+/)?.[0] || '999');
          return aDays - bDays;
        });
      }

      setPosts(sortedPosts as (Post & { user: User })[]);
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-800 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FeedClient
      initialPosts={posts}
      currentUserId={currentUserId}
      initialType={searchParams.get('type') || 'all'}
      initialSearch={searchParams.get('search') || ''}
      initialSort={searchParams.get('sort') || 'newest'}
    />
  );
}
