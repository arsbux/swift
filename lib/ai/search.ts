/**
 * Claude AI Search Integration
 * Searches through gigs and freelancer profiles to find matches
 */

import { createClient } from '@/lib/supabase/client';
import type { Post, User } from '@/lib/supabase/types';

export interface SearchParams {
  description: string;
  minBudget?: number | null;
  maxBudget?: number | null;
  skillLevel?: string | null;
  category?: string | null;
  deadline?: string | null;
}

export interface MatchResult {
  item: Post | User;
  type: 'gig' | 'freelancer';
  matchScore: number;
  matchReason: string;
}

export interface SearchResults {
  gigs: MatchResult[];
  freelancers: MatchResult[];
}

/**
 * Search for matching gigs and freelancers using Claude AI
 */
export async function searchFreelancersAndGigs(
  searchParams: SearchParams
): Promise<SearchResults> {
  // Note: For client-side usage, API key should be in NEXT_PUBLIC_ANTHROPIC_API_KEY
  // For production, consider using a server-side API route instead
  const apiKey = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY 
    : process.env.ANTHROPIC_API_KEY;
  const supabase = createClient();

  try {
    // Fetch ALL posts (both gigs and projects) - Claude will analyze all of them
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*, user:users(*)')
      .order('created_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts:', postsError);
    }

    // Fetch ALL users - Claude will analyze all profiles to find relevant freelancers
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Separate posts into gigs and projects for display purposes
    const allPosts = (postsData || []) as (Post & { user?: User })[];
    const gigs = allPosts.filter(post => post.type === 'gig');
    const projects = allPosts.filter(post => post.type === 'project');
    
    // Filter to freelancers for matching (but Claude sees all users for context)
    const allUsers = (usersData || []) as User[];
    const freelancers = allUsers.filter(user => user.role === 'freelancer');

    // Use Claude to match via server-side API route (to avoid CORS issues)
    try {
      // Limit data size to avoid request timeouts
      const limitedPosts = allPosts.slice(0, 100);
      const limitedUsers = allUsers.slice(0, 100);
      const limitedGigs = gigs.slice(0, 50);
      const limitedFreelancers = freelancers.slice(0, 50);

      const requestBody = {
        searchParams,
        allPosts: limitedPosts,
        allUsers: limitedUsers,
        gigs: limitedGigs,
        freelancers: limitedFreelancers,
      };

      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search API error:', response.status, response.statusText, errorText);
        return fallbackSearch(searchParams, gigs, freelancers);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('API returned non-JSON response:', text.substring(0, 200));
        return fallbackSearch(searchParams, gigs, freelancers);
      }

      const data = await response.json();
      
      if (!data.content) {
        console.error('API response missing content:', data);
        return fallbackSearch(searchParams, gigs, freelancers);
      }
      
      // Parse Claude's response (use limited arrays for matching)
      const parsed = parseClaudeResponse(data.content, limitedPosts, limitedUsers, limitedGigs, limitedFreelancers);
      return parsed;
    } catch (error: any) {
      console.error('Error calling search API:', error);
      // If it's a JSON parse error, provide more context
      if (error instanceof SyntaxError) {
        console.error('JSON parse error - API likely returned HTML or error page');
      }
      return fallbackSearch(searchParams, gigs, freelancers);
    }
  } catch (error) {
    console.error('Error in search:', error);
    return { gigs: [], freelancers: [] };
  }
}

/**
 * Build the prompt for Claude Haiku 3
 * Reads ALL posts and ALL users to find the best matches
 */
