'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Textarea, Card } from '@/components/ui';
import type { Post, PostType } from '@/lib/supabase/types';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({
    type: 'gig' as PostType,
    title: '',
    description: '',
    price: '',
    timeline: '',
  });

  useEffect(() => {
    loadPost();
  }, [params.id]);

  const loadPost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      router.push('/feed');
      return;
    }

    setPost(data);
    setFormData({
      type: data.type,
      title: data.title,
      description: data.description,
      price: data.price?.toString() || '',
      timeline: data.timeline || '',
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('posts')
      .update({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        timeline: formData.timeline || null,
      })
      .eq('id', params.id);

    if (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } else {
      router.push('/feed');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } else {
      router.push('/feed');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black py-6 sm:py-12 px-4 lg:pl-56">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Edit Post</h1>
        
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
                      : 'border-gray-800 hover:border-accent/20'
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
                      : 'border-gray-800 hover:border-accent/20'
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
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={6}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Price (optional)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              min="0"
              step="0.01"
            />
            <Input
              label="Timeline (optional)"
              value={formData.timeline}
              onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button type="submit" variant="primary" disabled={saving} className="flex-1 sm:flex-initial">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              className="text-red-400 border-red-600 hover:bg-red-900/30 w-full sm:w-auto"
            >
              Delete
            </Button>
          </div>
        </form>
        </Card>
      </div>
    </div>
  );
}

