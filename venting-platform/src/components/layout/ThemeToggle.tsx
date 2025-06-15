// src/components/layout/ThemeToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  // Default to 'light' on initial render (server & client pre-mount).
  // This will be updated after mount from localStorage.
  const [theme, setTheme] = useState<string>('light');
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Effect 1: Runs once on client mount.
  // Reads theme from localStorage and updates state. Then marks as mounted.
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    // Optional: Fallback to system preference if no theme is stored in localStorage
    // const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // const initialClientTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
    const initialClientTheme = storedTheme || 'light'; // Default to 'light' if nothing is stored

    setTheme(initialClientTheme); // Update theme state based on localStorage
    setIsMounted(true); // Mark as mounted AFTER attempting to set the theme
  }, []); // Empty dependency array ensures this runs only once on client mount

  // Effect 2: Apply theme to DOM and update localStorage.
  // Runs whenever 'theme' state changes OR when 'isMounted' becomes true.
  useEffect(() => {
    if (isMounted) { // Only proceed if component is mounted
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }
  }, [theme, isMounted]); // Dependencies: theme and isMounted

  // Render a placeholder or null until the component is mounted on the client.
  // This helps prevent hydration mismatches.
  if (!isMounted) {
    return <div className="w-6 h-6" />;
  }

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-neutral-DEFAULT dark:hover:bg-neutral-darker transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <SunIcon className="w-6 h-6 text-yellow-400" />
      ) : (
        <MoonIcon className="w-6 h-6 text-calm-blue-dark" />
      )}
    </button>
  );
}
