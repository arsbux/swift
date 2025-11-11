# Vercel Deployment Guide

This guide will help you deploy Swift to Vercel at `swift.flightlabs.agency`.

## Prerequisites

- GitHub repository: `https://github.com/arsbux/swift.git`
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase project set up
- Anthropic API key (for AI search feature)

## Step-by-Step Deployment

### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository: `arsbux/swift`
4. Vercel will automatically detect Next.js

### 2. Configure Build Settings

Vercel auto-detects Next.js, but verify these settings:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 3. Add Environment Variables

In the Vercel dashboard, go to **Settings > Environment Variables** and add:

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-api03-...` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `admin@example.com,another@example.com` |

**Important**: 
- Add these for **Production**, **Preview**, and **Development** environments
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `ANTHROPIC_API_KEY` is server-side only (no `NEXT_PUBLIC_` prefix)

### 4. Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (usually 2-3 minutes)
3. Your site will be live at `https://your-project.vercel.app`

### 5. Configure Custom Domain

1. Go to **Project Settings > Domains**
2. Click **"Add Domain"**
3. Enter: `swift.flightlabs.agency`
4. Follow Vercel's DNS configuration instructions:
   - Add a CNAME record pointing to your Vercel deployment
   - Or add A records if using apex domain
5. Vercel will automatically provision SSL certificates (may take a few minutes)

### 6. Update Supabase Configuration

1. Go to your Supabase dashboard
2. Navigate to **Authentication > URL Configuration**
3. Add these URLs:
   - **Site URL**: `https://swift.flightlabs.agency`
   - **Redirect URLs**: 
     - `https://swift.flightlabs.agency/auth/callback`
     - `https://*.vercel.app/auth/callback` (for preview deployments)

### 7. Verify Deployment

1. Visit `https://swift.flightlabs.agency`
2. Test user signup/login
3. Test AI search feature
4. Verify real-time messaging works

## Environment-Specific Deployments

Vercel supports three environments:
- **Production**: Your main deployment (custom domain)
- **Preview**: Automatic deployments for pull requests
- **Development**: Local development with `vercel dev`

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure Node.js version is 18+ (set in `package.json`)

### Authentication Not Working
- Verify Supabase redirect URLs are correct
- Check environment variables are set correctly
- Ensure Site URL matches your custom domain

### API Routes Not Working
- Verify `ANTHROPIC_API_KEY` is set (server-side only)
- Check API route logs in Vercel dashboard
- Ensure middleware allows API routes

### Custom Domain Not Working
- Verify DNS records are correct
- Wait for DNS propagation (can take up to 48 hours)
- Check SSL certificate status in Vercel dashboard

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Every push to `main` branch
- **Preview**: Every pull request gets a preview URL

To disable auto-deployment:
- Go to **Settings > Git**
- Configure deployment settings

## Performance Optimization

Vercel automatically optimizes:
- ✅ Edge caching for static assets
- ✅ Automatic image optimization
- ✅ Serverless function optimization
- ✅ CDN distribution globally

## Support

- Vercel Documentation: https://vercel.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/nextjs
- Vercel Status: https://vercel-status.com

