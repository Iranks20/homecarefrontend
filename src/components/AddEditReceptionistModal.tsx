import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { User } from '../types';

interface ReceptionistFormValues {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  department: string;
  isActive: boolean;
}

interface AddEditReceptionistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    username: string;
    name: string;
    email: string;
    password?: string;
    phone?: string;
    department?: string;
    isActive?: boolean;
    role?: User['role'];
  }) => Promise<void>;
  receptionist?: User | null;
  mode: 'add' | 'edit';
}

export default function AddEditReceptionistModal({
  isOpen,
  onClose,
  onSave,
  receptionist,
  mode,
}: AddEditReceptionistModalProps) {
  const [formData, setFormData] = useState<ReceptionistFormValues>({
    username: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    department: 'Reception',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit' && receptionist;

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEdit && receptionist) {
      setFormData({
        username: receptionist.username || '',
        name: receptionist.name || '',
        email: receptionist.email || '',
        password: '',
        phone: receptionist.phone || '',
        department: receptionist.department || 'Reception',
        isActive: receptionist.isActive ?? true,
      });
    } else {
      setFormData({
        username: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        department: 'Reception',
        isActive: true,
      });
    }
  }, [isEdit, receptionist, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!isEdit && !formData.password.trim()) {
      setError('Password is required for new receptionists');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: {
        username: string;
        name: string;
        email: string;
        password?: string;
        phone?: string;
        department?: string;
        isActive?: boolean;
        role?: User['role'];
      } = {
        username: formData.username.trim().toLowerCase(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        department: formData.department.trim() || undefined,
        isActive: formData.isActive,
        role: 'receptionist',
      };

      if (!isEdit) {
        payload.password = formData.password;
      } else if (formData.password.trim()) {
        payload.password = formData.password;
      }

      await onSave(payload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save receptionist');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isEdit ? 'Edit Receptionist' : 'Add New Receptionist'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. jane.smith (used for login)"
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  required
                  disabled={mode === 'edit'}
                />
                {mode === 'edit' && (
                  <p className="mt-1.5 text-xs text-gray-500">Username cannot be changed after creation</p>
                )}
                {mode !== 'edit' && (
                  <p className="mt-1.5 text-xs text-gray-500">Letters, numbers, dots, hyphens, underscores only</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name (e.g., Jane Smith)"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="receptionist@example.com"
                  className="input-field disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  required
                  disabled={mode === 'edit'}
                />
                {mode === 'edit' && (
                  <p className="mt-1.5 text-xs text-gray-500">Email cannot be changed after creation</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Password {!isEdit && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEdit ? 'Enter new password (leave blank to keep current)' : 'Enter password (minimum 8 characters)'}
                  className="input-field"
                  required={!isEdit}
                />
                {isEdit ? (
                  <p className="mt-1.5 text-xs text-gray-500">Leave blank to keep current password</p>
                ) : (
                  <p className="mt-1.5 text-xs text-gray-500">Password must be at least 8 characters long</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890 (optional)"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Reception (default)"
                  className="input-field"
                />
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-900">
                  Active Status
                </label>
                <span className="ml-2 text-xs text-gray-500">(Receptionist can log in and access the system)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Receptionist' : 'Add Receptionist'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
