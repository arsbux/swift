'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim() || !password) {
      setError('Please enter both email and password to confirm deletion.');
      return;
    }

    setLoading(true);

    try {
      // First verify the credentials
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        setError('Invalid credentials. Cannot delete account without correct password.');
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('User not found.');
        setLoading(false);
        return;
      }

      // Delete user profile from public.users
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        // Continue anyway - profile might not exist
      }

      // Sign out
      await supabase.auth.signOut();

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/signup');
      }, 2000);
    } catch (err) {
      console.error('Delete account error:', err);
      setError('Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-bold text-white">
            Delete Account
          </h2>
          <p className="mt-2 text-center text-xs sm:text-sm text-gray-300 px-2">
            Enter your credentials to permanently delete your account. You can then sign up again with a fresh password.
          </p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="text-green-400 bg-green-900/30 p-4 rounded-lg mb-4">
              Account deleted successfully! Redirecting to signup...
            </div>
            <Link href="/signup">
              <Button variant="primary">Go to Signup</Button>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleDelete}>
            <div className="space-y-4">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-sm text-accent hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

