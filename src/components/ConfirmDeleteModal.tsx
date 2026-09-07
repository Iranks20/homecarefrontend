import { useEffect, useState, type ReactNode } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: ReactNode;
  confirmWord?: string;
  confirmLabel?: string;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmWord = 'DELETE',
  confirmLabel = 'Delete permanently',
}: ConfirmDeleteModalProps) {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMatch = input === confirmWord;

  const handleConfirm = async () => {
    if (!isMatch || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-5 border-b">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm text-gray-700">{description}</div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Type <span className="font-mono font-semibold text-gray-900">{confirmWord}</span> to confirm
            </label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={confirmWord}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleConfirm();
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!isMatch || submitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
