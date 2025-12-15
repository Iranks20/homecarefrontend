import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Specialist } from '../types';
import { apiService } from '../services/api';
import { API_ENDPOINTS } from '../config/api';

interface SpecialistFormValues {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  specialization: Specialist['specialization'];
  experience: number;
  certifications: string[];
  hourlyRate: number;
  bio?: string;
  hireDate: string;
  avatar?: string;
  status?: Specialist['status'];
}

interface AddEditSpecialistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (specialist: SpecialistFormValues) => Promise<void>;
  specialist?: Specialist | null;
  mode: 'add' | 'edit';
}

const SPECIALIZATION_OPTIONS: Specialist['specialization'][] = [
  'clinical-psychologist',
  'nutritionist',
  'critical-care-nurse',
  'medical-doctor',
  'geriatrician',
  'palliative-care-specialist',
  'senior-midwife',
];

export default function AddEditSpecialistModal({
  isOpen,
  onClose,
  onSave,
  specialist,
  mode,
}: AddEditSpecialistModalProps) {
  const [formData, setFormData] = useState<SpecialistFormValues>({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialization: 'clinical-psychologist',
    experience: 0,
    certifications: [],
    hourlyRate: 0,
    bio: '',
    hireDate: new Date().toISOString().split('T')[0],
    avatar: '',
    status: 'active',
  });
  const [newCertification, setNewCertification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const isEdit = mode === 'edit' && specialist;

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
      setError(null);
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsUploadingAvatar(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEdit && specialist) {
      setFormData({
        name: specialist.name,
        email: specialist.email,
        phone: specialist.phone,
        licenseNumber: specialist.licenseNumber,
        specialization: specialist.specialization,
        experience: specialist.experience,
        certifications: specialist.certifications,
        hourlyRate: specialist.hourlyRate,
        bio: specialist.bio ?? '',
        hireDate: specialist.hireDate
          ? new Date(specialist.hireDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        avatar: specialist.avatar ?? '',
        status: specialist.status,
      });
      // Set avatar preview with full URL if it's a relative path
      if (specialist.avatar) {
        const avatarUrl = specialist.avatar.startsWith('http') 
          ? specialist.avatar 
          : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://51.20.98.153:3007'}${specialist.avatar.startsWith('/') ? specialist.avatar : '/' + specialist.avatar}`;
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview(null);
      }
    } else if (mode === 'add') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        licenseNumber: '',
        specialization: 'clinical-psychologist',
        experience: 0,
        certifications: [],
        hourlyRate: 0,
        bio: '',
        hireDate: new Date().toISOString().split('T')[0],
        avatar: '',
        status: 'active',
      });
      setAvatarPreview(null);
    }
  }, [isEdit, specialist, mode, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['experience', 'hourlyRate'].includes(name) ? Number(value) || 0 : value,
    }));
  };

  const handleAddCertification = () => {
    const trimmed = newCertification.trim();
    if (trimmed && !formData.certifications.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, trimmed],
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
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
    setFormData((prev) => ({
      ...prev,
      avatar: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        ...formData,
        certifications: formData.certifications.map((cert) => cert.trim()).filter(Boolean),
        experience: Number(formData.experience) || 0,
        hourlyRate: Number(formData.hourlyRate) || 0,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save specialist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSpecialization = (value: Specialist['specialization']) =>
    value
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'Add New Specialist' : 'Edit Specialist'}
          </h2>
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
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter phone number"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  placeholder="Enter license number"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization *
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  disabled={isSubmitting}
                >
                  {SPECIALIZATION_OPTIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {formatSpecialization(spec)}
                    </option>
                  ))}
                </select>
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
                      disabled={isUploadingAvatar || isSubmitting}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                className="input-field"
                placeholder="Enter specialist bio"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Certifications</h3>
            <div className="space-y-3">
              {formData.certifications.map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-900">{cert}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCertification(cert)}
                    className="text-red-600 hover:text-red-800"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Enter certification name"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={handleAddCertification}
                  className="btn-secondary flex items-center"
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience *
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  min={0}
                  max={50}
                  required
                  className="input-field"
                  placeholder="Enter years of experience"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hourly Rate *
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  min={0}
                  step="0.01"
                  required
                  className="input-field"
                  placeholder="Enter hourly rate"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Employment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  disabled={isSubmitting}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date *</label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  required
                  className="input-field"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
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
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : mode === 'add'
                ? 'Add Specialist'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
