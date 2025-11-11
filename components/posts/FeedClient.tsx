'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PostCard from './PostCard';
import { Button, Input } from '@/components/ui';
import type { Post, User } from '@/lib/supabase/types';

interface FeedClientProps {
  initialPosts: (Post & { user: User })[];
  currentUserId?: string;
  initialType: string;
  initialSearch: string;
  initialSort?: string;
}

type SortOption = 'newest' | 'price-high' | 'price-low' | 'timeline-fast';

export default function FeedClient({
  initialPosts,
  currentUserId,
  initialType,
  initialSearch,
  initialSort,
}: FeedClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState(initialPosts);
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<SortOption>((initialSort as SortOption) || 'newest');
  const [isPending, startTransition] = useTransition();

  const handleTypeChange = (newType: string) => {
    setType(newType);
    updateURL({ type: newType, search, sortBy });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL({ type, search, sortBy });
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    updateURL({ type, search, sortBy: newSort });
  };

  const updateURL = (params: { type: string; search: string; sortBy: SortOption }) => {
    startTransition(() => {
      const urlParams = new URLSearchParams();
      if (params.type !== 'all') urlParams.set('type', params.type);
      if (params.search) urlParams.set('search', params.search);
      if (params.sortBy !== 'newest') urlParams.set('sort', params.sortBy);
      router.push(`/feed?${urlParams.toString()}`);
    });
  };

  const handleMessage = (userId: string) => {
    router.push(`/messages/${userId}`);
  };

  // Posts are already sorted server-side, so we use them directly
  const sortedPosts = posts;

  return (
    <div className="min-h-screen bg-black lg:pl-56">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Top Row: Title and Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Discover Opportunities</h1>
                <p className="text-sm text-gray-300 mt-1">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'} available
                </p>
              </div>
              <Link href="/post/new" className="flex-shrink-0">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  Create Post
                </Button>
              </Link>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by skills, keywords, or services..."
                  className="w-full pr-10 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-accent transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
                {(['all', 'gig', 'job'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => handleTypeChange(filterType)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      type === filterType
                        ? 'bg-accent text-white'
                        : 'text-gray-300 hover:text-accent'
                    }`}
                  >
                    {filterType === 'all' ? 'All' : filterType === 'gig' ? 'Gigs' : 'Jobs'}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-900 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent appearance-none pr-8 transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="timeline-fast">Fastest Delivery</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    updateURL({ type, search: '', sortBy });
                  }}
                  className="text-sm text-gray-300 hover:text-accent transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {isPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-900 rounded-lg h-48" />
              </div>
            ))}
          </div>
        ) : sortedPosts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedPosts.map((post) => {
              // Ensure post has user data
              const postWithUser = {
                ...post,
                user: post.user || null,
              };
              return (
                <PostCard
                  key={post.id}
                  post={postWithUser}
                  currentUserId={currentUserId}
                  onMessage={handleMessage}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-900 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No posts found</h3>
              <p className="text-gray-300 mb-6">
                {search || type !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to create a post and start connecting'}
              </p>
              {!search && type === 'all' && (
                <Link href="/post/new">
                  <Button variant="primary">Create First Post</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
