import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Visitor, VisitorPayload } from '../services/visitors';

interface AddEditVisitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: VisitorPayload) => Promise<void>;
  visitor?: Visitor | null;
  mode: 'add' | 'edit';
}

function formatDateForInput(value?: string | null): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

export default function AddEditVisitorModal({
  isOpen,
  onClose,
  onSave,
  visitor,
  mode,
}: AddEditVisitorModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [visitedAt, setVisitedAt] = useState(formatDateForInput());
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsSubmitting(false);
    if (mode === 'edit' && visitor) {
      setName(visitor.name);
      setPhone(visitor.phone);
      setEmail(visitor.email ?? '');
      setCompany(visitor.company ?? '');
      setPurpose(visitor.purpose ?? '');
      setNotes(visitor.notes ?? '');
      setVisitedAt(formatDateForInput(visitor.visitedAt));
      setIsActive(visitor.isActive !== false);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setCompany('');
      setPurpose('');
      setNotes('');
      setVisitedAt(formatDateForInput());
      setIsActive(true);
    }
  }, [isOpen, mode, visitor]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: VisitorPayload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        company: company.trim() || null,
        purpose: purpose.trim() || null,
        notes: notes.trim() || null,
        visitedAt,
        isActive,
      };
      await onSave(payload);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Unable to save visitor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Register visitor' : 'Edit visitor'}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
              placeholder="Visitor full name"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="input-field"
                placeholder="07XXXXXXXX"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Visit date</label>
              <input
                type="date"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Optional email"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company / organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="input-field"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Purpose of visit</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="input-field"
                placeholder="Enquiry, tour, meeting..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Marketing notes, how they heard about us, follow-up..."
            />
          </div>

          {mode === 'edit' && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-primary-600"
              />
              Active (include in SMS lists)
            </label>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Register visitor' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
