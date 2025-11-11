'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Trim email and validate
      const trimmedEmail = email.trim().toLowerCase();
      
      if (!trimmedEmail || !password) {
        setError('Please enter both email and password.');
        setLoading(false);
        return;
      }

      console.log('Attempting login for:', trimmedEmail);
      
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password,
      });

      if (loginError) {
        console.error('Login error details:', {
          message: loginError.message,
          status: loginError.status,
          name: loginError.name
        });
        
        // More specific error handling
        if (loginError.message.includes('Invalid login credentials') || loginError.status === 400) {
          setError('Invalid email or password. The password might be incorrect. Use "Forgot password?" below to reset it, or delete your account and sign up again.');
          setShowReset(true); // Automatically show reset option
        } else if (loginError.message.includes('Email not confirmed')) {
          setError('Please confirm your email first. Check your inbox or disable email confirmations in Supabase settings.');
        } else {
          setError(loginError.message || 'Login failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        // Successfully logged in
        console.log('Login successful, redirecting...');
        router.push('/feed');
        router.refresh();
      } else {
        setError('Login failed - no session created. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setResetSent(true);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('Failed to send reset email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8 lg:ml-0">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-white">
            Log in to your account
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-300">
            Or{' '}
            <Link href="/signup" className="font-medium text-accent hover:text-accent-hover">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleEmailLogin}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              error={error}
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-400"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 border border-red-800 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </Button>
          </div>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => setShowReset(!showReset)}
              className="text-sm text-accent hover:underline block"
            >
              Forgot password?
            </button>
            <Link href="/delete-account" className="text-sm text-gray-400 hover:underline block">
              Can&apos;t login? Delete account and sign up again
            </Link>
          </div>

          {showReset && (
            <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-lg">
              {resetSent ? (
                <div className="text-sm text-green-400">
                  Password reset email sent! Check your inbox and follow the link to reset your password.
                </div>
              ) : (
                <form onSubmit={handlePasswordReset} className="space-y-2">
                  <p className="text-sm text-gray-300 mb-2">Enter your email to receive a password reset link:</p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                      required
                    />
                    <Button type="submit" variant="outline" size="sm" className="border-gray-700 text-white hover:border-accent hover:text-accent">
                      Send Reset Link
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

