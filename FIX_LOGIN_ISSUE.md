# Fix Login Issue - Step by Step

Your signup was successful (user exists in database), but login is failing. This is because **email confirmation is enabled** in Supabase.

## Quick Fix (Choose One):

### Option 1: Disable Email Confirmation (Recommended for MVP)

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Settings**
4. Scroll to **"Email Auth"** section
5. **Uncheck** "Enable email confirmations"
6. Click **Save**

### Option 2: Manually Confirm Your User

1. Go to Supabase Dashboard
2. Go to **Authentication** → **Users**
3. Find your user (franciskeith87@gmail.com)
4. Click on the user
5. Click **"Confirm Email"** or set `email_confirmed_at` to current timestamp

### Option 3: Run SQL to Confirm All Users

1. Go to **SQL Editor** in Supabase
2. Copy and paste the contents of `confirm-existing-users.sql`
3. Click **Run**
4. This will confirm all unconfirmed users

## After Fixing:

1. Try logging in again with your credentials
2. It should work immediately

## Why This Happens:

- Supabase creates the user account when you sign up
- But if email confirmation is enabled, the user can't log in until they confirm
- The user record exists in the database, but auth is blocked
- Disabling email confirmation removes this restriction for MVP

## For Production:

Later, you'll want to re-enable email confirmation for security. For now, disabling it makes MVP testing much easier.

