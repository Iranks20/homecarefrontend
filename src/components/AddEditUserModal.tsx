import { useEffect, useState } from 'react';
import { Loader2, UserPlus, Upload, Image as ImageIcon, X } from 'lucide-react';
import type { User } from '../types';
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'physiotherapist', label: 'Physiotherapist' },
  { value: 'clinical-psychologist', label: 'Clinical Psychologist' },
  { value: 'nutritionist', label: 'Nutritionist' },
  { value: 'critical-care-nurse', label: 'Critical Care Nurse' },
  { value: 'medical-doctor', label: 'Medical Doctor' },
  { value: 'geriatrician', label: 'Geriatrician' },
  { value: 'palliative-care-specialist', label: 'Palliative Care Specialist' },
  { value: 'senior-midwife', label: 'Senior Midwife' },
  { value: 'patient', label: 'Patient' },
];

interface AddEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (input: {
    name: string;
    email: string;
    password?: string;
    role?: User['role']; // Optional for edit mode
    phone?: string;
    department?: string;
    doctorSpecialization?: string;
    isActive?: boolean;
    avatar?: string;
  }) => Promise<void>;
  isSaving: boolean;
  user?: User | null; // If provided, this is an edit operation
  // Optional customization props
  title?: string; // Custom title (e.g., "Add Doctor", "Edit Doctor")
  description?: string; // Custom description
  hideRoleSelector?: boolean; // Hide role selector (useful when role is fixed)
  defaultRole?: User['role']; // Default role when creating
  showSpecialization?: boolean; // Show specialization field (for doctors)
}

const DEFAULT_FORM = {
  name: '',
  email: '',
  password: '',
  role: 'nurse' as User['role'],
  phone: '',
  department: '',
  doctorSpecialization: '',
  isActive: true,
  avatar: '',
};

const SPECIALIZATION_OPTIONS = [
  { value: 'NEUROLOGIST', label: 'Neurologist' },
  { value: 'ORTHOPEDIST', label: 'Orthopedist' },
  { value: 'PHYSIOTHERAPIST', label: 'Physiotherapist' },
];

