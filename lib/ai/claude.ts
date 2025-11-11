/**
 * Claude API Integration for AI-assisted brief generation
 * Uses Anthropic Claude API to generate structured briefs from one-line requests
 */

export interface BriefSuggestion {
  objective: string;
  deliverableType: 'landing_page' | 'ad_1min' | 'bug_fix' | 'design' | 'other';
  acceptanceCriteria: string[];
}

export async function generateBrief(oneLineRequest: string): Promise<BriefSuggestion> {
  // Check for API key (client-side uses NEXT_PUBLIC_ prefix, server-side uses regular)
  const apiKey = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY 
    : process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    // Fallback to rule-based system if API key is not set
    return generateBriefFallback(oneLineRequest);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Given this client request: "${oneLineRequest}"

Please generate a structured brief with:
1. A clear, one-sentence objective
2. The deliverable type (one of: landing_page, ad_1min, bug_fix, design, other)
3. Three specific, measurable acceptance criteria

Return your response as JSON in this exact format:
{
  "objective": "One clear sentence describing what needs to be delivered",
  "deliverableType": "landing_page|ad_1min|bug_fix|design|other",
  "acceptanceCriteria": [
    "First specific, measurable criterion",
    "Second specific, measurable criterion",
    "Third specific, measurable criterion"
  ]
}

Only return the JSON, no other text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, response.statusText);
      return generateBriefFallback(oneLineRequest);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    // Extract JSON from response (handle cases where Claude adds markdown formatting)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        objective: parsed.objective || oneLineRequest,
        deliverableType: parsed.deliverableType || 'other',
        acceptanceCriteria: parsed.acceptanceCriteria || [
          'Deliverable meets the stated requirements',
          'Quality standards are met',
          'Delivered on time',
        ],
      };
    }

    return generateBriefFallback(oneLineRequest);
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return generateBriefFallback(oneLineRequest);
  }
}

/**
 * Fallback rule-based brief generation when Claude API is unavailable
 */
function generateBriefFallback(oneLineRequest: string): BriefSuggestion {
  const lowerRequest = oneLineRequest.toLowerCase();
  
  // Determine deliverable type based on keywords
  let deliverableType: BriefSuggestion['deliverableType'] = 'other';
  if (lowerRequest.includes('landing page') || lowerRequest.includes('landing') || lowerRequest.includes('website')) {
    deliverableType = 'landing_page';
  } else if (lowerRequest.includes('ad') || lowerRequest.includes('video') || lowerRequest.includes('commercial')) {
    deliverableType = 'ad_1min';
  } else if (lowerRequest.includes('bug') || lowerRequest.includes('fix') || lowerRequest.includes('error')) {
    deliverableType = 'bug_fix';
  } else if (lowerRequest.includes('design') || lowerRequest.includes('ui') || lowerRequest.includes('ux')) {
    deliverableType = 'design';
  }

  // Generate acceptance criteria based on deliverable type
  const acceptanceCriteria: string[] = [];
  
  switch (deliverableType) {
    case 'landing_page':
      acceptanceCriteria.push(
        'Fully responsive design that works on mobile, tablet, and desktop',
        'All specified features and functionality are implemented and working',
        'Code is clean, commented, and follows best practices'
      );
      break;
    case 'ad_1min':
      acceptanceCriteria.push(
        'Video meets specified duration and format requirements',
        'All requested elements and messaging are included',
        'Final deliverable is in requested format and resolution'
      );
      break;
    case 'bug_fix':
      acceptanceCriteria.push(
        'Identified issue is completely resolved',
        'No new bugs introduced by the fix',
        'Code changes are tested and documented'
      );
      break;
    case 'design':
      acceptanceCriteria.push(
        'Design matches provided requirements and brand guidelines',
        'All design files are provided in requested formats',
        'Design is ready for implementation'
      );
      break;
    default:
      acceptanceCriteria.push(
        'Deliverable meets the stated requirements',
        'Quality standards are met',
        'Delivered on time'
      );
  }

  return {
    objective: oneLineRequest,
    deliverableType,
    acceptanceCriteria,
  };
}

