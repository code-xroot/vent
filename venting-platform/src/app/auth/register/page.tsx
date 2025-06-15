// src/app/auth/register/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react'; // To auto-login after registration

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Basic client-side validation (more robust validation on backend)
    if (!name.trim() || !email.trim() || !password) {
        setError("Name, email, and password are required.");
        return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }


    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to register. Please try again.');
      } else {
        setSuccessMessage(data.message || 'Registration successful! Redirecting to sign in...');

        // Optionally, automatically sign in the user after successful registration
        const signInResponse = await signIn('credentials', {
          redirect: false, // Don't redirect from signIn, handle it manually
          email: email,
          password: password, // Use the original password
        });

        if (signInResponse?.error) {
          // If auto sign-in fails, redirect to sign-in page with a message
          setError(`Registration successful, but auto sign-in failed: ${signInResponse.error}. Please sign in manually.`);
          setSuccessMessage(null); // Clear success message if auto sign-in fails
          setTimeout(() => {
            router.push('/auth/signin');
          }, 3000);
        } else if (signInResponse?.ok) {
          // Redirect to home or a dashboard page after successful auto sign-in
          router.push('/');
        } else {
            // Fallback if signInResponse is not as expected but registration was ok
            setSuccessMessage('Registration successful. Please proceed to sign in.');
            setTimeout(() => {
                router.push('/auth/signin');
            }, 3000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-neutral-light dark:bg-dark-bg">
      <div className="p-8 sm:p-12 bg-white dark:bg-dark-card shadow-xl rounded-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-neutral-darker dark:text-neutral-light mb-6 text-center">
          Create Account
        </h1>

        {successMessage && !error && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-700 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded-md text-center">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-700 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-darker dark:text-neutral-light">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm placeholder-neutral-dark dark:placeholder-neutral-DEFAULT focus:outline-none focus:ring-calm-purple focus:border-calm-purple sm:text-sm dark:bg-dark-bg dark:text-neutral-light"
              placeholder="Your Name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-darker dark:text-neutral-light">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm placeholder-neutral-dark dark:placeholder-neutral-DEFAULT focus:outline-none focus:ring-calm-purple focus:border-calm-purple sm:text-sm dark:bg-dark-bg dark:text-neutral-light"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-darker dark:text-neutral-light">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm placeholder-neutral-dark dark:placeholder-neutral-DEFAULT focus:outline-none focus:ring-calm-purple focus:border-calm-purple sm:text-sm dark:bg-dark-bg dark:text-neutral-light"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-darker dark:text-neutral-light">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm placeholder-neutral-dark dark:placeholder-neutral-DEFAULT focus:outline-none focus:ring-calm-purple focus:border-calm-purple sm:text-sm dark:bg-dark-bg dark:text-neutral-light"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-calm-purple hover:bg-calm-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-calm-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-dark dark:text-neutral-DEFAULT">
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-medium text-calm-purple hover:text-calm-purple-dark dark:hover:text-calm-purple-light">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
