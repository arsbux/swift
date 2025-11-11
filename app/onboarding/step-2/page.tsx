'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OnboardingContainer, useOnboarding } from '@/components/onboarding';
import { Card, Input, Button } from '@/components/ui';
import SkillSelector from '@/components/onboarding/SkillSelector';

export default function Step2Page() {
  return (
    <OnboardingContainer step={2}>
      <Step2Content />
    </OnboardingContainer>
  );
}

function Step2Content() {
  const router = useRouter();
  const { data, updateData, prevStep, nextStep } = useOnboarding();
  const supabase = createClient();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (data.skills.length === 0) {
      setError('Please add at least one skill');
      return;
    }

    if (!data.experience) {
      setError('Please select your experience level');
      return;
    }

    // SAVE TO DATABASE IMMEDIATELY
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      console.log('Saving Step 2 data to database:', {
        skills: data.skills,
        links: data.links,
      });

      const { error: saveError } = await supabase
        .from('users')
        .update({
          skills: data.skills,
          links: data.links || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (saveError) {
        console.error('Error saving Step 2 data:', saveError);
        setError(`Failed to save your skills: ${saveError.message}`);
        return;
      }

      console.log('Step 2 data saved successfully');
      nextStep();
    } catch (err: any) {
      console.error('Unexpected error in Step 2:', err);
      setError(`An error occurred: ${err.message}`);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Your Skills & Experience</h2>
        <p className="text-gray-300">
          Help clients understand what you bring to the table.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Skills *
          </label>
        <SkillSelector
          skills={data.skills}
          onChange={(skills) => updateData({ skills })}
          maxSkills={5}
        />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Experience Level *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['Beginner', 'Intermediate', 'Expert'] as const).map((level) => {
              const levelLower = level.toLowerCase() as 'beginner' | 'intermediate' | 'expert';
              return (
              <button
                key={level}
                type="button"
                onClick={() => updateData({ experience: levelLower })}
                className={`px-4 py-3 rounded-xl border-2 transition-all ${
                  data.experience === levelLower
                    ? 'border-accent bg-accent text-white'
                    : 'border-gray-700 text-white hover:border-accent/50 bg-gray-900'
                }`}
              >
                {level}
              </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Portfolio / Website (Optional)"
            type="url"
            value={data.links.portfolio || ''}
            onChange={(e) =>
              updateData({
                links: { ...data.links, portfolio: e.target.value },
              })
            }
            placeholder="https://yourportfolio.com"
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />

          <Input
            label="LinkedIn (Optional)"
            type="url"
            value={data.links.linkedin || ''}
            onChange={(e) =>
              updateData({
                links: { ...data.links, linkedin: e.target.value },
              })
            }
            placeholder="https://linkedin.com/in/yourprofile"
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />

          <Input
            label="GitHub (Optional)"
            type="url"
            value={data.links.github || ''}
            onChange={(e) =>
              updateData({
                links: { ...data.links, github: e.target.value },
              })
            }
            placeholder="https://github.com/yourusername"
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="ghost" onClick={prevStep} className="flex-1">
            Back
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Continue
          </Button>
        </div>
      </form>
    </Card>
  );
}
