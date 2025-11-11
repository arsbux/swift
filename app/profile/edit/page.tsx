'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea, Avatar, Card } from '@/components/ui';
import type { User } from '@/lib/supabase/types';

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Partial<User>>({
    name: '',
    bio: '',
    skills: [],
    links: {},
    avatar_url: null,
  });
  const [skillInput, setSkillInput] = useState('');
  const [links, setLinks] = useState({
    portfolio: '',
    twitter: '',
    linkedin: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setLinks({
        portfolio: data.links?.portfolio || '',
        twitter: data.links?.twitter || '',
        linkedin: data.links?.linkedin || '',
      });
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setProfile({ ...profile, avatar_url: data.publicUrl });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.skills?.includes(skillInput.trim())) {
      setProfile({
        ...profile,
        skills: [...(profile.skills || []), skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile({
      ...profile,
      skills: profile.skills?.filter((s) => s !== skill) || [],
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills,
        links: {
          portfolio: links.portfolio || undefined,
          twitter: links.twitter || undefined,
          linkedin: links.linkedin || undefined,
        },
        avatar_url: profile.avatar_url,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
    } else {
      router.push('/feed');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Edit Profile</h1>
        
        <Card>
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Avatar src={profile.avatar_url} name={profile.name || undefined} size="lg" />
              <div className="flex-1 w-full sm:w-auto">
                <label className="block text-sm font-medium text-white mb-2">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="text-sm text-gray-300"
                />
            </div>
          </div>

          <Input
            label="Full Name"
            value={profile.name || ''}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            required
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />

          <Textarea
            label="Bio (one-line value prop)"
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={2}
            placeholder="e.g., Full-stack developer specializing in React and Node.js"
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />

          <div>
              <label className="block text-sm font-medium text-white mb-2">
              Skills
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Add a skill"
                className="flex-1 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
              />
              <Button type="button" onClick={handleAddSkill} variant="outline" className="border-gray-700 text-white hover:border-accent hover:text-accent">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800 text-white rounded-full text-sm border border-gray-700"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Portfolio URL"
              type="url"
              value={links.portfolio}
              onChange={(e) => setLinks({ ...links, portfolio: e.target.value })}
              placeholder="https://yourportfolio.com"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Input
              label="Twitter/X"
              type="url"
              value={links.twitter}
              onChange={(e) => setLinks({ ...links, twitter: e.target.value })}
              placeholder="https://x.com/yourhandle"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Input
              label="LinkedIn"
              type="url"
              value={links.linkedin}
              onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
              placeholder="https://linkedin.com/in/yourprofile"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button onClick={handleSave} variant="primary" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
            <Button onClick={() => router.push('/feed')} variant="ghost" className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

