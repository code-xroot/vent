// src/app/vents/new/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react'; // Added useEffect
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { EMOTION_TAGS, TOPIC_CATEGORIES } from '@/lib/constants'; // Adjust path if needed
import { useSession } from 'next-auth/react';

export default function NewVentPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get query parameters
  const { data: session, status } = useSession(); // For checking auth status if needed for UI changes

  const [content, setContent] = useState(''); // Initial content from query param
  const [emotionTag, setEmotionTag] = useState('');
  const [topicCategory, setTopicCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 2000;

  useEffect(() => {
    const promptText = searchParams.get('prompt');
    if (promptText) {
      const initialContent = `Inspired by the prompt: "${promptText}"

`;
      if (initialContent.length <= MAX_CHARS) {
         setContent(initialContent);
         setCharCount(initialContent.length);
      } else {
         setContent(initialContent.substring(0, MAX_CHARS));
         setCharCount(MAX_CHARS);
      }
    }
  }, [searchParams]);


  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setContent(text);
      setCharCount(text.length);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!content.trim()) {
      setError('Vent content cannot be empty.');
      setIsLoading(false);
      return;
    }
    if (!emotionTag) {
      setError('Please select an emotion tag.');
      setIsLoading(false);
      return;
    }
    if (!topicCategory) {
      setError('Please select a topic category.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/vents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, emotionTag, topicCategory }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vent.');
      }

      // const newVent = await response.json();
      // Optionally, redirect to the feed or the new vent's page
      router.push('/feed'); // Redirect to feed for now
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure anonymous session is established if not logged in
  // This can be done by calling the session endpoint if no cookie is detected,
  // or rely on the API to handle it if the cookie is missing.
  // For simplicity, we'll assume the anonymous cookie is set by prior navigation
  // or the API call to /api/vents will trigger /api/auth/session if needed (though this is less direct).
  // A good place for ensuring anon session is in a top-level layout or provider.
  // For now, the /api/vents POST will work if the anon cookie exists.

  return (
    // ... (existing JSX for the form)
    // Ensure the textarea for content uses the `content` state variable
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-dark-card shadow-xl rounded-lg">
      <h1 className="text-3xl font-bold text-neutral-darker dark:text-neutral-light mb-6 text-center">Share Your Thoughts</h1>
      <p className="text-neutral-dark dark:text-neutral-DEFAULT mb-8 text-center">
        Let it out. Your post will be anonymous if you're not signed in.
        {status === 'authenticated' && session?.user?.name && (
          <span className="block text-sm text-calm-blue-dark dark:text-calm-blue-light mt-1">Posting as {session.user.name}</span>
        )}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-neutral-darker dark:text-neutral-light mb-1">
            Your Vent ({charCount}/{MAX_CHARS})
          </label>
          <textarea
            id="content"
            name="content"
            rows={6}
            className="w-full p-3 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm focus:ring-calm-purple focus:border-calm-purple dark:bg-dark-bg dark:text-neutral-light"
            value={content} // Make sure this uses the state variable
            onChange={handleContentChange}
            placeholder="What's on your mind?"
            required
            aria-describedby="content-char-count"
          />
          <p id="content-char-count" className={`text-sm mt-1 ${charCount > MAX_CHARS - 100 ? (charCount > MAX_CHARS ? 'text-red-500' : 'text-orange-500') : 'text-neutral-dark dark:text-neutral-DEFAULT'}`}>
            {MAX_CHARS - charCount} characters remaining
          </p>
        </div>

        <div>
          <label htmlFor="emotionTag" className="block text-sm font-medium text-neutral-darker mb-1">
            How are you feeling?
          </label>
          <select
            id="emotionTag"
            name="emotionTag"
            className="w-full p-3 border border-neutral-DEFAULT rounded-md shadow-sm focus:ring-calm-purple focus:border-calm-purple bg-white"
            value={emotionTag}
            onChange={(e) => setEmotionTag(e.target.value)}
            required
          >
            <option value="" disabled>Select an emotion</option>
            {EMOTION_TAGS.map(tag => (
              <option key={tag.id} value={tag.label}>{tag.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="topicCategory" className="block text-sm font-medium text-neutral-darker mb-1">
            What is it about?
          </label>
          <select
            id="topicCategory"
            name="topicCategory"
            className="w-full p-3 border border-neutral-DEFAULT rounded-md shadow-sm focus:ring-calm-purple focus:border-calm-purple bg-white"
            value={topicCategory}
            onChange={(e) => setTopicCategory(e.target.value)}
            required
          >
            <option value="" disabled>Select a category</option>
            {TOPIC_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.label}>{cat.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading || !content.trim() || !emotionTag || !topicCategory}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-calm-purple hover:bg-calm-purple-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-calm-purple-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : 'Post Anonymously'}
          </button>
        </div>
      </form>
    </div>
  );
}
