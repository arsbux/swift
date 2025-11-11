/**
 * Matching Algorithm
 * Scores and ranks freelancers for job matching based on:
 * - Skills match (40%)
 * - Completion rate (30%)
 * - Response time (20%)
 * - Availability (10%)
 */

import { createClient } from '@/lib/supabase/client';
import type { Job, User, JobMatch, JobReview } from '@/lib/supabase/types';

export interface MatchResult {
  freelancer: User;
  matchScore: number;
  estimatedFinishTime: string;
  completionRate: number;
  averageResponseTime: number; // in hours
}

/**
 * Get completion rate for a freelancer
 */
async function getCompletionRate(freelancerId: string): Promise<number> {
  const supabase = createClient();
  
  // Get all jobs where freelancer was matched
  const { data: matches } = await supabase
    .from('job_matches')
    .select('job_id, status')
    .eq('freelancer_id', freelancerId)
    .in('status', ['accepted', 'auto_assigned']);

  if (!matches || matches.length === 0) {
    return 0.8; // Default completion rate for new freelancers
  }

  // Get reviews for these jobs
  const jobIds = matches.map(m => m.job_id);
  const { data: reviews } = await supabase
    .from('job_reviews')
    .select('met_criteria')
    .in('job_id', jobIds);

  if (!reviews || reviews.length === 0) {
    return 0.8; // Default if no reviews yet
  }

  const completed = reviews.filter(r => r.met_criteria).length;
  return completed / reviews.length;
}

/**
 * Get average response time for a freelancer (in hours)
 */
async function getAverageResponseTime(freelancerId: string): Promise<number> {
  const supabase = createClient();
  
  // Get job matches and calculate time from match creation to acceptance
  const { data: matches } = await supabase
    .from('job_matches')
    .select('created_at, accepted_at')
    .eq('freelancer_id', freelancerId)
    .not('accepted_at', 'is', null);

  if (!matches || matches.length === 0) {
    return 2; // Default 2 hours for new freelancers
  }

  const responseTimes = matches.map(m => {
    const created = new Date(m.created_at).getTime();
    const accepted = new Date(m.accepted_at!).getTime();
    return (accepted - created) / (1000 * 60 * 60); // Convert to hours
  });

  const average = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  return average;
}

/**
 * Calculate skills match score
 */
function calculateSkillsMatch(jobSkills: string[], freelancerSkills: string[]): number {
  if (freelancerSkills.length === 0) return 0;
  if (jobSkills.length === 0) return 0.5; // If no specific skills required, give base score

  const matchedSkills = jobSkills.filter(skill =>
    freelancerSkills.some(fs => fs.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(fs.toLowerCase()))
  );

  return matchedSkills.length / Math.max(jobSkills.length, 1);
}

/**
 * Map deliverable type to required skills
 */
function getRequiredSkillsForDeliverable(deliverableType: string): string[] {
  const skillMap: Record<string, string[]> = {
    landing_page: ['web development', 'html', 'css', 'javascript', 'react', 'next.js'],
    ad_1min: ['video editing', 'animation', 'motion graphics', 'adobe premiere', 'after effects'],
    bug_fix: ['debugging', 'programming', 'code review', 'testing'],
    design: ['ui design', 'ux design', 'figma', 'adobe xd', 'graphic design'],
    other: [],
  };

  return skillMap[deliverableType] || [];
}

/**
 * Match freelancers to a job
 */
export async function matchFreelancersToJob(job: Job): Promise<MatchResult[]> {
  const supabase = createClient();

  // Get required skills for the deliverable
  const requiredSkills = getRequiredSkillsForDeliverable(job.deliverable_type);

  // Query all freelancers
  const { data: freelancers, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'freelancer');

  if (error || !freelancers) {
    console.error('Error fetching freelancers:', error);
    return [];
  }

  // Calculate match scores for each freelancer
  const matchResults: MatchResult[] = [];

  for (const freelancer of freelancers) {
    // Skills match (40%)
    const skillsMatch = calculateSkillsMatch(requiredSkills, freelancer.skills || []);
    const skillsScore = skillsMatch * 0.4;

    // Completion rate (30%)
    const completionRate = await getCompletionRate(freelancer.id);
    const completionScore = completionRate * 0.3;

    // Response time (20%) - faster is better
    const avgResponseTime = await getAverageResponseTime(freelancer.id);
    const responseScore = Math.max(0, (24 - avgResponseTime) / 24) * 0.2; // Normalize to 0-1

    // Availability (10%) - assume available if no active jobs
    const { count: activeJobsCount } = await supabase
      .from('job_matches')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', freelancer.id)
      .in('status', ['accepted', 'auto_assigned'])
      .eq('job_id', job.id); // This will be 0 for new matches, but we check other active jobs
    
    // Check for other active jobs
    const { count: otherActiveJobs } = await supabase
      .from('job_matches')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', freelancer.id)
      .in('status', ['accepted', 'auto_assigned'])
      .neq('job_id', job.id);

    const availabilityScore = (otherActiveJobs || 0) === 0 ? 0.1 : 0.05; // Prefer freelancers with no active jobs

    // Total match score
    const matchScore = skillsScore + completionScore + responseScore + availabilityScore;

    // Estimate finish time (deadline - buffer)
    const deadline = new Date(job.deadline);
    const now = new Date();
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    const estimatedFinishTime = hoursUntilDeadline > 0 
      ? `${Math.ceil(hoursUntilDeadline)} hours`
      : 'ASAP';

    matchResults.push({
      freelancer,
      matchScore,
      estimatedFinishTime,
      completionRate,
      averageResponseTime: avgResponseTime,
    });
  }

  // Sort by match score (highest first) and return top 3
  return matchResults
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

