// src/components/prompts/DailyPrompt.tsx
'use client';

import { useEffect, useState } from 'react';
import { Prompt } from '@/lib/types/prompt'; // Adjust path as needed
import Link from 'next/link';
import { LightBulbIcon } from '@heroicons/react/24/outline';

export default function DailyPrompt() {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrompt = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/prompts/today');
        if (response.status === 404) {
          // No prompt for today, not necessarily an "error" to display prominently
          setPrompt(null);
          console.info('No active prompt for today.');
          return; // Important to return here after setting prompt to null
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch today\'s prompt');
        }
        const data: Prompt = await response.json();
        setPrompt(data);
      } catch (err: any) {
        console.error("Error fetching daily prompt:", err.message);
        setError(err.message); // You might choose not to show this error in UI prominently
        setPrompt(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompt();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-calm-blue-light dark:bg-calm-blue-dark rounded-lg shadow-md text-center animate-pulse">
        <p className="text-sm text-calm-blue-dark dark:text-calm-blue-light">Loading today's inspiration...</p>
      </div>
    );
  }

  // Do not render the component at all if there's an error or no prompt,
  // unless you want to display a specific message for these cases.
  // For a cleaner UI, often it's better to just not show the prompt section.
  if (error || !prompt) {
    return null; // Or a subtle fallback message if desired
  }

  // If you want to show an error:
  // if (error) {
  //   return <p className="text-red-500 text-sm">Could not load prompt: {error}</p>;
  // }
  // if (!prompt) {
  //   return <p className="text-neutral-500 text-sm">No prompt for today. Check back tomorrow!</p>;
  // }


  return (
    <div className="my-6 p-4 bg-gradient-to-r from-calm-blue-light via-calm-purple-light to-neutral-light dark:from-calm-blue-dark dark:via-calm-purple-dark dark:to-neutral-darker rounded-lg shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl">
      <div className="flex items-center mb-2">
        <LightBulbIcon className="h-6 w-6 text-yellow-400 dark:text-yellow-300 mr-2 flex-shrink-0" />
        <h3 className="text-lg font-semibold text-neutral-darker dark:text-neutral-light">
          Today's Inspiration
        </h3>
      </div>
      <p className="text-neutral-dark dark:text-neutral-DEFAULT mb-3 text-sm sm:text-base">
        {prompt.text}
      </p>
      <Link
        href={`/vents/new?prompt=${encodeURIComponent(prompt.text)}`}
        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-calm-purple hover:bg-calm-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-calm-purple-dark transition-transform transform hover:scale-105"
      >
        Write about this
      </Link>
    </div>
  );
}
