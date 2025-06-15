// src/components/vents/VentPost.tsx
'use client';

import { Vent, ReactionCounts } from '@/lib/types/vent';
import { EMOTION_TAGS, TOPIC_CATEGORIES, REACTION_TYPES } from '@/lib/constants';
import Link from 'next/link';
import { useState, useEffect } from 'react'; // Added useEffect
import { useSession } from 'next-auth/react'; // To check authentication status
import { BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import ReportModal from '@/components/shared/ReportModal'; // Adjust path
import { EllipsisHorizontalIcon, FlagIcon } from '@heroicons/react/24/outline'; // FlagIcon for report
import { Menu, Transition as MenuTransition } from '@headlessui/react'; // For dropdown menu
import { Fragment } from 'react'; // For MenuTransition


// Updated avatar generator
const generateAvatar = (name?: string | null, imageUrl?: string | null) => {
  // If an image URL is provided (e.g., from Google profile), use it.
  if (imageUrl) {
    return <img src={imageUrl} alt={name || 'User Avatar'} className="w-10 h-10 rounded-full object-cover" />;
  }

  // Fallback to initial-based avatar if no image URL
  // Use the first character of the name, or 'U' for 'User' if name is also missing.
  const initial = (name?.[0] || 'U').toUpperCase();
  const colors = [ // Consistent set of fallback colors
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'
  ];
  // Generate a somewhat consistent color based on the initial or name length
  const colorIndex = (initial.charCodeAt(0) - 'A'.charCodeAt(0) + (name?.length || 0)) % colors.length;
  const bgColor = colors[colorIndex >= 0 ? colorIndex : 0]; // Ensure positive index

  return (
    <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-xl`}>
      {initial}
    </div>
  );
};

interface VentPostProps {
  vent: Vent;
  isInitiallySaved?: boolean; // Pass this if known, e.g., on "My Saved Vents" page
  onVentUpdate?: (updatedVent: Vent) => void; // Callback to update vent in parent list
}

export default function VentPost({ vent: initialVent, isInitiallySaved = false, onVentUpdate }: VentPostProps) {
  const [vent, setVent] = useState<Vent>(initialVent);
  const [isReacting, setIsReacting] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [isSaving, setIsSaving] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmittedMessage, setReportSubmittedMessage] = useState('');


  useEffect(() => { setIsSaved(isInitiallySaved); }, [isInitiallySaved]);
  useEffect(() => { setVent(initialVent); }, [initialVent]);


  const emotionTagDetails = EMOTION_TAGS.find(tag => tag.label === vent.emotionTag);
  const topicCategoryDetails = TOPIC_CATEGORIES.find(cat => cat.label === vent.topicCategory);

  const handleReaction = async (reactionType: string) => {
    // ... (existing reaction logic - ensure it calls onVentUpdate if provided)
    if (isReacting) return;
    setIsReacting(reactionType);
    const currentReactionCount = vent.reactions[reactionType] || 0;
    const newReactionsOptimistic: ReactionCounts = { ...vent.reactions, [reactionType]: currentReactionCount + 1 };
    const originalReactions = vent.reactions; // Store original for rollback
    setVent(prevVent => ({ ...prevVent, reactions: newReactionsOptimistic }));

    try {
      const response = await fetch(`/api/vents/${vent._id}/react`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setVent(prevVent => ({ ...prevVent, reactions: originalReactions }));
        console.error('Failed to react:', errorData.error || 'Unknown error');
        return;
      }
      const updatedVentData = await response.json();
      setVent(updatedVentData);
      if (onVentUpdate) onVentUpdate(updatedVentData); // Call callback
    } catch (error) {
      console.error('Error submitting reaction:', error);
      setVent(prevVent => ({ ...prevVent, reactions: originalReactions }));
    } finally {
      setIsReacting(null);
    }
  };

  const handleToggleSave = async () => {
    if (status !== 'authenticated' || !session?.user || !vent._id) return;
    setIsSaving(true);
    const endpoint = `/api/users/me/saved-vents`;
    try {
      let response;
      if (isSaved) {
        // Unsave
        response = await fetch(`${endpoint}/${vent._id.toString()}`, { method: 'DELETE' });
      } else {
        // Save
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ventId: vent._id.toString() }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to toggle save:', errorData.error || 'Unknown error');
        // TODO: Show error to user
        return;
      }
      setIsSaved(!isSaved);
      // Optionally, if the save/unsave action affects the vent data itself (e.g. a saveCount)
      // you might want to fetch the updated vent or receive it in the response.
      // For now, just toggling the client-side state.
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalReactions = Object.values(vent.reactions || {}).reduce((sum, count) => sum + count, 0);

  // Since vent.isAnonymous is now always false, and vent.pseudonym is the user's name,
  // and vent.avatarSeed is the user's image URL (or null).
  const displayName = vent.pseudonym || 'User'; // Fallback if name is somehow null
  const avatarElement = generateAvatar(displayName, vent.avatarSeed); // Pass name for initials if image is null

  return (
    <>
      <article className="bg-white dark:bg-dark-card shadow-lg rounded-lg p-6 mb-6 break-inside-avoid">
        <div className="flex items-start mb-4">
          {avatarElement} {/* Use the updated avatar element */}
          <div className="ml-3 flex-grow">
            <h3 className="font-semibold text-lg text-neutral-darker dark:text-neutral-light">
              {displayName}
              {/* The (Anonymous) span is no longer needed as isAnonymous is always false */}
              {/* {vent.isAnonymous && <span className="text-sm text-neutral-dark ml-1">(Anonymous)</span>} */}
            </h3>
            <p className="text-xs text-neutral-dark dark:text-neutral-DEFAULT">
              {new Date(vent.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Actions Menu: Save & Report */}
          <div className="relative">
            <Menu as="div" className="relative inline-block text-left">
              <div>
                <Menu.Button className="p-1 rounded-full hover:bg-neutral-light dark:hover:bg-neutral-dark text-neutral-darker dark:text-neutral-light">
                  <EllipsisHorizontalIcon className="h-6 w-6" />
                </Menu.Button>
              </div>
              <MenuTransition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-neutral-light dark:divide-neutral-dark rounded-md bg-white dark:bg-dark-bg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-1 py-1">
                    {status === 'authenticated' && vent._id && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleToggleSave}
                            disabled={isSaving}
                            className={`${
                              active ? 'bg-calm-purple text-white' : 'text-neutral-darker dark:text-neutral-light'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm disabled:opacity-50`}
                          >
                            {isSaving ? 'Saving...' : isSaved ? <BookmarkSolidIcon className="mr-2 h-5 w-5" /> : <BookmarkOutlineIcon className="mr-2 h-5 w-5" />}
                            {isSaved ? 'Unsave' : 'Save'}
                          </button>
                        )}
                      </Menu.Item>
                    )}
                    {status === 'authenticated' && vent._id && (
                       <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => setShowReportModal(true)}
                            className={`${
                              active ? 'bg-red-500 text-white' : 'text-neutral-darker dark:text-neutral-light'
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            <FlagIcon className="mr-2 h-5 w-5" />
                            Report
                          </button>
                        )}
                      </Menu.Item>
                    )}
                  </div>
                </Menu.Items>
              </MenuTransition>
            </Menu>
          </div>
        </div>

        {/* ... (content, tags, reactions UI) ... */}
        <p className="text-neutral-darker dark:text-neutral-light whitespace-pre-wrap mb-4 leading-relaxed">
          {vent.content}
        </p>
         {/* ... (tags display) ... */}
        <div className="flex flex-wrap gap-2 mb-4">
            {emotionTagDetails && (
              <span className={`px-3 py-1 text-sm rounded-full ${emotionTagDetails.color}`}>
                {vent.emotionTag}
              </span>
            )}
            {topicCategoryDetails && (
              <span className={`px-3 py-1 text-sm rounded-full border ${topicCategoryDetails.color} text-gray-700 dark:text-neutral-light`}>
                {vent.topicCategory}
              </span>
            )}
        </div>

        {reportSubmittedMessage && (
            <p className="text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-700 p-2 rounded-md mb-3 text-center">
                {reportSubmittedMessage}
            </p>
        )}

        {/* ... (reactions bar and buttons) ... */}
        <div className="border-t border-neutral-light dark:border-neutral-dark pt-4">
            <div className="flex justify-between items-center text-sm text-neutral-dark dark:text-neutral-DEFAULT mb-3">
              <div>
                <span className="mr-3">Reactions: {totalReactions}</span>
              </div>
              <Link href={`/vents/${vent._id?.toString()}/comments`} className="hover:underline">
                Comments ({vent.commentCount})
              </Link>
            </div>
            <div className="flex space-x-2">
              {REACTION_TYPES.map(reaction => (
                <button
                  key={reaction.id}
                  onClick={() => handleReaction(reaction.id)}
                  disabled={!!isReacting || status !== 'authenticated'} // Disable if not authenticated
                  title={status !== 'authenticated' ? "Sign in to react" : reaction.label}
                  className={`px-3 py-1 rounded-full text-sm flex items-center space-x-1
                            border border-neutral-DEFAULT dark:border-neutral-dark hover:bg-neutral-light dark:hover:bg-neutral-darker
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${isReacting === reaction.id ? 'bg-neutral-light dark:bg-neutral-darker animate-pulse' : ''}`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.label}</span>
                  <span className="text-xs text-neutral-dark dark:text-neutral-DEFAULT">({vent.reactions[reaction.id] || 0})</span>
                </button>
              ))}
            </div>
        </div>
      </article>

      {vent._id && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          itemId={vent._id.toString()}
          itemType="vent"
          onSubmitSuccess={() => {
            setReportSubmittedMessage('Vent reported successfully. Our team will review it.');
            setTimeout(() => setReportSubmittedMessage(''), 5000); // Clear message after 5s
          }}
        />
      )}
    </>
  );
}
