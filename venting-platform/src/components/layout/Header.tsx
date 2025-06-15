// src/components/layout/Header.tsx
"use client";
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { useSession, signOut } from 'next-auth/react'; // Import signOut
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline'; // Example icons

export default function Header() {
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' }); // Redirect to home page after sign out
  };

  return (
    <header className="bg-neutral-light dark:bg-dark-card py-4 px-6 shadow-md sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-calm-blue-dark dark:text-calm-blue-light">
          VentSpace
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link href="/feed" className="text-sm sm:text-base text-calm-blue-dark dark:text-calm-blue-light hover:text-calm-purple dark:hover:text-calm-purple-light">Feed</Link>
          <Link href="/vents/new" className="text-sm sm:text-base text-calm-blue-dark dark:text-calm-blue-light hover:text-calm-purple dark:hover:text-calm-purple-light">New Vent</Link>
          {status === 'authenticated' && session?.user && ( // Check session.user as well for robustness
            <>
              <Link href="/my-saved" className="text-sm sm:text-base text-calm-blue-dark dark:text-calm-blue-light hover:text-calm-purple dark:hover:text-calm-purple-light">Saved</Link>
              {/* Optional: Display user name or profile link */}
              {/* <span className="text-sm text-neutral-darker dark:text-neutral-light hidden sm:block">
                {session.user.name || session.user.email}
              </span> */}
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 rounded-md hover:bg-neutral-DEFAULT dark:hover:bg-neutral-darker transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-calm-blue-dark dark:text-calm-blue-light" />
              </button>
            </>
          )}
          {status !== 'authenticated' && status !== 'loading' && ( // Added status !== 'loading'
             <Link href="/auth/signin" className="text-sm sm:text-base text-calm-blue-dark dark:text-calm-blue-light hover:text-calm-purple dark:hover:text-calm-purple-light flex items-center">
                <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-1" />
                Sign In
             </Link>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
