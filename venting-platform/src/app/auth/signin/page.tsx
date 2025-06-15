// src/app/auth/signin/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react'; // Added useState, FormEvent
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // Added Link

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(''); // State for email input
  const [password, setPassword] = useState(''); // State for password input
  const [error, setError] = useState<string | null>(null); // State for login error messages
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator

  // Remove auto-redirect for authenticated users so user can always choose sign-in method
  // useEffect(() => {
  //   const callbackUrl = searchParams.get('callbackUrl') || '/';
  //   if (status === 'authenticated') {
  //     router.push(callbackUrl);
  //   }
  // }, [status, router, searchParams]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    try {
        await signIn('google', { callbackUrl: callbackUrl });
        // If signIn causes a redirect, setIsLoading(false) might not be reached.
        // NextAuth handles this by navigating away. If it fails and stays on page,
        // then setIsLoading should be managed.
    } catch (e: any) {
        setIsLoading(false);
        setError(e.message || "Failed to sign in with Google.");
    }
    // It's tricky to set isLoading to false here if redirect is successful
    // as component might unmount. If sign-in fails without redirect, then set it.
    // For now, we assume NextAuth handles unmounting on successful redirect.
  };

  const handleCredentialsSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const result = await signIn('credentials', {
      redirect: false, // Handle redirect manually to show errors
      email: email,
      password: password,
      // callbackUrl: callbackUrl // We are handling redirect manually
    });

    setIsLoading(false);

    if (result?.error) {
      setError(result.error); // Display error from NextAuth (e.g., "Incorrect password.")
    } else if (result?.ok) {
      router.push(callbackUrl); // Successful sign-in
    } else {
      setError("An unexpected error occurred during sign in.");
    }
  };


  if (status === 'loading' && !isLoading) { // Show page loading only if not button loading
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-neutral-dark dark:text-neutral-DEFAULT">Loading...</p>
      </div>
    );
  }

  // Remove the authenticated redirect message, always show the sign-in form
  // if (status === 'authenticated') {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <p className="text-lg text-neutral-dark dark:text-neutral-DEFAULT">You are already signed in. Redirecting...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 bg-neutral-light dark:bg-dark-bg">
      <div className="p-8 sm:p-12 bg-white dark:bg-dark-card shadow-xl rounded-lg max-w-md w-full">
        <h1 className="text-3xl font-bold text-neutral-darker dark:text-neutral-light mb-6 text-center">
          Sign In
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-700 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md text-center">
            {error}
          </div>
        )}

        {/* Credentials Sign-In Form */}
        <form onSubmit={handleCredentialsSignIn} className="space-y-5">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm placeholder-neutral-dark dark:placeholder-neutral-DEFAULT focus:outline-none focus:ring-calm-purple focus:border-calm-purple sm:text-sm dark:bg-dark-bg dark:text-neutral-light"
              placeholder="••••••••"
            />
          </div>
          {/* Optional: Add "Forgot Password?" link here */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-calm-blue hover:bg-calm-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-calm-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && !error ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Divider "OR" */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-neutral-DEFAULT dark:border-neutral-dark"></div>
          <span className="flex-shrink mx-4 text-neutral-dark dark:text-neutral-DEFAULT text-sm">OR</span>
          <div className="flex-grow border-t border-neutral-DEFAULT dark:border-neutral-dark"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm text-lg font-medium text-neutral-darker dark:text-neutral-light bg-white dark:bg-dark-bg hover:bg-neutral-light dark:hover:bg-neutral-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-calm-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 ease-in-out"
        >
          <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.4S109.4 18.3 244 18.3c69.9 0 129.5 28.5 173.7 74.2l-63.1 61.9C324.5 118.8 286.1 96.4 244 96.4c-78.2 0-141.2 63.4-141.2 141.4s63 141.4 141.2 141.4c86.1 0 120.8-60.8 124.7-91.8H244v-75.5h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          Sign in with Google
        </button>

        <p className="mt-8 text-center text-sm text-neutral-dark dark:text-neutral-DEFAULT">
          Don't have an account?{' '}
          <Link href="/auth/register" className="font-medium text-calm-purple hover:text-calm-purple-dark dark:hover:text-calm-purple-light">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
