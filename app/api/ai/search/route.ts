import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify route is accessible
export async function GET() {
  return NextResponse.json({ 
    message: 'AI Search API is working',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { searchParams, allPosts, allUsers, gigs, freelancers } = body;

    if (!searchParams || !allPosts || !allUsers) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured', content: null },
        { status: 500 }
      );
    }

    // Build the prompt
    const prompt = buildSearchPrompt(searchParams, allPosts, allUsers, gigs, freelancers);

    // Call Claude API from server-side (no CORS issues)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Claude API error', status: response.status, content: null },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error('Invalid Claude API response:', data);
      return NextResponse.json(
        { error: 'Invalid response from Claude API', content: null },
        { status: 500 }
      );
    }

    const content = data.content[0].text;

    if (!content) {
      console.error('Empty content from Claude API');
      return NextResponse.json(
        { error: 'Empty response from Claude API', content: null },
        { status: 500 }
      );
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Error in search API route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', content: null },
      { status: 500 }
    );
  }
}

/**
 * Build the prompt for Claude Haiku 3
 * Reads ALL posts and ALL users to find the best matches
 */
function buildSearchPrompt(
  params: any,
  allPosts: any[],
  allUsers: any[],
  gigs: any[],
  freelancers: any[]
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

