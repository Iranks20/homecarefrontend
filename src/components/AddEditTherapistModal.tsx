import React, { useState, useEffect } from 'react';
import { X, Plus, Upload, Image as ImageIcon, Loader2, UserPlus } from 'lucide-react';
import { apiService } from '../services/api';
import { API_ENDPOINTS, getAssetUrl } from '../config/api';
import { therapistService, type Therapist } from '../services/therapists';
import { specializationService, type Specialization } from '../services/specializations';

interface TherapistFormValues {
  username: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  experience: number;
  certifications: string[];
  hourlyRate: number;
  bio: string;
  hireDate: string;
  avatar: string;
}

interface AddEditTherapistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (therapist: TherapistFormValues) => Promise<void>;
  therapist?: any; // Therapist type from service
  mode: 'add' | 'edit';
  isSaving?: boolean;
}

// Specializations will be loaded from API

const DEFAULT_FORM: TherapistFormValues = {
  username: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  specialization: '',
  licenseNumber: '',
  experience: 0,
  certifications: [],
  hourlyRate: 0,
  bio: '',
  hireDate: new Date().toISOString().split('T')[0],
  avatar: '',
};

export default function AddEditTherapistModal({
  isOpen,
  onClose,
  onSave,
  therapist,
  mode,
  isSaving = false,
}: AddEditTherapistModalProps) {
  const [formData, setFormData] = useState<TherapistFormValues>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [certificationInput, setCertificationInput] = useState<string>('');
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loadingSpecializations, setLoadingSpecializations] = useState(true);

  const isEditMode = mode === 'edit' && therapist;

  // Load specializations from API
  useEffect(() => {
    const loadSpecializations = async () => {
      try {
        setLoadingSpecializations(true);
        const data = await specializationService.getSpecializations({ type: 'THERAPIST' });
        setSpecializations(data);
      } catch (err) {
        console.error('Failed to load specializations:', err);
      } finally {
        setLoadingSpecializations(false);
      }
    };
    if (isOpen) {
      loadSpecializations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(DEFAULT_FORM);
      setError(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsUploadingAvatar(false);
      return;
    }

    if (isEditMode && therapist) {
      // Fetch full therapist data if we only have basic info
      const loadTherapistData = async () => {
        try {
          const fullTherapist = await therapistService.getTherapist(therapist.id);
          setFormData({
            username: fullTherapist.username ?? (fullTherapist as { username?: string }).username ?? '',
            name: fullTherapist.name || '',
            email: fullTherapist.email || '',
            password: '',
            phone: fullTherapist.phone || '',
            specialization: fullTherapist.specialization || '',
            licenseNumber: fullTherapist.licenseNumber || '',
            experience: fullTherapist.experience || 0,
            certifications: fullTherapist.certifications || [],
            hourlyRate: fullTherapist.hourlyRate || 0,
            bio: fullTherapist.bio || '',
            hireDate: fullTherapist.hireDate ? new Date(fullTherapist.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            avatar: fullTherapist.avatar || '',
          });
          // Set avatar preview
          if (fullTherapist.avatar) {
            const avatarUrl = fullTherapist.avatar.startsWith('http') ? fullTherapist.avatar : getAssetUrl(fullTherapist.avatar);
            setAvatarPreview(avatarUrl);
          }
        } catch (err) {
          // Fallback to basic data if fetch fails
          setFormData({
            username: therapist.username ?? (therapist as { username?: string }).username ?? '',
            name: therapist.name || '',
            email: therapist.email || '',
            password: '',
            phone: therapist.phone || '',
            specialization: therapist.specialization || therapist.therapistSpecialization || '',
            licenseNumber: therapist.licenseNumber || '',
            experience: therapist.experience || 0,
            certifications: therapist.certifications || [],
            hourlyRate: therapist.hourlyRate || 0,
            bio: therapist.bio || '',
            hireDate: therapist.hireDate ? new Date(therapist.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            avatar: therapist.avatar || '',
          });
        }
      };
      loadTherapistData();
    } else {
      setFormData(DEFAULT_FORM);
      setAvatarPreview(null);
    }
  }, [isOpen, isEditMode, therapist]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value,
    }));
  };

  const handleAddCertification = () => {
    if (certificationInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()],
      }));
      setCertificationInput('');
    }
  };

  const handleRemoveCertification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    setAvatarFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    try {
      const response = await apiService.uploadFile<{ url: string; fileId: string; filename: string }>(
        API_ENDPOINTS.UPLOAD.IMAGE,
        file
      );
      if (response.success && response.data) {
        const uploadResult = response.data as { url: string; fileId: string; filename: string };
        const avatarUrl = uploadResult.url || (response.data as any).url;
        
        if (avatarUrl) {
          const avatarPath = avatarUrl.startsWith('http')
            ? avatarUrl.replace(/^https?:\/\/[^\/]+/, '')
            : avatarUrl.startsWith('/')
              ? avatarUrl
              : '/' + avatarUrl;
          
          setFormData((prev) => ({
            ...prev,
            avatar: avatarPath,
          }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'add' && !formData.username?.trim()) {
      setError('Username is required for new therapists.');
      return;
    }
    if (mode === 'add' && (!formData.password || formData.password.length < 8)) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Validate password if provided during edit
    if (mode === 'edit' && formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Validate required fields
    if (!formData.name) {
      setError('Name is required.');
      return;
    }

    if (mode === 'add' && !formData.specialization) {
      setError('Therapist specialization is required.');
      return;
    }

    if (mode === 'add' && (formData.experience == null || formData.experience < 0)) {
      setError('Experience must be a valid number.');
      return;
    }

    if (mode === 'add' && !formData.hireDate) {
      setError('Hire date is required.');
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save therapist. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 text-primary-600 rounded-lg h-10 w-10 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'add' ? 'Add New Therapist' : 'Edit Therapist'}
              </h2>
              <p className="text-sm text-gray-500">
                {mode === 'add' 
                  ? 'Create a new therapist account with login credentials'
                  : 'Update therapist information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'edit' ? 'Username (for reference)' : 'Username *'}
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required={mode === 'add'}
                disabled={mode === 'edit'}
                readOnly={mode === 'edit'}
                className="input-field disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-default"
                placeholder="e.g. lisa.anderson (used for login)"
              />
              {mode === 'edit' && (
                <p className="text-xs text-gray-500 mt-1">Shown for reference; cannot be changed after creation.</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter full name"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter email address"
                  disabled={isSaving || isEditMode}
                />
                <p className="text-xs text-gray-500 mt-1">Used for login when provided</p>
              </div>

              {mode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={mode === 'add'}
                    minLength={8}
                    className="input-field"
                    placeholder="Minimum 8 characters"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-gray-500 mt-1">Provide this to the therapist for login</p>
                </div>
              )}

              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    minLength={8}
                    className="input-field"
                    placeholder="Leave blank to keep current password"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-gray-500 mt-1">Only fill if you want to change the password</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter phone number"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Therapist Specialization *
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required={mode === 'add'}
                  className="input-field"
                  disabled={isSaving || loadingSpecializations}
                >
                  <option value="">Select specialization</option>
                  {loadingSpecializations ? (
                    <option disabled>Loading specializations...</option>
                  ) : (
                    specializations.map((spec) => (
                      <option key={spec.id} value={spec.name.toUpperCase().replace(/\s+/g, '_')}>
                        {spec.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter license number"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required={mode === 'add'}
                  min="0"
                  className="input-field"
                  placeholder="Enter years of experience"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate ($) <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="input-field"
                  placeholder="Enter hourly rate"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hire Date *
                </label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  required={mode === 'add'}
                  className="input-field"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certifications
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCertification();
                    }
                  }}
                  className="input-field flex-1"
                  placeholder="Enter certification (e.g., APTA Certified)"
                  disabled={isSaving}
                />
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="btn-outline flex items-center"
                  disabled={isSaving || !certificationInput.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
              {formData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                    >
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(index)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                        disabled={isSaving}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio / Professional Summary
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="input-field"
                placeholder="Enter professional bio or summary"
                disabled={isSaving}
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
                    disabled={isUploadingAvatar || isSaving}
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

          <div className="flex justify-end space-x-3 pt-2 border-t">
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
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                mode === 'edit' ? 'Update Therapist' : 'Create Therapist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
