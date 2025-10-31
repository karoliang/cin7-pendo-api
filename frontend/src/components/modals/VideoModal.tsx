import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/polaris/Cin7Modal';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  visitorId?: string;
  date?: string;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  recordingId,
  visitorId,
  date,
}) => {
  const pendoUrl = `https://app.pendo.io/session/${recordingId}`;

  const handleOpenRecording = () => {
    // Open in new window with specific dimensions
    const width = 1400;
    const height = 900;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      pendoUrl,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pendoUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Session Recording
          </DialogTitle>
          <DialogDescription>
            View the Pendo session recording for this visitor interaction.
            {visitorId && ` Visitor: ${visitorId}.`}
            {date && ` Recorded on: ${date}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informational content */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="space-y-2 text-sm">
              {visitorId && (
                <div>
                  <span className="font-medium text-gray-700">Visitor ID:</span>{' '}
                  <span className="font-mono text-gray-600">{visitorId}</span>
                </div>
              )}
              {date && (
                <div>
                  <span className="font-medium text-gray-700">Date:</span>{' '}
                  <span className="text-gray-600">{date}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Recording ID:</span>{' '}
                <span className="font-mono text-gray-600">{recordingId}</span>
              </div>
            </div>
          </div>

          {/* Explanation notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Authentication Required
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Session recordings will open in a new window. You must be logged into
                  Pendo with the appropriate permissions to view the recording.
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleOpenRecording}
            className="w-full flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            <span>Open Session Recording in Pendo</span>
          </button>

          {/* Alternative: Copy link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Copy Link to Clipboard</span>
          </button>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs">ESC</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
