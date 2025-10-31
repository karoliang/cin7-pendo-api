import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Session Recording
              </DialogTitle>
              <div className="text-sm text-gray-600 mt-1">
                {visitorId && <span>Visitor: {visitorId}</span>}
                {date && <span className="ml-4">Date: {date}</span>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 h-[calc(90vh-140px)]">
          <iframe
            src={`https://app.pendo.io/session/${recordingId}`}
            className="w-full h-full rounded-lg border border-gray-200"
            allow="fullscreen"
            title="Pendo Session Recording"
          />
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 text-xs text-gray-500">
          <p>
            Recording ID: <span className="font-mono">{recordingId}</span>
          </p>
          <p className="mt-1">
            Press <kbd className="px-2 py-1 bg-white border rounded">ESC</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
