'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea, Card } from '@/components/ui';
import type { PostType } from '@/lib/supabase/types';

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'gig' as PostType,
    title: '',
    description: '',
    price: '',
    timeline: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      type: formData.type,
      title: formData.title,
      description: formData.description,
      price: formData.price ? parseFloat(formData.price) : null,
      timeline: formData.timeline || null,
    });

    if (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } else {
      router.push('/feed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Create New Post</h1>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Post Type
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'gig' })}
                  className={`flex-1 px-4 py-2 rounded-xl border-2 transition-colors ${
                    formData.type === 'gig'
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-700 text-white hover:border-accent/50 bg-gray-900'
                  }`}
                >
                  Gig (I&apos;m offering)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'project' })}
                  className={`flex-1 px-4 py-2 rounded-xl border-2 transition-colors ${
                    formData.type === 'project'
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-700 text-white hover:border-accent/50 bg-gray-900'
                  }`}
                >
                  Project (I&apos;m hiring)
                </button>
              </div>
            </div>

          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="e.g., Build a landing page for my startup"
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={6}
            placeholder="Describe what you're offering or looking for..."
            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (optional)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="200"
              min="0"
              step="0.01"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Input
              label="Timeline (optional)"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
              placeholder="e.g., 3 days"
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button type="submit" variant="primary" disabled={loading} className="flex-1 sm:flex-initial">
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

