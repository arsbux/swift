# Supabase Setup Instructions for MVP

To remove restrictions and make signup/login work smoothly for your MVP, follow these steps:

## 1. Disable Email Confirmation (IMPORTANT)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Settings** (in the left sidebar)
4. Scroll down to **"Email Auth"** section
5. **Uncheck** "Enable email confirmations"
6. Click **Save**

This allows users to sign up and immediately log in without confirming their email.

## 2. Adjust Rate Limiting (Optional)

Supabase has built-in rate limiting to prevent abuse. For MVP testing:

1. Go to **Authentication** → **Settings**
2. Look for rate limiting settings
3. Note: Free tier has rate limits that can't be fully disabled, but you can:
   - Wait 60 seconds between signup attempts
   - Or use different email addresses for testing

## 3. Verify Database Setup

Make sure you've run the SQL setup script:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the contents of `supabase-setup.sql`
3. Click **Run**
4. You should see "Success" message

## 4. Verify RLS Policies

If you manually removed RLS policies, restore them:

1. Go to **SQL Editor**
2. Copy and paste the contents of `restore-rls-policies.sql`
3. Click **Run**

## 5. Test Signup Flow

After making these changes:

1. Try signing up with a new email
2. You should be able to log in immediately (no email confirmation needed)
3. If you get rate limit errors, wait 60 seconds and try again

## Quick Checklist

- [ ] Email confirmations disabled
- [ ] Database tables created (ran `supabase-setup.sql`)
- [ ] RLS policies restored (ran `restore-rls-policies.sql`)
- [ ] Test signup works
- [ ] Test login works

## Troubleshooting

**"Too Many Requests" error:**
- Wait 60 seconds between signup attempts
- Or use a different email address

**"Invalid login credentials":**
- Make sure you signed up successfully first
- Check that email confirmations are disabled
- Try resetting your password

**"Database error":**
- Make sure you ran the `supabase-setup.sql` script
- Check that all tables exist in the Database → Tables section

