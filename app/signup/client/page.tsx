'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';

export default function ClientSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  
  const fromSearch = searchParams.get('from_search') === 'true';

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'client',
        },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('rate limit') || signUpError.message.includes('Too Many Requests') || signUpError.status === 429) {
        setError('Too many signup attempts. Please wait a minute and try again.');
      } else if (signUpError.message.includes('already registered')) {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
    } else if (data.user) {
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try to insert or update user profile
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: name.trim(),
          role: 'client',
        });

      // If insert fails (e.g., user already exists from trigger), try update
      if (insertError) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: data.user.email,
            name: name.trim(),
            role: 'client',
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error saving profile:', updateError);
        }
      }

      // Check if email confirmation is required
      if (data.session) {
        // User is logged in immediately (email confirmation disabled)
        // If coming from search, redirect to job brief
        if (fromSearch) {
          // Load search params from sessionStorage
          const stored = sessionStorage.getItem('search_params');
          if (stored) {
            const searchParams = JSON.parse(stored);
            sessionStorage.setItem('job_from_search', 'true');
            sessionStorage.setItem('one_line_request', searchParams.description);
          }
          router.push('/jobs/brief');
        } else {
          router.push('/feed');
        }
        router.refresh();
      } else {
        // Email confirmation required
        setError('Please check your email to confirm your account before logging in. For MVP, disable email confirmations in Supabase settings.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8 lg:ml-0">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-white">
            Create Your Account
          </h2>
          {fromSearch && (
            <div className="mt-3 bg-accent/20 border border-accent/30 p-3 rounded-lg text-center">
              <p className="text-sm text-white font-medium">
                We&apos;ll find you a match within 24 hours!
              </p>
            </div>
          )}
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-300">
            Just a few seconds to get started
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleEmailSignup}>
          <div className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-lg">
              {error}
              {error.includes('rate limit') || error.includes('Too Many Requests') || error.includes('security purposes') ? (
                <div className="mt-2 text-xs text-red-300">
                  <p>💡 Tip: Wait 60 seconds and try again, or use a different email address.</p>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account & Continue'}
            </Button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-300">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

