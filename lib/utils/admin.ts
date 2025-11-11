import { createClient } from '@/lib/supabase/server';

// Simple admin check - for MVP, you can hardcode admin emails or use env variable
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.email) return false;
  
  return ADMIN_EMAILS.includes(user.email);
}

