# Swift MVP

The simplest way to find work or talent — instantly.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase (Auth, Database, Storage, Real-time)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### Setup Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your Project URL and anon/public key
   - Copy `env.example` to `.env.local`:
     ```bash
     cp env.example .env.local
     ```
   - Edit `.env.local` and fill in your Supabase credentials and admin email

3. **Set up the database:**
   - In Supabase dashboard, go to SQL Editor
   - Copy and paste the contents of `supabase-setup.sql`
   - Run the SQL script to create tables, RLS policies, and storage bucket

4. **Configure Authentication:**
   - In Supabase dashboard, go to Authentication > Providers
   - Enable Email provider (already enabled by default)
   - Add redirect URLs: `http://localhost:3000/auth/callback` for development
   - For production, add: `https://swift.flightlabs.agency/auth/callback`

5. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment to Vercel

1. **Push your code to GitHub**
   - Make sure your code is pushed to the repository: `https://github.com/arsbux/swift.git`

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "Add New Project"
   - Import your GitHub repository: `arsbux/swift`
   - Vercel will auto-detect Next.js (no configuration needed)
   - Add environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
     - `ANTHROPIC_API_KEY` - Your Anthropic API key (for AI search feature)
     - `ADMIN_EMAILS` - Comma-separated list of admin emails (e.g., `admin@example.com,another@example.com`)
   - Click "Deploy"

3. **Configure custom domain:**
   - After deployment, go to Project Settings > Domains
   - Add custom domain: `swift.flightlabs.agency`
   - Follow Vercel's DNS configuration instructions
   - Vercel will automatically provision SSL certificates

4. **Update Supabase redirect URLs:**
   - In Supabase dashboard, go to Authentication > URL Configuration
   - Add production URL: `https://swift.flightlabs.agency/auth/callback`
   - Update Site URL to: `https://swift.flightlabs.agency`
   - If using Vercel preview URLs, also add: `https://*.vercel.app/auth/callback`

## Features

- ✅ User authentication (Email/Password)
- ✅ User profiles with skills and links
- ✅ Post feed with gigs and projects
- ✅ Real-time messaging
- ✅ Search functionality
- ✅ Admin panel for content moderation
- ✅ Profile image uploads

## Project Structure

```
/app
  /(auth) - login, signup pages
  /feed - main feed page
  /post - post creation/editing
  /messages - messaging interface
  /profile - user profiles
  /admin - admin panel
/components
  /ui - reusable UI components
  /posts - post-related components
  /messages - messaging components
/lib
  /supabase - Supabase client and utilities
  /utils - helper functions
```

