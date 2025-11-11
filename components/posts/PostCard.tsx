'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import type { Post, User } from '@/lib/supabase/types';

interface PostCardProps {
  post: Post & { user?: User | null };
  currentUserId?: string;
  onMessage?: (userId: string) => void;
}

export default function PostCard({ post, currentUserId, onMessage }: PostCardProps) {
  const router = useRouter();
  const isOwnPost = post.user_id === currentUserId;
  const user = post.user;
  const skills = user?.skills || [];

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking on a link or button, don't navigate
    if ((e.target as HTMLElement).closest('a, button')) {
      return;
    }
    // If it's a job (project type posted by a client), navigate to job detail page
    if (post.type === 'project' && user?.role === 'client') {
      router.push(`/jobs/${post.id}`);
    } else {
      router.push(`/post/${post.id}`);
    }
  };

  // Removed debug logging - onboarding now saves data directly

  // Determine display name
  const displayName = user?.name 
    ? user.name.trim() 
    : user?.email 
      ? user.email.split('@')[0] 
      : 'Anonymous';

  // Determine avatar
  const avatarUrl = user?.avatar_url || null;
  const avatarName = user?.name || user?.email?.split('@')[0] || undefined;

  return (
    <Card 
      hover 
      className="transition-all duration-200 hover:shadow-lg border-gray-800 cursor-pointer touch-manipulation active:scale-[0.98]"
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-4">
        {/* Header: Type, Price, Timeline */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={post.type === 'gig' ? 'accent' : 'default'} className="text-xs font-medium">
              {post.type === 'gig' ? 'Gig' : user?.role === 'client' ? 'Job' : 'Project'}
            </Badge>
            {post.price && (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">${post.price}</span>
                {post.timeline && (
                  <span className="text-sm text-gray-300 font-normal">/ {post.timeline}</span>
                )}
              </div>
            )}
            {!post.price && post.timeline && (
              <span className="text-sm text-gray-300 font-medium">{post.timeline}</span>
            )}
          </div>
          {isOwnPost && (
            <Link 
              href={`/post/${post.id}/edit`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-gray-300 hover:text-white transition-colors"
            >
              Edit
            </Link>
          )}
        </div>

        {/* Title and Description */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-accent transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
            {post.description}
          </p>
        </div>

        {/* Skills (if available) */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-xs px-2 py-1 bg-gray-800 text-white rounded-md font-medium"
              >
                {skill}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="text-xs px-2 py-1 text-gray-400">
                +{skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Footer: User and CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <Link
            href={`/profile/${post.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Avatar src={avatarUrl} name={avatarName} size="sm" />
            <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {displayName}
                </span>
                {user?.bio && (
                  <span className="text-xs text-gray-300 line-clamp-1">
                    {user.bio}
                  </span>
                )}
            </div>
          </Link>
          
          {!isOwnPost && onMessage && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMessage(post.user_id);
              }}
              className="flex-shrink-0 min-h-[44px] touch-manipulation"
            >
              Message
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
