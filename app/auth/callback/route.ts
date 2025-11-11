import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const role = requestUrl.searchParams.get('role');
  const fromSearch = requestUrl.searchParams.get('from_search') === 'true';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    
    // If role is provided, update user profile
    if (role) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ role })
          .eq('id', user.id);
        
        // Check if this is a new user (no posts yet) and redirect accordingly
        const { data: posts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        
        // Redirect freelancers to onboarding if they have no posts, otherwise to feed
        if (role === 'freelancer' && (!posts || posts.length === 0)) {
          return NextResponse.redirect(new URL('/onboarding/step-1', requestUrl.origin));
        }
        
        // If client coming from search, redirect to job brief
        if (role === 'client' && fromSearch) {
          return NextResponse.redirect(new URL('/jobs/brief', requestUrl.origin));
        }
      }
    }
  }

  return NextResponse.redirect(new URL('/feed', requestUrl.origin));
}

