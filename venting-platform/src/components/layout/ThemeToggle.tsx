// src/components/layout/ThemeToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'; // Install @heroicons/react if not already

export default function ThemeToggle() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    setIsMounted(true);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Set initial theme on mount based on localStorage or system preference (optional)
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (systemPrefersDark) {
      // setTheme('dark'); // Uncomment to default to system preference
    }
  }, []);


  if (!isMounted) {
    return <div className="w-6 h-6" />; // Placeholder to prevent layout shift
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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
