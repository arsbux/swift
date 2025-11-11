'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OnboardingContainer, useOnboarding } from '@/components/onboarding';
import { Card, Input, Textarea, Button } from '@/components/ui';
import GigPreview from '@/components/onboarding/GigPreview';
import { getGigTemplate } from '@/lib/utils/gig-templates';

export default function Step3Page() {
  return (
    <OnboardingContainer step={3}>
      <Step3Content />
    </OnboardingContainer>
  );
}

function Step3Content() {
  const router = useRouter();
  const { data, updateData, prevStep } = useOnboarding();
  const supabase = createClient();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill template when component mounts or skills change
  useEffect(() => {
    if (data.skills.length > 0 && !data.gig.title) {
      const template = getGigTemplate(data.skills);
      updateData({
        gig: {
          title: template.title,
          description: template.description,
          price: template.suggestedPrice.toString(),
          timeline: template.suggestedTimeline,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.skills]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!data.gig.title.trim()) {
      setError('Please enter a title for your gig');
      return;
    }

    if (!data.gig.description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!data.gig.price.trim()) {
      setError('Please enter a price');
      return;
    }

    if (!data.gig.timeline.trim()) {
      setError('Please select a delivery time');
      return;
    }

    setPublishing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Verify profile data exists before creating post
      const { data: profile, error: profileFetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileFetchError || !profile) {
        console.error('Profile not found:', profileFetchError);
        setError('Profile data not found. Please go back and complete previous steps.');
        setPublishing(false);
        return;
      }

      console.log('Current profile before publishing:', profile);

      // Verify all required fields are present
      if (!profile.name || !profile.email || !profile.bio || !profile.avatar_url || !profile.skills || profile.skills.length === 0) {
        console.error('Profile missing required fields:', {
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          skills: profile.skills,
        });
        setError('Your profile is incomplete. Please go back and fill in all required fields.');
        setPublishing(false);
        return;
      }

      // Create the first post
      console.log('Creating first post:', {
        user_id: user.id,
        title: data.gig.title,
        type: 'gig',
        price: parseFloat(data.gig.price),
      });

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: data.gig.title,
          description: data.gig.description,
          type: 'gig',
          price: parseFloat(data.gig.price) || null,
          timeline: data.gig.timeline,
        })
        .select()
        .single();

      if (postError) {
        console.error('Error creating post:', postError);
        throw postError;
      }

      console.log('Post created successfully:', post);

      // Clear onboarding data from localStorage
      localStorage.removeItem('onboarding_data');

      // Redirect to success page with post ID
      router.push(`/onboarding/success?postId=${post.id}`);
    } catch (err: any) {
      console.error('Error publishing gig:', err);
      setError(err.message || 'Failed to publish gig. Please try again.');
      setPublishing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Create Your First Gig</h2>
        <p className="text-gray-300">
          This is how you&apos;ll appear to potential clients. You can always edit this later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Gig Title"
          value={data.gig.title}
          onChange={(e) =>
            updateData({
              gig: { ...data.gig, title: e.target.value },
            })
          }
          placeholder="e.g., I will build a responsive website with React"
          required
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
        />

        <Textarea
          label="Description"
          value={data.gig.description}
          onChange={(e) =>
            updateData({
              gig: { ...data.gig, description: e.target.value },
            })
          }
          placeholder="Describe what you'll deliver..."
          rows={6}
          required
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Delivery Time
            </label>
            <select
              value={data.gig.timeline}
              onChange={(e) =>
                updateData({
                  gig: { ...data.gig, timeline: e.target.value },
                })
              }
              className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
              required
            >
              <option value="">Select timeline</option>
              <option value="1 day">1 day</option>
              <option value="3 days">3 days</option>
              <option value="7 days">7 days</option>
              <option value="14 days">14 days</option>
            </select>
          </div>

          <Input
            label="Price ($)"
            type="number"
            value={data.gig.price}
            onChange={(e) =>
              updateData({
                gig: { ...data.gig, price: e.target.value },
              })
            }
            placeholder="300"
            min="0"
            step="1"
            required
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />
        </div>

        <GigPreview
          title={data.gig.title}
          description={data.gig.description}
          price={data.gig.price}
          timeline={data.gig.timeline}
          userName={`${data.firstName} ${data.lastName}`.trim()}
        />

        {error && (
          <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="ghost" onClick={prevStep} className="flex-1">
            Back
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={publishing}>
            {publishing ? 'Publishing...' : 'Publish Gig'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
