// src/components/layout/ThemeToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function ThemeToggle() {
  // Initialize with a default theme; will be updated on mount.
  // This helps avoid trying to access localStorage on the server or too early on the client.
  const [theme, setTheme] = useState('light');
  const [isMounted, setIsMounted] = useState(false);

  // Effect 1: Runs once on the client after initial render to set the theme
  // from localStorage (or system preference) and mark the component as mounted.
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    // Optional: Check system preference if no theme is stored
    // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
      setTheme(storedTheme);
    }
    // else if (prefersDark) { // Uncomment to respect system preference if no stored theme
    //   setTheme('dark');
    // }
    // else { // If neither stored nor system preference (or system is light)
    //   setTheme('light'); // Explicitly ensure it's light if that's the fallback
    // }
    setIsMounted(true);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect 2: Runs whenever the theme state changes (and after mount)
  // to apply the 'dark' class to the HTML element and update localStorage.
  useEffect(() => {
    // Only apply changes if the component is mounted and theme has been initialized.
    if (isMounted) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    }
  }, [theme, isMounted]); // Re-run when theme or isMounted changes

  // While not mounted, return a placeholder to prevent hydration mismatch,
  // as the server-rendered output won't know the theme from localStorage.
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