function buildSearchPrompt(
  params: SearchParams,
  allPosts: (Post & { user?: User })[],
  allUsers: User[],
  gigs: (Post & { user?: User })[],
  freelancers: User[]
): string {
  // Include ALL posts (gigs and projects) for comprehensive analysis
  const allPostsList = allPosts
    .slice(0, 100) // Increased limit since Haiku can handle more
    .map((post, i) => {
      return `Post ${i + 1} (Type: ${post.type}):
- Title: ${post.title}
- Description: ${post.description}
- Price: $${post.price || 'Not specified'}
- Timeline: ${post.timeline || 'Not specified'}
- User: ${post.user?.name || 'Anonymous'}
- User Bio: ${post.user?.bio || 'No bio'}
- User Skills: ${post.user?.skills?.join(', ') || 'Not specified'}
- User Portfolio: ${post.user?.links?.portfolio || 'Not specified'}
- User LinkedIn: ${post.user?.links?.linkedin || 'Not specified'}`;
    })
    .join('\n\n');

  // Include ALL users for comprehensive analysis (Claude will identify relevant freelancers)
  const allUsersList = allUsers
    .slice(0, 100) // Increased limit since Haiku can handle more
    .map((user, i) => {
      return `User ${i + 1} (Role: ${user.role}):
- Name: ${user.name || 'Anonymous'}
- Email: ${user.email || 'Not specified'}
- Bio: ${user.bio || 'No bio'}
- Skills: ${user.skills?.join(', ') || 'Not specified'}
- Portfolio: ${user.links?.portfolio || 'Not specified'}
- LinkedIn: ${user.links?.linkedin || 'Not specified'}`;
    })
    .join('\n\n');

  return `You are an AI assistant helping a client find the right freelancers for their project.

CLIENT REQUEST:
"${params.description}"
${params.minBudget ? `Budget: $${params.minBudget}` : ''}${params.maxBudget ? ` - $${params.maxBudget}` : ''}
${params.skillLevel ? `Skill Level: ${params.skillLevel}` : ''}
${params.category ? `Category: ${params.category}` : ''}
${params.deadline ? `Deadline: ${params.deadline}` : ''}

YOUR TASK:
Analyze ALL the posts and ALL the users below. Find freelancers (users with role='freelancer') and gigs (posts with type='gig') that are relevant to the client's needs. Consider:
- Skills and expertise match
- Experience level
- Portfolio/work samples
- Project descriptions
- Price range compatibility
- Timeline compatibility
- Any other relevant factors

ALL POSTS (Gigs and Projects):
${allPostsList}

ALL USERS (Freelancers and Clients):
${allUsersList}

Return your analysis as JSON in this exact format:
{
  "gigs": [
    {
      "index": 0,
      "matchScore": 85,
      "matchReason": "Detailed explanation of why this gig matches the client's needs"
    }
  ],
  "freelancers": [
    {
      "index": 0,
      "matchScore": 90,
      "matchReason": "Detailed explanation of why this freelancer matches the client's needs"
    }
  ]
}

IMPORTANT:
- Only return gigs (posts with type='gig') in the "gigs" array
- Only return freelancers (users with role='freelancer') in the "freelancers" array
- Use the index from the ALL POSTS list for gigs
- Use the index from the ALL USERS list for freelancers (but only include those with role='freelancer')
- Match scores should be 0-100
- Provide specific, detailed match reasons
- Return up to 10 best matches for each category
- Only return the JSON, no other text`;
}

/**
 * Parse Claude Haiku 3's response
 * Maps indices from allPosts and allUsers arrays to actual gigs and freelancers
 */
