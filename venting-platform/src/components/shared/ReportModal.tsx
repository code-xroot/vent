// src/components/shared/ReportModal.tsx
'use client';

import { useState, FormEvent, Fragment, useEffect } from 'react'; // Added useEffect
import { Dialog, Transition } from '@headlessui/react'; // npm install @headlessui/react
import { REPORT_REASONS } from '@/lib/constants';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string; // ID of the vent or comment
  itemType: 'vent' | 'comment';
  onSubmitSuccess: () => void; // Callback on successful report
}

export default function ReportModal({ isOpen, onClose, itemId, itemType, onSubmitSuccess }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const finalReason = reason === 'other' ? otherReasonText.trim() : REPORT_REASONS.find(r => r.id === reason)?.label || reason;

    if (!finalReason) {
      setError('Please select a reason or provide details if "Other".');
      setIsSubmitting(false);
      return;
    }
    if (finalReason.length > 500) {
        setError('Reason details are too long (max 500 characters).');
        setIsSubmitting(false);
        return;
    }


    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedItemId: itemId,
          itemType: itemType,
          reason: finalReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to submit report for ${itemType}.`);
      }
      onSubmitSuccess(); // Call the success callback
      onClose(); // Close modal on success
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens or closes or item changes
  useEffect(() => {
    if (!isOpen) { // Reset when closing
        setTimeout(() => { // Delay reset to allow exit animation
            setReason('');
            setOtherReasonText('');
            setError(null);
            setIsSubmitting(false);
        }, 300); // Adjust delay to match your leave transition duration
    } else { // Reset/initialize when opening for a new item
        setReason('');
        setOtherReasonText('');
        setError(null);
        setIsSubmitting(false);
    }
  }, [isOpen, itemId, itemType]);


  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-dark-card p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-neutral-darker dark:text-neutral-light flex items-center">
                  <ShieldExclamationIcon className="h-6 w-6 text-red-500 mr-2" />
                  Report Content
                </Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <p className="text-sm text-neutral-dark dark:text-neutral-DEFAULT">
                    You are reporting a {itemType}. Please select a reason. Your report is anonymous to other users.
                  </p>
                  <div>
                    <label htmlFor="reasonSelect" className="block text-sm font-medium text-neutral-darker dark:text-neutral-light mb-1">
                      Reason for reporting:
                    </label>
                    <select
                      id="reasonSelect"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full p-2 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm focus:ring-calm-purple focus:border-calm-purple bg-white dark:bg-dark-bg dark:text-neutral-light"
                      required
                    >
                      <option value="" disabled>Select a reason</option>
                      {REPORT_REASONS.map(r => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {reason === 'other' && (
                    <div>
                      <label htmlFor="otherReasonText" className="block text-sm font-medium text-neutral-darker dark:text-neutral-light mb-1">
                        Please specify:
                      </label>
                      <textarea
                        id="otherReasonText"
                        value={otherReasonText}
                        onChange={(e) => setOtherReasonText(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-neutral-DEFAULT dark:border-neutral-dark rounded-md shadow-sm focus:ring-calm-purple focus:border-calm-purple bg-white dark:bg-dark-bg dark:text-neutral-light"
                        placeholder="Provide more details (max 500 characters)"
                        maxLength={500}
                        required
                      />
                    </div>
                  )}

                  {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-neutral-dark dark:text-neutral-light bg-neutral-light dark:bg-neutral-dark hover:bg-neutral-DEFAULT dark:hover:bg-neutral-darker rounded-md border border-transparent"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !reason || (reason === 'other' && !otherReasonText.trim())} // Updated disabled condition
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
