'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import type { User } from '@/lib/supabase/types';

interface FreelancerCardProps {
  freelancer: User;
  matchScore: number;
  matchReason: string;
  onMessage?: (userId: string) => void;
}

export default function FreelancerCard({
  freelancer,
  matchScore,
  matchReason,
  onMessage,
}: FreelancerCardProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleMessage = async () => {
    if (onMessage) {
      onMessage(freelancer.id);
      return;
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Redirect to signup with redirect param
      router.push(`/signup?role=client&redirect=/messages/${freelancer.id}`);
      return;
    }

    // Navigate to messages
    router.push(`/messages/${freelancer.id}`);
  };

  const handleViewProfile = () => {
    router.push(`/profile/${freelancer.id}`);
  };

  const displayName = freelancer.name || freelancer.email?.split('@')[0] || 'Anonymous';
  const skills = freelancer.skills || [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar
              src={freelancer.avatar_url}
              name={displayName}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-primary truncate">{displayName}</h3>
              <p className="text-xs text-text-secondary">Freelancer</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="accent" className="text-xs">
              {matchScore}% match
            </Badge>
          </div>
        </div>

        {/* Bio */}
        {freelancer.bio && (
          <p className="text-sm text-text-secondary line-clamp-2">
            {freelancer.bio}
          </p>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="text-xs px-2 py-1 bg-surface text-primary rounded-md"
              >
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="text-xs px-2 py-1 bg-surface text-text-secondary rounded-md">
                +{skills.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Match Reason */}
        <div className="bg-accent-light p-3 rounded-lg">
          <p className="text-xs text-text-secondary">
            <span className="font-medium text-primary">Why this match:</span>{' '}
            {matchReason}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleMessage}
          >
            Message
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  );
}

