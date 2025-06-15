// src/app/vents/[ventId]/comments/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Vent } from '@/lib/types/vent';
import { Comment } from '@/lib/types/comment';
import VentPost from '@/components/vents/VentPost'; // To display parent vent
import CommentPost from '@/components/comments/CommentPost'; // Create this next

export default function VentCommentsPage() {
  const params = useParams();
  const ventId = params.ventId as string;
  const router = useRouter();

  const [vent, setVent] = useState<Vent | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');

  const [isLoadingVent, setIsLoadingVent] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [error, setError] = useState<string | null>(null); // For vent fetching
  const [commentError, setCommentError] = useState<string | null>(null); // For comments fetching/posting

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const COMMENTS_PER_PAGE = 20;


  // Fetch the parent vent
  useEffect(() => {
    if (!ventId) return;
    setIsLoadingVent(true);
    setError(null);
    const fetchVent = async () => {
      try {
        const response = await fetch(`/api/vents?id=${ventId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch vent details');
        }
        const data = await response.json();
        setVent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingVent(false);
      }
    };
    fetchVent();
  }, [ventId]);

  // Fetch comments
  useEffect(() => {
    if (!ventId) return;
    setIsLoadingComments(true);
    setCommentError(null);
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/vents/${ventId}/comments?page=${currentPage}&limit=${COMMENTS_PER_PAGE}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch comments');
        }
        const data = await response.json();
        setComments(data.comments);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        setCommentError(err.message);
      } finally {
        setIsLoadingComments(false);
      }
    };
    fetchComments();
  }, [ventId, currentPage]);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const response = await fetch(`/api/vents/${ventId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newCommentContent }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to post comment');
      }
      const newComment = await response.json();
      // Add to top for immediate view, and refetch if on last page and it creates a new page.
      setComments(prevComments => [newComment, ...prevComments]);
      setNewCommentContent('');
      // Increment parent vent's comment count
      if (vent) {
        setVent(v => v ? ({...v, commentCount: v.commentCount + 1}) : null);
      }
      // TODO: Consider refetching comments or more sophisticated pagination update
      // For instance, if adding a comment makes a new page, this won't show it.
      // A simple solution: if current page is last page and comments length reaches limit, increment totalPages.

    } catch (err: any) {
      setCommentError(err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <button onClick={() => router.back()} className="mb-4 text-calm-blue-dark hover:underline">
        &larr; Back
      </button>

      {isLoadingVent && <p className="text-center text-neutral-dark">Loading vent...</p>}
      {error && !isLoadingVent && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">Error loading vent: {error}</p>}
      {vent && !isLoadingVent && (
        <div className="mb-8">
          <VentPost vent={vent} />
        </div>
      )}

      <h2 className="text-2xl font-semibold text-neutral-darker mt-6 mb-4">Comments</h2>

      <form onSubmit={handleCommentSubmit} className="mb-6 p-4 bg-white shadow rounded-lg">
        <textarea
          value={newCommentContent}
          onChange={(e) => setNewCommentContent(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="w-full p-2 border border-neutral-DEFAULT rounded-md focus:ring-calm-purple focus:border-calm-purple"
          required
        />
        {commentError && <p className="text-sm text-red-500 mt-1">{commentError}</p>}
        <button
          type="submit"
          disabled={isSubmittingComment || !newCommentContent.trim()}
          className="mt-2 px-4 py-2 bg-calm-purple text-white rounded-md hover:bg-calm-purple-dark focus:outline-none focus:ring-2 focus:ring-calm-purple-dark disabled:opacity-50"
        >
          {isSubmittingComment ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {isLoadingComments && <p className="text-center text-neutral-dark">Loading comments...</p>}
      {commentError && !isLoadingComments && <p className="text-center text-red-500 bg-red-100 p-3 rounded-md">Error loading comments: {commentError}</p>}
      {!isLoadingComments && comments.length === 0 && !commentError && (
        <p className="text-neutral-dark text-center py-4">No comments yet. Be the first to reply!</p>
      )}
      <div className="space-y-4">
        {comments.map(comment => (
          <CommentPost key={comment._id?.toString()} comment={comment} />
        ))}
      </div>

      {!isLoadingComments && comments.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <button onClick={handlePrevPage} disabled={currentPage === 1 || isLoadingComments} className="px-3 py-1 bg-neutral-DEFAULT rounded hover:bg-neutral-dark disabled:opacity-50">Prev</button>
          <span className="text-neutral-dark">Page {currentPage} of {totalPages}</span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages || isLoadingComments} className="px-3 py-1 bg-neutral-DEFAULT rounded hover:bg-neutral-dark disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
