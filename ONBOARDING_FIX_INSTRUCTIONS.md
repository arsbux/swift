# Onboarding Data Persistence Fix

## Problem Identified
The onboarding process was storing data in `localStorage` but **NOT saving it to the database** until Step 3. This caused users to appear as "Anonymous" in the feed because their profile data was never persisted.

## Solution Implemented
Rebuilt the entire onboarding flow with **immediate database persistence** at each step:

### Changes Made:

#### 1. Step 1 (`app/onboarding/step-1/page.tsx`)
- **Now saves data immediately** to the database when clicking "Continue"
- Uses `upsert` to create or update the user profile
- Validates all required fields before saving:
  - First Name (required)
  - Last Name (required)
  - Email (required, validated)
  - Bio (required, min 10 characters)
  - Avatar/Profile Image (required, uploaded to Supabase Storage)
- Shows detailed error messages if save fails
- Logs save operations to console for debugging

#### 2. Step 2 (`app/onboarding/step-2/page.tsx`)
- **Now saves skills and links** immediately to the database
- Updates the existing user profile with:
  - Skills array (at least 1 required)
  - Experience level (required)
  - Optional links (portfolio, LinkedIn, GitHub)
- Validates before saving
- Shows error messages if save fails

#### 3. Step 3 (`app/onboarding/step-3/page.tsx`)
- **Verifies profile data exists** before creating post
- Checks that all required fields are present
- Creates the first gig/post only after verification
- Shows detailed error if profile is incomplete
- Logs all operations for debugging

## How to Test:

### 1. Delete All Existing Accounts
Run this in your Supabase SQL Editor:
```sql
-- Delete all posts first (due to foreign key constraints)
DELETE FROM public.posts;

-- Delete all users
DELETE FROM public.users;

-- Delete all auth users
-- WARNING: This deletes ALL users from auth.users
-- Only run this in development/testing
DELETE FROM auth.users;
```

### 2. Verify Database Schema
Run `verify-onboarding-data.sql` in Supabase SQL Editor to check:
- All required columns exist
- Data types are correct

### 3. Create a New Account
1. Go to `/signup`
2. Sign up with a new email
3. Complete all 3 onboarding steps:
   - **Step 1**: Add name, email, bio, and upload profile image
   - **Step 2**: Add at least 1 skill and select experience level
   - **Step 3**: Create your first gig

### 4. Verify Data Was Saved
Run this query in Supabase SQL Editor:
```sql
SELECT 
  id,
  name,
  email,
  bio,
  avatar_url,
  skills,
  role,
  created_at,
  updated_at
FROM public.users
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result**: All fields should have values (not empty strings or null).

### 5. Check Feed
1. Go to `/feed`
2. Your new post should show:
   - Your full name
   - Your profile picture
   - Your bio
   - Your gig details

## What Changed vs. Before:

### Before:
- Data stored only in `localStorage`
- Database update happened only in Step 3
- If Step 3 failed, no data was saved
- Users appeared as "Anonymous"

### After:
- **Step 1**: Saves name, email, bio, avatar immediately
- **Step 2**: Saves skills and links immediately  
- **Step 3**: Verifies all data exists before creating post
- Each step validates and saves independently
- Detailed error messages at each step
- Console logging for debugging

## Debugging:

Check browser console logs for:
- "Saving Step 1 data to database"
- "Step 1 data saved successfully"
- "Saving Step 2 data to database"
- "Step 2 data saved successfully"
- "Current profile before publishing"
- "Creating first post"
- "Post created successfully"

Check server logs (terminal running `npm run dev`) for:
- Feed page queries
- User data fetching
- Any database errors

## If Issues Persist:

1. **Check RLS Policies**: Make sure RLS is disabled or properly configured
   ```sql
   -- Check if RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```

2. **Check for Database Errors**: Look for error messages in:
   - Browser console
   - Server terminal logs
   - Supabase Dashboard > Logs

3. **Verify User Created in Database**:
   ```sql
   SELECT * FROM public.users WHERE email = 'your-test-email@example.com';
   ```

4. **Check Auth User Exists**:
   ```sql
   SELECT id, email, created_at FROM auth.users WHERE email = 'your-test-email@example.com';
   ```

## Next Steps:

1. Test the new onboarding flow
2. Verify data appears correctly in feed
3. If working, remove debug logs from production
4. Consider adding success toasts for better UX

