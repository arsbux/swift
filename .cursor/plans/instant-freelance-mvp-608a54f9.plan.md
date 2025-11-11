<!-- 608a54f9-289c-4416-979f-dded19a2620b 7c93abc8-8f4e-4868-8134-791864dcdc27 -->
# Freelancer Onboarding Flow - Implementation Plan

## Overview

Create a streamlined 3-step onboarding wizard that converts new freelancers into active users by getting them to post their first gig immediately after signup.

## Current State

- Signup redirects to `/profile/edit` (full form)
- No guided flow for first-time users
- High drop-off risk between signup and first post

## New Flow Architecture

### Route Structure

- `/onboarding` - Main onboarding container with step management
- `/onboarding/step-1` - Welcome & Identity
- `/onboarding/step-2` - Skills & Experience  
- `/onboarding/step-3` - Create First Gig
- `/onboarding/success` - Success screen

### Step 1: Welcome & Identity

**File**: `app/onboarding/step-1/page.tsx`

- Clean, centered card layout (Notion-style)
- Headline: "Let's help you get your next gig"
- Subheadline: "Just 3 quick steps to go live"
- Fields:
- Name (pre-filled from signup if available)
- Email (if not from auth, otherwise hidden)
- Role confirmation: Freelancer (pre-selected, read-only)
- One-line bio: "e.g. I build clean, fast web apps"
- Progress indicator: 3 dots (1 of 3 filled)
- CTA: "Next → Skills" (black button)

### Step 2: Skills & Experience

**File**: `app/onboarding/step-2/page.tsx`

- Tag-based skill selector with autocomplete
- Popular skills suggestions (React, Logo Design, Copywriting, etc.)
- Max 5 skills
- Experience level: Beginner / Intermediate / Expert (radio buttons)
- Optional links: Portfolio / LinkedIn / GitHub (collapsible section)
- Progress indicator: 3 dots (2 of 3 filled)
- CTA: "Next → First Gig"

### Step 3: Create First Offer

**File**: `app/onboarding/step-3/page.tsx`

- Pre-filled template based on skills
- Title: "I will [verb] your [thing] for [result]"
- Description: Pre-filled 3-5 sentence template
- Delivery time: Dropdown (1 day / 3 days / 7 days / 14 days)
- Price: Number input with $ prefix
- Live preview card showing how it'll appear in feed
- Progress indicator: 3 dots (3 of 3 filled)
- CTA: "Publish Gig" (black button)

### Success Screen

**File**: `app/onboarding/success/page.tsx`

- Celebration message: "Welcome aboard, [Name]. You're now visible to clients."
- Success checkmark/animation
- Big CTA: "View My Gig" (links to their post)
- Secondary: "Browse Feed" (links to /feed)

## Components to Build

### 1. OnboardingContainer

**File**: `components/onboarding/OnboardingContainer.tsx`

- Manages step state and navigation
- Progress bar component (3 dots)
- Handles data persistence between steps
- Redirects to appropriate step based on progress

### 2. SkillSelector

**File**: `components/onboarding/SkillSelector.tsx`

- Tag-based input with autocomplete
- Popular skills list
- Max 5 skills validation
- Clean, modern tag UI

### 3. GigTemplate

**File**: `components/onboarding/GigTemplate.tsx`

- Pre-fills gig based on selected skills
- Template suggestions (e.g., Frontend Dev → "I'll build your web app MVP in 3 days")
- Editable template fields

### 4. GigPreview

**File**: `components/onboarding/GigPreview.tsx`

- Shows how the gig will appear in feed
- Real-time preview as user types
- Matches PostCard component styling

### 5. ProgressIndicator

**File**: `components/onboarding/ProgressIndicator.tsx`

- 3 dots showing current step
- Filled dots for completed steps
- Smooth transitions

## Integration Points

### Update Signup Flow

- Modify `app/(auth)/signup/page.tsx`
- If role is 'freelancer' and user is new, redirect to `/onboarding` instead of `/profile/edit`
- Pass onboarding flag in query params

### Update Auth Callback

- Modify `app/auth/callback/route.ts`
- Check if user is new freelancer, redirect to onboarding

### Data Flow

- Store onboarding data in component state
- Save to database only on Step 3 (publish)
- Update user profile with all collected data
- Create first post immediately

