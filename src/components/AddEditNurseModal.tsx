import { useEffect, useState } from 'react';
import { X, Save, User, Award, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Nurse } from '../types';
import { apiService } from '../services/api';
import { API_CONFIG, API_ENDPOINTS, getAssetUrl } from '../config/api';

export interface NurseFormValues {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  specialization: string;
  experience: number;
  certifications: string[];
  status: Nurse['status'];
  hireDate: string;
  avatar?: string;
}

interface AddEditNurseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nurse: NurseFormValues) => Promise<void>;
  nurse?: Nurse | null;
  mode: 'add' | 'edit';
}

const DEFAULT_FORM: NurseFormValues = {
  username: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  licenseNumber: '',
  specialization: '',
  experience: 0,
  certifications: [],
  status: 'active',
  hireDate: new Date().toISOString().split('T')[0],
  avatar: '',
};

export default function AddEditNurseModal({
  isOpen,
  onClose,
  onSave,
  nurse,
  mode,
}: AddEditNurseModalProps) {
  const [formData, setFormData] = useState<NurseFormValues>(DEFAULT_FORM);
  const [newCertification, setNewCertification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(DEFAULT_FORM);
      setNewCertification('');
      setError(null);
      setIsSubmitting(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsUploadingAvatar(false);
      return;
    }

    if (mode === 'edit' && nurse) {
      setFormData({
        username: (nurse as Nurse & { username?: string }).username ?? '',
        name: nurse.name,
        email: nurse.email,
        password: '',
        phone: nurse.phone,
        licenseNumber: nurse.licenseNumber,
        specialization: nurse.specialization,
        experience: nurse.experience,
        certifications: nurse.certifications,
        status: nurse.status,
        hireDate: nurse.hireDate
          ? new Date(nurse.hireDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        avatar: nurse.avatar ?? '',
      });
      // Set avatar preview with full URL if it's a relative path
      if (nurse.avatar) {
        const avatarUrl = nurse.avatar.startsWith('http') ? nurse.avatar : getAssetUrl(nurse.avatar);
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview(null);
      }
    } else {
      setFormData(DEFAULT_FORM);
      setAvatarPreview(null);
    }
  }, [isOpen, mode, nurse]);

  if (!isOpen) {
    return null;
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'experience'
          ? Number.isNaN(Number(value))
            ? 0
            : parseInt(value, 10)
          : value,
    }));
  };

  const handleAddCertification = () => {
    const trimmed = newCertification.trim();
    if (!trimmed || formData.certifications.includes(trimmed)) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, trimmed],
    }));
    setNewCertification('');
  };

  const handleRemoveCertification = (certification: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert !== certification),
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
          
          setFormData((prev) => ({
            ...prev,
            avatar: avatarPath,
          }));
          
          // Update preview with full URL for display
          const baseUrl = API_CONFIG.API_ORIGIN;
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
    setFormData((prev) => ({
      ...prev,
      avatar: '',
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (mode === 'add' && !formData.username?.trim()) {
      setError('Username is required for new nurses.');
      setIsSubmitting(false);
      return;
    }
    if (mode === 'add' && (!formData.password || formData.password.length < 8)) {
      setError('Password must be at least 8 characters long.');
      setIsSubmitting(false);
      return;
    }

    // Validate password if provided during edit
    if (mode === 'edit' && formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsSubmitting(false);
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save nurse. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'add' ? 'Add Nurse' : 'Edit Nurse'}
            </h2>
            <p className="text-sm text-gray-500">
              {mode === 'add'
                ? 'Create a new nurse profile'
                : 'Update the nurse details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="space-y-4">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <User className="mr-2 h-5 w-5 text-primary-600" />
              Personal Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required={mode === 'add'}
                disabled={mode === 'edit'}
                className="input-field mt-1 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                placeholder="e.g. sarah.johnson (used for login)"
              />
              {mode === 'edit' && (
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed after creation</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field mt-1"
                  placeholder="Sarah Johnson"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field mt-1"
                  placeholder="sarah@example.com"
                />
              </div>
              {mode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    className="input-field mt-1"
                    placeholder="Minimum 8 characters"
                  />
                  <p className="text-xs text-gray-500 mt-1">Provide this to the nurse for login</p>
                </div>
              )}
              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    minLength={8}
                    className="input-field mt-1"
                    placeholder="Leave blank to keep current password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only fill if you want to change the password</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="input-field mt-1"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  License number<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  required
                  className="input-field mt-1"
                  placeholder="RN-001234"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <Award className="mr-2 h-5 w-5 text-primary-600" />
              Professional Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specialization<span className="text-red-500">*</span>
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required
                  className="input-field mt-1"
                >
                  <option value="">Select specialization</option>
                  <option value="General Nursing">General Nursing</option>
                  <option value="Critical Care">Critical Care</option>
                  <option value="Pediatric Nursing">Pediatric Nursing</option>
                  <option value="Geriatric Nursing">Geriatric Nursing</option>
                  <option value="Mental Health">Mental Health</option>
                  <option value="Home Health">Home Health</option>
                  <option value="Wound Care">Wound Care</option>
                  <option value="Palliative Care">Palliative Care</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Years of experience<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min={0}
                  max={50}
                  required
                  className="input-field mt-1"
                  placeholder="5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status<span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="input-field mt-1"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-leave">On leave</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hire date<span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  required
                  className="input-field mt-1"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <Award className="mr-2 h-5 w-5 text-primary-600" />
              Certifications
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                className="input-field flex-1"
                placeholder="Add certification"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCertification();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCertification}
                className="btn-primary"
              >
                Add
              </button>
            </div>

            {formData.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800"
                  >
                    {cert}
                    <button
                      type="button"
                      onClick={() => handleRemoveCertification(cert)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="flex items-center text-lg font-medium text-gray-900">
              <User className="mr-2 h-5 w-5 text-primary-600" />
              Profile picture
            </h3>

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
          </section>

          <div className="flex items-center justify-end gap-4 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting
                ? 'Saving...'
                : mode === 'add'
                ? 'Add Nurse'
                : 'Update Nurse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
