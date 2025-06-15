// src/app/feed/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react'; // Added FormEvent
import VentPost from '@/components/vents/VentPost';
import { Vent } from '@/lib/types/vent';
import Link from 'next/link'; // Added Link
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // For search icon
import DailyPrompt from '@/components/prompts/DailyPrompt'; // Import DailyPrompt

type SortByType = 'latest' | 'top' | 'trending';

export default function FeedPage() {
  const [vents, setVents] = useState<Vent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<SortByType>('latest');
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // State for submitted search term
  const VENTS_PER_PAGE = 10;

  useEffect(() => {
    const fetchVents = async () => {
      setIsLoading(true);
      setError(null);
      let apiUrl = `/api/vents?page=${currentPage}&limit=${VENTS_PER_PAGE}&sortBy=${activeTab}`;
      if (activeSearchTerm) {
        apiUrl += `&keyword=${encodeURIComponent(activeSearchTerm)}`;
      }

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorData = await response.json();
          // Specific check for text index error from backend
          if (errorData.details && errorData.details.includes("Text index required")) {
            setError("Search is temporarily unavailable. Please try again later or contact support if the issue persists. (Admin: Text index might be missing on 'vents' collection).");
          } else {
            setError(errorData.error || 'Failed to fetch vents');
          }
          setVents([]);
          return;
        }
        const data = await response.json();
        setVents(data.vents);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        setError(err.message);
        setVents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVents();
  }, [currentPage, activeTab, activeSearchTerm]); // Add activeSearchTerm to dependency array

  const handleTabChange = (tab: SortByType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    // setVents([]); // Let useEffect handle refetch with new tab
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page for new search
    setActiveSearchTerm(searchQuery);
    // setVents([]); // Let useEffect handle refetch with new search term
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearchTerm('');
    setCurrentPage(1);
    // setVents([]); // Let useEffect handle refetch without search term
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1); // Corrected: was prev + 1
  };

  // Function to update a single vent in the list (e.g., after a reaction or save)
  const handleVentUpdateInList = (updatedVent: Vent) => {
    setVents(prevVents =>
      prevVents.map(v => (v._id === updatedVent._id ? updatedVent : v))
    );
  };


  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold text-neutral-darker dark:text-neutral-light mb-6 text-center">Vents Feed</h1>

      <DailyPrompt /> {/* Add DailyPrompt component here */}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vents by keyword..."
          className="flex-grow p-2 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm focus:ring-calm-purple focus:border-calm-purple dark:bg-dark-card dark:text-neutral-light"
        />
        <button
          type="submit"
          className="p-2 bg-calm-purple hover:bg-calm-purple-dark text-white rounded-md shadow-sm flex items-center"
          disabled={isLoading}
        >
          <MagnifyingGlassIcon className="h-5 w-5 mr-1" /> Search
        </button>
        {activeSearchTerm && (
          <button
            type="button"
            onClick={clearSearch}
            className="p-2 bg-neutral-dark hover:bg-neutral-darker text-white rounded-md shadow-sm"
            disabled={isLoading}
          >
            Clear
          </button>
        )}
      </form>

      {activeSearchTerm && !isLoading && (
        <p className="text-sm text-neutral-dark dark:text-neutral-DEFAULT mb-4">
          Showing results for: <strong>"{activeSearchTerm}"</strong>
        </p>
      )}


      <div className="mb-6 flex justify-center border-b border-neutral-light dark:border-neutral-dark">
        {(['latest', 'top', 'trending'] as SortByType[]).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            disabled={isLoading || (tab === 'trending')} // Keep 'trending' disabled for now as it's not implemented
            title={ tab === 'trending' ? "Trending sort coming soon!" : `Sort by ${tab}` }
            className={`py-3 px-6 font-medium text-lg capitalize
                        ${activeTab === tab ? 'border-b-2 border-calm-purple text-calm-purple dark:text-calm-purple-light' : 'text-neutral-dark dark:text-neutral-DEFAULT hover:text-calm-purple-dark dark:hover:text-calm-purple-light'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading && vents.length === 0 && (
        <div className="text-center py-10"><p className="text-lg text-neutral-dark dark:text-neutral-DEFAULT">Loading vents...</p></div>
      )}

      {error && (
        <div className="text-center py-10 bg-red-100 dark:bg-red-800 p-4 rounded-md">
          <p className="text-lg text-red-600 dark:text-red-200">{error}</p>
        </div>
      )}

      {!isLoading && !error && vents.length === 0 && (
        <div className="text-center py-10">
          <p className="text-lg text-neutral-dark dark:text-neutral-DEFAULT">
            {activeSearchTerm ? `No vents found matching "${activeSearchTerm}".` : "No vents found. Why not be the first to share?"}
          </p>
          {!activeSearchTerm && (
            <Link href="/vents/new" className="mt-4 inline-block bg-calm-purple hover:bg-calm-purple-dark text-white font-bold py-2 px-4 rounded">
              Create a Vent
            </Link>
          )}
        </div>
      )}

      <div className="space-y-6">
        {vents.map(vent => (
          // Pass isInitiallySaved status if we can determine it.
          // For a general feed, it's unlikely we know this without extra queries per vent.
          // The VentPost component's internal save state will handle it after first interaction.
          <VentPost
            key={vent._id?.toString()}
            vent={vent}
            onVentUpdate={handleVentUpdateInList}
            // isInitiallySaved={ checkIfVentIsSaved(vent._id) } // Needs a helper and user's saved list
          />
        ))}
      </div>

      {!isLoading && !error && vents.length > 0 && totalPages > 1 && (
        <div className="mt-8 flex justify-between items-center">
          <button onClick={handlePrevPage} disabled={currentPage === 1 || isLoading} className="bg-calm-blue hover:bg-calm-blue-dark text-white font-semibold py-2 px-4 rounded disabled:opacity-50">Previous</button>
          <span className="text-neutral-dark dark:text-neutral-DEFAULT">Page {currentPage} of {totalPages}</span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages || isLoading} className="bg-calm-blue hover:bg-calm-blue-dark text-white font-semibold py-2 px-4 rounded disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
