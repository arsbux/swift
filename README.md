# Swift MVP

The simplest way to find work or talent — instantly.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: TailwindCSS
- **Backend**: Supabase (Auth, Database, Storage, Real-time)
- **Deployment**: Netlify

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

## Deployment to Netlify

1. **Push your code to GitHub**

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Import your GitHub repository
   - Build settings (auto-detected from `netlify.toml`):
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Add environment variables in Netlify dashboard:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `ANTHROPIC_API_KEY` (for AI search feature)
     - `ADMIN_EMAILS` (comma-separated list of admin emails)
   - Deploy!

3. **Configure custom domain:**
   - In Netlify dashboard, go to Site settings > Domain management
   - Add custom domain: `swift.flightlabs.agency`
   - Follow Netlify's DNS configuration instructions

4. **Update Supabase redirect URLs:**
   - In Supabase dashboard, go to Authentication > URL Configuration
   - Add production URL: `https://swift.flightlabs.agency/auth/callback`
   - Update Site URL to: `https://swift.flightlabs.agency`

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

