// src/app/auth/signin/page.tsx
'use client';

import { useEffect } from 'react'; // Removed useState as email form is gone
import { signIn, useSession } from 'next-auth/react'; // Removed getProviders as we directly use 'google'
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams

// It's good to have an icon for the Google button.
// You can use an SVG, an <img> tag, or a library like react-icons.
// For simplicity, a basic text button is implemented, but an icon is recommended for better UX.
// Example: import { FcGoogle } from "react-icons/fc"; // npm install react-icons

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams(); // To get callbackUrl

  useEffect(() => {
    const callbackUrl = searchParams.get('callbackUrl') || '/'; // Default to home if no callbackUrl
    if (status === 'authenticated') {
      router.push(callbackUrl); // Redirect if already authenticated
    }
  }, [status, router, searchParams]);

  const handleGoogleSignIn = async () => {
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    // The second argument to signIn can include a callbackUrl
    await signIn('google', { callbackUrl: callbackUrl });
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-neutral-dark dark:text-neutral-DEFAULT">Loading...</p>
      </div>
    );
  }

  // If somehow still on this page while authenticated (should be redirected by useEffect)
  if (status === 'authenticated') {
     const callbackUrl = searchParams.get('callbackUrl') || '/';
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg text-neutral-dark dark:text-neutral-DEFAULT">You are already signed in. Redirecting...</p>
        {/* 안전을 위해 useEffect가 리디렉션할 때까지 기다립니다. */}
        {typeof window !== 'undefined' && window.setTimeout(() => router.push(callbackUrl), 100)}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-neutral-light dark:bg-dark-bg">
      <div className="p-8 sm:p-12 bg-white dark:bg-dark-card shadow-xl rounded-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-neutral-darker dark:text-neutral-light mb-3">
          Sign In
        </h1>
        <p className="text-neutral-dark dark:text-neutral-DEFAULT mb-8">
          Welcome to VentSpace! Sign in to continue.
        </p>

        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-calm-purple hover:bg-calm-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-calm-purple-dark transition-all duration-150 ease-in-out transform hover:scale-105"
        >
          {/* Optional: Add Google Icon here. Example: <FcGoogle className="mr-2 h-5 w-5" /> */}
          <svg className="mr-2 -ml-1 w-4 h-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.4S109.4 18.3 244 18.3c69.9 0 129.5 28.5 173.7 74.2l-63.1 61.9C324.5 118.8 286.1 96.4 244 96.4c-78.2 0-141.2 63.4-141.2 141.4s63 141.4 141.2 141.4c86.1 0 120.8-60.8 124.7-91.8H244v-75.5h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
          Sign in with Google
        </button>

        {/* Remove the old email form and provider check */}
        {/* {provider && ( ... old form ... )} */}
        {/* {!provider && status !== 'loading' && ( ... old message ... )} */}

        <p className="mt-6 text-xs text-neutral-dark dark:text-neutral-DEFAULT">
          By signing in, you agree to our (future) Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