export default function AddEditUserModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  user,
  title,
  description,
  hideRoleSelector = false,
  defaultRole = 'nurse',
  showSpecialization = false,
}: AddEditUserModalProps) {
  const isEditMode = !!user;
  const [formState, setFormState] = useState({ ...DEFAULT_FORM, role: defaultRole });
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Determine modal title and description
  const modalTitle = title || (isEditMode ? 'Edit User' : 'Add New User');
  const modalDescription = description || (
    isEditMode 
      ? 'Update user information and password.' 
      : 'Provision a new staff or patient account.'
  );

  useEffect(() => {
    if (isOpen) {
      if (user) {
        // Edit mode: populate form with user data
        setFormState({
          name: user.name || '',
          email: user.email || '',
          password: '', // Don't populate password
          role: user.role || 'nurse',
          phone: user.phone || '',
          department: user.department || '',
          doctorSpecialization: user.doctorSpecialization?.toUpperCase() || '',
          isActive: user.isActive !== false,
          avatar: user.avatar || '',
        });
        // Set avatar preview with full URL if it's a relative path
        if (user.avatar) {
          const avatarUrl = user.avatar.startsWith('http') 
            ? user.avatar 
            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.98.153:3007'}${user.avatar.startsWith('/') ? user.avatar : '/' + user.avatar}`;
          setAvatarPreview(avatarUrl);
        } else {
          setAvatarPreview(null);
        }
      } else {
        // Add mode: reset to defaults with default role
        setFormState({ ...DEFAULT_FORM, role: defaultRole });
        setAvatarPreview(null);
      }
      setAvatarFile(null);
      setError(null);
      setIsUploadingAvatar(false);
    }
  }, [isOpen, user, defaultRole]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    const checked = (event.target as HTMLInputElement).checked;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setAvatarFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    setIsUploadingAvatar(true);
    try {
      const response = await apiService.uploadFile<{ url: string; fileId: string; filename: string }>(
        API_ENDPOINTS.UPLOAD.IMAGE,
        file
      );
      if (response.success && response.data) {
        // The response.data is the FileUploadResult object with url property
        const uploadResult = response.data as { url: string; fileId: string; filename: string; originalName?: string; mimetype?: string; size?: number };
        const avatarUrl = uploadResult.url || (response.data as any).url;
        
        if (avatarUrl) {
          // Store the path as returned from backend (e.g., /uploads/filename.jpg)
          const avatarPath = avatarUrl.startsWith('http') 
            ? avatarUrl.replace(/^https?:\/\/[^\/]+/, '') // Extract path from full URL
            : avatarUrl.startsWith('/') 
              ? avatarUrl 
              : '/' + avatarUrl;
          
          setFormState((prev) => ({
            ...prev,
            avatar: avatarPath,
          }));
          
          // Update preview with full URL for display
          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.98.153:3007';
          const previewUrl = `${baseUrl}${avatarPath}`;
          setAvatarPreview(previewUrl);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image');
      setAvatarFile(null);
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setFormState((prev) => ({
      ...prev,
      avatar: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Password is required only when creating a new user
    if (!isEditMode && (!formState.password || formState.password.length < 8)) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // If editing and password is provided, validate it
    if (isEditMode && formState.password && formState.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      const payload: any = {
        name: formState.name,
        email: formState.email,
        phone: formState.phone,
        department: formState.department,
        isActive: formState.isActive,
      };
      
      // Add specialization if shown
      if (showSpecialization && formState.doctorSpecialization) {
        payload.doctorSpecialization = formState.doctorSpecialization;
      }
      
      // Add avatar if uploaded
      if (formState.avatar) {
        payload.avatar = formState.avatar;
      }
      
        // Only include password if it's provided (for edit) or required (for create)
      if (isEditMode) {
        if (formState.password) {
          payload.password = formState.password;
        }
      } else {
        payload.password = formState.password;
        payload.role = formState.role; // Only include role when creating
      }
      
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to save user.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 text-primary-600 rounded-lg h-10 w-10 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {modalTitle}
              </h3>
              <p className="text-sm text-gray-500">
                {modalDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formState.name}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="e.g. Sarah Johnson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="user@teamworkhomecare.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!hideRoleSelector && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formState.role}
                onChange={handleChange}
                required
                  disabled={isEditMode || hideRoleSelector} // Don't allow role change when editing or when hidden
                className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {isEditMode && (
                <p className="text-xs text-gray-500 mt-1">Role cannot be changed</p>
              )}
            </div>
            )}
            <div className={hideRoleSelector ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formState.department}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g. Medical, Cardiology"
              />
            </div>
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                  <div className="btn-outline flex items-center justify-center">
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {avatarPreview ? 'Change Picture' : 'Upload Picture'}
                      </>
                    )}
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF (max 10MB)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showSpecialization && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization *
                </label>
                <select
                  name="doctorSpecialization"
                  value={formState.doctorSpecialization}
                  onChange={handleChange}
                  required={showSpecialization}
                  className="input-field"
                >
                  <option value="">Select specialization</option>
                  {SPECIALIZATION_OPTIONS.map((spec) => (
                    <option key={spec.value} value={spec.value}>
                      {spec.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formState.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="+1-555-0100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEditMode ? 'New Password (leave blank to keep current)' : 'Temporary Password *'}
              </label>
              <input
                type="password"
                name="password"
                value={formState.password}
                onChange={handleChange}
                required={!isEditMode}
                minLength={8}
                className="input-field"
                placeholder={isEditMode ? "Leave blank to keep current password" : "Minimum 8 characters"}
              />
            </div>
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formState.isActive}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditMode 
                  ? (title?.toLowerCase().includes('doctor') ? 'Update Doctor' : 'Update User')
                  : (title?.toLowerCase().includes('doctor') ? 'Create Doctor' : 'Create User')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

