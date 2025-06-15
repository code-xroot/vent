// src/components/comments/CommentPost.tsx
'use client';

import { Comment } from '@/lib/types/comment';
import { useSession } from 'next-auth/react';
import { useState, Fragment } from 'react';
import ReportModal from '@/components/shared/ReportModal';
import { EllipsisHorizontalIcon, FlagIcon } from '@heroicons/react/24/outline';
import { Menu, Transition as MenuTransition } from '@headlessui/react';


// Simple avatar generator (can be imported from VentPost or a shared util)
const generateAvatar = (seed: string, isAnonymous: boolean) => {
  if (!isAnonymous && seed.startsWith('http')) {
    return <img src={seed} alt="User Avatar" className="w-8 h-8 rounded-full" />;
  }
  const initial = (seed[0] || 'A').toUpperCase();
  const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-indigo-400', 'bg-purple-400', 'bg-pink-400', 'bg-teal-400'];
  const colorIndex = (seed.charCodeAt(0) || 0) % colors.length;
  return (
    <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-semibold text-sm`}>
      {initial}
    </div>
  );
};

interface CommentPostProps {
  comment: Comment;
}

export default function CommentPost({ comment }: CommentPostProps) {
  const { data: session, status } = useSession();
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSubmittedMessage, setReportSubmittedMessage] = useState('');


  return (
    <>
      <article className="bg-white dark:bg-dark-bg shadow rounded-lg p-4 flex items-start space-x-3"> {/* Updated dark mode class */}
        <div>{generateAvatar(comment.avatarSeed || comment.userId, comment.isAnonymous)}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between"> {/* Use justify-between */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-darker dark:text-neutral-light">
                {comment.pseudonym || 'User'}
                {comment.isAnonymous && <span className="text-xs text-neutral-dark ml-1">(Anonymous)</span>}
              </h4>
              <p className="text-xs text-neutral-dark dark:text-neutral-DEFAULT">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
            {status === 'authenticated' && comment._id && (
              <Menu as="div" className="relative inline-block text-left">
                <div><Menu.Button className="p-1 rounded-full hover:bg-neutral-light dark:hover:bg-neutral-dark text-neutral-darker dark:text-neutral-light"><EllipsisHorizontalIcon className="h-5 w-5" /></Menu.Button></div>
                <MenuTransition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="absolute right-0 mt-1 w-40 origin-top-right rounded-md bg-white dark:bg-dark-card shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-1 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button onClick={() => setShowReportModal(true)} className={`${active ? 'bg-red-500 text-white' : 'text-neutral-darker dark:text-neutral-light'} group flex w-full items-center rounded-md px-2 py-2 text-sm`}>
                            <FlagIcon className="mr-2 h-5 w-5" /> Report
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </MenuTransition>
              </Menu>
            )}
          </div>
          <p className="text-neutral-darker dark:text-neutral-light whitespace-pre-wrap mt-1 text-sm">
            {comment.content}
          </p>
          {reportSubmittedMessage && (
            <p className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-700 p-1 rounded-md mt-2 text-center">
                {reportSubmittedMessage}
            </p>
          )}
        </div>
      </article>
      {comment._id && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          itemId={comment._id.toString()}
          itemType="comment"
          onSubmitSuccess={() => {
             setReportSubmittedMessage('Comment reported. Our team will review it.');
             setTimeout(() => setReportSubmittedMessage(''), 5000);
          }}
        />
      )}
    </>
  );
}