## Design Principles

### Visual Style

- Clean, centered card layouts
- Generous white space
- Black/white color scheme (professional)
- Minimal distractions
- Progress visible at all times

### UX Patterns

- One field per focus area
- Auto-advance where possible
- Clear next actions
- No back buttons (forward momentum only)
- Skip optional fields easily

### Emotional Design

- Step 1: Calm, welcoming ("you belong here")
- Step 2: Confident ("you're skilled")
- Step 3: Motivating ("you're live and ready")
- Success: Celebration ("you did it!")

## Technical Implementation

### State Management

- Use React state for multi-step form
- Persist to localStorage as backup
- Save to Supabase on final step

### Skill Autocomplete

- Pre-populated list of common skills
- Filter as user types
- Add custom skills on Enter

### Gig Templates

- Map skills to template suggestions
- Pre-fill title and description
- User can edit everything

### Validation

- Step 1: Name and bio required
- Step 2: At least 1 skill required
- Step 3: Title, description, price required

## Files to Create/Modify

### New Files

- `app/onboarding/step-1/page.tsx`
- `app/onboarding/step-2/page.tsx`
- `app/onboarding/step-3/page.tsx`
- `app/onboarding/success/page.tsx`
- `components/onboarding/OnboardingContainer.tsx`
- `components/onboarding/SkillSelector.tsx`
- `components/onboarding/GigTemplate.tsx`
- `components/onboarding/GigPreview.tsx`
- `components/onboarding/ProgressIndicator.tsx`
- `lib/utils/gig-templates.ts` (template mapping logic)

### Modified Files

- `app/(auth)/signup/page.tsx` - Redirect freelancers to onboarding
- `app/auth/callback/route.ts` - Handle onboarding redirect
- `app/post/new/page.tsx` - Can reuse some components

## Success Metrics

- Time to first post: < 2 minutes
- Completion rate: > 80%
- User feels confident and ready after onboarding

### To-dos

- [ ] Create database schema for jobs, transactions, job_matches, job_checklists, job_deliverables, job_reviews, and job_messages tables with indexes and RLS policies
- [ ] Add TypeScript interfaces for all new entities (Job, Transaction, JobMatch, etc.) to lib/supabase/types.ts
- [ ] Update landing page (app/page.tsx) to include one-line request input box with 'Get price & time' CTA
- [ ] Create Claude API integration (lib/ai/claude.ts) for AI-assisted brief generation
- [ ] Create pricing engine utility (lib/utils/pricing.ts) for price estimation based on deliverable type and deadline
- [ ] Create structured brief page (app/jobs/brief/page.tsx) with AI suggestions, deliverable selection, budget, deadline, and priority toggle
- [ ] Create payment/escrow page (app/jobs/[id]/payment/page.tsx) with payment method selection, instructions, and transaction creation
- [ ] Create matching algorithm utility (lib/utils/matching.ts) to score and rank freelancers for job matching
- [ ] Create match page (app/jobs/[id]/match/page.tsx) displaying top 3 freelancer matches with selection/auto-assign options
- [ ] Create workroom components (ProgressChecklist, DeliverableUpload, JobChat) for job progress tracking
- [ ] Create workroom page (app/jobs/[id]/workroom/page.tsx) with brief, checklist, chat, deliverables, and ETA countdown
- [ ] Create review/acceptance page (app/jobs/[id]/review/page.tsx) with binary acceptance choice and revision handling
- [ ] Create post-job completion page (app/jobs/[id]/complete/page.tsx) with invoice, rating, and rebook CTA
- [ ] Create API routes for job management (POST /api/jobs, GET /api/jobs/:id, POST /api/jobs/:id/pay, etc.)
- [ ] Create client onboarding page (app/jobs/onboarding/page.tsx) for first-time client welcome and quick request
- [ ] Create admin job management page (app/admin/jobs/page.tsx) for payment verification, manual matching, and dispute resolution
- [ ] Update Sidebar component to include 'My Jobs' navigation link for clients
- [ ] Implement real-time updates for job status, matches, chat, and progress using Supabase Realtime
- [ ] Add error handling for all failure cases (no matches, payment failed, freelancer timeout, etc.)