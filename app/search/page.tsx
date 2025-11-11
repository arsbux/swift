'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Textarea, Button } from '@/components/ui';

type SkillLevel = 'beginner' | 'intermediate' | 'expert' | '';
type Deadline = '24h' | '48h' | '1week' | '2weeks' | 'flexible' | '';

const categories = [
  'Web Development',
  'Design',
  'Video Production',
  'Writing',
  'Marketing',
  'Data Analysis',
  'Mobile Development',
  'Other',
];

export default function SearchPage() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState<Deadline>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      return;
    }

    setSubmitting(true);

    // Store search params in sessionStorage
    const searchParams = {
      description: description.trim(),
      minBudget: minBudget || null,
      maxBudget: maxBudget || null,
      skillLevel: skillLevel || null,
      category: category || null,
      deadline: deadline || null,
    };

    sessionStorage.setItem('search_params', JSON.stringify(searchParams));

    // Navigate to results page
    router.push('/search/results');
  };

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:ml-0">
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Describe the Role You&apos;re Looking For</h1>
            <p className="text-gray-300">
              Tell us what you need and we&apos;ll use AI to find the best matching freelancers for you
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Describe the role/project you need <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: I need a web developer to build a landing page with email capture functionality. Should be responsive and completed within 48 hours. Budget is around $200-300."
                rows={6}
                required
                className="w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400 mt-2">
                Be as detailed as possible. Include what you need, timeline, and budget if you have one.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Min Budget ($)
                </label>
                <Input
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Max Budget ($)
                </label>
                <Input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="1000"
                  min="0"
                  step="1"
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Skill Level
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                {(['beginner', 'intermediate', 'expert'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSkillLevel(skillLevel === level ? '' : level)}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-colors capitalize min-h-[48px] touch-manipulation ${
                      skillLevel === level
                        ? 'border-accent bg-accent text-white'
                        : 'border-gray-700 text-white hover:border-accent/50 bg-gray-900 active:bg-gray-800'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
              >
                <option value="">Any Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Deadline
              </label>
              <select
                value={deadline}
                onChange={(e) => setDeadline(e.target.value as Deadline)}
                className="w-full px-4 py-2.5 border border-gray-700 bg-gray-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
              >
                <option value="">Flexible</option>
                <option value="24h">24 hours</option>
                <option value="48h">48 hours</option>
                <option value="1week">1 week</option>
                <option value="2weeks">2 weeks</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold"
              disabled={submitting || !description.trim()}
            >
              {submitting ? 'Searching...' : 'Find Freelancers'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

