'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OnboardingContainer, useOnboarding } from '@/components/onboarding';
import { Card, Input, Textarea, Button } from '@/components/ui';
import Image from 'next/image';

export default function Step1Page() {
  return (
    <OnboardingContainer step={1}>
      <Step1Content />
    </OnboardingContainer>
  );
}

function Step1Content() {
  const router = useRouter();
  const { data, updateData, nextStep } = useOnboarding();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        const [firstName, ...lastNameParts] = (profile.name || '').split(' ');
        const lastName = lastNameParts.join(' ');

        updateData({
          firstName: firstName || '',
          lastName: lastName || '',
          email: profile.email || user.email || '',
          bio: profile.bio || '',
          avatar_url: profile.avatar_url || null,
        });
      } else {
        updateData({
          email: user.email || '',
        });
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!data.firstName.trim()) {
      setError('Please enter your first name');
      return;
    }

    if (!data.lastName.trim()) {
      setError('Please enter your last name');
      return;
    }

    if (!data.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (!data.bio.trim()) {
      setError('Please enter a brief bio');
      return;
    }

    if (data.bio.trim().length < 10) {
      setError('Bio must be at least 10 characters long');
      return;
    }

    if (!data.avatar_url) {
      setError('Please upload a profile image');
      return;
    }

    // SAVE TO DATABASE IMMEDIATELY
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

      console.log('Saving Step 1 data to database:', {
        name: fullName,
        email: data.email.trim(),
        bio: data.bio.trim(),
        avatar_url: data.avatar_url,
      });

      const { error: saveError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: fullName,
          email: data.email.trim(),
          bio: data.bio.trim(),
          avatar_url: data.avatar_url,
          role: 'freelancer',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (saveError) {
        console.error('Error saving Step 1 data:', saveError);
        setError(`Failed to save your information: ${saveError.message}`);
        return;
      }

      console.log('Step 1 data saved successfully');
      nextStep();
    } catch (err: any) {
      console.error('Unexpected error in Step 1:', err);
      setError(`An error occurred: ${err.message}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Please log in to upload an image');
      setUploading(false);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      setUploading(false);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      setUploading(false);
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      updateData({ avatar_url: publicUrl });
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-400">Loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Swift!</h2>
        <p className="text-gray-300">
          Let&apos;s set up your professional profile. This should only take a minute.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name *"
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            placeholder="John"
            required
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />
          <Input
            label="Last Name *"
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            placeholder="Doe"
            required
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />
        </div>

        <Input
          label="Email Address *"
          type="email"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          placeholder="john@example.com"
          required
          className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
        />

        <div>
          <Textarea
            label="Professional Bio *"
            value={data.bio}
            onChange={(e) => updateData({ bio: e.target.value })}
            placeholder="Tell us about yourself and what you do..."
            rows={4}
            required
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />
          <div className="mt-1 text-xs text-gray-400">
            {data.bio.length} characters (minimum 10)
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Profile Image * (Required)
          </label>
          <div className="flex items-center gap-4">
            {data.avatar_url && (
              <div className="w-20 h-20 rounded-full overflow-hidden bg-black">
                <Image
                  src={data.avatar_url}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-black file:cursor-pointer cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG, or GIF (max 5MB)
              </p>
              {uploading && <p className="mt-1 text-xs text-accent">Uploading...</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full">
          Continue
        </Button>
      </form>
    </Card>
  );
}
