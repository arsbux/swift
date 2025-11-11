'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import type { UserRole } from '@/lib/supabase/types';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole | ''>(searchParams.get('role') as UserRole || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  
  const redirectUrl = searchParams.get('redirect');
  const hasPromise = searchParams.get('promise') === '24h';

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Please select a role');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });

    if (signUpError) {
      // Handle rate limiting and other errors
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
          name: name || data.user.user_metadata?.name || null,
          role: role,
        });

      // If insert fails (e.g., user already exists from trigger), try update
      if (insertError) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: data.user.email,
            name: name || data.user.user_metadata?.name || null,
            role: role,
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error saving profile:', updateError);
          // Don't block signup if profile update fails - user can update later
          console.warn('Profile update failed, but user is created. They can update profile later.');
        }
      }

      // Check if email confirmation is required
      if (data.session) {
        // User is logged in immediately (email confirmation disabled)
        // Handle redirect if provided
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (role === 'freelancer') {
          router.push('/onboarding/step-1');
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
            Create your account
          </h2>
          {hasPromise && (
            <div className="mt-3 bg-accent/20 border border-accent/30 p-3 rounded-lg text-center">
              <p className="text-sm text-white font-medium">
                We&apos;ll find you a match within 24 hours!
              </p>
            </div>
          )}
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-300">
            Or{' '}
            <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
              log in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleEmailSignup}>
          <div className="space-y-4">
            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                I am a...
              </label>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 transition-colors text-sm sm:text-base ${
                    role === 'client'
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-700 text-white hover:border-accent/50 bg-gray-900'
                  }`}
                >
                  Client (Hiring)
                </button>
                <button
                  type="button"
                  onClick={() => setRole('freelancer')}
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 transition-colors text-sm sm:text-base ${
                    role === 'freelancer'
                      ? 'border-accent bg-accent text-white'
                      : 'border-gray-700 text-white hover:border-accent/50 bg-gray-900'
                  }`}
                >
                  Freelancer
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-lg">
              {error}
              {error.includes('rate limit') || error.includes('Too Many Requests') || error.includes('security purposes') ? (
                <div className="mt-2 text-xs text-red-300">
                  <p>💡 Tip: Wait 60 seconds and try again, or use a different email address.</p>
                  <p className="mt-1">For MVP testing, make sure email confirmations are disabled in Supabase settings.</p>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