function parseClaudeResponse(
  content: string,
  allPosts: (Post & { user?: User })[],
  allUsers: User[],
  gigs: (Post & { user?: User })[],
  freelancers: User[]
): SearchResults {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackSearch(
        { description: '' },
        gigs,
        freelancers
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const results: SearchResults = {
      gigs: [],
      freelancers: [],
    };

    // Map gig matches - Claude returns indices from allPosts, we need to find the corresponding gig
    if (parsed.gigs && Array.isArray(parsed.gigs)) {
      const gigMatches: MatchResult[] = parsed.gigs
        .filter((match: { index: number; matchScore?: number; matchReason?: string }) => match.index >= 0 && match.index < allPosts.length)
        .map((match: { index: number; matchScore?: number; matchReason?: string }): MatchResult | null => {
          const post = allPosts[match.index];
          // Only include if it's actually a gig
          if (post.type === 'gig') {
            return {
              item: post,
              type: 'gig' as const,
              matchScore: Math.min(100, Math.max(0, match.matchScore || 0)),
              matchReason: match.matchReason || 'Good match for your requirements',
            };
          }
          return null;
        })
        .filter((match: MatchResult | null): match is MatchResult => match !== null)
        .sort((a: MatchResult, b: MatchResult) => b.matchScore - a.matchScore)
        .slice(0, 10);
      
      results.gigs = gigMatches;
    }

    // Map freelancer matches - Claude returns indices from allUsers, we need to find the corresponding freelancer
    if (parsed.freelancers && Array.isArray(parsed.freelancers)) {
      const freelancerMatches: MatchResult[] = parsed.freelancers
        .filter((match: { index: number; matchScore?: number; matchReason?: string }) => match.index >= 0 && match.index < allUsers.length)
        .map((match: { index: number; matchScore?: number; matchReason?: string }): MatchResult | null => {
          const user = allUsers[match.index];
          // Only include if it's actually a freelancer
          if (user.role === 'freelancer') {
            return {
              item: user,
              type: 'freelancer' as const,
              matchScore: Math.min(100, Math.max(0, match.matchScore || 0)),
              matchReason: match.matchReason || 'Good match for your requirements',
            };
          }
          return null;
        })
        .filter((match: MatchResult | null): match is MatchResult => match !== null)
        .sort((a: MatchResult, b: MatchResult) => b.matchScore - a.matchScore)
        .slice(0, 10);
      
      results.freelancers = freelancerMatches;
    }

    return results;
  } catch (error) {
    console.error('Error parsing Claude response:', error);
    return fallbackSearch({ description: '' }, gigs, freelancers);
  }
}

/**
 * Fallback rule-based search when Claude is unavailable
 */
function fallbackSearch(
  params: SearchParams,
  gigs: (Post & { user?: User })[],
  freelancers: User[]
): SearchResults {
  const descriptionLower = params.description.toLowerCase();
  const results: SearchResults = {
    gigs: [],
    freelancers: [],
  };

  // Simple keyword matching for gigs
  gigs.forEach((gig) => {
    const titleMatch = gig.title.toLowerCase().includes(descriptionLower) ? 30 : 0;
    const descMatch = gig.description.toLowerCase().includes(descriptionLower) ? 40 : 0;
    const priceMatch = params.minBudget && gig.price
      ? (gig.price >= params.minBudget && (!params.maxBudget || gig.price <= params.maxBudget)) ? 20 : 0
      : 10;
    const skillMatch = gig.user?.skills?.some((skill) =>
      descriptionLower.includes(skill.toLowerCase())
    ) ? 10 : 0;

    const score = titleMatch + descMatch + priceMatch + skillMatch;
    if (score > 20) {
      results.gigs.push({
        item: gig,
        type: 'gig',
        matchScore: Math.min(100, score),
        matchReason: 'Matches your search criteria',
      });
    }
  });

  // Simple keyword matching for freelancers
  freelancers.forEach((freelancer) => {
    const bioMatch = freelancer.bio?.toLowerCase().includes(descriptionLower) ? 40 : 0;
    const skillMatch = freelancer.skills?.some((skill) =>
      descriptionLower.includes(skill.toLowerCase())
    ) ? 50 : 0;
    const nameMatch = freelancer.name?.toLowerCase().includes(descriptionLower) ? 10 : 0;

    const score = bioMatch + skillMatch + nameMatch;
    if (score > 20) {
      results.freelancers.push({
        item: freelancer,
        type: 'freelancer',
        matchScore: Math.min(100, score),
        matchReason: 'Skills and experience match your needs',
      });
    }
  });

  // Sort by score
  results.gigs.sort((a, b) => b.matchScore - a.matchScore);
  results.freelancers.sort((a, b) => b.matchScore - a.matchScore);

  // Limit to top 10 each
  results.gigs = results.gigs.slice(0, 10);
  results.freelancers = results.freelancers.slice(0, 10);

  return results;
}

